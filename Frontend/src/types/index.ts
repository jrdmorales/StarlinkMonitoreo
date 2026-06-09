export interface ProjectionResult {
  dailyAvg:       number;
  projectedTotal: number;
  deficit:        number;
  bagsNeeded:     number;
  suggestion:     string;
}

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

export interface ObrasResponse {
  obras:        ObraDto[];
  kpis:         GlobalKpis;
  lastUpdated:  string | null; // ISO timestamp del último fetch desde New Relic
}

export interface HistoryPoint {
  [key: string]: string | number;
  date:       string;
  daily:      number;
  cumulative: number;
}

export interface HistoryResponse {
  history: HistoryPoint[];
}

export type Status = 'ok' | 'warn' | 'risk';

export interface AlertLogEntry {
  id:          number;
  threshold:   number;
  cycleStart:  string;
  sentAt:      string;
  antennaCode: string;
  antennaName: string | null;
  obraKey:     string | null;
  obraLabel:   string | null;
}

export interface AlertLogResponse {
  alerts: AlertLogEntry[];
}
