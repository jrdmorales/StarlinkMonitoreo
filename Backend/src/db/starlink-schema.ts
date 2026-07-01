import {
  pgTable, uuid, text, timestamp, integer,
  doublePrecision, jsonb, unique, index,
} from 'drizzle-orm/pg-core';

// FK a obras.id no usa .references() para evitar imports cross-file que rompen drizzle-kit (CJS bundler).
// La constraint REFERENCES obras(id) ON DELETE CASCADE existe en la migración SQL generada manualmente.

/** Credenciales OAuth2 del service account Starlink por obra */
export const starlinkAccounts = pgTable('starlink_accounts', {
  id:                    uuid('id').primaryKey().defaultRandom(),
  // Nullable a propósito: la cuenta puede sincronizarse sin obra asignada
  // todavía — las antenas resultantes quedan "sin obra" y se asignan
  // manualmente después en /api/admin/antennas.
  obraId:                integer('obra_id'),
  starlinkAccountId:     text('starlink_account_id').notNull(), // "ACC-xxxx"
  clientId:              text('client_id').notNull(),
  clientSecretEncrypted: text('client_secret_encrypted').notNull(), // AES-256-GCM, nunca plano
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  // Único por starlinkAccountId solo (no obraId+starlinkAccountId): con
  // obraId nullable, Postgres trata cada NULL como distinto en una unique
  // compuesta, así que ON CONFLICT nunca matchearía y el seed desde env
  // insertaría filas duplicadas en cada restart.
  accountUnique: unique().on(t.starlinkAccountId),
}));

/** Cache de access tokens — una fila viva por cuenta Starlink */
export const starlinkTokens = pgTable('starlink_tokens', {
  id:                uuid('id').primaryKey().defaultRandom(),
  starlinkAccountId: uuid('starlink_account_id').notNull()
    .references(() => starlinkAccounts.id, { onDelete: 'cascade' }),
  accessToken:       text('access_token').notNull(),
  expiresAt:         timestamp('expires_at', { withTimezone: true }).notNull(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  accountUnique: unique().on(t.starlinkAccountId),
}));

/** Terminales Starlink (snapshot, se resincroniza periódicamente) */
export const starlinkUserTerminals = pgTable('starlink_user_terminals', {
  id:                uuid('id').primaryKey().defaultRandom(),
  obraId:            integer('obra_id'),
  starlinkAccountId: uuid('starlink_account_id').notNull()
    .references(() => starlinkAccounts.id, { onDelete: 'cascade' }),
  userTerminalId:    text('user_terminal_id').notNull(),
  dishSerialNumber:  text('dish_serial_number'),
  kitSerialNumber:   text('kit_serial_number'),
  serviceLineNumber: text('service_line_number'),
  nickname:          text('nickname'),
  syncedAt:          timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  obraIdx:        index('idx_sl_terminals_obra').on(t.obraId),
  externalUnique: unique().on(t.starlinkAccountId, t.userTerminalId),
}));

/**
 * Histórico de consumo de datos por service line.
 * rawResponse guarda el payload crudo para debug/reprocess; usar columnas tipadas en queries.
 */
export const starlinkDataUsage = pgTable('starlink_data_usage', {
  id:                uuid('id').primaryKey().defaultRandom(),
  obraId:            integer('obra_id'),
  starlinkAccountId: uuid('starlink_account_id').notNull()
    .references(() => starlinkAccounts.id, { onDelete: 'cascade' }),
  serviceLineNumber: text('service_line_number').notNull(),
  billingCycleStart: timestamp('billing_cycle_start', { withTimezone: true }),
  billingCycleEnd:   timestamp('billing_cycle_end',   { withTimezone: true }),
  dataAmountGb:      doublePrecision('data_amount_gb').notNull(),
  rawResponse:       jsonb('raw_response'),
  fetchedAt:         timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  obraIdx:         index('idx_sl_usage_obra').on(t.obraId),
  serviceLineIdx:  index('idx_sl_usage_service_line').on(t.serviceLineNumber, t.fetchedAt),
}));

export type StarlinkAccountRow      = typeof starlinkAccounts.$inferSelect;
export type StarlinkUserTerminalRow = typeof starlinkUserTerminals.$inferSelect;
export type StarlinkDataUsageRow    = typeof starlinkDataUsage.$inferSelect;
