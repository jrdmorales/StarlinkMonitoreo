import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdmin } from '../../middleware/auth.js';
import { db } from '../../../db/client.js';
import { starlinkAccounts, starlinkDataUsage, starlinkUserTerminals } from '../../../db/starlink-schema.js';
import { encrypt } from '../../../lib/crypto.js';
import { syncUserTerminals, getTerminalsForAccount } from '../../../services/starlink/terminals.js';
import { fetchAndPersistDataUsage } from '../../../services/starlink/dataUsage.js';
import { runStarlinkSyncForAllAccounts } from '../../../jobs/starlinkSync.js';

const accountSchema = z.object({
  obraId:            z.number().int().positive().optional(),
  starlinkAccountId: z.string().min(1),
  clientId:          z.string().min(1),
  clientSecret:      z.string().min(1),
});

const idParamSchema = z.object({ id: z.string().uuid('ID inválido') });

const starlinkAdminRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', requireAdmin);

  /** Lista todas las cuentas Starlink configuradas (sin exponer secrets) */
  fastify.get('/accounts', async (_req, reply) => {
    const accounts = await db.select({
      id:                starlinkAccounts.id,
      obraId:            starlinkAccounts.obraId,
      starlinkAccountId: starlinkAccounts.starlinkAccountId,
      clientId:          starlinkAccounts.clientId,
      createdAt:         starlinkAccounts.createdAt,
      updatedAt:         starlinkAccounts.updatedAt,
    }).from(starlinkAccounts);

    return reply.send({ accounts });
  });

  /** Crea o actualiza una cuenta Starlink para una obra */
  fastify.post('/accounts', async (req, reply) => {
    const body = accountSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Datos inválidos', details: body.error.flatten() });
    }
    const { obraId, starlinkAccountId, clientId, clientSecret } = body.data;

    let clientSecretEncrypted: string;
    try {
      clientSecretEncrypted = encrypt(clientSecret);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error cifrando client_secret';
      return reply.code(500).send({ error: message });
    }

    const [account] = await db.insert(starlinkAccounts)
      .values({ obraId: obraId ?? null, starlinkAccountId, clientId, clientSecretEncrypted })
      .onConflictDoUpdate({
        target: starlinkAccounts.starlinkAccountId,
        set:    { obraId: obraId ?? null, clientId, clientSecretEncrypted, updatedAt: new Date() },
      })
      .returning({
        id:                starlinkAccounts.id,
        obraId:            starlinkAccounts.obraId,
        starlinkAccountId: starlinkAccounts.starlinkAccountId,
      });

    return reply.code(201).send({ account });
  });

  /** Elimina una cuenta Starlink (cascade elimina tokens y terminales) */
  fastify.delete<{ Params: { id: string } }>('/accounts/:id', async (req, reply) => {
    const params = idParamSchema.safeParse(req.params);
    if (!params.success) return reply.code(400).send({ error: 'ID inválido' });

    await db.delete(starlinkAccounts).where(eq(starlinkAccounts.id, params.data.id));
    return reply.send({ ok: true });
  });

  /** Sincroniza terminales + consumo para una cuenta específica */
  fastify.post<{ Params: { id: string } }>('/accounts/:id/sync', async (req, reply) => {
    const params = idParamSchema.safeParse(req.params);
    if (!params.success) return reply.code(400).send({ error: 'ID inválido' });

    const [account] = await db.select()
      .from(starlinkAccounts)
      .where(eq(starlinkAccounts.id, params.data.id))
      .limit(1);
    if (!account) return reply.code(404).send({ error: 'Cuenta no encontrada' });

    const start = Date.now();
    const terminalCount = await syncUserTerminals(account.obraId, account);

    const terminals = await getTerminalsForAccount(account.id);
    const serviceLineNumbers = terminals
      .map((t) => t.serviceLineNumber)
      .filter((s): s is string => s !== null);

    const usageRows = await fetchAndPersistDataUsage(account.obraId, account, serviceLineNumbers);

    return reply.send({ ok: true, terminalCount, usageRows, ms: Date.now() - start });
  });

  /** Sincroniza todas las cuentas (equivalente al job periódico) */
  fastify.post('/sync', async (_req, reply) => {
    const start = Date.now();
    const result = await runStarlinkSyncForAllAccounts();
    return reply.send({ ok: true, ...result, ms: Date.now() - start });
  });

  /** Terminales registrados para una cuenta */
  fastify.get<{ Params: { id: string } }>('/accounts/:id/terminals', async (req, reply) => {
    const params = idParamSchema.safeParse(req.params);
    if (!params.success) return reply.code(400).send({ error: 'ID inválido' });

    const terminals = await db.select()
      .from(starlinkUserTerminals)
      .where(eq(starlinkUserTerminals.starlinkAccountId, params.data.id));

    return reply.send({ terminals });
  });

  /** Últimos registros de consumo por service line */
  fastify.get<{
    Querystring: { obraId?: string; limit?: string };
  }>('/data-usage', async (req, reply) => {
    const limit = Math.min(Number(req.query.limit ?? 100), 500);
    const obraId = req.query.obraId ? Number(req.query.obraId) : undefined;

    const rows = await (obraId !== undefined
      ? db.select().from(starlinkDataUsage).where(eq(starlinkDataUsage.obraId, obraId)).limit(limit)
      : db.select().from(starlinkDataUsage).limit(limit));

    return reply.send({ rows });
  });
};

export default starlinkAdminRoutes;
