/** Respuesta cruda desde New Relic GraphQL */
export interface NewRelicResult {
  facet: [string, string, string]; // [serviceName, productId, cycleStart ISO]
  'Consumo Gigas': number;
  'Limite uso GB': number;
  '% Uso': number;
  'Fecha Termino': string;
}

/** Lectura normalizada lista para persistir */
export interface NormalizedReading {
  code:        string; // "10000697951"
  serviceName: string; // nombre completo desde NR
  consumedGb:  number;
  limitGb:     number;
  usagePct:    number;
  cycleStart:  string; // YYYY-MM-DD
  cycleEnd:    string; // YYYY-MM-DD
}

/** Resultado del cálculo de proyección de fin de ciclo */
export interface ProjectionResult {
  dailyAvg:       number; // GB/día promedio
  projectedTotal: number; // GB proyectados al fin del ciclo
  deficit:        number; // GB que faltarían (0 si alcanza)
  bagsNeeded:     number; // bolsas de 50 GB necesarias
  suggestion:     string; // texto para UI/email
}

/** Antena con datos de consumo actuales — usado en API responses */
export interface AntennaDto {
  id:         number;
  code:       string;
  obraKey:    string;
  obraLabel:  string;
  name:       string | null;
  limitGb:    number;
  consumed:   number;
  usagePct:   number;
  available:  number;
  daysLeft:   number;
  cycleEnd:   string;
  status:     'ok' | 'warn' | 'risk';
  projection: ProjectionResult;
}

/** Obra con KPIs agregados y lista de antenas */
export interface ObraDto {
  key:          string;
  label:        string;
  email:        string;
  antennaCount: number;
  consumed:     number;
  limitGb:      number;
  usagePct:     number;
  available:    number;
  minDaysLeft:  number;
  status:       'ok' | 'warn' | 'risk';
  riskCount:    number;
  warnCount:    number;
  antennas:     AntennaDto[];
}

/** Punto del historial de consumo para gráficos */
export interface HistoryPoint {
  date:       string; // YYYY-MM-DD
  daily:      number; // GB consumidos ese día (delta)
  cumulative: number; // GB acumulados en el ciclo
}

/** KPIs globales de todas las obras */
export interface GlobalKpis {
  totalConsumed:  number;
  totalLimit:     number;
  totalAvailable: number;
  globalPct:      number;
  riskCount:      number;
  warnCount:      number;
  antennaCount:   number;
  obraCount:      number;
}
