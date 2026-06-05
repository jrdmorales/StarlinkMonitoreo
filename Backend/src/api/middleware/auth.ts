import type { FastifyRequest, FastifyReply } from 'fastify';

/** Verifica JWT en el header Authorization: Bearer <token> */
export async function requireAuth(
  request: FastifyRequest,
  reply:   FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({ error: 'No autorizado. Token inválido o expirado.' });
  }
}
