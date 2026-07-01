import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Shell from '../components/layout/Shell';
import { Icons } from '../components/ui/Icons';
import { api, token, getTokenPayload } from '../api/client';
import { useTheme } from '../hooks/useTheme';
import { useObras } from '../hooks/useObras';

interface AdminObra {
  id: number; key: string; label: string; email: string;
  active: boolean; antennaCount: number;
}
interface AdminAntenna {
  id: number; code: string; name: string | null; limitGb: number;
  active: boolean; obraKey: string | null; obraLabel: string | null;
}

export default function Ajustes() {
  const isAdmin = !!token.get();
  const user = getTokenPayload();
  const { theme, setTheme } = useTheme();
  const { data } = useObras();
  const qc = useQueryClient();

  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  function showToast(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const syncNow = useMutation({
    mutationFn: () => api.post<{
      ok: boolean;
      starlink: { synced: number; failed: number };
      newrelic: { saved: number; skipped: number; error?: string };
    }>('/admin/sync', {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['obras'] });
      qc.invalidateQueries({ queryKey: ['admin-antennas'] });
    },
  });

  const lastSyncLabel = data?.lastUpdated
    ? new Date(data.lastUpdated).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'sin datos aún';

  // ── Gestión de obras ──────────────────────────────────────────────────────
  const [showObraForm, setShowObraForm] = useState(false);
  const [newKey, setNewKey]       = useState('');
  const [newLabel, setNewLabel]   = useState('');
  const [newPrefix, setNewPrefix] = useState('');
  const [newEmail, setNewEmail]   = useState('');

  const [editingObraRowId, setEditingObraRowId] = useState<number | null>(null);
  const [editingObraField, setEditingObraField] = useState<'label' | 'email' | null>(null);
  const [editObraVal, setEditObraVal]           = useState('');
  const [sendingId, setSendingId]               = useState<number | null>(null);

  const { data: adminObraData, isLoading: adminObraLoading } = useQuery({
    queryKey: ['admin-obras'],
    queryFn:  () => api.get<{ obras: AdminObra[] }>('/admin/obras'),
    enabled:  isAdmin,
  });

  const addObra = useMutation({
    mutationFn: (body: { key: string; label: string; prefix: string; email: string }) => api.post('/admin/obras', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-obras'] });
      qc.invalidateQueries({ queryKey: ['obras'] });
      showToast('ok', `Obra ${newLabel} creada`);
      setNewKey(''); setNewLabel(''); setNewPrefix(''); setNewEmail('');
      setShowObraForm(false);
    },
    onError: (err) => showToast('err', err instanceof Error ? err.message : 'Error'),
  });

  const patchObra = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) => api.patch(`/admin/obras/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-obras'] });
      qc.invalidateQueries({ queryKey: ['obras'] });
      setEditingObraRowId(null);
      setEditingObraField(null);
    },
    onError: (err) => showToast('err', err instanceof Error ? err.message : 'Error'),
  });

  function handleAddObra() {
    const key    = newKey.trim().toUpperCase();
    const label  = newLabel.trim();
    const prefix = newPrefix.trim().toUpperCase();
    const email  = newEmail.trim();
    if (!key)    { showToast('err', 'Clave requerida (ej: BRONC-CLIENTES)'); return; }
    if (!label)  { showToast('err', 'Nombre requerido'); return; }
    if (!prefix) { showToast('err', 'Prefijo requerido (ej: BRN)'); return; }
    if (!email)  { showToast('err', 'Email requerido'); return; }
    addObra.mutate({ key, label, prefix, email });
  }

  function startObraEdit(id: number, field: 'label' | 'email', val: string) {
    setEditingObraRowId(id);
    setEditingObraField(field);
    setEditObraVal(val);
  }

  async function sendReport(id: number, label: string) {
    setSendingId(id);
    try {
      await api.post(`/admin/obras/${id}/send-report`, {});
      showToast('ok', `Reporte de ${label} enviado`);
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Error al enviar reporte');
    } finally {
      setSendingId(null);
    }
  }

  // ── Gestión de antenas ────────────────────────────────────────────────────
  const [showAntForm, setShowAntForm] = useState(false);
  const [newCode, setNewCode]         = useState('');
  const [newObraKey, setNewObraKey]   = useState('');
  const [newLimit, setNewLimit]       = useState('2000');
  const [editingAntId, setEditingAntId]     = useState<number | null>(null);
  const [editAntVal, setEditAntVal]         = useState('');
  const [editingObraSelectId, setEditingObraSelectId] = useState<number | null>(null);

  const { data: adminAntData, isLoading: adminAntLoading } = useQuery({
    queryKey: ['admin-antennas'],
    queryFn:  () => api.get<{ antennas: AdminAntenna[] }>('/admin/antennas'),
    enabled:  isAdmin,
  });

  const addAntenna = useMutation({
    mutationFn: (body: { code: string; obraKey: string; limitGb: number }) => api.post('/admin/antennas', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-antennas'] });
      qc.invalidateQueries({ queryKey: ['obras'] });
      showToast('ok', `Antena ${newCode} agregada`);
      setNewCode(''); setNewObraKey(''); setNewLimit('2000');
      setShowAntForm(false);
    },
    onError: (err) => showToast('err', err instanceof Error ? err.message : 'Error'),
  });

  const patchAntenna = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) => api.patch(`/admin/antennas/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-antennas'] });
      qc.invalidateQueries({ queryKey: ['obras'] });
      setEditingAntId(null);
      setEditingObraSelectId(null);
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
    const val = Number(editAntVal);
    if (isNaN(val) || val <= 0) { showToast('err', 'Límite debe ser número positivo'); return; }
    patchAntenna.mutate({ id, body: { limitGb: val } });
  }

  return (
    <Shell title="Ajustes">
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
        <div className="page-eyebrow">Configuración</div>
        <h1>Ajustes</h1>
      </div>

      <div className="settings-grid">
        <div className="panel">
          <div className="settings-card-title">Apariencia</div>
          <div className="settings-card-sub">Tema del panel.</div>
          <div className="seg" style={{ width: '100%' }}>
            <button className={'seg-btn' + (theme === 'light' ? ' on' : '')} style={{ flex: 1 }} onClick={() => setTheme('light')}>
              <Icons.sun size={14} /> Claro
            </button>
            <button className={'seg-btn' + (theme === 'dark' ? ' on' : '')} style={{ flex: 1 }} onClick={() => setTheme('dark')}>
              <Icons.moon size={14} /> Oscuro
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="settings-card-title">Cuenta</div>
          <div className="settings-card-sub">Sesión activa.</div>
          {user ? (
            <>
              <div className="settings-field">
                <div className="settings-field-label">Correo</div>
                <div className="field-input" style={{ background: 'var(--bg-2)' }}>{user.email}</div>
              </div>
              <div className="settings-field">
                <div className="settings-field-label">Rol</div>
                <div className="field-input" style={{ background: 'var(--bg-2)', color: 'var(--dim)' }}>{user.role === 'admin' ? 'Administrador' : user.role}</div>
              </div>
            </>
          ) : (
            <div className="muted">No has iniciado sesión — el panel funciona en modo solo lectura.</div>
          )}
        </div>

        {isAdmin && (
          <div className="panel">
            <div className="settings-card-title">Integración Starlink</div>
            <div className="settings-card-sub">Conexión con Starlink y New Relic.</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, background: 'var(--accent-soft)',
              borderRadius: 11, padding: '12px 14px', marginBottom: 16,
            }}>
              <span style={{ width: 9, height: 9, borderRadius: 99, background: 'var(--accent)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-strong)' }}>Última sincronización</span>
              <span style={{ fontSize: 12, color: 'var(--dim)', marginLeft: 'auto' }}>{lastSyncLabel}</span>
            </div>
            <button className="btn-primary" onClick={() => syncNow.mutate()} disabled={syncNow.isPending} style={{ width: '100%', justifyContent: 'center' }}>
              <span style={{ display: 'inline-flex', animation: syncNow.isPending ? 'spin 1s linear infinite' : 'none' }}>
                <Icons.refresh size={14} />
              </span>
              {syncNow.isPending ? 'Sincronizando…' : 'Sincronizar ahora'}
            </button>
            {syncNow.isSuccess && (
              <div className="report-status ok" style={{ textAlign: 'center' }}>
                Starlink: {syncNow.data.starlink.synced} ok · New Relic: {syncNow.data.newrelic.saved} guardados
              </div>
            )}
            {syncNow.isError && <div className="report-status error" style={{ textAlign: 'center' }}>Error al sincronizar</div>}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-head">
            <h3>Gestión de obras</h3>
            <button
              className="btn-ghost sm"
              onClick={() => setShowObraForm((v) => !v)}
              style={{ color: showObraForm ? 'var(--risk)' : 'var(--accent)' }}
            >
              {showObraForm ? '✕ Cancelar' : '+ Nueva obra'}
            </button>
          </div>

          {showObraForm && (
            <div className="mgmt-form obra">
              <label>Clave *
                <input placeholder="ej: BRONC-CLIENTES" value={newKey} onChange={(e) => setNewKey(e.target.value.toUpperCase())} />
              </label>
              <label>Nombre *
                <input placeholder="ej: Los Bronces" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
              </label>
              <label>Prefijo *
                <input placeholder="ej: BRN" value={newPrefix} onChange={(e) => setNewPrefix(e.target.value.toUpperCase())} />
              </label>
              <label>Email alertas *
                <input type="email" placeholder="ej: encargado@excon.cl" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddObra()} />
              </label>
              <button className="btn-primary" onClick={handleAddObra} disabled={addObra.isPending}>
                {addObra.isPending ? '...' : 'Crear'}
              </button>
            </div>
          )}

          {adminObraLoading ? <div className="empty">Cargando...</div> : (
            <div className="table-scroll table-scroll-y">
              <table className="atable">
                <thead>
                  <tr>
                    <th className="static">Clave</th>
                    <th className="static">Nombre</th>
                    <th className="static">Email alertas</th>
                    <th className="r static">Antenas</th>
                    <th className="static">Estado</th>
                    <th className="r static">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {adminObraData?.obras.map((o) => (
                    <tr key={o.id} style={{ cursor: 'default', opacity: o.active ? 1 : 0.5 }}>
                      <td><span className="mono cell-code">{o.key}</span></td>
                      <td>
                        {editingObraRowId === o.id && editingObraField === 'label' ? (
                          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input className="field-input" value={editObraVal} onChange={(e) => setEditObraVal(e.target.value)} autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter')  patchObra.mutate({ id: o.id, body: { label: editObraVal } });
                                if (e.key === 'Escape') { setEditingObraRowId(null); setEditingObraField(null); }
                              }} />
                            <button className="btn-icon" onClick={() => patchObra.mutate({ id: o.id, body: { label: editObraVal } })}>✓</button>
                            <button className="btn-icon" onClick={() => { setEditingObraRowId(null); setEditingObraField(null); }}>✕</button>
                          </span>
                        ) : (
                          <span style={{ cursor: 'pointer', fontSize: 13 }} onClick={() => startObraEdit(o.id, 'label', o.label)} title="Click para editar">
                            {o.label} <span style={{ opacity: .4 }}><Icons.edit size={11} /></span>
                          </span>
                        )}
                      </td>
                      <td>
                        {editingObraRowId === o.id && editingObraField === 'email' ? (
                          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input className="field-input" type="email" value={editObraVal} onChange={(e) => setEditObraVal(e.target.value)} autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter')  patchObra.mutate({ id: o.id, body: { email: editObraVal } });
                                if (e.key === 'Escape') { setEditingObraRowId(null); setEditingObraField(null); }
                              }} />
                            <button className="btn-icon" onClick={() => patchObra.mutate({ id: o.id, body: { email: editObraVal } })}>✓</button>
                            <button className="btn-icon" onClick={() => { setEditingObraRowId(null); setEditingObraField(null); }}>✕</button>
                          </span>
                        ) : (
                          <span style={{ cursor: 'pointer', color: 'var(--accent)', fontSize: 13 }} onClick={() => startObraEdit(o.id, 'email', o.email)} title="Click para editar">
                            {o.email || '—'} <Icons.edit size={11} />
                          </span>
                        )}
                      </td>
                      <td className="r mono">{o.antennaCount}</td>
                      <td>
                        <span style={{
                          fontSize: 11.5, padding: '3px 9px', borderRadius: 99, fontWeight: 600,
                          background: o.active ? 'var(--ok-bg)' : 'var(--panel-2)',
                          color:      o.active ? 'var(--ok)'    : 'var(--dim)',
                        }}>
                          {o.active ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="actions">
                        <span className="row-actions">
                          <button
                            className="btn-icon"
                            disabled={sendingId === o.id || !o.email}
                            title={o.email ? `Enviar reporte a ${o.email}` : 'Sin email configurado'}
                            onClick={() => sendReport(o.id, o.label)}
                          >
                            <Icons.file size={13} />
                          </button>
                          {o.active ? (
                            <button className="btn-icon danger" title="Desactivar obra"
                              onClick={() => { if (confirm(`¿Desactivar obra ${o.label}?`)) patchObra.mutate({ id: o.id, body: { active: false } }); }}>
                              <Icons.trash size={13} />
                            </button>
                          ) : (
                            <button className="btn-icon" title="Reactivar obra"
                              onClick={() => patchObra.mutate({ id: o.id, body: { active: true } })}>
                              <Icons.refresh size={13} />
                            </button>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-head">
            <h3>Gestión de antenas</h3>
            <button
              className="btn-ghost sm"
              onClick={() => setShowAntForm((v) => !v)}
              style={{ color: showAntForm ? 'var(--risk)' : 'var(--accent)' }}
            >
              {showAntForm ? '✕ Cancelar' : '+ Nueva antena'}
            </button>
          </div>

          {showAntForm && (
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

          {adminAntLoading ? <div className="empty">Cargando...</div> : (
            <div className="table-scroll table-scroll-y">
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
                          {editingObraSelectId === a.id ? (
                            <select
                              autoFocus
                              className="field-input"
                              defaultValue={a.obraKey ?? ''}
                              onChange={(e) => { if (e.target.value) patchAntenna.mutate({ id: a.id, body: { obraKey: e.target.value } }); else setEditingObraSelectId(null); }}
                              onBlur={() => setEditingObraSelectId(null)}
                            >
                              <option value="">— Sin asignar —</option>
                              {adminObraData?.obras.filter((o) => o.active).map((o) => (
                                <option key={o.key} value={o.key}>{o.label}</option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ cursor: 'pointer', fontSize: 12, color: sinAsignar ? 'var(--warn)' : 'var(--text)' }} onClick={() => setEditingObraSelectId(a.id)} title="Click para cambiar obra">
                              {sinAsignar ? <span style={{ fontWeight: 700 }}>⚠ Sin asignar</span> : a.obraLabel} <Icons.edit size={11} />
                            </span>
                          )}
                        </td>
                        <td className="r">
                          {editingAntId === a.id ? (
                            <span style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                              <input type="number" className="field-input" style={{ width: 80 }} value={editAntVal} onChange={(e) => setEditAntVal(e.target.value)} autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') saveLimit(a.id); if (e.key === 'Escape') setEditingAntId(null); }} />
                              <button className="btn-icon" onClick={() => saveLimit(a.id)}>✓</button>
                              <button className="btn-icon" onClick={() => setEditingAntId(null)}>✕</button>
                            </span>
                          ) : (
                            <span className="mono" style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={() => { setEditingAntId(a.id); setEditAntVal(String(a.limitGb)); }} title="Click para editar">
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
