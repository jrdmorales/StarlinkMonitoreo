import { eq, count } from 'drizzle-orm';
import { db } from '../client.js';
import { users } from '../schema.js';

export type UserRow = typeof users.$inferSelect;

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return row ?? null;
}

export async function createUser(email: string, passwordHash: string): Promise<UserRow> {
  const [row] = await db
    .insert(users)
    .values({ email, passwordHash })
    .returning();
  return row;
}

/** Cantidad de usuarios registrados — usado para proteger el endpoint de setup */
export async function countUsers(): Promise<number> {
  const [{ value }] = await db.select({ value: count() }).from(users);
  return Number(value);
}
