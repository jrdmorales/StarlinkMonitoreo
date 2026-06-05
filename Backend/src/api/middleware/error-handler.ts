import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { config } from '../../lib/config.js';

export function errorHandler(
  error:   FastifyError,
  request: FastifyRequest,
  reply:   FastifyReply,
): void {
  request.log.error({ err: error }, 'Unhandled error');

  const statusCode = error.statusCode ?? 500;
  const isServer   = statusCode >= 500;

  reply.code(statusCode).send({
    error:   isServer ? 'Internal server error' : error.message,
    // En producción no se exponen detalles internos al cliente
    detail:  isServer && config.NODE_ENV === 'production' ? undefined : error.message,
  });
}
