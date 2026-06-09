import type { FastifyPluginAsync } from 'fastify';
import { getObrasWithAntennas, getGlobalKpis } from '../../services/consumption.service.js';
import { getLastFetchedAt } from '../../db/repositories/consumption.repo.js';

const obrasRoutes: FastifyPluginAsync = async (fastify) => {

  function stripEmail<T extends { email: string }>(obra: T): Omit<T, 'email'> {
    const { email: _email, ...rest } = obra;
    return rest;
  }

  /** Lista todas las obras con KPIs agregados y antenas */
  fastify.get('/', async (_req, reply) => {
    const [obras, kpis, lastFetchedAt] = await Promise.all([
      getObrasWithAntennas(),
      getGlobalKpis(),
      getLastFetchedAt(),
    ]);
    return reply.send({
      obras:       obras.map(stripEmail),
      kpis,
      lastUpdated: lastFetchedAt?.toISOString() ?? null,
    });
  });

  /** Detalle de una obra por su key (ej: "SALAR-CLIENTES") */
  fastify.get<{ Params: { key: string } }>('/:key', async (req, reply) => {
    const obras = await getObrasWithAntennas();
    const obra  = obras.find((o) => o.key === req.params.key);

    if (!obra) {
      return reply.code(404).send({ error: `Obra '${req.params.key}' no encontrada` });
    }

    return reply.send(stripEmail(obra));
  });

};

export default obrasRoutes;
