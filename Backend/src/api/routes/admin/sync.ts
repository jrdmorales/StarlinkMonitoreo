import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import { runCycle } from '../../../jobs/scheduler.js';

const syncRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', requireAuth);

  fastify.post('/', async (_req, reply) => {
    const start = Date.now();
    await runCycle();
    return reply.send({ ok: true, ms: Date.now() - start });
  });
};

export default syncRoutes;
