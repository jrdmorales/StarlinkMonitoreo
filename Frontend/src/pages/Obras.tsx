import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Shell from '../components/layout/Shell';
import ObraTable from '../components/obras/ObraTable';
import { Icons } from '../components/ui/Icons';
import { api, token } from '../api/client';
import { useObras } from '../hooks/useObras';
import { fmtGB } from '../lib/formatters';

interface AdminObra {
  id: number; key: string; label: string; email: string;
  active: boolean; antennaCount: number;
}

export default function Obras() {
  const isAdmin = !!token.get();
  const qc = useQueryClient();

  const { data, isLoading, error } = useObras();

  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  function showToast(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const [showForm, setShowForm] = useState(false);
  const [newKey, setNewKey]       = useState('');
  const [newLabel, setNewLabel]   = useState('');
  const [newPrefix, setNewPrefix] = useState('');
  const [newEmail, setNewEmail]   = useState('');

  const [editingId, setEditingId]       = useState<number | null>(null);
  const [editingField, setEditingField] = useState<'label' | 'email' | null>(null);
  const [editVal, setEditVal]           = useState('');
  const [sendingId, setSendingId]       = useState<number | null>(null);

  const { data: adminData, isLoading: adminLoading } = useQuery({
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
      setShowForm(false);
    },
    onError: (err) => showToast('err', err instanceof Error ? err.message : 'Error'),
  });

  const patchObra = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) => api.patch(`/admin/obras/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-obras'] });
      qc.invalidateQueries({ queryKey: ['obras'] });
      setEditingId(null);
      setEditingField(null);
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

  function startEdit(id: number, field: 'label' | 'email', val: string) {
    setEditingId(id);
    setEditingField(field);
    setEditVal(val);
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

      <div className="panel obras-panel" style={{ marginBottom: 16 }}>
        <div className="panel-head">
          <h3><Icons.box size={17} /> Listado de obras <span className="count-dim">({data.obras.length})</span></h3>
        </div>
        <ObraTable obras={data.obras} />
      </div>

      {isAdmin && (
        <div className="panel">
          <div className="panel-head">
            <h3>Gestión de obras</h3>
            <button
              className="btn-ghost sm"
              onClick={() => setShowForm((v) => !v)}
              style={{ color: showForm ? 'var(--risk)' : 'var(--accent)' }}
            >
              {showForm ? '✕ Cancelar' : '+ Nueva obra'}
            </button>
          </div>

          {showForm && (
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

          {adminLoading ? <div className="empty">Cargando...</div> : (
            <div className="table-scroll">
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
                  {adminData?.obras.map((o) => (
                    <tr key={o.id} style={{ cursor: 'default', opacity: o.active ? 1 : 0.5 }}>
                      <td><span className="mono cell-code">{o.key}</span></td>
                      <td>
                        {editingId === o.id && editingField === 'label' ? (
                          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input className="field-input" value={editVal} onChange={(e) => setEditVal(e.target.value)} autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter')  patchObra.mutate({ id: o.id, body: { label: editVal } });
                                if (e.key === 'Escape') { setEditingId(null); setEditingField(null); }
                              }} />
                            <button className="btn-icon" onClick={() => patchObra.mutate({ id: o.id, body: { label: editVal } })}>✓</button>
                            <button className="btn-icon" onClick={() => { setEditingId(null); setEditingField(null); }}>✕</button>
                          </span>
                        ) : (
                          <span style={{ cursor: 'pointer', fontSize: 13 }} onClick={() => startEdit(o.id, 'label', o.label)} title="Click para editar">
                            {o.label} <span style={{ opacity: .4 }}><Icons.edit size={11} /></span>
                          </span>
                        )}
                      </td>
                      <td>
                        {editingId === o.id && editingField === 'email' ? (
                          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input className="field-input" type="email" value={editVal} onChange={(e) => setEditVal(e.target.value)} autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter')  patchObra.mutate({ id: o.id, body: { email: editVal } });
                                if (e.key === 'Escape') { setEditingId(null); setEditingField(null); }
                              }} />
                            <button className="btn-icon" onClick={() => patchObra.mutate({ id: o.id, body: { email: editVal } })}>✓</button>
                            <button className="btn-icon" onClick={() => { setEditingId(null); setEditingField(null); }}>✕</button>
                          </span>
                        ) : (
                          <span style={{ cursor: 'pointer', color: 'var(--accent)', fontSize: 13 }} onClick={() => startEdit(o.id, 'email', o.email)} title="Click para editar">
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
    </Shell>
  );
}
