import type { Status } from '../../types/index';
import { STATUS_CONFIG, WARN_THRESHOLD, RISK_THRESHOLD } from '../../lib/constants';

interface Props {
  pct:    number;
  status: Status;
  height?: number;
}

export default function UsageBar({ pct, status, height = 8 }: Props) {
  const st = STATUS_CONFIG[status];
  return (
    <div className="usage" style={{ height }}>
      <div className="usage-fill" style={{ width: `${Math.min(pct, 100)}%`, background: st.color }} />
      <span className="usage-warn" style={{ left: `${WARN_THRESHOLD}%` }} />
      <span className="usage-risk" style={{ left: `${RISK_THRESHOLD}%` }} />
    </div>
  );
}
