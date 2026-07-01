import { z } from 'zod';

const schema = z.object({
  DATABASE_URL:        z.string().url('DATABASE_URL debe ser una URL válida de PostgreSQL'),
  NEWRELIC_API_KEY:    z.string().min(1, 'NEWRELIC_API_KEY es requerida'),
  NEWRELIC_ACCOUNT_ID: z.string().default('7041272'),
  PORT:                z.coerce.number().default(3000),
  NODE_ENV:            z.enum(['development', 'production', 'test']).default('development'),
  FETCH_CRON:          z.string().default('0 */4 * * *'),
  REPORT_CRON:         z.string().default('0 8 * * 5'),   // viernes 08:00
  ALERT_THRESHOLDS:    z.string().default('60,80,100'),
  // Fase 2: email
  SMTP_HOST:           z.string().optional(),
  SMTP_PORT:           z.coerce.number().default(587),
  SMTP_USER:           z.string().optional(),
  SMTP_PASS:           z.string().optional(),
  SMTP_FROM:           z.string().optional(),
  // Fase 3: auth
  JWT_SECRET:          z.string().min(32).optional(),
  ADMIN_EMAIL:         z.string().email().optional(),
  ADMIN_PASSWORD_HASH: z.string().optional(),
  // Starlink API directa
  STARLINK_ENCRYPTION_KEY: z.string().length(64, 'debe ser 64 chars hex (32 bytes) — generá con: openssl rand -hex 32').optional(),
  STARLINK_SYNC_CRON:      z.string().default('0 */6 * * *'),
  // Cuentas Starlink — JSON array, seed automático al arrancar
  STARLINK_ACCOUNTS:       z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('[Config] Variables de entorno inválidas:');
  for (const [field, errors] of Object.entries(parsed.error.flatten().fieldErrors)) {
    console.error(`  ${field}: ${(errors as string[]).join(', ')}`);
  }
  process.exit(1);
}

export const config = parsed.data;

export const alertThresholds: number[] = config.ALERT_THRESHOLDS
  .split(',')
  .map(Number)
  .filter((n) => !isNaN(n))
  .sort((a, b) => a - b);
