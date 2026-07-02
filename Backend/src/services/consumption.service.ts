import { getCurrentCycle, formatDateISO, daysUntil } from '../lib/cycle.js';
import { project } from '../lib/projection.js';
import { RISK_THRESHOLD, WARN_THRESHOLD } from '../lib/constants.js';
import { fetchStarlinkReadings } from './newrelic.service.js';
import { findAllObras } from '../db/repositories/obra.repo.js';
import { findAntennaByCode, upsertAntenna } from '../db/repositories/antenna.repo.js';
import {
  insertConsumptionLog,
  getLatestConsumptionForAntennaIds,
  getConsumptionInCycle,
  getConsumptionInCycleForAntennaIds,
} from '../db/repositories/consumption.repo.js';
import type { AntennaDto, ObraDto, HistoryPoint, GlobalKpis } from '../types/index.js';
import type { ConsumptionLogRow } from '../db/schema.js';

function statusFor(pct: number): 'ok' | 'warn' | 'risk' {
  if (pct >= RISK_THRESHOLD) return 'risk';
  if (pct >= WARN_THRESHOLD) return 'warn';
  return 'ok';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Fetch datos de New Relic, auto-crea obras/antenas si no existen,
 * persiste snapshots de consumo.
 *
 * Es idempotente: si se ejecuta dos veces con el mismo timestamp de muestreo,
 * el segundo pase no duplica registros (unique constraint en DB).
 */
export async function refreshConsumption(): Promise<{ saved: number; skipped: number }> {
  const readings = await fetchStarlinkReadings();
  const now      = new Date();
  const cycle    = getCurrentCycle(now);

  let saved = 0;
  let skipped = 0;

  for (const reading of readings) {
    // Preservar obraId y limitGb si el admin los modificó; usar los de NR solo en creación
    const existing = await findAntennaByCode(reading.code);
    const antenna  = await upsertAntenna({
      code:    reading.code,
      obraId:  existing?.obraId ?? undefined,
      name:    reading.serviceName,
      limitGb: existing?.limitGb ?? reading.limitGb,
    });

    const { inserted } = await insertConsumptionLog({
      antennaId:  antenna.id,
      sampledAt:  now,
      cycleStart: formatDateISO(cycle.start),
      cycleEnd:   formatDateISO(cycle.end),
      consumedGb: reading.consumedGb,
      limitGb:    antenna.limitGb,
      usagePct:   antenna.limitGb > 0 ? (reading.consumedGb / antenna.limitGb) * 100 : 0,
    });

    if (inserted) saved++;
    else skipped++;
  }

  return { saved, skipped };
}

/** Construye el DTO completo de una antena a partir de su último snapshot */
function buildAntennaDto(
  antenna: { id: number; code: string; obraId: number | null; name: string | null; limitGb: number },
  obraKey:   string,
  obraLabel: string,
  cycle:     ReturnType<typeof getCurrentCycle>,
  latest:    ConsumptionLogRow | undefined,
): AntennaDto | null {
  if (!latest) return null;

  const consumed = Number(latest.consumedGb);
  const limitGb  = latest.limitGb;
  const usagePct = Number(latest.usagePct);
  const daysLeft = daysUntil(String(latest.cycleEnd));
  const proj     = project(consumed, limitGb, cycle.daysElapsed, daysLeft);

  return {
    id:         antenna.id,
    code:       antenna.code,
    obraKey,
    obraLabel,
    name:       antenna.name,
    limitGb,
    consumed:   round2(consumed),
    usagePct:   round2(usagePct),
    available:  round2(limitGb - consumed),
    daysLeft,
    cycleEnd:   String(latest.cycleEnd),
    status:     statusFor(usagePct),
    projection: proj,
  };
}

/** Retorna todas las obras activas con sus antenas y datos de consumo actuales */
export async function getObrasWithAntennas(): Promise<ObraDto[]> {
  const cycle        = getCurrentCycle();
  const obrasWithAnt = await findAllObras();

  const allAntennaIds = obrasWithAnt.flatMap((o) => o.antennas.map((a) => a.id));
  const latestRows    = await getLatestConsumptionForAntennaIds(allAntennaIds);
  const latestByAntennaId = new Map(latestRows.map((r) => [r.antennaId, r]));

  const result: ObraDto[] = [];

  for (const obra of obrasWithAnt) {
    const antennaDtos: AntennaDto[] = [];

    for (const ant of obra.antennas) {
      const dto = buildAntennaDto(ant, obra.key, obra.label, cycle, latestByAntennaId.get(ant.id));
      if (dto) antennaDtos.push(dto);
    }

    if (antennaDtos.length === 0) continue;

    const totalConsumed = antennaDtos.reduce((s, a) => s + a.consumed, 0);
    const totalLimit    = antennaDtos.reduce((s, a) => s + a.limitGb, 0);
    const obraPct       = totalLimit > 0 ? (totalConsumed / totalLimit) * 100 : 0;

    result.push({
      key:          obra.key,
      label:        obra.label,
      email:        obra.email,
      antennaCount: antennaDtos.length,
      consumed:     round2(totalConsumed),
      limitGb:      totalLimit,
      usagePct:     round2(obraPct),
      available:    round2(totalLimit - totalConsumed),
      minDaysLeft:  Math.min(...antennaDtos.map((a) => a.daysLeft)),
      status:       statusFor(obraPct),
      riskCount:    antennaDtos.filter((a) => a.status === 'risk').length,
      warnCount:    antennaDtos.filter((a) => a.status === 'warn').length,
      antennas:     antennaDtos,
    });
  }

  return result;
}

/**
 * Historial de consumo de una antena para el ciclo activo.
 * Agrupa por día (toma el snapshot más reciente del día) y calcula delta diario.
 */
export async function getAntennaHistory(code: string): Promise<HistoryPoint[]> {
  const antenna = await findAntennaByCode(code);
  if (!antenna) return [];

  const { start } = getCurrentCycle();
  const logs = await getConsumptionInCycle(antenna.id, start);
  if (logs.length === 0) return [];

  // Agrupar por fecha: tomar el snapshot con mayor consumedGb del día
  const byDate = new Map<string, number>();
  for (const log of logs) {
    const day      = formatDateISO(new Date(log.sampledAt));
    const consumed = Number(log.consumedGb);
    const current  = byDate.get(day) ?? -1;
    if (consumed > current) byDate.set(day, consumed);
  }

  const dates = Array.from(byDate.keys()).sort();
  const points: HistoryPoint[] = [];

  for (let i = 0; i < dates.length; i++) {
    const cumulative = byDate.get(dates[i])!;
    const prevCum    = i > 0 ? (byDate.get(dates[i - 1]) ?? 0) : 0;
    points.push({
      date:       dates[i],
      daily:      round2(Math.max(0, cumulative - prevCum)),
      cumulative: round2(cumulative),
    });
  }

  return points;
}

/**
 * Historial agregado de consumo del ciclo activo, sumando todas las antenas
 * (o solo las de una obra si se pasa `obraKey`). Usado para el gráfico de
 * tendencia global de Resumen/Consumo y el gráfico por obra del Detalle.
 * Para cada día, suma el último valor acumulado conocido de cada antena
 * (carry-forward) — así una antena sin snapshot ese día no baja el total.
 */
export async function getAggregateHistory(obraKey?: string): Promise<HistoryPoint[]> {
  const { start }   = getCurrentCycle();
  const obras       = await getObrasWithAntennas();
  const scopedObras = obraKey ? obras.filter((o) => o.key === obraKey) : obras;
  const antennaIds  = scopedObras.flatMap((o) => o.antennas.map((a) => a.id));
  if (antennaIds.length === 0) return [];

  const logs = await getConsumptionInCycleForAntennaIds(antennaIds, start);
  if (logs.length === 0) return [];

  // Por antena: fecha -> mayor consumo acumulado registrado ese día
  const perAntennaByDate = new Map<number, Map<string, number>>();
  const allDates = new Set<string>();
  for (const log of logs) {
    const day = formatDateISO(new Date(log.sampledAt));
    allDates.add(day);

    let byDate = perAntennaByDate.get(log.antennaId);
    if (!byDate) {
      byDate = new Map();
      perAntennaByDate.set(log.antennaId, byDate);
    }
    const consumed = Number(log.consumedGb);
    const current  = byDate.get(day) ?? -1;
    if (consumed > current) byDate.set(day, consumed);
  }

  const dates = Array.from(allDates).sort();
  const lastKnown = new Map<number, number>();
  const points: HistoryPoint[] = [];
  let prevTotal = 0;

  for (const day of dates) {
    let total = 0;
    for (const antennaId of antennaIds) {
      const value = perAntennaByDate.get(antennaId)?.get(day);
      if (value !== undefined) lastKnown.set(antennaId, value);
      total += lastKnown.get(antennaId) ?? 0;
    }
    points.push({
      date:       day,
      daily:      round2(Math.max(0, total - prevTotal)),
      cumulative: round2(total),
    });
    prevTotal = total;
  }

  return points;
}

/** KPIs globales de todo el sistema */
export async function getGlobalKpis(): Promise<GlobalKpis> {
  const obras = await getObrasWithAntennas();
  const allAntennas = obras.flatMap((o) => o.antennas);

  const totalConsumed = allAntennas.reduce((s, a) => s + a.consumed, 0);
  const totalLimit    = allAntennas.reduce((s, a) => s + a.limitGb, 0);

  return {
    totalConsumed:  round2(totalConsumed),
    totalLimit,
    totalAvailable: round2(totalLimit - totalConsumed),
    globalPct:      totalLimit > 0 ? round2((totalConsumed / totalLimit) * 100) : 0,
    riskCount:      allAntennas.filter((a) => a.status === 'risk').length,
    warnCount:      allAntennas.filter((a) => a.status === 'warn').length,
    antennaCount:   allAntennas.length,
    obraCount:      obras.length,
  };
}
