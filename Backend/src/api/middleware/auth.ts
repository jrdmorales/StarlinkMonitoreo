import type { FastifyRequest, FastifyReply } from 'fastify';

export interface JwtUser {
  sub:   number;
  email: string;
  role:  string;
}

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

/** Verifica JWT y exige rol 'admin'. Retorna 403 si el usuario es viewer. */
export async function requireAdmin(
  request: FastifyRequest,
  reply:   FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
    const user = request.user as JwtUser;
    if (user.role !== 'admin') {
      reply.code(403).send({ error: 'Acceso restringido a administradores.' });
    }
  } catch {
    reply.code(401).send({ error: 'No autorizado. Token inválido o expirado.' });
  }
}
