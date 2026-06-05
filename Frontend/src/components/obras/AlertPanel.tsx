import { useNavigate } from 'react-router-dom';
import { Icons } from '../ui/Icons';
import { STATUS_CONFIG } from '../../lib/constants';
import { fmtGB, fmtPct } from '../../lib/formatters';
import type { AntennaDto } from '../../types/index';

interface Props {
  antennas: AntennaDto[];
}

export default function AlertPanel({ antennas }: Props) {
  const navigate = useNavigate();
  const list = [...antennas]
    .filter((a) => a.status !== 'ok')
    .sort((a, b) => b.usagePct - a.usagePct)
    .slice(0, 6);

  return (
    <div className="panel alerts">
      <div className="panel-head">
        <h3><Icons.alert size={17} stroke="var(--risk)" /> Antenas en alerta</h3>
        <span className="pill">{antennas.filter((a) => a.status !== 'ok').length}</span>
      </div>
      <div className="alert-list">
        {list.map((a) => {
          const st = STATUS_CONFIG[a.status];
          return (
            <button key={a.code} className="alert-row" onClick={() => navigate(`/obras/${a.obraKey}`)}>
              <span className="alert-dot" style={{ background: st.color }} />
              <div className="alert-info">
                <div className="alert-code mono">{a.code}</div>
                <div className="alert-meta">{a.obraLabel} · {fmtGB(a.consumed)} / {fmtGB(a.limitGb)}</div>
              </div>
              <div className="alert-pct mono" style={{ color: st.color }}>{fmtPct(a.usagePct)}</div>
            </button>
          );
        })}
        {list.length === 0 && <div className="empty">Sin alertas activas</div>}
      </div>
    </div>
  );
}
