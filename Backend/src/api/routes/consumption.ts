import type { FastifyPluginAsync } from 'fastify';
import { refreshConsumption } from '../../services/consumption.service.js';
import { checkAndSendAlerts } from '../../services/alert.service.js';
import { sendEmail } from '../../services/email.service.js';
import { config } from '../../lib/config.js';

const consumptionRoutes: FastifyPluginAsync = async (fastify) => {

  /**
   * Dispara un fetch manual de New Relic y persiste los datos.
   * Útil durante desarrollo y para forzar una actualización desde el panel admin.
   * En producción este endpoint estará protegido por JWT (Fase 3).
   */
  fastify.post('/refresh', async (_req, reply) => {
    const start  = Date.now();
    const result = await refreshConsumption();
    return reply.send({
      ...result,
      durationMs: Date.now() - start,
      timestamp:  new Date().toISOString(),
    });
  });

  /**
   * Evalúa y envía alertas de email manualmente.
   * Útil para testing del sistema de alertas sin esperar el cron.
   */
  fastify.post('/alerts/check', async (_req, reply) => {
    const start  = Date.now();
    const result = await checkAndSendAlerts();
    return reply.send({
      ...result,
      durationMs: Date.now() - start,
      timestamp:  new Date().toISOString(),
    });
  });

  /** Envía un email de prueba al SMTP_USER configurado */
  fastify.post('/alerts/test-email', async (_req, reply) => {
    const to = config.SMTP_USER;
    if (!to) {
      return reply.code(400).send({ error: 'SMTP_USER no configurado en .env' });
    }

    try {
      await sendEmail({
        to,
        subject: '✅ Test SMTP — Starlink Control',
        html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0d1117;font-family:Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:32px 12px;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;background:#161b22;border-radius:12px;border:1px solid #30363d;">
        <tr>
          <td style="background:#14532d;padding:24px 32px;">
            <h1 style="margin:0;font-size:20px;font-weight:800;color:#ffffff;">✅ SMTP funcionando</h1>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.65);">Starlink Control · Sistema de alertas</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;">
            <p style="margin:0 0 12px;font-size:14px;color:#94a3b8;">El servidor puede enviar correos correctamente.</p>
            <table cellpadding="0" cellspacing="0" style="background:#0d1117;border-radius:8px;border:1px solid #30363d;padding:0;width:100%;">
              <tr><td style="padding:12px 16px;">
                <p style="margin:0;font-size:12px;font-family:monospace;color:#64748b;">Enviado desde: <span style="color:#e2e8f0;">${config.SMTP_FROM ?? to}</span></p>
                <p style="margin:4px 0 0;font-size:12px;font-family:monospace;color:#64748b;">Timestamp: <span style="color:#e2e8f0;">${new Date().toISOString()}</span></p>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 24px;">
            <p style="margin:0;font-size:12px;color:#475569;">Si recibiste este mensaje, la configuración SMTP está correcta.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      });

      return reply.send({
        ok:        true,
        sentTo:    to,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return reply.code(500).send({ ok: false, error: message });
    }
  });

};

export default consumptionRoutes;
