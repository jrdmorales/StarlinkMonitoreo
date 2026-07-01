import { useMutation, useQueryClient } from '@tanstack/react-query';
import Shell from '../components/layout/Shell';
import { Icons } from '../components/ui/Icons';
import { api, token, getTokenPayload } from '../api/client';
import { useTheme } from '../hooks/useTheme';
import { useObras } from '../hooks/useObras';

export default function Ajustes() {
  const isAdmin = !!token.get();
  const user = getTokenPayload();
  const { theme, setTheme } = useTheme();
  const { data } = useObras();
  const qc = useQueryClient();

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

  return (
    <Shell title="Ajustes">
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
    </Shell>
  );
}
