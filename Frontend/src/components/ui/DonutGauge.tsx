import { RISK_THRESHOLD, WARN_THRESHOLD, STATUS_CONFIG } from '../../lib/constants';
import { fmtPct } from '../../lib/formatters';

interface Props {
  pct:     number;
  status?: 'ok' | 'warn' | 'risk';
  size?:   number;
  stroke?: number;
  label?:  string;
  sub?:    string;
}

export default function DonutGauge({ pct, status, size = 168, stroke = 16, label, sub }: Props) {
  const r   = (size - stroke) / 2;
  const c   = 2 * Math.PI * r;
  // Usa el status del server si se provee (mismo criterio que StatusBadge/UsageBar
  // en el resto de la UI) — solo recalcula desde pct cuando no hay uno (ej. KPI agregado).
  const st  = STATUS_CONFIG[status ?? (pct >= RISK_THRESHOLD ? 'risk' : pct >= WARN_THRESHOLD ? 'warn' : 'ok')];
  const off = c * (1 - Math.min(pct, 100) / 100);

  // Tamaños de texto proporcionales al diámetro — a tamaños chicos el font-size fijo
  // se solapaba con el label y con el trazo del anillo.
  const pctSize   = Math.round(size * 0.2);
  const labelSize = Math.round(size * 0.08);
  const subSize   = Math.round(size * 0.075);

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={st.color} strokeWidth={stroke}
                strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dashoffset .9s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div className="donut-center">
        <div className="donut-pct" style={{ color: st.color, fontSize: pctSize }}>{fmtPct(pct)}</div>
        {label && <div className="donut-label" style={{ fontSize: labelSize }}>{label}</div>}
        {sub   && <div className="donut-sub" style={{ fontSize: subSize }}>{sub}</div>}
      </div>
    </div>
  );
}
