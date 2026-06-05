import cron from 'node-cron';
import { config } from '../lib/config.js';
import { refreshConsumption } from '../services/consumption.service.js';
import { checkAndSendAlerts } from '../services/alert.service.js';
import { sendWeeklyReport } from '../services/report.service.js';

/**
 * Ejecuta un ciclo completo: fetch de New Relic → evaluar alertas.
 * Las alertas siempre corren después del fetch para trabajar con datos frescos.
 */
async function runCycle(): Promise<void> {
  const start = Date.now();
  console.info('[Scheduler] Iniciando ciclo...');

  try {
    const fetchResult = await refreshConsumption();
    console.info(`[Scheduler] Fetch completado: ${fetchResult.saved} guardados, ${fetchResult.skipped} omitidos`);
  } catch (err) {
    console.error('[Scheduler] Error en fetch de New Relic:', err);
    // No detener el check de alertas — puede haber datos de fetch anteriores
  }

  try {
    const alertResult = await checkAndSendAlerts();
    if (alertResult.sent > 0 || alertResult.skipped > 0) {
      console.info(`[Scheduler] Alertas: ${alertResult.sent} emails enviados, ${alertResult.skipped} ya enviados`);
    }
  } catch (err) {
    console.error('[Scheduler] Error en check de alertas:', err);
  }

  console.info(`[Scheduler] Ciclo completado en ${Date.now() - start}ms`);
}

/**
 * Inicia el scheduler con el cron expression definido en FETCH_CRON.
 * Por defecto: cada 4 horas ("0 *\/4 * * *").
 */
export function startScheduler(): void {
  if (!cron.validate(config.FETCH_CRON)) {
    console.error(`[Scheduler] FETCH_CRON inválido: "${config.FETCH_CRON}"`);
    return;
  }

  cron.schedule(config.FETCH_CRON, runCycle, { timezone: 'America/Santiago' });
  console.info(`[Scheduler] Ciclo activo. Cron: "${config.FETCH_CRON}" (America/Santiago)`);

  // Reporte semanal — independiente del consumo
  if (cron.validate(config.REPORT_CRON)) {
    cron.schedule(config.REPORT_CRON, async () => {
      console.info('[Scheduler] Enviando reporte semanal...');
      try {
        const { sent } = await sendWeeklyReport();
        console.info(`[Scheduler] Reporte semanal: ${sent} emails enviados`);
      } catch (err) {
        console.error('[Scheduler] Error en reporte semanal:', err);
      }
    }, { timezone: 'America/Santiago' });
    console.info(`[Scheduler] Reporte semanal activo. Cron: "${config.REPORT_CRON}" (America/Santiago)`);
  }
}
