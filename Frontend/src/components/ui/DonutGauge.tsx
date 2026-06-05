import { RISK_THRESHOLD, WARN_THRESHOLD, STATUS_CONFIG } from '../../lib/constants';
import { fmtPct } from '../../lib/formatters';

interface Props {
  pct:    number;
  size?:  number;
  stroke?: number;
  label?: string;
  sub?:   string;
}

export default function DonutGauge({ pct, size = 168, stroke = 16, label, sub }: Props) {
  const r   = (size - stroke) / 2;
  const c   = 2 * Math.PI * r;
  const st  = STATUS_CONFIG[pct >= RISK_THRESHOLD ? 'risk' : pct >= WARN_THRESHOLD ? 'warn' : 'ok'];
  const off = c * (1 - Math.min(pct, 100) / 100);

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
        <div className="donut-pct" style={{ color: st.color }}>{fmtPct(pct)}</div>
        {label && <div className="donut-label">{label}</div>}
        {sub   && <div className="donut-sub">{sub}</div>}
      </div>
    </div>
  );
}
