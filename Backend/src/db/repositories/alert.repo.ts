import { eq, and } from 'drizzle-orm';
import { db } from '../client.js';
import { alertLog } from '../schema.js';

/**
 * Verifica si ya se envió una alerta para esta antena, umbral y ciclo.
 * La constraint UNIQUE en alert_log garantiza que no podemos insertar duplicados,
 * pero consultamos primero para evitar el try/catch en el flujo normal.
 */
export async function hasAlertBeenSent(
  antennaId:  number,
  threshold:  number,
  cycleStart: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: alertLog.id })
    .from(alertLog)
    .where(
      and(
        eq(alertLog.antennaId, antennaId),
        eq(alertLog.threshold, threshold),
        eq(alertLog.cycleStart, cycleStart),
      ),
    )
    .limit(1);
  return !!row;
}

/**
 * Registra que se envió una alerta.
 * onConflictDoNothing = idempotente si por alguna race condition se llama dos veces.
 */
export async function insertAlertLog(data: {
  antennaId:  number;
  threshold:  number;
  cycleStart: string;
}): Promise<void> {
  await db
    .insert(alertLog)
    .values(data)
    .onConflictDoNothing();
}
