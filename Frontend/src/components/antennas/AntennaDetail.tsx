import { useState } from 'react';
import { Icons } from '../ui/Icons';
import StatusBadge from '../ui/StatusBadge';
import DonutGauge from '../ui/DonutGauge';
import AreaChart from '../charts/AreaChart';
import { fmtGB, fmtGB1, fmtDateShort } from '../../lib/formatters';
import { api, getTokenPayload } from '../../api/client';
import type { AntennaDto, HistoryPoint } from '../../types/index';

interface Props {
  antenna:  AntennaDto | null;
  history:  HistoryPoint[];
  loading?: boolean;
}

type SendState = 'idle' | 'sending' | 'ok' | 'error';

export default function AntennaDetail({ antenna, history, loading }: Props) {
  const [alertState, setAlertState] = useState<SendState>('idle');
  const isAdmin = getTokenPayload()?.role === 'admin';

  async function sendAlert() {
    if (!antenna) return;
    setAlertState('sending');
    try {
      await api.post(`/admin/antennas/${antenna.code}/send-alert`, {});
      setAlertState('ok');
      setTimeout(() => setAlertState('idle'), 3000);
    } catch {
      setAlertState('error');
      setTimeout(() => setAlertState('idle'), 3000);
    }
  }
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
        <DonutGauge pct={antenna.usagePct} status={antenna.status} size={140} stroke={13} label="de uso" />
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

      {isAdmin && (
        <div style={{ display: 'flex', gap: 8, padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
          <button
            onClick={sendAlert}
            disabled={alertState === 'sending'}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)', cursor: 'pointer',
              background: alertState === 'ok' ? 'var(--ok-bg, #f0fdf4)' : alertState === 'error' ? 'var(--risk-bg, #fef2f2)' : 'var(--panel)',
              color: alertState === 'ok' ? 'var(--ok, #16a34a)' : alertState === 'error' ? 'var(--risk)' : 'var(--text)',
              fontSize: 12, fontWeight: 600, opacity: alertState === 'sending' ? 0.6 : 1,
            }}
          >
            <Icons.alert size={13} />
            {alertState === 'sending' ? 'Enviando...' : alertState === 'ok' ? 'Alerta enviada ✓' : alertState === 'error' ? 'Error al enviar' : 'Enviar alerta'}
          </button>
        </div>
      )}

      <div className="detail-chart">
        <div className="dc-title">Consumo acumulado en el ciclo</div>
        {loading
          ? <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>Cargando...</div>
          : <AreaChart data={history} valueKey="cumulative" accent={accent} id={'d' + antenna.code} height={100} />
        }
      </div>
    </div>
  );
}
