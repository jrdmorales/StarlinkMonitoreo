import type { Status } from '../types/index';

export const RISK_THRESHOLD = 85;
export const WARN_THRESHOLD = 75;

export const STATUS_CONFIG: Record<Status, { color: string; bg: string; label: string }> = {
  ok:   { color: 'var(--ok)',   bg: 'var(--ok-bg)',   label: 'OK' },
  warn: { color: 'var(--warn)', bg: 'var(--warn-bg)', label: 'Advertencia' },
  risk: { color: 'var(--risk)', bg: 'var(--risk-bg)', label: 'En riesgo' },
};
