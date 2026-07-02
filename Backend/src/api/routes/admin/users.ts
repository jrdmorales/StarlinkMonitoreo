import type { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { requireAdmin } from '../../middleware/auth.js';
import {
  listUsers, findUserById, createUser,
  updateUserRole, updateUserPassword, deleteUser, countAdmins,
  type UserRole,
} from '../../../db/repositories/user.repo.js';

const createSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role:     z.enum(['admin', 'viewer']).default('viewer'),
});

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'viewer']),
});

const updatePasswordSchema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

const adminUsersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', requireAdmin);

  /** Lista todos los usuarios (sin passwordHash) */
  fastify.get('/', async (_req, reply) => {
    const users = await listUsers();
    return reply.send({ users });
  });

  /** Crea un nuevo usuario con rol especificado */
  fastify.post('/', async (req, reply) => {
    const body = createSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Datos inválidos', details: body.error.flatten() });
    }

    const hash = await bcrypt.hash(body.data.password, 12);
    const user = await createUser(body.data.email, hash, body.data.role as UserRole);

    return reply.code(201).send({
      id:    user.id,
      email: user.email,
      role:  user.role,
    });
  });

  /** Cambia el rol de un usuario */
  fastify.patch<{ Params: { id: string } }>('/:id/role', async (req, reply) => {
    const id = Number(req.params.id);
    const body = updateRoleSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Rol inválido. Usa: admin | viewer' });
    }

    // Un admin no puede degradarse a sí mismo
    const caller = req.user as { sub: number };
    if (caller.sub === id && body.data.role !== 'admin') {
      return reply.code(400).send({ error: 'No puedes cambiar tu propio rol.' });
    }

    const updated = await updateUserRole(id, body.data.role);
    if (!updated) return reply.code(404).send({ error: 'Usuario no encontrado.' });

    return reply.send({ id: updated.id, email: updated.email, role: updated.role });
  });

  /** Resetea la contraseña de un usuario */
  fastify.patch<{ Params: { id: string } }>('/:id/password', async (req, reply) => {
    const id = Number(req.params.id);
    const body = updatePasswordSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Datos inválidos', details: body.error.flatten() });
    }

    const user = await findUserById(id);
    if (!user) return reply.code(404).send({ error: 'Usuario no encontrado.' });

    const hash = await bcrypt.hash(body.data.password, 12);
    await updateUserPassword(id, hash);

    return reply.send({ ok: true });
  });

  /** Elimina un usuario — un admin no puede eliminarse a sí mismo */
  fastify.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const id = Number(req.params.id);
    const caller = req.user as { sub: number };

    if (caller.sub === id) {
      return reply.code(400).send({ error: 'No puedes eliminar tu propia cuenta.' });
    }

    // Evitar dejar el sistema sin ningún admin
    const user = await findUserById(id);
    if (!user) return reply.code(404).send({ error: 'Usuario no encontrado.' });

    if (user.role === 'admin') {
      const admins = await countAdmins();
      if (admins <= 1) {
        return reply.code(400).send({ error: 'No puedes eliminar el único admin.' });
      }
    }

    await deleteUser(id);
    return reply.send({ ok: true });
  });
};

export default adminUsersRoutes;
