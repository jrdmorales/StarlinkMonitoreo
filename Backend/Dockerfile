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
# apunta a AMBOS archivos, los dos deben copiarse o el push falla/cuelga.
COPY --from=builder /app/src/db/schema.ts ./src/db/schema.ts
COPY --from=builder /app/src/db/starlink-schema.ts ./src/db/starlink-schema.ts
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

USER nodejs
EXPOSE 3000
# --force: sin TTY en el contenedor, drizzle-kit push queda colgado
# indefinidamente esperando confirmación interactiva si no se pasa este flag
# (incluso para cambios no destructivos). Ojo: --force también auto-aprueba
# statements con pérdida de datos (ej. DROP COLUMN) sin preguntar — si vas a
# hacer un cambio de schema destructivo a propósito, corré primero
# `npx drizzle-kit push --strict --verbose` a mano (con TTY, contra una
# copia/staging de la DB) para ver y confirmar el SQL antes de deployar.
CMD ["sh", "-c", "node_modules/.bin/drizzle-kit push --force && node dist/index.js"]
