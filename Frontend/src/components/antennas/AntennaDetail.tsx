import { Icons } from '../ui/Icons';
import StatusBadge from '../ui/StatusBadge';
import DonutGauge from '../ui/DonutGauge';
import AreaChart from '../charts/AreaChart';
import { fmtGB, fmtGB1, fmtDateShort } from '../../lib/formatters';
import type { AntennaDto, HistoryPoint } from '../../types/index';

interface Props {
  antenna:  AntennaDto | null;
  history:  HistoryPoint[];
  loading?: boolean;
}

export default function AntennaDetail({ antenna, history, loading }: Props) {
  if (!antenna) {
    return (
      <div className="panel detail empty-detail">
        <Icons.sat size={30} stroke="var(--muted)" />
        <p>Selecciona una antena para ver su detalle de consumo.</p>
      </div>
    );
  }

  const accent = antenna.status === 'risk' ? 'var(--risk)' : antenna.status === 'warn' ? 'var(--warn)' : 'var(--accent)';

  return (
    <div className="panel detail">
      <div className="detail-head">
        <div>
          <div className="mono detail-code">{antenna.code}</div>
          <div className="detail-name">{antenna.name}</div>
        </div>
        <StatusBadge status={antenna.status} />
      </div>

      <div className="detail-gauge">
        <DonutGauge pct={antenna.usagePct} size={150} stroke={14} label="de uso" />
      </div>
      <div className="detail-gauge-cap mono">
        {fmtGB1(antenna.consumed)} <span>/ {fmtGB(antenna.limitGb)}</span>
      </div>

      <div className="detail-stats">
        <div><span>Disponible</span><b className="mono">{fmtGB1(antenna.available)}</b></div>
        <div><span>Fecha término</span><b>{fmtDateShort(antenna.cycleEnd)}</b></div>
        <div><span>Días restantes</span><b className={antenna.daysLeft <= 7 ? 'danger' : ''}>{antenna.daysLeft} días</b></div>
      </div>

      <div className="detail-stats" style={{ borderBottom: 'none', paddingBottom: 12, paddingTop: 12 }}>
        <div><span>Prom. diario</span><b className="mono">{antenna.projection.dailyAvg} GB/d</b></div>
        <div><span>Proyección</span><b className="mono">{antenna.projection.projectedTotal} GB</b></div>
        <div><span>Bolsas extra</span><b className={antenna.projection.bagsNeeded > 0 ? 'danger' : ''}>{antenna.projection.bagsNeeded}</b></div>
      </div>

      {antenna.projection.bagsNeeded > 0 && (
        <div style={{ padding: '8px 0 16px', fontSize: 12, color: 'var(--warn)', borderBottom: '1px solid var(--line)' }}>
          {antenna.projection.suggestion}
        </div>
      )}

      <div className="detail-chart">
        <div className="dc-title">Consumo acumulado en el ciclo</div>
        {loading
          ? <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>Cargando...</div>
          : <AreaChart data={history} valueKey="cumulative" accent={accent} id={'d' + antenna.code} height={150} />
        }
      </div>
    </div>
  );
}
