import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Shell from '../components/layout/Shell';
import AntennaTable from '../components/antennas/AntennaTable';
import AntennaDetail from '../components/antennas/AntennaDetail';
import { useObras } from '../hooks/useObras';
import { useAntennaHistory } from '../hooks/useAntennaHistory';
import type { AntennaDto } from '../types/index';

export default function Antenas() {
  const [params] = useSearchParams();

  const { data, isLoading, error } = useObras();
  const allAntennas = useMemo(() => data?.obras.flatMap((o) => o.antennas) ?? [], [data]);

  const initialCode = params.get('code');
  const [selected, setSelected] = useState<AntennaDto | null>(null);
  const effectiveSelected = selected ?? (initialCode ? allAntennas.find((a) => a.code === initialCode) ?? null : null);

  const { data: histData, isLoading: histLoading } = useAntennaHistory(effectiveSelected?.code ?? null);

  if (isLoading) {
    return (
      <Shell title="Antenas">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <span style={{ color: 'var(--muted)' }}>Cargando datos...</span>
        </div>
      </Shell>
    );
  }

  if (error || !data) {
    return (
      <Shell title="Antenas">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <span style={{ color: 'var(--risk)' }}>Error al cargar datos.</span>
        </div>
      </Shell>
    );
  }

  const okCount = allAntennas.filter((a) => a.status === 'ok').length;

  return (
    <Shell title="Antenas">
      <div className="page-header">
        <div className="page-eyebrow">Inventario</div>
        <h1>Antenas</h1>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-card-label">Antenas activas</div>
          <div className="stat-card-value">{allAntennas.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">OK</div>
          <div className="stat-card-value accent">{okCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">En riesgo</div>
          <div className="stat-card-value risk">{data.kpis.riskCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">En advertencia</div>
          <div className="stat-card-value warn">{data.kpis.warnCount}</div>
        </div>
      </div>

      <div className="detail-layout">
        <AntennaTable
          antennas={allAntennas}
          onSelect={(a) => setSelected(a)}
          selected={effectiveSelected?.code ?? null}
          showObraColumn
        />
        <AntennaDetail
          antenna={effectiveSelected}
          history={histData?.history ?? []}
          loading={histLoading}
        />
      </div>
    </Shell>
  );
}
