# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: Run ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

COPY package*.json ./
# Prod deps + drizzle-kit (necesario para db:push al iniciar)
RUN npm ci --omit=dev && npm install drizzle-kit --no-save

# Compiled output
COPY --from=builder /app/dist ./dist
# Schema source requerido por drizzle-kit en runtime — drizzle.config.ts
# apunta a AMBOS archivos, los dos deben copiarse o el comando falla/cuelga.
COPY --from=builder /app/src/db/schema.ts ./src/db/schema.ts
COPY --from=builder /app/src/db/starlink-schema.ts ./src/db/starlink-schema.ts
COPY --from=builder /app/src/db/migrations ./src/db/migrations
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

USER nodejs
EXPOSE 3000
# `migrate` (no `push`): push re-diffea el schema contra la DB en cada boot y,
# sin TTY, --force no resuelve de forma confiable los prompts de ambigüedad
# (create vs rename) — puede imprimir "Changes applied" sin haber creado la
# tabla. `migrate` en cambio corre los .sql ya generados en src/db/migrations
# en orden, de forma determinística, y lleva registro en su propia tabla de
# journal — no hay prompts. Los archivos SQL deben ser idempotentes
# (IF NOT EXISTS / DO $$ EXCEPTION WHEN duplicate_object) porque esta DB fue
# poblada históricamente con `push` y no tiene journal previo.
# Nuevos cambios de schema: `npm run db:generate` local y commitear el .sql.
CMD ["sh", "-c", "node_modules/.bin/drizzle-kit migrate && node dist/index.js"]
