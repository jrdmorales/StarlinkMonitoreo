import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Kpi from '../components/ui/Kpi';
import StatusBadge from '../components/ui/StatusBadge';
import AntennaTable from '../components/antennas/AntennaTable';
import AntennaDetail from '../components/antennas/AntennaDetail';
import { Icons } from '../components/ui/Icons';
import { useObras } from '../hooks/useObras';
import { useAntennaHistory } from '../hooks/useAntennaHistory';
import { fmtGB, fmtPct } from '../lib/formatters';
import type { AntennaDto } from '../types/index';

export default function ObraDetail() {
  const { key }    = useParams<{ key: string }>();
  const navigate   = useNavigate();
  const { data }   = useObras();
  const obra        = data?.obras.find((o) => o.key === key);

  const defaultSel  = obra?.antennas.find((a) => a.status === 'risk') ?? obra?.antennas[0] ?? null;
  const [selected, setSelected] = useState<AntennaDto | null>(defaultSel);

  const { data: histData, isLoading: histLoading } = useAntennaHistory(selected?.code ?? null);

  // Pre-cargar historiales de todas las antenas para sparklines
  const [histories] = useState<Record<string, never>>({});

  if (!obra) {
    return (
      <div className="app">
        <Sidebar />
        <div className="content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'var(--muted)' }}>{data ? `Obra '${key}' no encontrada` : 'Cargando...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar />
      <div className="content">
        <header className="topbar">
          <div className="crumb-row">
            <button className="back" onClick={() => navigate('/')}><Icons.back size={18} /></button>
            <div>
              <div className="crumb">Obras / {obra.key}</div>
              <h1>{obra.label}</h1>
            </div>
          </div>
          <div className="topbar-right">
            <StatusBadge status={obra.status}>
              {obra.riskCount > 0 ? `${obra.riskCount} en riesgo` : obra.warnCount > 0 ? `${obra.warnCount} en advertencia` : 'Todo en orden'}
            </StatusBadge>
          </div>
        </header>

        <div className="kpi-row">
          <Kpi label="Consumo de la obra"  value={fmtGB(obra.consumed)}   sub={`de ${fmtGB(obra.limitGb)} contratados`}      icon={Icons.chart} accent="var(--accent)" />
          <Kpi label="Uso promedio"         value={fmtPct(obra.usagePct)}  sub={`${fmtGB(obra.available)} disponibles`}         icon={Icons.spark} accent="var(--cyan)" />
          <Kpi label="Antenas"              value={obra.antennaCount}       sub={`${obra.riskCount} en riesgo · ${obra.warnCount} adv.`} icon={Icons.sat} accent="var(--text)" />
          <Kpi label="Próximo corte"        value={`${obra.minDaysLeft} días`} sub="antena más cercana al término"              icon={Icons.clock} accent={obra.minDaysLeft <= 7 ? 'var(--risk)' : 'var(--text)'} />
        </div>

        <div className="detail-layout">
          <AntennaTable
            antennas={obra.antennas}
            histories={histories}
            onSelect={(a) => setSelected(a)}
            selected={selected?.code ?? null}
          />
          <AntennaDetail
            antenna={selected}
            history={histData?.history ?? []}
            loading={histLoading}
          />
        </div>
      </div>
    </div>
  );
}
