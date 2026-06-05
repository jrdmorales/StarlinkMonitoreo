import { getObrasWithAntennas } from './consumption.service.js';
import { sendEmail, buildReportEmailHtml, buildReportSubject } from './email.service.js';
import { getCurrentCycle } from '../lib/cycle.js';
import { config } from '../lib/config.js';

/**
 * Envía un reporte semanal por obra — un email por cada obra, al correo de esa obra.
 * Independiente del consumo, se manda siempre.
 */
export async function sendWeeklyReport(): Promise<{ sent: number }> {
  if (!config.SMTP_HOST) return { sent: 0 };

  const obras = await getObrasWithAntennas();
  if (obras.length === 0) return { sent: 0 };

  const cycle      = getCurrentCycle();
  const cycleStart = cycle.start.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
  const cycleEnd   = cycle.end.toLocaleDateString('es-CL',   { day: 'numeric', month: 'long' });
  const reportDate = new Date().toLocaleDateString('es-CL',  { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  let sent = 0;
  for (const obra of obras) {
    if (!obra.email) continue;
    try {
      await sendEmail({
        to:      obra.email,
        subject: buildReportSubject(obra.label, reportDate),
        html:    buildReportEmailHtml({ obra, reportDate, cycleStart, cycleEnd }),
      });
      sent++;
      console.info(`[Report] Enviado a ${obra.email} — ${obra.label}`);
    } catch (err) {
      console.error(`[Report] Error enviando a ${obra.email} (${obra.label}):`, err);
    }
  }

  return { sent };
}
