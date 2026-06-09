import type { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { findUserByEmail, createUser, countUsers } from '../../db/repositories/user.repo.js';

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
});

const setupSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

const authRoutes: FastifyPluginAsync = async (fastify) => {

  /**
   * Crea el primer y único usuario admin.
   * Bloqueado si ya existe un usuario en la DB — no permite registros adicionales.
   */
  fastify.post('/setup', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (req, reply) => {
    const total = await countUsers();
    if (total > 0) {
      return reply.code(409).send({ error: 'Admin ya configurado. Usa /login.' });
    }

    const body = setupSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Datos inválidos', details: body.error.flatten() });
    }

    const hash = await bcrypt.hash(body.data.password, 12);
    const user = await createUser(body.data.email, hash);

    return reply.code(201).send({
      ok:    true,
      email: user.email,
      hint:  'Ahora usa POST /api/auth/login para obtener tu token.',
    });
  });

  /** Autenticación: retorna JWT válido por 8 horas */
  fastify.post('/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Email o contraseña inválidos' });
    }

    const user = await findUserByEmail(body.data.email);
    if (!user) {
      // Misma respuesta para email o contraseña incorrectos — no revelar cuál falló
      return reply.code(401).send({ error: 'Credenciales incorrectas' });
    }

    const valid = await bcrypt.compare(body.data.password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ error: 'Credenciales incorrectas' });
    }

    const token = fastify.jwt.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '8h' },
    );

    return reply.send({
      token,
      expiresIn: '8h',
      email:     user.email,
    });
  });

  /** Verifica si el token en el header es válido — útil para el frontend */
  fastify.get('/me', {
    preHandler: async (req, reply) => {
      try { await req.jwtVerify(); }
      catch { reply.code(401).send({ error: 'No autorizado' }); }
    },
  }, async (req, reply) => {
    const user = req.user as { sub: number; email: string };
    return reply.send({ id: user.sub, email: user.email });
  });

};

export default authRoutes;
