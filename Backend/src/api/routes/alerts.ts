import type { FastifyPluginAsync } from 'fastify';
import { desc, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { alertLog, antennas, obras } from '../../db/schema.js';
import { getObrasWithAntennas } from '../../services/consumption.service.js';
import { buildAlertEmailHtml } from '../../services/email.service.js';
import { getCurrentCycle } from '../../lib/cycle.js';

const alertsRoutes: FastifyPluginAsync = async (fastify) => {

  /** Historial completo de alertas enviadas */
  fastify.get('/', async (_req, reply) => {
    const rows = await db
      .select({
        id:          alertLog.id,
        threshold:   alertLog.threshold,
        cycleStart:  alertLog.cycleStart,
        sentAt:      alertLog.sentAt,
        antennaCode: antennas.code,
        antennaName: antennas.name,
        obraKey:     obras.key,
        obraLabel:   obras.label,
      })
      .from(alertLog)
      .innerJoin(antennas, eq(alertLog.antennaId, antennas.id))
      .leftJoin(obras, eq(antennas.obraId, obras.id))
      .orderBy(desc(alertLog.sentAt))
      .limit(500);

    return reply.send({ alerts: rows });
  });

  /**
   * Genera vista previa HTML del email para una obra y umbral dados.
   * Usa datos ACTUALES de consumo — no los del momento en que se envió.
   */
  fastify.get<{ Querystring: { obraKey: string; threshold: string } }>(
    '/preview',
    async (req, reply) => {
      const { obraKey, threshold: thresholdStr } = req.query;
      const threshold = Number(thresholdStr);

      if (!obraKey || isNaN(threshold)) {
        return reply.code(400).send({ error: 'obraKey y threshold requeridos' });
      }

      const allObras  = await getObrasWithAntennas();
      const obra      = allObras.find((o) => o.key === obraKey);

      if (!obra) {
        return reply.code(404).send({ error: `Obra '${obraKey}' no encontrada` });
      }

      const cycle    = getCurrentCycle();
      // Mostrar antenas sobre el umbral; si ninguna supera el umbral, mostrar todas (demo)
      const filtered = obra.antennas.filter((a) => a.usagePct >= threshold);
      const preview  = filtered.length > 0 ? filtered : obra.antennas;

      const html = buildAlertEmailHtml({
        obra,
        threshold,
        antennas: preview,
        cycleStart: cycle.start.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' }),
        cycleEnd:   cycle.end.toLocaleDateString('es-CL',   { day: 'numeric', month: 'long' }),
      });

      return reply.send({ html, isDemo: filtered.length === 0 });
    },
  );

};

export default alertsRoutes;
