import { useState, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { Icons } from '../components/ui/Icons';
import { useAlertLog, useAlertPreview } from '../hooks/useAlertLog';
import type { AlertLogEntry } from '../types/index';

function getThresholdStyle(threshold: number): { color: string; bg: string; label: string } {
  const label = `${threshold}%`;
  if (threshold >= 100) return { color: 'var(--risk)', bg: 'var(--risk-bg)', label };
  if (threshold >= 75)  return { color: '#fb923c',     bg: 'oklch(0.66 0.20 40 / 0.14)', label };
  return                       { color: 'var(--warn)', bg: 'var(--warn-bg)', label };
}

function fmtDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
  };
}

interface Selected { obraKey: string; obraLabel: string; threshold: number }

export default function AlertsLog() {
  const { data, isLoading } = useAlertLog();
  const [selected, setSelected] = useState<Selected | null>(null);
  const [filterThreshold, setFilterThreshold] = useState<number | 'all'>('all');

  const { data: previewData, isLoading: previewLoading } = useAlertPreview(
    selected?.obraKey ?? null,
    selected?.threshold ?? null,
  );

  // Umbrales únicos presentes en los datos (para filtros dinámicos)
  const availableThresholds = useMemo(() => {
    if (!data?.alerts) return [];
    return [...new Set(data.alerts.map((a) => a.threshold))].sort((a, b) => a - b);
  }, [data]);

  // Agrupar alertas por fecha de envío
  const grouped = useMemo(() => {
    if (!data?.alerts) return [];
    const filtered = filterThreshold === 'all'
      ? data.alerts
      : data.alerts.filter((a) => a.threshold === filterThreshold);

    const map = new Map<string, AlertLogEntry[]>();
    for (const entry of filtered) {
      const key = fmtDateTime(entry.sentAt).date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    }
    return Array.from(map.entries());
  }, [data, filterThreshold]);

  // Deduplicar: única combinación (obra, threshold, fecha) en la lista
  const uniqueKey = (e: AlertLogEntry) =>
    `${e.obraKey}-${e.threshold}-${fmtDateTime(e.sentAt).date}`;

  return (
    <div className="app">
      <Sidebar />
      <div className="content">
        <header className="topbar">
          <div>
            <div className="crumb">Monitoreo</div>
            <h1>Registro de alertas</h1>
          </div>
          <div className="topbar-right">
            <div className="seg">
              {([['all', 'Todas'] as const, ...availableThresholds.map((t) => [t, `${t}%`] as const)]).map(([v, l]) => (
                <button
                  key={String(v)}
                  className={'seg-btn' + (filterThreshold === v ? ' on' : '')}
                  onClick={() => setFilterThreshold(v)}
                  style={filterThreshold !== v && v !== 'all'
                    ? { color: getThresholdStyle(v as number).color }
                    : {}
                  }
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </header>

        {isLoading && <div className="empty">Cargando historial...</div>}

        {!isLoading && data?.alerts.length === 0 && (
          <div className="empty" style={{ marginTop: 60, fontSize: 14 }}>
            No se han enviado alertas aún.
          </div>
        )}

        {!isLoading && (data?.alerts.length ?? 0) > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16, alignItems: 'start' }}>

            {/* ── Lista de alertas ───────────────────────────────────────── */}
            <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
                  Enviadas ({data?.alerts.length ?? 0})
                </h3>
              </div>
              <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {grouped.map(([date, entries]) => {
                  const seen = new Set<string>();
                  const deduped = entries.filter((e) => {
                    const k = uniqueKey(e);
                    if (seen.has(k)) return false;
                    seen.add(k);
                    return true;
                  });
                  return (
                    <div key={date}>
                      <div style={{
                        padding: '8px 18px', fontSize: 11, fontWeight: 700,
                        color: 'var(--muted)', background: 'var(--bg-2)',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        borderBottom: '1px solid var(--line)',
                      }}>
                        {date}
                      </div>
                      {deduped.map((entry) => {
                        const ts   = getThresholdStyle(entry.threshold);
                        const time = fmtDateTime(entry.sentAt).time;
                        const isSelected =
                          selected?.obraKey === entry.obraKey &&
                          selected?.threshold === entry.threshold;

                        return (
                          <button
                            key={entry.id}
                            onClick={() => setSelected({
                              obraKey:   entry.obraKey ?? '',
                              obraLabel: entry.obraLabel ?? entry.obraKey ?? '',
                              threshold: entry.threshold,
                            })}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center',
                              gap: 12, padding: '11px 18px', border: 'none',
                              background: isSelected ? 'oklch(0.66 0.17 252 / 0.12)' : 'none',
                              boxShadow: isSelected ? 'inset 3px 0 0 var(--accent)' : undefined,
                              color: 'var(--text)', cursor: 'pointer', textAlign: 'left',
                              borderBottom: '1px solid oklch(0.30 0.02 255 / 0.3)',
                              transition: '.14s',
                            }}
                          >
                            {/* Threshold badge */}
                            <span style={{
                              minWidth: 42, textAlign: 'center',
                              background: ts.bg, color: ts.color,
                              borderRadius: 99, padding: '3px 8px',
                              fontSize: 12, fontWeight: 700,
                            }}>
                              {ts.label}
                            </span>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {entry.obraLabel ?? entry.obraKey ?? '—'}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, fontFamily: 'monospace' }}>
                                {entry.antennaCode}
                              </div>
                            </div>

                            {/* Time */}
                            <span style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'monospace', flexShrink: 0 }}>
                              {time}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Vista previa del correo ────────────────────────────────── */}
            <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                padding: '14px 18px', borderBottom: '1px solid var(--line)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
                  Vista previa del correo
                  {selected && (
                    <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--muted)', fontWeight: 400 }}>
                      {selected.obraLabel} · {selected.threshold}%
                    </span>
                  )}
                </h3>
                {previewData?.isDemo && (
                  <span style={{ fontSize: 11, color: 'var(--warn)', background: 'var(--warn-bg)', padding: '3px 10px', borderRadius: 99, fontWeight: 600 }}>
                    Demo — ninguna antena supera {selected?.threshold}% actualmente
                  </span>
                )}
              </div>

              {!selected && (
                <div className="empty-detail" style={{ minHeight: 500 }}>
                  <Icons.alert size={28} stroke="var(--muted)" />
                  <p>Selecciona una alerta para ver cómo llegó el correo</p>
                </div>
              )}

              {selected && previewLoading && (
                <div className="empty-detail" style={{ minHeight: 500 }}>
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>Generando vista previa...</span>
                </div>
              )}

              {selected && !previewLoading && previewData?.html && (
                <div>
                  <div style={{ padding: '8px 18px', background: 'var(--bg-2)', borderBottom: '1px solid var(--line)', fontSize: 11.5, color: 'var(--dim)' }}>
                    Vista previa con consumo actual — puede diferir del correo original
                  </div>
                  <iframe
                    srcDoc={previewData.html}
                    style={{ width: '100%', height: '65vh', border: 'none', display: 'block' }}
                    title="Email preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
