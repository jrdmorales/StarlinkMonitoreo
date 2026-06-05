const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface Cycle {
  start:       Date;
  end:         Date;
  daysElapsed: number;
  daysLeft:    number;
  totalDays:   number;
}

/**
 * Calcula el ciclo de facturación activo.
 * El ciclo va del día 14 de cada mes al día 13 del mes siguiente (inclusive).
 * Esta lógica es idéntica a la del script n8n original.
 */
export function getCurrentCycle(now = new Date()): Cycle {
  const y = now.getFullYear();
  const m = now.getMonth();

  let start: Date;
  let end: Date;

  if (now.getDate() >= 14) {
    start = new Date(y, m, 14, 0, 0, 0, 0);
    end   = new Date(y, m + 1, 13, 23, 59, 59, 999);
  } else {
    start = new Date(y, m - 1, 14, 0, 0, 0, 0);
    end   = new Date(y, m, 13, 23, 59, 59, 999);
  }

  const daysElapsed = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / MS_PER_DAY));
  const daysLeft    = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / MS_PER_DAY));
  const totalDays   = Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY);

  return { start, end, daysElapsed, daysLeft, totalDays };
}

/**
 * Formatea fecha usando componentes LOCALES (no UTC).
 * toISOString() usa UTC — en Chile (UTC-4) el 13 jun 23:59 local
 * se convierte en 14 jun 03:59 UTC y el slice daría "2026-06-14". Bug evitado.
 */
export function formatDateISO(d: Date): string {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Días restantes desde hoy hasta una fecha ISO dada */
export function daysUntil(isoDate: string): number {
  const target = new Date(isoDate + 'T23:59:59');
  return Math.max(0, Math.ceil((target.getTime() - Date.now()) / MS_PER_DAY));
}
