import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
import * as starlinkSchema from './starlink-schema.js';
import { config } from '../lib/config.js';

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max:              10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Sin este listener, un error en un cliente idle (ej. DB reiniciada) se convierte
// en excepción no capturada y tumba el proceso entero.
pool.on('error', (err) => {
  console.error('[DB] Error inesperado en pool de conexiones:', err);
});

export const db = drizzle(pool, { schema: { ...schema, ...starlinkSchema } });
export type DB = typeof db;
