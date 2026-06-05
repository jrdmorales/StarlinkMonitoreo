import type { Status } from '../../types/index';
import { STATUS_CONFIG } from '../../lib/constants';

interface Props {
  status:   Status;
  children?: React.ReactNode;
}

export default function StatusBadge({ status, children }: Props) {
  const st = STATUS_CONFIG[status];
  return (
    <span className="badge" style={{ color: st.color, background: st.bg }}>
      <span className="badge-dot" style={{ background: st.color }} />
      {children ?? st.label}
    </span>
  );
}
