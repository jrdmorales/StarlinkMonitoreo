import type { FastifyPluginAsync } from 'fastify';
import { eq, count } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { db } from '../../../db/client.js';
import { obras, antennas } from '../../../db/schema.js';
import { getObrasWithAntennas } from '../../../services/consumption.service.js';
import { sendEmail, buildReportEmailHtml, buildReportSubject } from '../../../services/email.service.js';
import { getCurrentCycle } from '../../../lib/cycle.js';
import { config } from '../../../lib/config.js';

const createSchema = z.object({
  key:    z.string().min(2).max(50).toUpperCase(),
  label:  z.string().min(1).max(100),
  prefix: z.string().min(1).max(10).toUpperCase(),
  email:  z.string().email(),
});

const updateSchema = z.object({
  label:  z.string().min(1).max(100).optional(),
  email:  z.string().email().optional(),
  active: z.boolean().optional(),
});

const adminObrasRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', requireAuth);

  /** Lista todas las obras con conteo de antenas activas */
  fastify.get('/', async (_req, reply) => {
    const obraRows = await db.select().from(obras).orderBy(obras.key);

    const result = await Promise.all(
      obraRows.map(async (obra) => {
        const [{ value: activeCount }] = await db
          .select({ value: count() })
          .from(antennas)
          .where(eq(antennas.obraId, obra.id));

        return { ...obra, antennaCount: Number(activeCount) };
      }),
    );

    return reply.send({ obras: result });
  });

  /** Crea una nueva obra */
  fastify.post('/', async (req, reply) => {
    const body = createSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Datos inválidos', details: body.error.flatten() });
    }

    const existing = await db
      .select({ id: obras.id })
      .from(obras)
      .where(eq(obras.key, body.data.key))
      .limit(1);

    if (existing.length > 0) {
      return reply.code(409).send({ error: `Obra '${body.data.key}' ya existe` });
    }

    const [obra] = await db.insert(obras).values(body.data).returning();
    return reply.code(201).send(obra);
  });

  /** Actualiza email de contacto, label o estado de una obra */
  fastify.patch<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const id   = parseInt(req.params.id, 10);
    const body = updateSchema.safeParse(req.body);

    if (isNaN(id)) return reply.code(400).send({ error: 'ID inválido' });
    if (!body.success) {
      return reply.code(400).send({ error: 'Datos inválidos', details: body.error.flatten() });
    }

    const updates: Record<string, unknown> = {};
    if (body.data.label  !== undefined) updates.label  = body.data.label;
    if (body.data.email  !== undefined) updates.email  = body.data.email;
    if (body.data.active !== undefined) updates.active = body.data.active;

    if (Object.keys(updates).length === 0) {
      return reply.code(400).send({ error: 'Sin campos para actualizar' });
    }

    const [updated] = await db
      .update(obras)
      .set(updates)
      .where(eq(obras.id, id))
      .returning();

    if (!updated) return reply.code(404).send({ error: 'Obra no encontrada' });
    return reply.send(updated);
  });

  /** Envía reporte manual de todas las antenas de una obra */
  fastify.post<{ Params: { id: string } }>('/:id/send-report', async (req, reply) => {
    if (!config.SMTP_HOST) {
      return reply.code(503).send({ error: 'SMTP no configurado' });
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return reply.code(400).send({ error: 'ID inválido' });

    const [obraRow] = await db
      .select({ key: obras.key, email: obras.email })
      .from(obras)
      .where(eq(obras.id, id))
      .limit(1);

    if (!obraRow)       return reply.code(404).send({ error: 'Obra no encontrada' });
    if (!obraRow.email) return reply.code(400).send({ error: 'La obra no tiene email configurado' });

    const allObras = await getObrasWithAntennas();
    const obra = allObras.find((o) => o.key === obraRow.key);
    if (!obra) return reply.code(404).send({ error: 'Obra sin datos de consumo aún' });

    const cycle      = getCurrentCycle();
    const cycleStart = cycle.start.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
    const cycleEnd   = cycle.end.toLocaleDateString('es-CL',   { day: 'numeric', month: 'long' });
    const reportDate = new Date().toLocaleDateString('es-CL',  { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    await sendEmail({
      to:      obraRow.email,
      subject: buildReportSubject(obra.label, reportDate),
      html:    buildReportEmailHtml({ obra, reportDate, cycleStart, cycleEnd }),
    });

    return reply.send({ ok: true, sentTo: obraRow.email, antennas: obra.antennas.length });
  });

};

export default adminObrasRoutes;
