# Integración Starlink API V2 — Fastify + Drizzle + PostgreSQL

## Contexto y decisiones de diseño

Multi-tenant: cada cliente tiene su propia cuenta Starlink (service account propio, `client_id`/`client_secret` propios). Esto implica:

- Un token por tenant, no uno global. Cachear en Postgres, no en memoria de proceso — necesario para sobrevivir restarts y para que múltiples instancias del backend no pisen el refresh entre sí.
- Aislamiento estricto por `tenant_id` en toda tabla que toque datos de Starlink. Ningún query sin ese filtro.
- Credenciales (`client_secret`) cifradas en reposo, nunca en texto plano ni en logs.

No hay solución "ingeniosa" aquí: es CRUD + un scheduler de refresh + un job de sync. Resistir la tentación de meter lógica de negocio en el cliente HTTP.

---

## 1. Schema (Drizzle)

```typescript
// db/schema/starlink.ts
import { pgTable, uuid, text, timestamp, integer, doublePrecision, boolean, jsonb, unique, index } from 'drizzle-orm/pg-core';

// Credenciales del service account por tenant
export const starlinkAccounts = pgTable('starlink_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  starlinkAccountId: text('starlink_account_id').notNull(), // "ACC-xxxx"
  clientId: text('client_id').notNull(),
  clientSecretEncrypted: text('client_secret_encrypted').notNull(), // cifrado con KMS/libsodium, nunca plano
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantUnique: unique().on(table.tenantId, table.starlinkAccountId),
}));

// Cache de tokens — una fila viva por starlink_account
export const starlinkTokens = pgTable('starlink_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  starlinkAccountId: uuid('starlink_account_id').notNull().references(() => starlinkAccounts.id, { onDelete: 'cascade' }),
  accessToken: text('access_token').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  accountUnique: unique().on(table.starlinkAccountId),
}));

// Terminales (snapshot, se resincroniza periódicamente)
export const starlinkUserTerminals = pgTable('starlink_user_terminals', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  starlinkAccountId: uuid('starlink_account_id').notNull().references(() => starlinkAccounts.id, { onDelete: 'cascade' }),
  userTerminalId: text('user_terminal_id').notNull(), // ID externo de Starlink
  dishSerialNumber: text('dish_serial_number'),
  kitSerialNumber: text('kit_serial_number'),
  serviceLineNumber: text('service_line_number'),
  nickname: text('nickname'),
  syncedAt: timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index().on(table.tenantId),
  externalUnique: unique().on(table.starlinkAccountId, table.userTerminalId),
}));

// Histórico de consumo de datos — esto es lo que alimenta reportes/gráficas
export const starlinkDataUsage = pgTable('starlink_data_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  starlinkAccountId: uuid('starlink_account_id').notNull().references(() => starlinkAccounts.id, { onDelete: 'cascade' }),
  serviceLineNumber: text('service_line_number').notNull(),
  billingCycleStart: timestamp('billing_cycle_start', { withTimezone: true }),
  dataAmountGb: doublePrecision('data_amount_gb').notNull(),
  rawResponse: jsonb('raw_response'), // payload completo por trazabilidad/debug, no para queries
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index().on(table.tenantId),
  serviceLineIdx: index().on(table.serviceLineNumber, table.fetchedAt),
}));
```

Decisión deliberada: `rawResponse` en `jsonb` guarda el payload crudo por si la API cambia de forma o necesitas reprocesar histórico, pero las columnas tipadas (`dataAmountGb`, `billingCycleStart`) son las que usa cualquier query de reporte — no parsees JSON en cada lectura para graficar.

---

## 2. Cliente HTTP — autenticación y refresh

```typescript
// services/starlink/client.ts
import { db } from '../../db';
import { starlinkAccounts, starlinkTokens } from '../../db/schema/starlink';
import { eq } from 'drizzle-orm';
import { decrypt } from '../../lib/crypto';

const TOKEN_URL = 'https://www.starlink.com/api/auth/connect/token';
const BASE_URL = 'https://starlink.com/public/v2';
const SAFETY_MARGIN_MS = 30_000;

interface StarlinkAccountCreds {
  id: string;
  clientId: string;
  clientSecretEncrypted: string;
}

async function getValidToken(account: StarlinkAccountCreds): Promise<string> {
  const cached = await db.query.starlinkTokens.findFirst({
    where: eq(starlinkTokens.starlinkAccountId, account.id),
  });

  const now = Date.now();
  if (cached && cached.expiresAt.getTime() - SAFETY_MARGIN_MS > now) {
    return cached.accessToken;
  }

  return refreshToken(account);
}

async function refreshToken(account: StarlinkAccountCreds): Promise<string> {
  const clientSecret = await decrypt(account.clientSecretEncrypted);

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: account.clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    throw new StarlinkAuthError(`Token refresh failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json() as { access_token: string; expires_in: number };
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  // upsert: una fila por starlink_account, no acumular histórico de tokens
  await db.insert(starlinkTokens)
    .values({ starlinkAccountId: account.id, accessToken: data.access_token, expiresAt })
    .onConflictDoUpdate({
      target: starlinkTokens.starlinkAccountId,
      set: { accessToken: data.access_token, expiresAt, updatedAt: new Date() },
    });

  return data.access_token;
}

export class StarlinkAuthError extends Error {}
export class StarlinkApiError extends Error {
  constructor(message: string, public status: number, public body: unknown) {
    super(message);
  }
}

export async function starlinkFetch<T>(
  account: StarlinkAccountCreds,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getValidToken(account);

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    // token pudo haber sido revocado del lado de Starlink pese a no haber expirado localmente
    // un solo retry con refresh forzado, no loop infinito
    const freshToken = await refreshToken(account);
    const retryResponse = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${freshToken}`, 'Content-Type': 'application/json' },
    });
    if (!retryResponse.ok) {
      throw new StarlinkApiError(`Request failed after token refresh`, retryResponse.status, await retryResponse.json().catch(() => null));
    }
    return retryResponse.json();
  }

  if (!response.ok) {
    throw new StarlinkApiError(`Starlink API error`, response.status, await response.json().catch(() => null));
  }

  return response.json();
}
```

Punto crítico: el 401-retry-once evita loop infinito si el token sigue inválido tras refresh (credenciales revocadas de verdad) — en ese caso el segundo fallo se propaga como error real, no se reintenta indefinidamente.

No mezcles este cliente con lógica de negocio. Su única responsabilidad es: token válido + request autenticado + manejo de 401. Nada de parsing de dominio aquí.

---

## 3. Capa de dominio — terminales y consumo

```typescript
// services/starlink/terminals.ts
import { starlinkFetch } from './client';
import { db } from '../../db';
import { starlinkUserTerminals } from '../../db/schema/starlink';
import { eq, and } from 'drizzle-orm';

interface UserTerminalResponse {
  content: {
    totalCount: number;
    isLastPage: boolean;
    results: Array<{
      userTerminalId: string;
      dishSerialNumber: string;
      kitSerialNumber: string;
      serviceLineNumber: string;
      nickname: string | null;
    }>;
  };
}

export async function syncUserTerminals(tenantId: string, account: { id: string; clientId: string; clientSecretEncrypted: string }) {
  const data = await starlinkFetch<UserTerminalResponse>(account, '/user-terminals');

  // upsert por terminal, no DELETE+INSERT — evita huecos si el sync falla a medio camino
  for (const terminal of data.content.results) {
    await db.insert(starlinkUserTerminals)
      .values({
        tenantId,
        starlinkAccountId: account.id,
        userTerminalId: terminal.userTerminalId,
        dishSerialNumber: terminal.dishSerialNumber,
        kitSerialNumber: terminal.kitSerialNumber,
        serviceLineNumber: terminal.serviceLineNumber,
        nickname: terminal.nickname,
        syncedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [starlinkUserTerminals.starlinkAccountId, starlinkUserTerminals.userTerminalId],
        set: { dishSerialNumber: terminal.dishSerialNumber, serviceLineNumber: terminal.serviceLineNumber, nickname: terminal.nickname, syncedAt: new Date() },
      });
  }

  return data.content.totalCount;
}

export async function getTerminalCount(tenantId: string): Promise<number> {
  const rows = await db.select().from(starlinkUserTerminals).where(eq(starlinkUserTerminals.tenantId, tenantId));
  return rows.length;
}
```

```typescript
// services/starlink/dataUsage.ts
import { starlinkFetch } from './client';
import { db } from '../../db';
import { starlinkDataUsage } from '../../db/schema/starlink';

interface DataUsageResponse {
  content: {
    results: Array<{
      serviceLineNumber: string;
      billingCycles: Array<{
        startDate: string;
        totalDataUsageGb: number; // confirmar nombre exacto de campo contra response real
      }>;
    }>;
  };
}

export async function fetchAndPersistDataUsage(
  tenantId: string,
  account: { id: string; clientId: string; clientSecretEncrypted: string },
  serviceLineNumbers: string[],
) {
  const data = await starlinkFetch<DataUsageResponse>(account, '/data-usage/query?page=0&limit=250', {
    method: 'POST',
    body: JSON.stringify({
      serviceLineNumbers,
      previousBillingCycles: 1,
      activeServiceLinesOnly: true,
    }),
  });

  const rows = data.content.results.flatMap((sl) =>
    sl.billingCycles.map((cycle) => ({
      tenantId,
      starlinkAccountId: account.id,
      serviceLineNumber: sl.serviceLineNumber,
      billingCycleStart: new Date(cycle.startDate),
      dataAmountGb: cycle.totalDataUsageGb,
      rawResponse: cycle,
      fetchedAt: new Date(),
    })),
  );

  if (rows.length > 0) {
    await db.insert(starlinkDataUsage).values(rows);
  }

  return rows;
}
```

Nota: el shape exacto de `DataUsageResponse` lo dejé como mejor estimación basada en el patrón visto en otros endpoints — **valida contra el response real** de tu `POST /data-usage/query` antes de confiar en este código en producción. No asumas el nombre de campo (`totalDataUsageGb`) sin confirmarlo, mismo error que cometimos con los paths al inicio.

---

## 4. Rutas Fastify

```typescript
// routes/starlink.ts
import { FastifyInstance } from 'fastify';
import { syncUserTerminals, getTerminalCount } from '../services/starlink/terminals';
import { fetchAndPersistDataUsage } from '../services/starlink/dataUsage';
import { getStarlinkAccountForTenant } from '../services/starlink/accounts'; // resuelve credenciales por tenant_id de la request autenticada

export async function starlinkRoutes(app: FastifyInstance) {
  app.get('/api/starlink/terminals/count', async (request, reply) => {
    const tenantId = request.tenantId; // de tu middleware de auth/tenant
    const count = await getTerminalCount(tenantId);
    return { count };
  });

  app.post('/api/starlink/terminals/sync', async (request, reply) => {
    const tenantId = request.tenantId;
    const account = await getStarlinkAccountForTenant(tenantId);
    if (!account) return reply.code(404).send({ error: 'starlink_account_not_configured' });

    const totalCount = await syncUserTerminals(tenantId, account);
    return { synced: totalCount };
  });

  app.post('/api/starlink/data-usage/sync', async (request, reply) => {
    const tenantId = request.tenantId;
    const account = await getStarlinkAccountForTenant(tenantId);
    if (!account) return reply.code(404).send({ error: 'starlink_account_not_configured' });

    const { serviceLineNumbers } = request.body as { serviceLineNumbers: string[] };
    const rows = await fetchAndPersistDataUsage(tenantId, account, serviceLineNumbers);
    return { persisted: rows.length };
  });
}
```

Cada ruta resuelve `tenantId` desde el contexto de auth ya existente en tu backend (no lo recibas como param de la URL ni del body — eso permite que un tenant consulte datos de otro con solo cambiar un ID).

---

## 5. Job de sincronización periódica

No hagas fetch a Starlink en cada request del usuario final — eso acopla la latencia de tu API a la de Starlink y multiplica llamadas innecesarias. Sincroniza con un job.

```typescript
// jobs/starlinkSync.ts
import { db } from '../db';
import { starlinkAccounts } from '../db/schema/starlink';
import { syncUserTerminals } from '../services/starlink/terminals';
import { fetchAndPersistDataUsage } from '../services/starlink/dataUsage';

export async function runStarlinkSyncForAllTenants() {
  const accounts = await db.select().from(starlinkAccounts);

  for (const account of accounts) {
    try {
      await syncUserTerminals(account.tenantId, account);

      const terminals = await db.query.starlinkUserTerminals.findMany({
        where: (t, { eq }) => eq(t.starlinkAccountId, account.id),
      });
      const serviceLineNumbers = terminals.map((t) => t.serviceLineNumber).filter(Boolean) as string[];

      if (serviceLineNumbers.length > 0) {
        await fetchAndPersistDataUsage(account.tenantId, account, serviceLineNumbers);
      }
    } catch (err) {
      // un tenant fallando no debe detener el sync de los demás
      app.log.error({ err, tenantId: account.tenantId }, 'starlink_sync_failed');
    }
  }
}
```

Ejecútalo con tu scheduler existente (cron job, BullMQ repeatable job, lo que ya tengan en el stack — no introduzcas una librería nueva solo para esto). Frecuencia sugerida: cada 6-12 horas es razonable para data-usage; no hay necesidad de tiempo real salvo que el negocio lo exija explícitamente.

---

## 6. Seguridad — no negociable

- **Cifra `clientSecretEncrypted`** con KMS de tu proveedor cloud o `libsodium` antes de insertar en `starlink_accounts`. Nunca en texto plano, ni en logs, ni en `rawResponse` de otras tablas.
- **RLS (Row Level Security) en Postgres** si tu arquitectura multi-tenant ya lo usa para otras tablas — aplícalo también aquí por consistencia, no por necesidad extra.
- **Nunca expongas `clientSecret` ni `accessToken` en responses de tu API** — ni siquiera a usuarios admin del tenant. Si necesitan rotar credenciales, expón un endpoint que solo permita reemplazar, no leer.
- **Rate limiting de tu lado** antes de pegarle a Starlink en el job de sync — si tienes muchos tenants, paralelizar sin control puede gatillar 429 de Starlink. Procesa secuencial o con concurrencia limitada (`p-limit` o similar) si la cantidad de cuentas crece.

---

## Pendiente de validar

1. Shape exacto del response de `/data-usage/query` — el campo `totalDataUsageGb` es una suposición, confírmalo con un request real antes de deployar.
2. Permisos exactos requeridos por cada endpoint (`featureAccessString`/`permissionString`) — documenta cuáles necesita cada service account de cliente, ya que el onboarding de un tenant nuevo va a requerir que configuren esos permisos en su panel de Starlink antes de que el sync funcione.
3. Rate limits de la API de Starlink — no documentados en lo que revisamos; necesitas probarlo empíricamente o contactar soporte antes de escalar a muchos tenants.
