import type { FastifyPluginAsync } from 'fastify';
import { findAntennaByCode } from '../../db/repositories/antenna.repo.js';
import { getLatestConsumptionByAntenna } from '../../db/repositories/consumption.repo.js';
import { getAntennaHistory } from '../../services/consumption.service.js';
import { getCurrentCycle, daysUntil } from '../../lib/cycle.js';
import { project } from '../../lib/projection.js';
import { RISK_THRESHOLD, WARN_THRESHOLD } from '../../lib/constants.js';

const antennasRoutes: FastifyPluginAsync = async (fastify) => {

  /** Estado actual de una antena por su código numérico */
  fastify.get<{ Params: { code: string } }>('/:code', async (req, reply) => {
    const antenna = await findAntennaByCode(req.params.code);
    if (!antenna) {
      return reply.code(404).send({ error: `Antena '${req.params.code}' no encontrada` });
    }

    const latest = await getLatestConsumptionByAntenna(antenna.id);
    if (!latest) {
      return reply.send({ antenna, consumption: null });
    }

    const consumed = Number(latest.consumedGb);
    const usagePct = Number(latest.usagePct);
    const daysLeft = daysUntil(String(latest.cycleEnd));
    const cycle    = getCurrentCycle();
    const proj     = project(consumed, latest.limitGb, cycle.daysElapsed, daysLeft);

    return reply.send({
      antenna,
      consumption: {
        consumed,
        limitGb:   latest.limitGb,
        usagePct,
        available: latest.limitGb - consumed,
        daysLeft,
        cycleEnd:  latest.cycleEnd,
        status:    usagePct >= RISK_THRESHOLD ? 'risk' : usagePct >= WARN_THRESHOLD ? 'warn' : 'ok',
        projection: proj,
        sampledAt: latest.sampledAt,
      },
    });
  });

  /**
   * Historial de consumo de una antena en el ciclo activo.
   * Retorna puntos agrupados por día para alimentar los gráficos del frontend.
   */
  fastify.get<{ Params: { code: string } }>('/:code/history', async (req, reply) => {
    const history = await getAntennaHistory(req.params.code);

    if (history.length === 0) {
      const antenna = await findAntennaByCode(req.params.code);
      if (!antenna) {
        return reply.code(404).send({ error: `Antena '${req.params.code}' no encontrada` });
      }
    }

    return reply.send({ history });
  });

};

export default antennasRoutes;
