import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Shell from '../components/layout/Shell';
import Kpi from '../components/ui/Kpi';
import StatusBadge from '../components/ui/StatusBadge';
import AntennaTable from '../components/antennas/AntennaTable';
import AntennaDetail from '../components/antennas/AntennaDetail';
import AreaChart from '../components/charts/AreaChart';
import { Icons } from '../components/ui/Icons';
import { useObras } from '../hooks/useObras';
import { useAntennaHistory } from '../hooks/useAntennaHistory';
import { useAggregateHistory } from '../hooks/useAggregateHistory';
import { fmtGB, fmtPct } from '../lib/formatters';
import type { AntennaDto } from '../types/index';

export default function ObraDetail() {
  const { key }    = useParams<{ key: string }>();
  const navigate   = useNavigate();
  const { data, isLoading, error } = useObras();
  const obra        = data?.obras.find((o) => o.key === key);

  const [selected, setSelected] = useState<AntennaDto | null>(null);

  // Auto-selecciona la antena más riesgosa cuando `obra` llega (carga fría o
  // deep-link directo: useObras() aún no había resuelto en el primer render).
  useEffect(() => {
    if (selected || !obra) return;
    setSelected(obra.antennas.find((a) => a.status === 'risk') ?? obra.antennas[0] ?? null);
  }, [obra, selected]);

  const { data: histData, isLoading: histLoading } = useAntennaHistory(selected?.code ?? null);
  const { data: obraHistData, isLoading: obraHistLoading } = useAggregateHistory(key);

  if (error) {
    return (
      <Shell title="Detalle de obra">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <span style={{ color: 'var(--risk)' }}>Error al cargar datos.</span>
        </div>
      </Shell>
    );
  }

  if (!obra) {
    return (
      <Shell title="Detalle de obra">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <span style={{ color: 'var(--muted)' }}>{isLoading ? 'Cargando...' : `Obra '${key}' no encontrada`}</span>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title={obra.label} onBack={() => navigate('/obras')}>
      <div className="page-header-row" style={{ marginBottom: 22 }}>
        <div>
          <div className="page-eyebrow">Obra · {obra.key}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
            <h1 className="obra-title">{obra.label}</h1>
            <StatusBadge status={obra.status}>
              {obra.riskCount > 0 ? `${obra.riskCount} en riesgo` : obra.warnCount > 0 ? `${obra.warnCount} en advertencia` : 'Todo en orden'}
            </StatusBadge>
          </div>
        </div>
      </div>

      <div className="kpi-row">
        <Kpi label="Consumo de la obra"  value={fmtGB(obra.consumed)}   sub={`de ${fmtGB(obra.limitGb)} contratados`}      icon={Icons.chart} accent="var(--accent)" />
        <Kpi label="Uso promedio"         value={fmtPct(obra.usagePct)}  sub={`${fmtGB(obra.available)} disponibles`}         icon={Icons.spark} accent="var(--cyan)" />
        <Kpi label="Antenas"              value={obra.antennaCount}       sub={`${obra.riskCount} en riesgo · ${obra.warnCount} adv.`} icon={Icons.sat} accent="var(--text)" />
        <Kpi label="Próximo corte"        value={`${obra.minDaysLeft} días`} sub="antena más cercana al término"              icon={Icons.clock} accent={obra.minDaysLeft <= 7 ? 'var(--risk)' : 'var(--text)'} />
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-head">
          <div>
            <h3>Consumo acumulado · {obra.label}</h3>
            <span className="muted">GB consumidos vs. límite contratado de la obra</span>
          </div>
        </div>
        {obraHistLoading
          ? <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>Cargando...</div>
          : <AreaChart data={obraHistData?.history ?? []} valueKey="cumulative" id={'obra-' + obra.key} height={180} />}
      </div>

      <div className="detail-layout">
        <AntennaTable
          antennas={obra.antennas}
          onSelect={(a) => setSelected(a)}
          selected={selected?.code ?? null}
        />
        <AntennaDetail
          antenna={selected}
          history={histData?.history ?? []}
          loading={histLoading}
        />
      </div>
    </Shell>
  );
}
