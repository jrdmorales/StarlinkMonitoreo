import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { starlinkAccounts } from '../../db/starlink-schema.js';
import { encrypt } from '../../lib/crypto.js';
import { config } from '../../lib/config.js';

export async function getStarlinkAccountForObra(obraId: number) {
  const [account] = await db.select()
    .from(starlinkAccounts)
    .where(eq(starlinkAccounts.obraId, obraId))
    .limit(1);
  return account ?? null;
}

export async function getAllStarlinkAccounts() {
  return db.select().from(starlinkAccounts);
}

interface EnvAccount {
  obraId?:           number;
  starlinkAccountId: string;
  clientId:          string;
  clientSecret:      string;
}

/**
 * Upsert de todas las cuentas definidas en STARLINK_ACCOUNTS (JSON array).
 * Requiere STARLINK_ENCRYPTION_KEY. Cuentas con campos faltantes se omiten con warning.
 */
export async function seedAccountFromEnv(): Promise<void> {
  const { STARLINK_ACCOUNTS, STARLINK_ENCRYPTION_KEY } = config;

  if (!STARLINK_ACCOUNTS) {
    console.warn('[Starlink] STARLINK_ACCOUNTS no configurada — 0 cuentas Starlink registradas, sync no tendrá nada que sincronizar.');
    return;
  }

  if (!STARLINK_ENCRYPTION_KEY) {
    console.warn('[Starlink] STARLINK_ENCRYPTION_KEY no configurada — no se puede guardar credenciales.');
    return;
  }

  let accounts: EnvAccount[];
  try {
    accounts = JSON.parse(STARLINK_ACCOUNTS) as EnvAccount[];
    if (!Array.isArray(accounts)) throw new Error('debe ser un array');
  } catch (err) {
    console.error('[Starlink] STARLINK_ACCOUNTS JSON inválido:', err);
    return;
  }

  for (const acc of accounts) {
    if (!acc.starlinkAccountId || !acc.clientId || !acc.clientSecret) {
      console.warn(`[Starlink] Cuenta incompleta omitida:`, acc);
      continue;
    }
    if (acc.obraId === undefined) {
      console.info(`[Starlink] Cuenta ${acc.starlinkAccountId} sin obraId — se sincroniza sin obra asignada, asignar luego en /api/admin/antennas.`);
    }

    const clientSecretEncrypted = encrypt(acc.clientSecret);

    await db.insert(starlinkAccounts)
      .values({
        obraId:                acc.obraId ?? null,
        starlinkAccountId:     acc.starlinkAccountId,
        clientId:              acc.clientId,
        clientSecretEncrypted,
      })
      .onConflictDoUpdate({
        target: starlinkAccounts.starlinkAccountId,
        set:    { obraId: acc.obraId ?? null, clientId: acc.clientId, clientSecretEncrypted, updatedAt: new Date() },
      });

    console.info(`[Starlink] Cuenta ${acc.starlinkAccountId} (obraId ${acc.obraId ?? 'sin asignar'}) registrada desde .env`);
  }
}
