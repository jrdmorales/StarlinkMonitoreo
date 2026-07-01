import { useMemo } from 'react';
import Shell from '../components/layout/Shell';
import AreaChart from '../components/charts/AreaChart';
import { useObras } from '../hooks/useObras';
import { useAggregateHistory } from '../hooks/useAggregateHistory';
import { fmtGB, fmtGB1, fmtPct } from '../lib/formatters';

export default function Consumo() {
  const { data, isLoading, error } = useObras();
  const { data: histData, isLoading: histLoading } = useAggregateHistory();

  const stats = useMemo(() => {
    const history = histData?.history ?? [];
    const recent = history.slice(-7);
    const dailyAvg = recent.length > 0 ? recent.reduce((s, p) => s + p.daily, 0) / recent.length : 0;
    return { dailyAvg };
  }, [histData]);

  if (isLoading) {
    return (
      <Shell title="Consumo">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <span style={{ color: 'var(--muted)' }}>Cargando datos...</span>
        </div>
      </Shell>
    );
  }

  if (error || !data) {
    return (
      <Shell title="Consumo">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <span style={{ color: 'var(--risk)' }}>Error al cargar datos.</span>
        </div>
      </Shell>
    );
  }

  const k = data.kpis;
  const allAntennas = data.obras.flatMap((o) => o.antennas);
  const remainingDays = allAntennas.length > 0 ? Math.min(...allAntennas.map((a) => a.daysLeft)) : 0;
  const projectedTotal = k.totalConsumed + stats.dailyAvg * remainingDays;
  const withinLimit = projectedTotal <= k.totalLimit;

  const sortedObras = [...data.obras].sort((a, b) => b.consumed - a.consumed);
  const maxConsumed = Math.max(...sortedObras.map((o) => o.consumed), 1);

  return (
    <Shell title="Consumo">
      <div className="page-header">
        <div className="page-eyebrow">Analítica</div>
        <h1>Consumo de datos</h1>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-card-label">Consumido</div>
          <div className="stat-card-value">{fmtGB(k.totalConsumed)}</div>
          <div className="stat-card-sub">{fmtPct(k.globalPct)} del total</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Disponible</div>
          <div className="stat-card-value accent">{fmtGB(k.totalAvailable)}</div>
          <div className="stat-card-sub">{fmtPct(100 - k.globalPct)} restante</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Promedio diario</div>
          <div className="stat-card-value">{fmtGB1(stats.dailyAvg)}/día</div>
          <div className="stat-card-sub">últimos 7 días</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Proyección fin de ciclo</div>
          <div className={'stat-card-value' + (withinLimit ? '' : ' risk')}>{fmtGB(projectedTotal)}</div>
          <div className="stat-card-sub" style={{ color: withinLimit ? 'var(--accent-strong)' : 'var(--risk)' }}>
            {withinLimit ? 'dentro del límite' : 'excede el límite contratado'}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Consumo acumulado del ciclo</h3>
              <span className="muted">GB consumidos por toda la flota</span>
            </div>
          </div>
          {histLoading
            ? <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>Cargando...</div>
            : <AreaChart data={histData?.history ?? []} valueKey="cumulative" id="consumo-global" height={200} />}
        </div>

        <div className="panel">
          <h3 style={{ marginBottom: 18 }}>Consumo por obra (GB)</h3>
          <div className="dist-list-scroll" style={{ display: 'grid', gap: 13 }}>
            {sortedObras.map((o) => (
              <div key={o.key} className="dist-row">
                <span className="dist-label">{o.label}</span>
                <div className="dist-track" style={{ height: 11 }}>
                  <div style={{
                    width: `${(o.consumed / maxConsumed) * 100}%`, height: '100%', borderRadius: 99,
                    background: o.status === 'risk' ? 'var(--risk)' : o.status === 'warn' ? 'var(--warn)' : 'var(--accent)',
                    transition: 'width .8s cubic-bezier(.4,0,.2,1)',
                  }} />
                </div>
                <span className="mono dist-value-gb">{fmtGB1(o.consumed)}</span>
                <span className="mono dist-value" style={{ color: 'var(--dim)', fontWeight: 600 }}>{fmtPct(o.usagePct)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
