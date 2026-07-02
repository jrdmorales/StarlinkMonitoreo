import { getCurrentCycle, formatDateISO } from '../lib/cycle.js';
import { alertThresholds, config } from '../lib/config.js';
import { getObrasWithAntennas } from './consumption.service.js';
import { sendEmail, buildAlertEmailHtml, buildAlertSubject } from './email.service.js';
import { hasAlertBeenSent, insertAlertLog } from '../db/repositories/alert.repo.js';
import type { AntennaDto, ObraDto } from '../types/index.js';

export interface AlertResult {
  sent:    number; // emails enviados
  skipped: number; // (antena, umbral) ya alertados este ciclo
}

/**
 * Evalúa todos los umbrales configurados contra el consumo actual.
 * Por cada combinación (obra, umbral) con antenas nuevas, envía UN email.
 *
 * Flujo:
 * 1. Para cada umbral en [50, 80, 100]
 * 2. Filtra antenas cuyo usagePct >= umbral Y que no tienen registro en alert_log
 * 3. Agrupa por obra y envía un email por grupo
 * 4. Inserta registros en alert_log para no re-enviar
 */
export async function checkAndSendAlerts(): Promise<AlertResult> {
  if (!config.SMTP_HOST) {
    return { sent: 0, skipped: 0 };
  }

  const obras        = await getObrasWithAntennas();
  const cycle        = getCurrentCycle();
  const cycleStart   = formatDateISO(cycle.start);
  const cycleStartFmt = cycle.start.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
  const cycleEndFmt   = cycle.end.toLocaleDateString('es-CL',   { day: 'numeric', month: 'long' });

  let sent    = 0;
  let skipped = 0;

  for (const threshold of alertThresholds) {
    // Agrupar antenas que necesitan alerta de este umbral por obra
    const obraAlerts = await buildObraAlertMap(obras, threshold, cycleStart);
    if (obraAlerts.size === 0) continue;

    for (const [, { obra, antennas }] of obraAlerts) {
      try {
        const html = buildAlertEmailHtml({
          obra,
          threshold,
          antennas,
          cycleStart: cycleStartFmt,
          cycleEnd:   cycleEndFmt,
        });

        await sendEmail({
          to:      obra.email ?? config.ADMIN_EMAIL ?? '',
          subject: buildAlertSubject(obra.label, threshold, antennas.length),
          html,
        });

        // Marcar cada antena como alertada para este umbral y ciclo
        for (const ant of antennas) {
          await insertAlertLog({ antennaId: ant.id, threshold, cycleStart });
        }

        sent++;
      } catch (err) {
        // El fallo de un email no debe detener el resto de alertas
        console.error(`[Alerts] Error enviando alerta ${threshold}% para ${obra.key}:`, err);
      }
    }

    // skipped = antenas sobre el umbral menos las que efectivamente se agregaron
    // a un email nuevo este ciclo (no obraAlerts.size, que cuenta obras, no antenas).
    const totalOverThreshold = obras.flatMap((o) => o.antennas)
      .filter((a) => a.usagePct >= threshold).length;
    const newlyAlerted = Array.from(obraAlerts.values())
      .reduce((s, { antennas }) => s + antennas.length, 0);
    skipped += totalOverThreshold - newlyAlerted;
  }

  return { sent, skipped };
}

/** Construye el mapa (obraKey → {obra, antenas a alertar}) para un umbral dado */
async function buildObraAlertMap(
  obras:      ObraDto[],
  threshold:  number,
  cycleStart: string,
): Promise<Map<string, { obra: ObraDto; antennas: AntennaDto[] }>> {
  const map = new Map<string, { obra: ObraDto; antennas: AntennaDto[] }>();

  for (const obra of obras) {
    for (const ant of obra.antennas) {
      if (ant.usagePct < threshold) continue;

      const alreadySent = await hasAlertBeenSent(ant.id, threshold, cycleStart);
      if (alreadySent) continue;

      if (!map.has(obra.key)) {
        map.set(obra.key, { obra, antennas: [] });
      }
      map.get(obra.key)!.antennas.push(ant);
    }
  }

  return map;
}
