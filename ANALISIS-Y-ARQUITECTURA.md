# Starlink Control — Análisis de Arquitectura e Implementación

> Análisis senior · Stack recomendado · Plan de implementación modular

---

## 1. Diagnóstico del Estado Actual

### 1.1 Script de n8n (script antiguo)

El flujo n8n hace tres cosas en cadena:

| Paso | Qué hace | Problema |
|------|----------|---------|
| HTTP Request | Llama `api.newrelic.com/graphql` con API key hardcodeada | Credencial expuesta en texto plano |
| Code node 1 | De-duplica resultados por código de antena, filtra al ciclo más reciente | Lógica OK, reutilizable |
| Code node 2 | Agrupa por obra, calcula proyecciones, genera HTML de email | Mezclado: business logic + presentación |

**Problemas concretos del script:**
- API key hardcodeada expuesta — **ya rotada, reemplazar por variable de entorno**
- Sin persistencia: no hay historial, cada ejecución es efímera
- Sin estado de alertas: no sabe si ya envió el 50% o el 80%
- `groupMapping` hardcodeado — no hay forma de administrar antenas sin editar el código
- Cycle detection asume día 14 fijo; si New Relic devuelve fechas distintas puede romperse

### 1.2 Frontend (prototipo)

El diseño es excelente y está bien estructurado:
- `components.jsx` — componentes puros reutilizables (AreaChart, DonutGauge, UsageBar, etc.)
- `app.jsx` — vistas (Overview, ObraView, AntennaDetail)
- `data.jsx` — capa de datos **mock** que hay que reemplazar por API real

**Lo que hay que hacer con el frontend:**
- Migrar de CDN + Babel a build real (Vite + TypeScript)
- Reemplazar `window.DATA` por React Query + llamadas REST
- Agregar routing real (overview ↔ obra detail ↔ admin)
- Agregar autenticación (pantalla de login para admin)

---

## 2. Stack Recomendado

### Por qué este stack

La lógica existente es JavaScript. El frontend es React. Usar Node.js en backend elimina el context switch y permite compartir tipos e interfaces entre capas.

```
┌─────────────────────────────────────────────────┐
│  Frontend  React 18 + Vite + TypeScript          │
│            TanStack Query · React Router v6      │
│            CSS existente (sin migrar a Tailwind) │
├─────────────────────────────────────────────────┤
│  Backend   Node.js 20 LTS + Fastify              │
│            TypeScript · Zod (validación)         │
│            Drizzle ORM                           │
│            node-cron (scheduler)                 │
│            Nodemailer (email)                    │
├─────────────────────────────────────────────────┤
│  Base de   PostgreSQL 16                         │
│  Datos     Drizzle Migrations                    │
├─────────────────────────────────────────────────┤
│  Externo   New Relic GraphQL API                 │
│            SMTP (correo saliente)                │
└─────────────────────────────────────────────────┘
```

### Por qué Fastify sobre Express
- TypeScript first, sin boilerplate extra
- Schema validation integrada (usa Zod en nuestro caso)
- 2x más rápido que Express en benchmarks
- Plugin system limpio para separar concerns

### Por qué Drizzle sobre Prisma
- Queries en SQL-like syntax — sin magia, predecible
- Migraciones como archivos SQL versionados
- Bundle size mínimo, sin runtime binarios
- Type inference automático desde el schema

### Por qué TanStack Query en frontend
- Caché automático de respuestas API
- Refetch en background, stale-while-revalidate
- Loading/error states sin boilerplate
- Reemplaza exactamente `window.DATA` con datos reales

---

## 3. Estructura de Directorios

```
starlink/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── antennas.ts       # CRUD antenas
│   │   │   │   ├── obras.ts          # CRUD obras / grupos
│   │   │   │   ├── consumption.ts    # histórico, ciclo actual
│   │   │   │   ├── alerts.ts         # log de alertas
│   │   │   │   └── auth.ts           # login admin
│   │   │   └── middleware/
│   │   │       ├── auth.ts           # JWT guard
│   │   │       └── error-handler.ts
│   │   ├── services/
│   │   │   ├── newrelic.service.ts   # llamada a New Relic GQL
│   │   │   ├── consumption.service.ts# lógica de ciclo y proyecciones
│   │   │   ├── alert.service.ts      # evaluación y envío de alertas
│   │   │   └── email.service.ts      # wrapper Nodemailer
│   │   ├── jobs/
│   │   │   ├── fetch-consumption.job.ts  # cron: fetch + persist
│   │   │   └── check-alerts.job.ts       # cron: evaluar umbrales
│   │   ├── db/
│   │   │   ├── client.ts             # instancia Drizzle
│   │   │   ├── schema.ts             # tablas como código TS
│   │   │   ├── migrations/           # archivos SQL versionados
│   │   │   └── repositories/
│   │   │       ├── antenna.repo.ts
│   │   │       ├── obra.repo.ts
│   │   │       ├── consumption.repo.ts
│   │   │       └── alert.repo.ts
│   │   ├── lib/
│   │   │   ├── cycle.ts              # lógica de ciclo (día 14)
│   │   │   ├── projection.ts         # cálculo de proyección + bolsas
│   │   │   └── config.ts             # env vars tipadas
│   │   └── types/
│   │       └── index.ts              # interfaces compartidas
│   ├── .env.example
│   ├── drizzle.config.ts
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts             # fetch wrapper tipado
│   │   ├── components/               # migración de components.jsx
│   │   │   ├── charts/
│   │   │   │   ├── AreaChart.tsx
│   │   │   │   └── Sparkline.tsx
│   │   │   ├── ui/
│   │   │   │   ├── DonutGauge.tsx
│   │   │   │   ├── UsageBar.tsx
│   │   │   │   ├── StatusBadge.tsx
│   │   │   │   └── Icons.tsx
│   │   │   └── layout/
│   │   │       └── Sidebar.tsx
│   │   ├── pages/
│   │   │   ├── Overview.tsx          # migración de Overview()
│   │   │   ├── ObraDetail.tsx        # migración de ObraView()
│   │   │   ├── Admin.tsx             # nuevo: gestión de antenas
│   │   │   └── Login.tsx             # nuevo: autenticación
│   │   ├── hooks/
│   │   │   ├── useAntennas.ts        # TanStack Query hooks
│   │   │   ├── useObras.ts
│   │   │   └── useConsumption.ts
│   │   ├── lib/
│   │   │   ├── formatters.ts         # migración de nf0, fmtGB, etc.
│   │   │   └── constants.ts          # RISK, WARN thresholds
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css                 # CSS existente
│   ├── index.html
│   └── package.json
│
├── ANALISIS-Y-ARQUITECTURA.md
└── docker-compose.yml                # PostgreSQL local para dev
```

---

## 4. Schema de Base de Datos

```sql
-- Grupos de antenas (obras)
CREATE TABLE obras (
  id          SERIAL PRIMARY KEY,
  key         VARCHAR(50)  UNIQUE NOT NULL,  -- "SALAR-CLIENTES"
  label       VARCHAR(100) NOT NULL,          -- "Salar"
  prefix      VARCHAR(10)  NOT NULL,          -- "SAL"
  email       VARCHAR(255) NOT NULL,
  active      BOOLEAN      DEFAULT TRUE,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Antenas individuales
CREATE TABLE antennas (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(20)  UNIQUE NOT NULL,   -- "10000697951"
  obra_id     INTEGER      REFERENCES obras(id) ON DELETE SET NULL,
  name        VARCHAR(255),                   -- nombre completo de New Relic
  limit_gb    INTEGER      NOT NULL DEFAULT 2000,
  active      BOOLEAN      DEFAULT TRUE,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Snapshots de consumo (una fila por antena por fetch)
CREATE TABLE consumption_logs (
  id           SERIAL PRIMARY KEY,
  antenna_id   INTEGER      NOT NULL REFERENCES antennas(id),
  sampled_at   TIMESTAMPTZ  NOT NULL,
  cycle_start  DATE         NOT NULL,
  cycle_end    DATE         NOT NULL,
  consumed_gb  NUMERIC(10,2) NOT NULL,
  limit_gb     INTEGER      NOT NULL,
  usage_pct    NUMERIC(5,2) NOT NULL,
  UNIQUE(antenna_id, sampled_at)
);

-- Índice para queries de historial por antena + fecha
CREATE INDEX idx_consumption_antenna_time ON consumption_logs(antenna_id, sampled_at DESC);

-- Log de alertas enviadas (evita duplicados por ciclo)
CREATE TABLE alert_log (
  id          SERIAL PRIMARY KEY,
  antenna_id  INTEGER   NOT NULL REFERENCES antennas(id),
  threshold   SMALLINT  NOT NULL,  -- 50 | 80 | 100
  cycle_start DATE      NOT NULL,
  sent_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(antenna_id, threshold, cycle_start)   -- una alerta por umbral por ciclo
);

-- Usuario admin (único)
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

**Por qué `UNIQUE(antenna_id, threshold, cycle_start)` en alert_log:**
Garantiza idempotencia. Si el job de alertas corre 10 veces al día, solo envía cada umbral una vez por ciclo. Sin esta constraint, habría que hacer lógica en el código para evitar re-envíos.

---

## 5. Lógica de Negocio Clave

### 5.1 Ciclo de facturación

```typescript
// lib/cycle.ts
export function getCurrentCycle(now = new Date()): { start: Date; end: Date } {
  const y = now.getFullYear();
  const m = now.getMonth();

  if (now.getDate() >= 14) {
    return {
      start: new Date(y, m, 14),
      end:   new Date(y, m + 1, 13, 23, 59, 59),
    };
  }
  return {
    start: new Date(y, m - 1, 14),
    end:   new Date(y, m, 13, 23, 59, 59),
  };
}
```

### 5.2 Proyección y recomendación de bolsas

```typescript
// lib/projection.ts
export interface Projection {
  dailyAvg: number;
  projectedTotal: number;
  deficit: number;
  bagsNeeded: number;    // bolsas de 50 GB
  suggestion: string;
}

export function project(
  consumed: number,
  limitGb: number,
  dayElapsed: number,
  daysLeft: number,
): Projection {
  const dailyAvg      = consumed / Math.max(dayElapsed, 1);
  const projectedTotal = dailyAvg * (dayElapsed + daysLeft);
  const deficit       = Math.max(0, projectedTotal - limitGb);
  const bagsNeeded    = Math.ceil(deficit / 50);
  const usagePct      = (consumed / limitGb) * 100;

  let suggestion: string;
  if (deficit > 15)     suggestion = `Agrega ${bagsNeeded} bolsa(s) de 50 GB.`;
  else if (usagePct > 80) suggestion = "Precaución: superaste el 80% de la cuota.";
  else if (deficit > 0)   suggestion = `Podrías necesitar ${bagsNeeded} bolsa(s) extra.`;
  else                    suggestion = "Consumo dentro de lo esperado.";

  return { dailyAvg, projectedTotal, deficit, bagsNeeded, suggestion };
}
```

### 5.3 Llamada a New Relic

```typescript
// services/newrelic.service.ts
const QUERY = `{
  actor {
    account(id: 7041272) {
      nrql(query: "FROM consumoStarlink SELECT latest(ConsumoGigas) AS 'Consumo Gigas',
        latest(UsageLimitGB) AS 'Limite uso GB',
        100 * latest(ConsumoGigas) / latest(UsageLimitGB) AS '% Uso',
        latest(EndDate) AS 'Fecha Termino'
        FACET Nickname AS 'Dispositivo', ProductId, StartDate AS 'Fecha de inicio'
        SINCE 5 days ago LIMIT MAX") {
        results
      }
    }
  }
}`;

// Extrae código numérico del nombre del servicio
function extractCode(serviceName: string): string | null {
  return serviceName.match(/(\d+)$/)?.[1] ?? null;
}

// Filtra al ciclo más reciente (misma lógica del script n8n)
export function deduplicateByLatestCycle(
  results: NewRelicResult[],
): NewRelicResult[] {
  const grouped: Record<string, NewRelicResult> = {};

  for (const item of results) {
    const code  = extractCode(item.facet[0]);
    const fecha = item.facet[2];
    if (!code || !fecha) continue;
    if (!grouped[code] || fecha > grouped[code].facet[2]) {
      grouped[code] = item;
    }
  }

  const latestDate = Object.values(grouped).reduce(
    (max, item) => (item.facet[2] > max ? item.facet[2] : max), "",
  );

  return Object.values(grouped).filter((i) => i.facet[2] === latestDate);
}
```

---

## 6. Plan de Implementación por Fases

### Fase 1 — Backend core (sin frontend, sin cron)
**Objetivo:** API funcional, datos reales desde New Relic, persistencia en Postgres

- [ ] Setup Fastify + TypeScript + Drizzle
- [ ] Schema DB + migración inicial
- [ ] `newrelic.service.ts` — fetch + dedup + normalize
- [ ] `consumption.service.ts` — persist snapshot, calcular proyecciones
- [ ] `cycle.ts` + `projection.ts` — lógica pura
- [ ] Endpoint `GET /api/obras` — lista con KPIs agregados
- [ ] Endpoint `GET /api/obras/:key/antennas` — detalle
- [ ] Endpoint `GET /api/antennas/:code/history` — histórico
- [ ] Endpoint `POST /api/consumption/refresh` — trigger manual (para dev)

### Fase 2 — Alertas + cron
**Objetivo:** Sistema de notificaciones funcional

- [ ] `email.service.ts` — wrapper Nodemailer con template HTML
- [ ] `alert.service.ts` — evaluar umbrales, respetar `alert_log` (no duplicar)
- [ ] `fetch-consumption.job.ts` — cron cada N horas
- [ ] `check-alerts.job.ts` — cron post-fetch
- [ ] Template HTML email (migración del estilo del script n8n)

### Fase 3 — Auth + admin API
**Objetivo:** Panel de administración funcional

- [ ] `auth.ts` — JWT login / refresh
- [ ] Endpoints CRUD antenas (agregar, eliminar, renombrar, cambiar límite)
- [ ] Endpoints CRUD obras (agregar email de destino)
- [ ] Middleware guard en rutas admin

### Fase 4 — Frontend Vite
**Objetivo:** Migrar prototipo a app real

- [ ] Setup Vite + TypeScript + React Router
- [ ] Migrar `components.jsx` → componentes TypeScript individuales
- [ ] `api/client.ts` — fetch tipado contra backend
- [ ] Hooks TanStack Query (`useObras`, `useAntennas`, `useHistory`)
- [ ] Overview page con datos reales
- [ ] ObraDetail page con datos reales
- [ ] Login page
- [ ] Admin page (CRUD antenas)

### Fase 5 — Producción
- [ ] Docker Compose (postgres + backend + frontend)
- [ ] Variables de entorno en `.env` (nunca hardcodeado)
- [ ] Health check endpoint
- [ ] Logs estructurados (pino)
- [ ] Rotar API key New Relic

---

## 7. Endpoints API

```
# Datos (público con token de lectura)
GET  /api/obras                         # lista obras + KPIs
GET  /api/obras/:key                    # detalle de una obra
GET  /api/obras/:key/antennas           # antenas de la obra
GET  /api/antennas/:code/history        # historial consumo

# Trigger manual (dev/admin)
POST /api/consumption/refresh           # fetch New Relic + persist

# Alertas
GET  /api/alerts                        # log de alertas enviadas

# Auth
POST /api/auth/login                    # { email, password } → { token }
POST /api/auth/refresh

# Admin (requiere JWT)
GET    /api/admin/antennas              # lista todas
POST   /api/admin/antennas             # agregar antena
PATCH  /api/admin/antennas/:id         # renombrar / cambiar límite
DELETE /api/admin/antennas/:id         # desactivar (soft delete)
POST   /api/admin/obras                # agregar obra
PATCH  /api/admin/obras/:id            # cambiar email destino
```

---

## 8. Variables de Entorno

```env
# Backend — .env
DATABASE_URL=postgresql://user:pass@localhost:5432/starlink

NEWRELIC_API_KEY=NRAK-...              # rotar la actual
NEWRELIC_ACCOUNT_ID=7041272

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=alerts@excon.cl
SMTP_PASS=...
SMTP_FROM="Starlink Control <alerts@excon.cl>"

JWT_SECRET=...                         # mínimo 32 chars, random
ADMIN_EMAIL=jmorales@excon.cl
ADMIN_PASSWORD_HASH=...                # bcrypt hash

FETCH_CRON="0 */4 * * *"              # cada 4 horas
ALERT_THRESHOLDS=50,80,100
```

---

## 9. Reglas de Código (memoria de dev)

Estas reglas aplican a TODO el código del proyecto:

1. **Sin duplicación** — cualquier lógica que aparece dos veces va a un módulo en `lib/` o `services/`
2. **Funciones puras en `lib/`** — `cycle.ts` y `projection.ts` no importan nada del framework; son testeables sin DB ni HTTP
3. **Repositorios para DB** — ningún servicio escribe SQL directamente; todo va por `*.repo.ts`
4. **Types compartidos** — interfaces de datos en `types/index.ts`; ni el servicio ni la ruta definen sus propias interfaces si ya existe una
5. **Comentarios solo para WHY** — no comentar qué hace el código, solo por qué hace algo no obvio
6. **Validación en boundary** — Zod valida en la ruta (entrada del usuario/API externa); dentro del servicio no se re-valida
7. **Errores explícitos** — las funciones retornan `Result<T, E>` o lanzan errores tipados, nunca `any`
8. **Env vars centralizadas** — `lib/config.ts` lee y valida todas las env vars con Zod; nadie importa `process.env` directamente
9. **No hardcodear datos de negocio** — umbrales (50/80/100%), tamaño de bolsa (50 GB), ID de cuenta New Relic → todos desde config/env

---

## 10. Decisiones de Diseño Explícitas

| Decisión | Elegido | Descartado | Razón |
|----------|---------|-----------|-------|
| Backend lang | TypeScript | Python | Mismo ecosistema que frontend, lógica JS existente reutilizable |
| ORM | Drizzle | Prisma | Sin runtime binarios, SQL-like, bundle pequeño |
| Scheduler | node-cron | Agenda / Bull | Sin Redis requerido, suficiente para frecuencia horaria |
| Email | Nodemailer | Resend API | Sin dependencia de servicio externo de pago |
| Frontend state | TanStack Query | Redux / Zustand | Solo estado de servidor, no necesita store global |
| Auth | JWT stateless | Sessions | Sin estado en servidor, simple para usuario único |
| DB | PostgreSQL | MongoDB | Ya especificado en requisitos + datos relacionales |
| CSS | CSS custom existente | Tailwind | El diseño ya está hecho y es excelente, no migrar |

---

## 11. Lo que NO hacer

- **No usar n8n como parte del nuevo sistema** — n8n era la orquestación completa; ahora el backend es el orquestador
- **No commitear la API key actual de New Relic** — rotarla antes de cualquier commit
- **No mezclar business logic en rutas** — las rutas solo validan input y llaman al servicio
- **No hacer un endpoint que devuelva datos crudos de New Relic** — siempre normalizar y persistir primero
- **No enviar email directamente desde el job de fetch** — fetch → persist → (cron separado) → evaluar → alertar
- **No usar `any` en TypeScript** — configurar `"strict": true` en tsconfig

---

*Análisis generado el 2026-06-04 · Proyecto: Starlink Control Dashboard · Excon*
