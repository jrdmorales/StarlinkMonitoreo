import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { db } from '../../../db/client.js';
import { antennas, obras } from '../../../db/schema.js';
import {
  findAntennaByCode,
  upsertAntenna,
  updateAntennaLimit,
  deactivateAntenna,
} from '../../../db/repositories/antenna.repo.js';

const createSchema = z.object({
  code:    z.string().min(5).max(20),
  obraKey: z.string().min(1),
  name:    z.string().optional(),
  limitGb: z.number().int().positive().default(2000),
});

const updateSchema = z.object({
  name:    z.string().optional(),
  limitGb: z.number().int().positive().optional(),
  obraKey: z.string().optional(),
  active:  z.boolean().optional(),
});

const adminAntennasRoutes: FastifyPluginAsync = async (fastify) => {
  // Todas las rutas de este plugin requieren JWT
  fastify.addHook('preHandler', requireAuth);

  /** Lista todas las antenas (activas e inactivas) con datos de su obra */
  fastify.get('/', async (_req, reply) => {
    const rows = await db
      .select({
        id:        antennas.id,
        code:      antennas.code,
        name:      antennas.name,
        limitGb:   antennas.limitGb,
        active:    antennas.active,
        updatedAt: antennas.updatedAt,
        obraKey:   obras.key,
        obraLabel: obras.label,
      })
      .from(antennas)
      .leftJoin(obras, eq(antennas.obraId, obras.id))
      .orderBy(obras.key, antennas.code);

    return reply.send({ antennas: rows });
  });

  /**
   * Agrega una antena o la activa si ya existía.
   * Si el código ya existe en DB (creado por el refresh automático), actualiza sus datos.
   */
  fastify.post('/', async (req, reply) => {
    const body = createSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Datos inválidos', details: body.error.flatten() });
    }

    const [obra] = await db
      .select({ id: obras.id })
      .from(obras)
      .where(eq(obras.key, body.data.obraKey))
      .limit(1);

    if (!obra) {
      return reply.code(404).send({ error: `Obra '${body.data.obraKey}' no encontrada` });
    }

    const antenna = await upsertAntenna({
      code:    body.data.code,
      obraId:  obra.id,
      name:    body.data.name,
      limitGb: body.data.limitGb,
    });

    // Reactivar si estaba desactivada
    if (!antenna.active) {
      const [reactivated] = await db
        .update(antennas)
        .set({ active: true, updatedAt: new Date() })
        .where(eq(antennas.id, antenna.id))
        .returning();
      return reply.code(201).send(reactivated);
    }

    return reply.code(201).send(antenna);
  });

  /** Modifica nombre, límite, obra o estado activo de una antena */
  fastify.patch<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const id   = parseInt(req.params.id, 10);
    const body = updateSchema.safeParse(req.body);

    if (isNaN(id)) return reply.code(400).send({ error: 'ID inválido' });
    if (!body.success) {
      return reply.code(400).send({ error: 'Datos inválidos', details: body.error.flatten() });
    }

    const { name, limitGb, obraKey, active } = body.data;
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (name    !== undefined) updates.name    = name;
    if (limitGb !== undefined) updates.limitGb = limitGb;
    if (active  !== undefined) updates.active  = active;

    if (obraKey !== undefined) {
      const [obra] = await db
        .select({ id: obras.id })
        .from(obras)
        .where(eq(obras.key, obraKey))
        .limit(1);
      if (!obra) return reply.code(404).send({ error: `Obra '${obraKey}' no encontrada` });
      updates.obraId = obra.id;
    }

    const [updated] = await db
      .update(antennas)
      .set(updates)
      .where(eq(antennas.id, id))
      .returning();

    if (!updated) return reply.code(404).send({ error: 'Antena no encontrada' });
    return reply.send(updated);
  });

  /** Desactiva una antena (soft delete — conserva historial) */
  fastify.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return reply.code(400).send({ error: 'ID inválido' });

    await deactivateAntenna(id);
    return reply.send({ ok: true, id });
  });

};

export default adminAntennasRoutes;
