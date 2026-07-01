import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { config } from './lib/config.js';
import { errorHandler } from './api/middleware/error-handler.js';
import obrasRoutes from './api/routes/obras.js';
import antennasRoutes from './api/routes/antennas.js';
import consumptionRoutes from './api/routes/consumption.js';
import authRoutes from './api/routes/auth.js';
import alertsRoutes from './api/routes/alerts.js';
import adminAntennasRoutes from './api/routes/admin/antennas.js';
import adminObrasRoutes from './api/routes/admin/obras.js';
import adminSyncRoutes from './api/routes/admin/sync.js';
import adminSeedRoutes from './api/routes/admin/seed.js';
import adminStarlinkRoutes from './api/routes/admin/starlink.js';
import adminUsersRoutes from './api/routes/admin/users.js';
import { startScheduler } from './jobs/scheduler.js';
import { seedAccountFromEnv } from './services/starlink/accounts.js';

async function main(): Promise<void> {
  const app = Fastify({
    logger: {
      level:     config.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: config.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true, ignore: 'pid,hostname' } }
        : undefined,
    },
    // Detrás de nginx (ver Frontend/nginx.conf) — usa X-Forwarded-For para
    // request.ip real, necesario para que el rate limiter no comparta un
    // solo balde entre todos los usuarios.
    trustProxy: true,
  });

  await app.register(cors, {
    origin: config.NODE_ENV === 'development',
  });

  await app.register(rateLimit, {
    global:       false,   // solo aplicar donde se decora explícitamente
    max:          20,
    timeWindow:   '1 minute',
    errorResponseBuilder: () => ({ error: 'Demasiados intentos. Espera un minuto.' }),
  });

  app.setErrorHandler(errorHandler);

  // Rutas públicas
  await app.register(obrasRoutes,       { prefix: '/api/obras' });
  await app.register(antennasRoutes,    { prefix: '/api/antennas' });
  await app.register(consumptionRoutes, { prefix: '/api/consumption' });
  await app.register(alertsRoutes,      { prefix: '/api/alerts' });

  // Auth y admin — solo disponibles si JWT_SECRET está configurado
  if (config.JWT_SECRET) {
    await app.register(fastifyJwt, {
      secret:  config.JWT_SECRET,
      sign:    { expiresIn: '60d' },
    });

    await app.register(authRoutes,           { prefix: '/api/auth' });
    await app.register(adminAntennasRoutes,  { prefix: '/api/admin/antennas' });
    await app.register(adminObrasRoutes,     { prefix: '/api/admin/obras' });
    await app.register(adminSyncRoutes,      { prefix: '/api/admin/sync' });
    await app.register(adminSeedRoutes,      { prefix: '/api/admin/seed' });
    await app.register(adminStarlinkRoutes,  { prefix: '/api/admin/starlink' });
    await app.register(adminUsersRoutes,     { prefix: '/api/admin/users' });

    app.log.info('Panel admin habilitado en /api/admin/*');
  } else {
    app.log.warn('JWT_SECRET no configurado. Rutas /api/auth y /api/admin deshabilitadas.');
  }

  app.get('/health', async () => ({
    status:    'ok',
    timestamp: new Date().toISOString(),
  }));

  await app.listen({ port: config.PORT, host: '0.0.0.0' });

  await seedAccountFromEnv();
  startScheduler();
}

main().catch((err) => {
  console.error('[Fatal] Server failed to start:', err);
  process.exit(1);
});
