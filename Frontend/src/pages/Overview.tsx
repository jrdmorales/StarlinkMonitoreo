import Shell from '../components/layout/Shell';
import Kpi from '../components/ui/Kpi';
import DonutGauge from '../components/ui/DonutGauge';
import AreaChart from '../components/charts/AreaChart';
import AlertPanel from '../components/obras/AlertPanel';
import { Icons } from '../components/ui/Icons';
import { useObras } from '../hooks/useObras';
import { useAggregateHistory } from '../hooks/useAggregateHistory';
import { fmtGB, fmtGB1, fmtPct } from '../lib/formatters';

export default function Overview() {
  const { data, isLoading, error } = useObras();
  const { data: histData, isLoading: histLoading } = useAggregateHistory();

  if (isLoading) {
    return (
      <Shell title="Resumen">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <span style={{ color: 'var(--muted)' }}>Cargando datos...</span>
        </div>
      </Shell>
    );
  }

  if (error || !data) {
    return (
      <Shell title="Resumen">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <span style={{ color: 'var(--risk)' }}>Error al cargar datos. Verificar que el backend está corriendo.</span>
        </div>
      </Shell>
    );
  }

  const k = data.kpis;
  const allAntennas = data.obras.flatMap((o) => o.antennas);
  const sortedObras = [...data.obras].sort((a, b) => b.usagePct - a.usagePct);

  return (
    <Shell title="Resumen">
      <div className="page-header">
        <div className="page-eyebrow">Resumen general</div>
        <h1>Consumo Starlink por obra</h1>
      </div>

      <div className="kpi-row">
        <Kpi label="Consumo total · ciclo" value={fmtGB(k.totalConsumed)} sub={`de ${fmtGB(k.totalLimit)} contratados`} icon={Icons.chart} accent="var(--accent)" />
        <Kpi label="Antenas en riesgo"     value={k.riskCount}            sub={`${k.warnCount} en advertencia`}          icon={Icons.alert} accent="var(--risk)" />
        <Kpi label="Antenas activas"       value={k.antennaCount}         sub={`distribuidas en ${k.obraCount} obras`}   icon={Icons.sat}   accent="var(--text)" />
        <Kpi label="Uso global de la red"  value={fmtPct(k.globalPct)}    sub={`${fmtGB(k.totalAvailable)} disponibles`} icon={Icons.spark} accent="var(--cyan)" />
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Consumo acumulado del ciclo</h3>
              <span className="muted">GB consumidos vs. total contratado</span>
            </div>
          </div>
          {histLoading
            ? <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>Cargando...</div>
            : <AreaChart data={histData?.history ?? []} valueKey="cumulative" id="global" height={200} />}
        </div>

        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: 0 }}>Uso global de la red</h3>
          <span className="muted">Porcentaje del total contratado</span>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0 4px' }}>
            <DonutGauge pct={k.globalPct} size={170} stroke={15} label="en uso" />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
            <div style={{ flex: 1, background: 'var(--bg-2)', borderRadius: 11, padding: '11px 13px' }}>
              <div style={{ fontSize: 11, color: 'var(--dim)', fontWeight: 600 }}>Consumido</div>
              <div className="mono" style={{ fontSize: 15, fontWeight: 800, marginTop: 3 }}>{fmtGB1(k.totalConsumed)}</div>
            </div>
            <div style={{ flex: 1, background: 'var(--bg-2)', borderRadius: 11, padding: '11px 13px' }}>
              <div style={{ fontSize: 11, color: 'var(--dim)', fontWeight: 600 }}>Disponible</div>
              <div className="mono" style={{ fontSize: 15, fontWeight: 800, marginTop: 3, color: 'var(--accent-strong)' }}>{fmtGB1(k.totalAvailable)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <h3>Distribución de uso por obra</h3>
            <span className="muted">{data.obras.length} obras activas</span>
          </div>
          <div style={{ display: 'grid', gap: 13 }}>
            {sortedObras.map((o) => (
              <div key={o.key} className="dist-row">
                <span className="dist-label">{o.label}</span>
                <div className="dist-track">
                  <div style={{
                    width: `${Math.min(o.usagePct, 100)}%`, height: '100%', borderRadius: 99,
                    background: o.status === 'risk' ? 'var(--risk)' : o.status === 'warn' ? 'var(--warn)' : 'var(--accent)',
                    transition: 'width .8s cubic-bezier(.4,0,.2,1)',
                  }} />
                </div>
                <span className="mono dist-value" style={{ color: o.status === 'risk' ? 'var(--risk)' : o.status === 'warn' ? 'var(--warn)' : 'var(--text)' }}>
                  {fmtPct(o.usagePct)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <AlertPanel antennas={allAntennas} />
      </div>
    </Shell>
  );
}
