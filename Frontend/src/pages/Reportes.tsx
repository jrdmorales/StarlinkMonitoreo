import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Shell from '../components/layout/Shell';
import { Icons } from '../components/ui/Icons';
import { api, token } from '../api/client';
import { useObras } from '../hooks/useObras';

interface AdminObra { id: number; key: string; label: string; email: string; active: boolean }

type SendState = 'idle' | 'sending' | 'ok' | 'error';

export default function Reportes() {
  const isAdmin = !!token.get();
  const { data } = useObras();
  const allAntennas = data?.obras.flatMap((o) => o.antennas) ?? [];

  const { data: adminObraData } = useQuery({
    queryKey: ['admin-obras'],
    queryFn:  () => api.get<{ obras: AdminObra[] }>('/admin/obras'),
    enabled:  isAdmin,
  });

  const [obraId, setObraId] = useState('');
  const [obraState, setObraState] = useState<SendState>('idle');
  const [obraMsg, setObraMsg] = useState('');

  const [antCode, setAntCode] = useState('');
  const [antState, setAntState] = useState<SendState>('idle');
  const [antMsg, setAntMsg] = useState('');

  async function sendObraReport() {
    if (!obraId) return;
    setObraState('sending');
    try {
      const obra = adminObraData?.obras.find((o) => String(o.id) === obraId);
      const res = await api.post<{ ok: boolean; sentTo: string }>(`/admin/obras/${obraId}/send-report`, {});
      setObraMsg(`Enviado a ${res.sentTo ?? obra?.email}`);
      setObraState('ok');
    } catch (err) {
      setObraMsg(err instanceof Error ? err.message : 'Error al enviar');
      setObraState('error');
    }
  }

  async function sendAntennaReport() {
    if (!antCode) return;
    setAntState('sending');
    try {
      const res = await api.post<{ ok: boolean; sentTo: string }>(`/admin/antennas/${antCode}/send-report`, {});
      setAntMsg(`Enviado a ${res.sentTo}`);
      setAntState('ok');
    } catch (err) {
      setAntMsg(err instanceof Error ? err.message : 'Error al enviar');
      setAntState('error');
    }
  }

  return (
    <Shell title="Reportes">
      <div className="page-header">
        <div className="page-eyebrow">Documentos</div>
        <h1>Reportes</h1>
      </div>

      {!isAdmin && (
        <div className="panel" style={{ marginBottom: 16, color: 'var(--muted)' }}>
          Inicia sesión como administrador para enviar reportes por email.
        </div>
      )}

      {isAdmin && (
        <div className="report-grid">
          <div className="panel">
            <span className="report-card-icon"><Icons.box size={18} /></span>
            <div className="report-card-title">Reporte de obra</div>
            <div className="report-card-sub">Envía el resumen de consumo del ciclo actual al email de contacto de la obra.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select className="field-input" value={obraId} onChange={(e) => { setObraId(e.target.value); setObraState('idle'); }}>
                <option value="">— Seleccionar obra —</option>
                {adminObraData?.obras.filter((o) => o.active).map((o) => (
                  <option key={o.id} value={o.id}>{o.label} ({o.key}){o.email ? '' : ' — sin email'}</option>
                ))}
              </select>
              <button className="btn-primary" onClick={sendObraReport} disabled={!obraId || obraState === 'sending'}>
                {obraState === 'sending' ? 'Enviando…' : 'Generar y enviar reporte'}
              </button>
              {obraState === 'ok'    && <div className="report-status ok">{obraMsg} ✓</div>}
              {obraState === 'error' && <div className="report-status error">{obraMsg}</div>}
            </div>
          </div>

          <div className="panel">
            <span className="report-card-icon"><Icons.sat size={18} /></span>
            <div className="report-card-title">Reporte de antena</div>
            <div className="report-card-sub">Envía el reporte de la obra dueña de una antena puntual.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select className="field-input" value={antCode} onChange={(e) => { setAntCode(e.target.value); setAntState('idle'); }}>
                <option value="">— Seleccionar antena —</option>
                {allAntennas.map((a) => (
                  <option key={a.code} value={a.code}>{a.code} · {a.obraLabel}</option>
                ))}
              </select>
              <button className="btn-primary" onClick={sendAntennaReport} disabled={!antCode || antState === 'sending'}>
                {antState === 'sending' ? 'Enviando…' : 'Generar y enviar reporte'}
              </button>
              {antState === 'ok'    && <div className="report-status ok">{antMsg} ✓</div>}
              {antState === 'error' && <div className="report-status error">{antMsg}</div>}
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
