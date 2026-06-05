import { useState, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Kpi from '../components/ui/Kpi';
import ObraTable from '../components/obras/ObraTable';
import AlertPanel from '../components/obras/AlertPanel';
import { Icons } from '../components/ui/Icons';
import { useObras } from '../hooks/useObras';
import { fmtGB, fmtPct } from '../lib/formatters';
import type { ObraDto } from '../types/index';

export default function Overview() {
  const { data, isLoading, error } = useObras();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'risk' | 'warn' | 'ok'>('all');

  const allAntennas = useMemo(() => data?.obras.flatMap((o) => o.antennas) ?? [], [data]);

  const filteredObras = useMemo<ObraDto[]>(() => {
    if (!data) return [];
    return data.obras.filter((o) =>
      (statusFilter === 'all' || o.status === statusFilter) &&
      (q === '' || o.label.toLowerCase().includes(q.toLowerCase()) || o.key.toLowerCase().includes(q.toLowerCase()))
    );
  }, [data, q, statusFilter]);

  const lastUpdatedLabel = useMemo(() => {
    if (!data?.lastUpdated) return 'Sin datos';
    const d = new Date(data.lastUpdated);
    const time = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const dateStr = isToday
      ? 'hoy'
      : d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
    return `${time} · ${dateStr}`;
  }, [data?.lastUpdated]);

  if (isLoading) {
    return (
      <div className="app">
        <Sidebar />
        <div className="content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'var(--muted)' }}>Cargando datos...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="app">
        <Sidebar />
        <div className="content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'var(--risk)' }}>Error al cargar datos. Verificar que el backend está corriendo.</span>
        </div>
      </div>
    );
  }

  const k = data.kpis;

  return (
    <div className="app">
      <Sidebar />
      <div className="content">
        <header className="topbar">
          <div>
            <div className="crumb">Resumen general</div>
            <h1>Consumo Starlink por obra</h1>
          </div>
          <div className="topbar-right">
            <div className="search">
              <Icons.search size={18} />
              <input placeholder="Buscar obra…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: 99, padding: '9px 14px', fontSize: 12.5,
              color: 'var(--muted)', fontWeight: 600,
            }}>
              <Icons.clock size={14} />
              <span>{lastUpdatedLabel}</span>
            </div>
          </div>
        </header>

        <div className="kpi-row">
          <Kpi label="Consumo total (ciclo)" value={fmtGB(k.totalConsumed)} sub={`de ${fmtGB(k.totalLimit)} contratados`} icon={Icons.chart} accent="var(--accent)" />
          <Kpi label="Uso global"             value={fmtPct(k.globalPct)}   sub={`${fmtGB(k.totalAvailable)} disponibles`} icon={Icons.spark} accent="var(--cyan)" />
          <Kpi label="Antenas en riesgo"      value={k.riskCount}            sub={`${k.warnCount} en advertencia`}           icon={Icons.alert} accent="var(--risk)" />
          <Kpi label="Antenas activas"        value={k.antennaCount}         sub={`en ${k.obraCount} obras`}                 icon={Icons.sat}   accent="var(--text)" />
        </div>

        <div className="grid-2" style={{ marginBottom: 26 }}>
          <div className="panel">
            <div className="panel-head">
              <h3>Distribución de uso por obra</h3>
              <span className="muted">{data.obras.length} obras activas</span>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {data.obras.sort((a, b) => b.usagePct - a.usagePct).map((o) => (
                <div key={o.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 120, fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>{o.label}</span>
                  <div style={{ flex: 1, background: 'var(--track)', borderRadius: 99, height: 6 }}>
                    <div style={{
                      width: `${Math.min(o.usagePct, 100)}%`, height: '100%', borderRadius: 99,
                      background: o.status === 'risk' ? 'var(--risk)' : o.status === 'warn' ? 'var(--warn)' : 'var(--accent)',
                      transition: 'width .8s cubic-bezier(.4,0,.2,1)',
                    }} />
                  </div>
                  <span className="mono" style={{ width: 52, textAlign: 'right', fontSize: 12, color: o.status === 'risk' ? 'var(--risk)' : o.status === 'warn' ? 'var(--warn)' : 'var(--text)' }}>
                    {fmtPct(o.usagePct)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <AlertPanel antennas={allAntennas} />
        </div>

        <div className="panel obras-panel">
          <div className="panel-head">
            <h3><Icons.grid size={17} /> Obras <span className="count-dim">({filteredObras.length})</span></h3>
            <div className="panel-head-right">
              <div className="seg">
                {(['all', 'risk', 'warn', 'ok'] as const).map((v) => (
                  <button key={v} className={'seg-btn' + (statusFilter === v ? ' on' : '')} onClick={() => setStatusFilter(v)}>
                    {v === 'all' ? 'Todas' : v === 'risk' ? 'En riesgo' : v === 'warn' ? 'Advertencia' : 'OK'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <ObraTable obras={filteredObras} />
        </div>
      </div>
    </div>
  );
}
