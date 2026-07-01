import type { FastifyPluginAsync } from 'fastify';
import { requireAdmin } from '../../middleware/auth.js';
import { runCycle } from '../../../jobs/scheduler.js';
import { runStarlinkSyncForAllAccounts } from '../../../jobs/starlinkSync.js';

const syncRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', requireAdmin);

  fastify.post('/', async (_req, reply) => {
    const start = Date.now();

    const starlink  = await runStarlinkSyncForAllAccounts();
    const newrelic  = await runCycle();

    return reply.send({ ok: true, ms: Date.now() - start, starlink, newrelic });
  });
};

export default syncRoutes;
