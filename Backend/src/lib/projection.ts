import type { ProjectionResult } from '../types/index.js';
import { BAG_SIZE_GB } from './constants.js';

/**
 * Proyecta el consumo al fin de ciclo usando el promedio diario actual.
 * Determina si hay déficit y cuántas bolsas de datos se necesitarían.
 *
 * La lógica es lineal: si el ritmo actual se mantiene hasta el fin del ciclo,
 * ¿alcanza la cuota? Esta fue la lógica original del script n8n, conservada.
 */
export function project(
  consumedGb:  number,
  limitGb:     number,
  daysElapsed: number,
  daysLeft:    number,
): ProjectionResult {
  const dailyAvg       = consumedGb / Math.max(daysElapsed, 1);
  const projectedTotal = dailyAvg * (daysElapsed + daysLeft);
  const deficit        = Math.max(0, projectedTotal - limitGb);
  const bagsNeeded     = Math.ceil(deficit / BAG_SIZE_GB);
  const usagePct       = limitGb > 0 ? (consumedGb / limitGb) * 100 : 0;

  const suggestion = buildSuggestion(deficit, bagsNeeded, usagePct);

  return {
    dailyAvg:       round2(dailyAvg),
    projectedTotal: round2(projectedTotal),
    deficit:        round2(deficit),
    bagsNeeded,
    suggestion,
  };
}

function buildSuggestion(deficit: number, bagsNeeded: number, usagePct: number): string {
  if (deficit > 15) {
    return `Agrega ${bagsNeeded} bolsa${bagsNeeded === 1 ? '' : 's'} de ${BAG_SIZE_GB} GB.`;
  }
  if (usagePct > 80) {
    return 'Precaución: superaste el 80% de la cuota. Revisa consumo diario.';
  }
  if (deficit > 0) {
    return `Podrías necesitar ${bagsNeeded} bolsa${bagsNeeded === 1 ? '' : 's'} extra (${BAG_SIZE_GB} GB c/u).`;
  }
  return 'Consumo dentro de lo esperado.';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
