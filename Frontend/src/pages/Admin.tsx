import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '../components/layout/Sidebar';
import { Icons } from '../components/ui/Icons';
import { api } from '../api/client';

interface AdminAntenna {
  id: number; code: string; name: string | null; limitGb: number;
  active: boolean; obraKey: string | null; obraLabel: string | null;
}
interface AdminObra {
  id: number; key: string; label: string; email: string;
  active: boolean; antennaCount: number;
}

const INPUT = {
  background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8,
  padding: '8px 12px', color: 'var(--text)', font: 'inherit', fontSize: 13,
  outline: 'none', width: '100%',
} as const;

type Tab = 'antennas' | 'obras';

export default function Admin() {
  const [tab, setTab]             = useState<Tab>('antennas');
  const [toast, setToast]         = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editVal, setEditVal]     = useState('');
  const [showForm,      setShowForm     ] = useState(false);
  const [showObraForm,  setShowObraForm ] = useState(false);
  const [editingObraId, setEditingObraId] = useState<number | null>(null);
  const [antFilter,     setAntFilter    ] = useState<'all' | 'unassigned'>('all');

  // new-antenna form state
  const [newCode,    setNewCode   ] = useState('');
  const [newObraKey, setNewObraKey] = useState('');
  const [newLimit,   setNewLimit  ] = useState('2000');

  // new-obra form state
  const [newObraKey2,    setNewObraKey2   ] = useState('');
  const [newObraLabel,   setNewObraLabel  ] = useState('');
  const [newObraPrefix,  setNewObraPrefix ] = useState('');
  const [newObraEmail,   setNewObraEmail  ] = useState('jmorales@excon.cl');

  const qc = useQueryClient();

  function showToast(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: antData, isLoading: antLoading } = useQuery({
    queryKey: ['admin-antennas'],
    queryFn:  () => api.get<{ antennas: AdminAntenna[] }>('/admin/antennas'),
  });

  const { data: obraData, isLoading: obraLoading } = useQuery({
    queryKey: ['admin-obras'],
    queryFn:  () => api.get<{ obras: AdminObra[] }>('/admin/obras'),
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const addAntenna = useMutation({
    mutationFn: (body: { code: string; obraKey: string; limitGb: number }) =>
      api.post('/admin/antennas', body),
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
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      api.patch(`/admin/antennas/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-antennas'] });
      qc.invalidateQueries({ queryKey: ['obras'] });
      showToast('ok', 'Guardado');
      setEditingId(null);
    },
    onError: (err) => showToast('err', err instanceof Error ? err.message : 'Error'),
  });

  const deleteAntenna = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/antennas/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-antennas'] });
      showToast('ok', 'Antena desactivada');
    },
    onError: (err) => showToast('err', err instanceof Error ? err.message : 'Error'),
  });

  const addObra = useMutation({
    mutationFn: (body: { key: string; label: string; prefix: string; email: string }) =>
      api.post('/admin/obras', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-obras'] });
      qc.invalidateQueries({ queryKey: ['obras'] });
      showToast('ok', `Obra ${newObraLabel} creada`);
      setNewObraKey2(''); setNewObraLabel(''); setNewObraPrefix(''); setNewObraEmail('jmorales@excon.cl');
      setShowObraForm(false);
    },
    onError: (err) => showToast('err', err instanceof Error ? err.message : 'Error'),
  });

  const patchObra = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      api.patch(`/admin/obras/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-obras'] });
      showToast('ok', 'Guardado');
      setEditingId(null);
    },
    onError: (err) => showToast('err', err instanceof Error ? err.message : 'Error'),
  });

  const syncNow = useMutation({
    mutationFn: () => api.post<{ ok: boolean; ms: number }>('/admin/sync', {}),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-antennas'] });
      qc.invalidateQueries({ queryKey: ['obras'] });
      showToast('ok', `Sync completado (${res.ms} ms)`);
    },
    onError: (err) => showToast('err', err instanceof Error ? err.message : 'Error al sincronizar'),
  });

  const [sendingReportId, setSendingReportId] = useState<number | null>(null);

  async function sendObraReport(obraId: number, obraLabel: string) {
    setSendingReportId(obraId);
    try {
      await api.post(`/admin/obras/${obraId}/send-report`, {});
      showToast('ok', `Reporte de ${obraLabel} enviado`);
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Error al enviar reporte');
    } finally {
      setSendingReportId(null);
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function startEdit(id: number, currentVal: string) {
    setEditingId(id);
    setEditVal(currentVal);
  }

  function saveAntenna(id: number, field: 'limitGb' | 'name') {
    const val = field === 'limitGb' ? Number(editVal) : editVal;
    if (field === 'limitGb' && (isNaN(val as number) || (val as number) <= 0)) {
      showToast('err', 'Límite debe ser número positivo'); return;
    }
    patchAntenna.mutate({ id, body: { [field]: val } });
  }

  function handleAddObra() {
    const key    = newObraKey2.trim().toUpperCase();
    const label  = newObraLabel.trim();
    const prefix = newObraPrefix.trim().toUpperCase();
    const email  = newObraEmail.trim();
    if (!key)    { showToast('err', 'Clave requerida (ej: BRONC-CLIENTES)'); return; }
    if (!label)  { showToast('err', 'Nombre requerido'); return; }
    if (!prefix) { showToast('err', 'Prefijo requerido (ej: BRN)'); return; }
    if (!email)  { showToast('err', 'Email requerido'); return; }
    addObra.mutate({ key, label, prefix, email });
  }

  function handleAddAntenna() {
    const code = newCode.trim();
    const limitGb = Number(newLimit);
    if (!code)          { showToast('err', 'El código es requerido'); return; }
    if (!newObraKey)    { showToast('err', 'Selecciona una obra'); return; }
    if (isNaN(limitGb) || limitGb <= 0) { showToast('err', 'Límite inválido'); return; }
    addAntenna.mutate({ code, obraKey: newObraKey, limitGb });
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <Sidebar />
      <div className="content">

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 1000,
            background: toast.type === 'ok' ? 'var(--ok-bg)' : 'var(--risk-bg)',
            color:      toast.type === 'ok' ? 'var(--ok)'    : 'var(--risk)',
            border:    `1px solid ${toast.type === 'ok' ? 'var(--ok)' : 'var(--risk)'}`,
            borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 600,
          }}>
            {toast.msg}
          </div>
        )}

        <header className="topbar">
          <div>
            <div className="crumb">Administración</div>
            <h1>Panel de control</h1>
          </div>
          <button
            className="btn-ghost"
            onClick={() => syncNow.mutate()}
            disabled={syncNow.isPending}
            title="Fuerza un fetch de New Relic ahora"
            style={{ display: 'flex', alignItems: 'center', gap: 7, opacity: syncNow.isPending ? 0.6 : 1 }}
          >
            <span style={{ display: 'inline-flex', animation: syncNow.isPending ? 'spin 1s linear infinite' : 'none' }}>
              <Icons.refresh size={15} />
            </span>
            {syncNow.isPending ? 'Sincronizando…' : 'Sync ahora'}
          </button>
        </header>

        {/* Tabs */}
        <div className="seg" style={{ marginBottom: 20 }}>
          <button className={'seg-btn' + (tab === 'antennas' ? ' on' : '')} onClick={() => setTab('antennas')}>Antenas</button>
          <button className={'seg-btn' + (tab === 'obras'    ? ' on' : '')} onClick={() => setTab('obras')}>Obras</button>
        </div>

        {/* ── Antennas tab ───────────────────────────────────────────────────── */}
        {tab === 'antennas' && (
          <div className="panel">
            <div className="panel-head">
              <h3><Icons.sat size={17} /> Antenas ({antData?.antennas.length ?? 0})</h3>
              <button
                className="btn-ghost sm"
                onClick={() => { setShowForm((v) => !v); }}
                style={{ color: showForm ? 'var(--risk)' : 'var(--accent)', borderColor: showForm ? 'var(--risk)' : undefined }}
              >
                {showForm ? '✕ Cancelar' : '+ Nueva antena'}
              </button>
            </div>

            {/* ── Formulario nueva antena ────────────────────────────────────── */}
            {showForm && (
              <div className="admin-antenna-form">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted)' }}>Código antena *</label>
                  <input
                    style={INPUT}
                    placeholder="ej: 10000731262"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={(e)  => e.target.style.borderColor = 'var(--line)'}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAntenna()}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted)' }}>Obra *</label>
                  <select
                    style={{ ...INPUT, cursor: 'pointer' }}
                    value={newObraKey}
                    onChange={(e) => setNewObraKey(e.target.value)}
                  >
                    <option value="">— Seleccionar —</option>
                    {obraData?.obras.filter((o) => o.active).map((o) => (
                      <option key={o.key} value={o.key}>{o.label} ({o.key})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted)' }}>Límite GB</label>
                  <input
                    style={INPUT}
                    type="number"
                    min={1}
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={(e)  => e.target.style.borderColor = 'var(--line)'}
                  />
                </div>

                <button
                  className="btn-ghost"
                  onClick={handleAddAntenna}
                  disabled={addAntenna.isPending}
                  style={{ background: 'var(--accent)', color: '#fff', border: 'none' }}
                >
                  {addAntenna.isPending ? '...' : 'Agregar'}
                </button>
              </div>
            )}

            {/* ── Filtro ────────────────────────────────────────────────────── */}
            {(() => {
              const unassigned = antData?.antennas.filter(
                (a) => !a.obraKey || a.obraKey === 'OTROS-CLIENTES'
              ).length ?? 0;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div className="seg sm">
                    <button className={'seg-btn' + (antFilter === 'all'        ? ' on' : '')} onClick={() => setAntFilter('all')}>Todas</button>
                    <button className={'seg-btn' + (antFilter === 'unassigned' ? ' on' : '')} onClick={() => setAntFilter('unassigned')}
                      style={unassigned > 0 && antFilter !== 'unassigned' ? { color: 'var(--warn)' } : {}}>
                      Sin obra {unassigned > 0 && <span style={{ background: 'var(--warn-bg)', color: 'var(--warn)', borderRadius: 99, padding: '1px 7px', marginLeft: 4, fontSize: 11 }}>{unassigned}</span>}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ── Tabla de antenas ───────────────────────────────────────────── */}
            {antLoading ? <div className="empty">Cargando...</div> : (
              <div className="table-scroll">
                <table className="atable">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre (New Relic)</th>
                      <th>Obra</th>
                      <th className="r">Límite (GB)</th>
                      <th>Estado</th>
                      <th className="r">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {antData?.antennas
                      .filter((a) => antFilter === 'all' || !a.obraKey || a.obraKey === 'OTROS-CLIENTES')
                      .map((a) => {
                        const sinAsignar = !a.obraKey || a.obraKey === 'OTROS-CLIENTES';
                        return (
                          <tr key={a.id} style={{
                            opacity: a.active ? 1 : 0.4,
                            boxShadow: sinAsignar && a.active ? 'inset 3px 0 0 var(--warn)' : undefined,
                          }}>
                            <td><span className="mono cell-code">{a.code}</span></td>
                            <td><span style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'monospace' }}>{a.name ?? '—'}</span></td>

                            {/* Obra editable con select */}
                            <td>
                              {editingObraId === a.id ? (
                                <select
                                  autoFocus
                                  defaultValue={a.obraKey ?? ''}
                                  style={{ ...INPUT, width: 'auto', minWidth: 160 }}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      patchAntenna.mutate({ id: a.id, body: { obraKey: e.target.value } });
                                    }
                                    setEditingObraId(null);
                                  }}
                                  onBlur={() => setEditingObraId(null)}
                                >
                                  <option value="">— Sin asignar —</option>
                                  {obraData?.obras.filter((o) => o.active).map((o) => (
                                    <option key={o.key} value={o.key}>{o.label}</option>
                                  ))}
                                </select>
                              ) : (
                                <span
                                  style={{ cursor: 'pointer', fontSize: 12, color: sinAsignar ? 'var(--warn)' : 'var(--text)' }}
                                  onClick={() => setEditingObraId(a.id)}
                                  title="Click para cambiar obra"
                                >
                                  {sinAsignar
                                    ? <span style={{ fontWeight: 700 }}>⚠ Sin asignar <Icons.edit size={11} /></span>
                                    : <span>{a.obraLabel} <span style={{ opacity: 0.4 }}><Icons.edit size={11} /></span></span>
                                  }
                                </span>
                              )}
                            </td>

                            {/* Límite editable inline */}
                            <td className="r">
                              {editingId === a.id ? (
                                <span style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                                  <input
                                    type="number" value={editVal} onChange={(e) => setEditVal(e.target.value)}
                                    style={{ width: 80, background: 'var(--bg-2)', border: '1px solid var(--accent)', borderRadius: 6, padding: '4px 8px', color: 'var(--text)', font: 'inherit', fontSize: 13 }}
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === 'Enter') saveAntenna(a.id, 'limitGb'); if (e.key === 'Escape') setEditingId(null); }}
                                  />
                                  <button className="btn-ghost sm" onClick={() => saveAntenna(a.id, 'limitGb')}>✓</button>
                                  <button className="btn-ghost sm" onClick={() => setEditingId(null)}>✕</button>
                                </span>
                              ) : (
                                <span className="mono" style={{ cursor: 'pointer', color: 'var(--accent)' }}
                                  onClick={() => startEdit(a.id, String(a.limitGb))} title="Click para editar">
                                  {a.limitGb} <Icons.edit size={12} />
                                </span>
                              )}
                            </td>

                            <td>
                              <span style={{
                                fontSize: 11.5, padding: '3px 9px', borderRadius: 99,
                                background: a.active ? 'var(--ok-bg)' : 'var(--panel-2)',
                                color:      a.active ? 'var(--ok)'    : 'var(--dim)', fontWeight: 600,
                              }}>
                                {a.active ? 'Activa' : 'Inactiva'}
                              </span>
                            </td>

                            <td className="r">
                              {a.active ? (
                                <button className="btn-ghost sm" style={{ color: 'var(--risk)' }}
                                  title="Desactivar antena"
                                  onClick={() => { if (confirm(`¿Desactivar antena ${a.code}?\nEl historial se conserva.`)) deleteAntenna.mutate(a.id); }}>
                                  <Icons.trash size={14} />
                                </button>
                              ) : (
                                <button className="btn-ghost sm" style={{ color: 'var(--ok)', fontSize: 11 }}
                                  title="Reactivar antena"
                                  onClick={() => patchAntenna.mutate({ id: a.id, body: { active: true } })}>
                                  Reactivar
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

        {/* ── Obras tab ──────────────────────────────────────────────────────── */}
        {tab === 'obras' && (
          <div className="panel">
            <div className="panel-head">
              <h3><Icons.grid size={17} /> Obras ({obraData?.obras.length ?? 0})</h3>
              <button
                className="btn-ghost sm"
                onClick={() => setShowObraForm((v) => !v)}
                style={{ color: showObraForm ? 'var(--risk)' : 'var(--accent)', borderColor: showObraForm ? 'var(--risk)' : undefined }}
              >
                {showObraForm ? '✕ Cancelar' : '+ Nueva obra'}
              </button>
            </div>

            {/* ── Formulario nueva obra ──────────────────────────────────────── */}
            {showObraForm && (
              <div className="admin-obra-form">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted)' }}>Clave *</label>
                  <input
                    style={INPUT} placeholder="ej: BRONC-CLIENTES"
                    value={newObraKey2} onChange={(e) => setNewObraKey2(e.target.value.toUpperCase())}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={(e)  => e.target.style.borderColor = 'var(--line)'}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted)' }}>Nombre *</label>
                  <input
                    style={INPUT} placeholder="ej: Los Bronces"
                    value={newObraLabel} onChange={(e) => setNewObraLabel(e.target.value)}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={(e)  => e.target.style.borderColor = 'var(--line)'}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted)' }}>Prefijo *</label>
                  <input
                    style={INPUT} placeholder="ej: BRN"
                    value={newObraPrefix} onChange={(e) => setNewObraPrefix(e.target.value.toUpperCase())}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={(e)  => e.target.style.borderColor = 'var(--line)'}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted)' }}>Email alertas *</label>
                  <input
                    style={INPUT} type="email" placeholder="ej: encargado@excon.cl"
                    value={newObraEmail} onChange={(e) => setNewObraEmail(e.target.value)}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={(e)  => e.target.style.borderColor = 'var(--line)'}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddObra()}
                  />
                </div>
                <button
                  className="btn-ghost"
                  onClick={handleAddObra}
                  disabled={addObra.isPending}
                  style={{ background: 'var(--accent)', color: '#fff', border: 'none' }}
                >
                  {addObra.isPending ? '...' : 'Crear'}
                </button>
              </div>
            )}
            {obraLoading ? <div className="empty">Cargando...</div> : (
              <div className="table-scroll">
                <table className="atable">
                  <thead>
                    <tr>
                      <th>Clave</th>
                      <th>Nombre</th>
                      <th>Email alertas</th>
                      <th className="r">Antenas</th>
                      <th className="r">Reporte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {obraData?.obras.map((o) => (
                      <tr key={o.id}>
                        <td><span className="mono cell-code">{o.key}</span></td>
                        <td>{o.label}</td>
                        <td>
                          {editingId === o.id * -1 ? (
                            <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <input
                                type="email" value={editVal} onChange={(e) => setEditVal(e.target.value)}
                                style={{ flex: 1, background: 'var(--bg-2)', border: '1px solid var(--accent)', borderRadius: 6, padding: '4px 8px', color: 'var(--text)', font: 'inherit', fontSize: 13 }}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter')  patchObra.mutate({ id: o.id, body: { email: editVal } });
                                  if (e.key === 'Escape') setEditingId(null);
                                }}
                              />
                              <button className="btn-ghost sm" onClick={() => patchObra.mutate({ id: o.id, body: { email: editVal } })}>✓</button>
                              <button className="btn-ghost sm" onClick={() => setEditingId(null)}>✕</button>
                            </span>
                          ) : (
                            <span
                              style={{ cursor: 'pointer', color: 'var(--accent)', fontSize: 13 }}
                              onClick={() => startEdit(o.id * -1, o.email)}
                              title="Click para editar"
                            >
                              {o.email || '—'} <Icons.edit size={12} />
                            </span>
                          )}
                        </td>
                        <td className="r mono">{o.antennaCount}</td>
                        <td className="r">
                          <button
                            className="btn-ghost sm"
                            disabled={sendingReportId === o.id || !o.email}
                            title={o.email ? `Enviar reporte a ${o.email}` : 'Sin email configurado'}
                            onClick={() => sendObraReport(o.id, o.label)}
                            style={{ color: 'var(--accent)', opacity: (!o.email || sendingReportId === o.id) ? 0.4 : 1 }}
                          >
                            <Icons.chart size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
