# Starlink Control

Panel de monitoreo de consumo de antenas Starlink para obras de construcción. Permite visualizar en tiempo real el uso de datos por obra y antena, gestionar alertas automáticas por umbral de consumo, y enviar reportes semanales a los responsables de cada obra.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js · Fastify · Drizzle ORM |
| Base de datos | PostgreSQL |
| Frontend | React · Vite · TanStack Query |
| Datos | New Relic GraphQL API · Starlink API directa (opcional, por obra) |
| Email | Nodemailer · SMTP interno |

---

## Funcionalidades

- **Resumen** — KPIs globales, tendencia de consumo del ciclo, uso global (gauge), distribución por obra, antenas en alerta
- **Obras** — Listado con % de uso, consumo y estado; gestión (crear/editar nombre y email/activar-desactivar) para sesiones con rol admin
- **Antenas** — Listado global con historial (sparkline) y detalle de consumo por antena; gestión (crear/editar límite y obra/activar-desactivar) para sesiones con rol admin
- **Detalle de obra** — Gráfico histórico de la obra, tabla de antenas, detalle de antena seleccionada, proyección de consumo
- **Consumo** — Analítica: tendencia global del ciclo y consumo por obra
- **Alertas** — Log de alertas enviadas con vista previa del email
- **Reportes** — Envío manual de reporte por email (por obra o por antena puntual)
- **Ajustes** — Tema claro/oscuro, datos de cuenta, sincronización manual con New Relic/Starlink
- **Alertas automáticas** — Email al 60%, 80% y 100% de consumo (no se repite por ciclo)
- **Reporte semanal** — Email por obra cada viernes con resumen completo
- **Roles** — `admin` (lectura + escritura) y `viewer` (solo lectura); el dashboard es navegable sin sesión, las acciones de escritura requieren login
- **Procedimientos FAQ** — Guía interactiva de compra y contratación Starlink

---

## Estructura

```
starlink/
├── Backend/          # API Fastify + jobs cron
│   └── src/
│       ├── api/      # Rutas REST
│       ├── db/       # Schema Drizzle + repositorios
│       ├── jobs/     # Scheduler (fetch + alertas + reporte)
│       ├── lib/      # Config, constantes, ciclo, proyección
│       └── services/ # New Relic, email, alertas, reporte
├── Frontend/         # React app
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       └── types/
└── docker-compose.yml
```

---

## Configuración

### 1. Base de datos

```bash
docker compose up -d   # levanta PostgreSQL
```

### 2. Backend

```bash
cd Backend
cp .env.example .env   # completar variables
npm install
npm run db:push        # aplica schema a la DB
npm run dev
```

### Variables de entorno requeridas (`.env`)

```env
# Base de datos
DATABASE_URL=postgresql://user:pass@localhost:5432/starlink

# New Relic
NEWRELIC_API_KEY=NRAK-...
NEWRELIC_ACCOUNT_ID=7041272

# Servidor
PORT=3000
NODE_ENV=development

# Cron jobs
FETCH_CRON=0 */4 * * *     # fetch cada 4 horas
REPORT_CRON=0 8 * * 5      # reporte semanal viernes 08:00

# Alertas (% de consumo)
ALERT_THRESHOLDS=60,80,100

# Email (SMTP interno sin autenticación)
SMTP_HOST=172.30.10.130
SMTP_PORT=25
SMTP_FROM=Starlink Control <starlink_consumo@excon.cl>

# Auth admin
JWT_SECRET=<mínimo 32 caracteres aleatorios>

# Starlink API directa (opcional — sync alternativo/complementario a New Relic)
STARLINK_ENCRYPTION_KEY=<64 chars hex — cifra client_secret en reposo>
STARLINK_SYNC_CRON=0 */6 * * *
# JSON array, una cuenta Starlink por obra
STARLINK_ACCOUNTS=[{"obraId":1,"starlinkAccountId":"ACC-XXXXX","clientId":"...","clientSecret":"..."}]
```

Detalle de la integración Starlink (schema, cliente HTTP, jobs): ver [`starlink-integration.md`](./starlink-integration.md).

### 3. Frontend

```bash
cd Frontend
npm install
npm run dev            # http://localhost:5173
```

---

## Ciclo de datos

El ciclo de consumo corre del **día 14 al 13** de cada mes (según configuración ENTEL). El backend:

1. Consulta New Relic (y, si está configurado, Starlink directo) según `FETCH_CRON` / `STARLINK_SYNC_CRON`
2. Persiste snapshots en `consumption_logs`
3. Evalúa umbrales → envía alertas si corresponde
4. Cada viernes 08:00 envía reporte semanal por obra

---

## Umbrales de alerta

| Umbral | Color | Acción recomendada |
|--------|-------|--------------------|
| 60% | 🟡 Verde | Planificar posible recarga |
| 80% | 🟠 Ámbar | Solicitar bolsa adicional |
| 100% | 🔴 Rojo | Activación inmediata urgente |

Cada alerta se envía **una sola vez por ciclo** por antena.

---

## Desarrollo

```bash
# Generar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Migrations
cd Backend && npm run db:push

# Build producción
cd Frontend && npm run build
```

---

*Desarrollado para Excon · Área TI Corporativo*
