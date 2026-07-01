import { eq, count } from 'drizzle-orm';
import { db } from '../client.js';
import { users } from '../schema.js';

export type UserRow  = typeof users.$inferSelect;
export type UserRole = 'admin' | 'viewer';

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return row ?? null;
}

export async function findUserById(id: number): Promise<UserRow | null> {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

export async function createUser(email: string, passwordHash: string, role: UserRole = 'viewer'): Promise<UserRow> {
  const [row] = await db.insert(users).values({ email, passwordHash, role }).returning();
  return row;
}

export async function updateUserRole(id: number, role: UserRole): Promise<UserRow | null> {
  const [row] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
  return row ?? null;
}

export async function updateUserPassword(id: number, passwordHash: string): Promise<void> {
  await db.update(users).set({ passwordHash }).where(eq(users.id, id));
}

export async function deleteUser(id: number): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}

export async function listUsers(): Promise<Omit<UserRow, 'passwordHash'>[]> {
  return db.select({
    id:        users.id,
    email:     users.email,
    role:      users.role,
    createdAt: users.createdAt,
  }).from(users);
}

/** Cantidad de usuarios registrados — usado para proteger el endpoint de setup */
export async function countUsers(): Promise<number> {
  const [{ value }] = await db.select({ value: count() }).from(users);
  return Number(value);
}
