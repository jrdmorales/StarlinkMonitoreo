import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Shell from '../components/layout/Shell';
import AntennaTable from '../components/antennas/AntennaTable';
import AntennaDetail from '../components/antennas/AntennaDetail';
import { Icons } from '../components/ui/Icons';
import { api, token } from '../api/client';
import { useObras } from '../hooks/useObras';
import { useAntennaHistory } from '../hooks/useAntennaHistory';
import type { AntennaDto } from '../types/index';

interface AdminAntenna {
  id: number; code: string; name: string | null; limitGb: number;
  active: boolean; obraKey: string | null; obraLabel: string | null;
}
interface AdminObra { id: number; key: string; label: string; active: boolean }

export default function Antenas() {
  const isAdmin = !!token.get();
  const qc = useQueryClient();
  const [params] = useSearchParams();

  const { data, isLoading, error } = useObras();
  const allAntennas = useMemo(() => data?.obras.flatMap((o) => o.antennas) ?? [], [data]);

  const initialCode = params.get('code');
  const [selected, setSelected] = useState<AntennaDto | null>(null);
  const effectiveSelected = selected ?? (initialCode ? allAntennas.find((a) => a.code === initialCode) ?? null : null);

  const { data: histData, isLoading: histLoading } = useAntennaHistory(effectiveSelected?.code ?? null);

  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  function showToast(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const [showForm, setShowForm]   = useState(false);
  const [newCode, setNewCode]     = useState('');
  const [newObraKey, setNewObraKey] = useState('');
  const [newLimit, setNewLimit]   = useState('2000');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editVal, setEditVal]     = useState('');
  const [editingObraId, setEditingObraId] = useState<number | null>(null);

  const { data: adminAntData, isLoading: adminLoading } = useQuery({
    queryKey: ['admin-antennas'],
    queryFn:  () => api.get<{ antennas: AdminAntenna[] }>('/admin/antennas'),
    enabled:  isAdmin,
  });
  const { data: adminObraData } = useQuery({
    queryKey: ['admin-obras'],
    queryFn:  () => api.get<{ obras: AdminObra[] }>('/admin/obras'),
    enabled:  isAdmin,
  });

  const addAntenna = useMutation({
    mutationFn: (body: { code: string; obraKey: string; limitGb: number }) => api.post('/admin/antennas', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-antennas'] });
      qc.invalidateQueries({ queryKey: ['obras'] });
      showToast('ok', `Antena ${newCode} agregada`);
      setNewCode(''); setNewObraKey(''); setNewLimit('2000');
      setShowForm(false);
    },
    onError: (err) => showToast('err', err instanceof Error ? err.message : 'Error'),
  });

  const patchAntenna = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) => api.patch(`/admin/antennas/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-antennas'] });
      qc.invalidateQueries({ queryKey: ['obras'] });
      setEditingId(null);
      setEditingObraId(null);
    },
    onError: (err) => showToast('err', err instanceof Error ? err.message : 'Error'),
  });

  const deactivateAntenna = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/antennas/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-antennas'] });
      showToast('ok', 'Antena desactivada');
    },
    onError: (err) => showToast('err', err instanceof Error ? err.message : 'Error'),
  });

  function handleAddAntenna() {
    const code = newCode.trim();
    const limitGb = Number(newLimit);
    if (!code)       { showToast('err', 'El código es requerido'); return; }
    if (!newObraKey) { showToast('err', 'Selecciona una obra'); return; }
    if (isNaN(limitGb) || limitGb <= 0) { showToast('err', 'Límite inválido'); return; }
    addAntenna.mutate({ code, obraKey: newObraKey, limitGb });
  }

  function saveLimit(id: number) {
    const val = Number(editVal);
    if (isNaN(val) || val <= 0) { showToast('err', 'Límite debe ser número positivo'); return; }
    patchAntenna.mutate({ id, body: { limitGb: val } });
  }

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
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 1000, maxWidth: 'calc(100vw - 40px)',
          background: toast.type === 'ok' ? 'var(--ok-bg)' : 'var(--risk-bg)',
          color:      toast.type === 'ok' ? 'var(--ok)'    : 'var(--risk)',
          border:    `1px solid ${toast.type === 'ok' ? 'var(--ok)' : 'var(--risk)'}`,
          borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 600,
        }}>
          {toast.msg}
        </div>
      )}

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
          histories={{}}
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

      {isAdmin && (
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-head">
            <h3>Gestión de antenas</h3>
            <button
              className="btn-ghost sm"
              onClick={() => setShowForm((v) => !v)}
              style={{ color: showForm ? 'var(--risk)' : 'var(--accent)' }}
            >
              {showForm ? '✕ Cancelar' : '+ Nueva antena'}
            </button>
          </div>

          {showForm && (
            <div className="mgmt-form antenna">
              <label>Código antena *
                <input placeholder="ej: 10000731262" value={newCode} onChange={(e) => setNewCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAntenna()} />
              </label>
              <label>Obra *
                <select value={newObraKey} onChange={(e) => setNewObraKey(e.target.value)}>
                  <option value="">— Seleccionar —</option>
                  {adminObraData?.obras.filter((o) => o.active).map((o) => (
                    <option key={o.key} value={o.key}>{o.label} ({o.key})</option>
                  ))}
                </select>
              </label>
              <label>Límite GB
                <input type="number" min={1} value={newLimit} onChange={(e) => setNewLimit(e.target.value)} />
              </label>
              <button className="btn-primary" onClick={handleAddAntenna} disabled={addAntenna.isPending}>
                {addAntenna.isPending ? '...' : 'Agregar'}
              </button>
            </div>
          )}

          {adminLoading ? <div className="empty">Cargando...</div> : (
            <div className="table-scroll">
              <table className="atable">
                <thead>
                  <tr>
                    <th className="static">Código</th>
                    <th className="static">Nombre (New Relic)</th>
                    <th className="static">Obra</th>
                    <th className="r static">Límite (GB)</th>
                    <th className="static">Estado</th>
                    <th className="r static">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {adminAntData?.antennas.map((a) => {
                    const sinAsignar = !a.obraKey || a.obraKey === 'OTROS-CLIENTES';
                    return (
                      <tr key={a.id} style={{ cursor: 'default', opacity: a.active ? 1 : 0.5 }}>
                        <td><span className="mono cell-code">{a.code}</span></td>
                        <td><span style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'monospace' }}>{a.name ?? '—'}</span></td>
                        <td>
                          {editingObraId === a.id ? (
                            <select
                              autoFocus
                              className="field-input"
                              defaultValue={a.obraKey ?? ''}
                              onChange={(e) => { if (e.target.value) patchAntenna.mutate({ id: a.id, body: { obraKey: e.target.value } }); else setEditingObraId(null); }}
                              onBlur={() => setEditingObraId(null)}
                            >
                              <option value="">— Sin asignar —</option>
                              {adminObraData?.obras.filter((o) => o.active).map((o) => (
                                <option key={o.key} value={o.key}>{o.label}</option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ cursor: 'pointer', fontSize: 12, color: sinAsignar ? 'var(--warn)' : 'var(--text)' }} onClick={() => setEditingObraId(a.id)} title="Click para cambiar obra">
                              {sinAsignar ? <span style={{ fontWeight: 700 }}>⚠ Sin asignar</span> : a.obraLabel} <Icons.edit size={11} />
                            </span>
                          )}
                        </td>
                        <td className="r">
                          {editingId === a.id ? (
                            <span style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                              <input type="number" className="field-input" style={{ width: 80 }} value={editVal} onChange={(e) => setEditVal(e.target.value)} autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') saveLimit(a.id); if (e.key === 'Escape') setEditingId(null); }} />
                              <button className="btn-icon" onClick={() => saveLimit(a.id)}>✓</button>
                              <button className="btn-icon" onClick={() => setEditingId(null)}>✕</button>
                            </span>
                          ) : (
                            <span className="mono" style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={() => { setEditingId(a.id); setEditVal(String(a.limitGb)); }} title="Click para editar">
                              {a.limitGb} <Icons.edit size={11} />
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{
                            fontSize: 11.5, padding: '3px 9px', borderRadius: 99, fontWeight: 600,
                            background: a.active ? 'var(--ok-bg)' : 'var(--panel-2)',
                            color:      a.active ? 'var(--ok)'    : 'var(--dim)',
                          }}>
                            {a.active ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td className="actions">
                          {a.active ? (
                            <button className="btn-icon danger" title="Desactivar antena"
                              onClick={() => { if (confirm(`¿Desactivar antena ${a.code}?\nEl historial se conserva.`)) deactivateAntenna.mutate(a.id); }}>
                              <Icons.trash size={13} />
                            </button>
                          ) : (
                            <button className="btn-icon" title="Reactivar antena"
                              onClick={() => patchAntenna.mutate({ id: a.id, body: { active: true } })}>
                              <Icons.refresh size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}
