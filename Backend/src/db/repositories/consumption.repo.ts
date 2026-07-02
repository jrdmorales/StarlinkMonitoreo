import { eq, and, gte, desc, max, inArray } from 'drizzle-orm';
import { db } from '../client.js';
import { consumptionLogs, type ConsumptionLogRow } from '../schema.js';

interface InsertConsumptionData {
  antennaId:  number;
  sampledAt:  Date;
  cycleStart: string; // YYYY-MM-DD
  cycleEnd:   string; // YYYY-MM-DD
  consumedGb: number;
  limitGb:    number;
  usagePct:   number;
}

/**
 * Inserta un snapshot de consumo.
 * Si ya existe el mismo (antennaId, sampledAt), lo ignora silenciosamente.
 * Retorna `inserted: true` solo cuando se persistió un registro nuevo.
 */
export async function insertConsumptionLog(
  data: InsertConsumptionData,
): Promise<{ inserted: boolean }> {
  const rows = await db
    .insert(consumptionLogs)
    .values({
      antennaId:  data.antennaId,
      sampledAt:  data.sampledAt,
      cycleStart: data.cycleStart,
      cycleEnd:   data.cycleEnd,
      consumedGb: String(data.consumedGb),
      limitGb:    data.limitGb,
      usagePct:   String(data.usagePct),
    })
    .onConflictDoNothing()
    .returning({ id: consumptionLogs.id });

  return { inserted: rows.length > 0 };
}

/** El timestamp del último fetch exitoso en toda la tabla (null si no hay datos) */
export async function getLastFetchedAt(): Promise<Date | null> {
  const [row] = await db
    .select({ value: max(consumptionLogs.sampledAt) })
    .from(consumptionLogs);
  return row?.value ?? null;
}

/** El snapshot más reciente de una antena (null si nunca se ha hecho fetch) */
export async function getLatestConsumptionByAntenna(
  antennaId: number,
): Promise<ConsumptionLogRow | null> {
  const [row] = await db
    .select()
    .from(consumptionLogs)
    .where(eq(consumptionLogs.antennaId, antennaId))
    .orderBy(desc(consumptionLogs.sampledAt))
    .limit(1);
  return row ?? null;
}

/**
 * El snapshot más reciente de cada antena en `antennaIds`, en una sola query
 * (DISTINCT ON en vez de N round-trips secuenciales). Usado por
 * getObrasWithAntennas(), que antes hacía una query por antena.
 */
export async function getLatestConsumptionForAntennaIds(
  antennaIds: number[],
): Promise<ConsumptionLogRow[]> {
  if (antennaIds.length === 0) return [];
  return db
    .selectDistinctOn([consumptionLogs.antennaId])
    .from(consumptionLogs)
    .where(inArray(consumptionLogs.antennaId, antennaIds))
    .orderBy(consumptionLogs.antennaId, desc(consumptionLogs.sampledAt));
}

/**
 * Todos los snapshots de una antena dentro del ciclo activo, en orden cronológico.
 * Usado para construir el historial de gráficos.
 */
export async function getConsumptionInCycle(
  antennaId:  number,
  cycleStart: Date,
): Promise<ConsumptionLogRow[]> {
  return db
    .select()
    .from(consumptionLogs)
    .where(
      and(
        eq(consumptionLogs.antennaId, antennaId),
        gte(consumptionLogs.sampledAt, cycleStart),
      ),
    )
    .orderBy(consumptionLogs.sampledAt);
}

/**
 * Todos los snapshots de un conjunto de antenas dentro del ciclo activo, en orden cronológico.
 * Usado para construir el historial agregado (flota completa u obra específica).
 */
export async function getConsumptionInCycleForAntennaIds(
  antennaIds: number[],
  cycleStart: Date,
): Promise<ConsumptionLogRow[]> {
  if (antennaIds.length === 0) return [];
  return db
    .select()
    .from(consumptionLogs)
    .where(
      and(
        inArray(consumptionLogs.antennaId, antennaIds),
        gte(consumptionLogs.sampledAt, cycleStart),
      ),
    )
    .orderBy(consumptionLogs.sampledAt);
}
