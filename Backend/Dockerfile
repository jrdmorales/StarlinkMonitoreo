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
# Schema source requerido por drizzle-kit en runtime
COPY --from=builder /app/src/db/schema.ts ./src/db/schema.ts
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

USER nodejs
EXPOSE 3000
CMD ["sh", "-c", "node_modules/.bin/drizzle-kit push && node dist/index.js"]
