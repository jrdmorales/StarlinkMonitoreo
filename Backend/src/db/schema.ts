import {
  pgTable, serial, varchar, boolean, integer,
  numeric, date, timestamp, unique, index, smallint,
} from 'drizzle-orm/pg-core';

/** Grupos de antenas organizados por obra de construcción */
export const obras = pgTable('obras', {
  id:        serial('id').primaryKey(),
  key:       varchar('key', { length: 50 }).unique().notNull(),    // "SALAR-CLIENTES"
  label:     varchar('label', { length: 100 }).notNull(),          // "Salar"
  prefix:    varchar('prefix', { length: 10 }).notNull(),          // "SAL"
  email:     varchar('email', { length: 255 }).notNull(),
  active:    boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Antenas Starlink individuales */
export const antennas = pgTable('antennas', {
  id:        serial('id').primaryKey(),
  code:      varchar('code', { length: 50 }).unique().notNull(),   // "10000697951" | "SL-XXXXXXXX-XXXXX-XX"
  obraId:    integer('obra_id').references(() => obras.id, { onDelete: 'set null' }),
  name:      varchar('name', { length: 255 }),                     // nombre completo de New Relic
  limitGb:   integer('limit_gb').notNull().default(2000),
  active:    boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Snapshot de consumo por antena en cada fetch.
 * consumed_gb es el total acumulado en el ciclo (no incremental).
 */
export const consumptionLogs = pgTable('consumption_logs', {
  id:         serial('id').primaryKey(),
  antennaId:  integer('antenna_id').notNull().references(() => antennas.id),
  sampledAt:  timestamp('sampled_at', { withTimezone: true }).notNull(),
  cycleStart: date('cycle_start').notNull(),
  cycleEnd:   date('cycle_end').notNull(),
  consumedGb: numeric('consumed_gb', { precision: 10, scale: 2 }).notNull(),
  limitGb:    integer('limit_gb').notNull(),
  usagePct:   numeric('usage_pct', { precision: 5, scale: 2 }).notNull(),
}, (t) => ({
  // Evita duplicados si el cron corre múltiples veces con el mismo timestamp
  uniqAntennaTime: unique('consumption_antenna_time_uniq').on(t.antennaId, t.sampledAt),
  // Índice para queries de historial: buscar por antena ordenado por tiempo
  idxAntennaTime:  index('idx_consumption_antenna_time').on(t.antennaId, t.sampledAt),
}));

/**
 * Log de alertas enviadas por email.
 * La constraint unique garantiza que no se repita la misma alerta en el mismo ciclo.
 */
export const alertLog = pgTable('alert_log', {
  id:         serial('id').primaryKey(),
  antennaId:  integer('antenna_id').notNull().references(() => antennas.id),
  threshold:  smallint('threshold').notNull(),  // 50 | 80 | 100
  cycleStart: date('cycle_start').notNull(),
  sentAt:     timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqAlertPerCycle: unique('alert_antenna_threshold_cycle_uniq').on(
    t.antennaId, t.threshold, t.cycleStart,
  ),
}));

/** Usuarios del panel admin — roles: 'admin' (acceso total) | 'viewer' (solo lectura) */
export const users = pgTable('users', {
  id:           serial('id').primaryKey(),
  email:        varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role:         varchar('role', { length: 20 }).notNull().default('admin'), // default 'admin' para usuarios existentes en migración
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Tipos inferidos desde el schema — usar en repositorios
export type ObraRow    = typeof obras.$inferSelect;
export type AntennaRow = typeof antennas.$inferSelect;
export type ConsumptionLogRow = typeof consumptionLogs.$inferSelect;
export type AlertLogRow = typeof alertLog.$inferSelect;
