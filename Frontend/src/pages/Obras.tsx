import Shell from '../components/layout/Shell';
import ObraTable from '../components/obras/ObraTable';
import { Icons } from '../components/ui/Icons';
import { useObras } from '../hooks/useObras';
import { fmtGB } from '../lib/formatters';

export default function Obras() {
  const { data, isLoading, error } = useObras();

  if (isLoading) {
    return (
      <Shell title="Obras">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <span style={{ color: 'var(--muted)' }}>Cargando datos...</span>
        </div>
      </Shell>
    );
  }

  if (error || !data) {
    return (
      <Shell title="Obras">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <span style={{ color: 'var(--risk)' }}>Error al cargar datos.</span>
        </div>
      </Shell>
    );
  }

  const riskObras = data.obras.filter((o) => o.status === 'risk').length;

  return (
    <Shell title="Obras">
      <div className="page-header">
        <div className="page-eyebrow">Gestión</div>
        <h1>Obras</h1>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-card-label">Total de obras</div>
          <div className="stat-card-value">{data.obras.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Antenas desplegadas</div>
          <div className="stat-card-value">{data.kpis.antennaCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Obras en riesgo</div>
          <div className="stat-card-value risk">{riskObras}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Consumo total</div>
          <div className="stat-card-value">{fmtGB(data.kpis.totalConsumed)}</div>
        </div>
      </div>

      <div className="panel obras-panel">
        <div className="panel-head">
          <h3><Icons.box size={17} /> Listado de obras <span className="count-dim">({data.obras.length})</span></h3>
        </div>
        <ObraTable obras={data.obras} />
      </div>
    </Shell>
  );
}
