import { useState, useEffect, useCallback } from 'react';
import Shell from '../components/layout/Shell';
import { Icons } from '../components/ui/Icons';

const PDF_URL = '/Procedimiento_Compra_Contratacion_Starlink_ENTEL%206.pdf';

/* ─── Color: un solo acento, como en el resto del dashboard ─── */
const ACCENT = 'var(--accent)';
/** Deriva un tono translúcido del color recibido — funciona tanto con var(--x) como con hex/oklch. */
const alpha = (c: string, a: number) => `color-mix(in srgb, ${c} ${Math.round(a * 100)}%, transparent)`;

/** Icono de sección envuelto en una insignia circular, igual al patrón de .report-card-icon / .kpi-ic. */
function IconBadge({ icon: I, size = 44 }: { icon: (p: { size?: number; stroke?: string }) => React.ReactNode; size?: number }) {
  return (
    <span style={{
      width: size, height: size, flexShrink: 0, borderRadius: size >= 40 ? 12 : 9,
      background: 'var(--accent-soft)', color: 'var(--accent-strong)',
      display: 'grid', placeItems: 'center',
    }}>
      <I size={Math.round(size * 0.42)} />
    </span>
  );
}

/* ─── Content atoms ─── */

function BigStat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={{ flex: '1 1 130px', background: alpha(color, 0.08), border: `1px solid ${alpha(color, 0.28)}`, borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 28, fontWeight: 800, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, lineHeight: 1.4 }}>{label}</div>
    </div>
  );
}

function CodeCard({ code, label, color }: { code: string; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: alpha(color, 0.07), border: `1px solid ${alpha(color, 0.25)}`, borderRadius: 12, padding: '12px 16px', flex: '1 1 140px' }}>
      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{label}</span>
      <code style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 15, fontWeight: 800, color, letterSpacing: '0.04em' }}>{code}</code>
    </div>
  );
}

function Callout({ icon, text, color }: { icon: React.ReactNode; text: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: alpha(color, 0.07), border: `1px solid ${alpha(color, 0.22)}`, borderRadius: 12, padding: '13px 16px', fontSize: 13, lineHeight: 1.55 }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{ color: 'var(--muted)' }}>{text}</span>
    </div>
  );
}

function KitItem({ icon, name, desc, color }: { icon: string; name: string; desc: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: 12, padding: '13px 16px', flex: '1 1 200px' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: alpha(color, 0.12), border: `1px solid ${alpha(color, 0.25)}`, display: 'grid', placeItems: 'center', fontSize: 22 }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{name}</div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  );
}

function PlanRow({ gb, uf, users, desc, highlight, color }: { gb: string; uf: string; users: string; desc: string; highlight?: boolean; color: string }) {
  const pct = (parseFloat(uf.replace(',', '.')) / 43.38) * 100;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 14, alignItems: 'center', padding: '12px 16px', borderRadius: 12, background: highlight ? alpha(color, 0.1) : 'var(--panel-2)', border: `1px solid ${highlight ? alpha(color, 0.35) : 'var(--line)'}` }}>
      <div>
        <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 14, fontWeight: 800, color: highlight ? color : 'var(--text)' }}>{gb}</div>
        <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 2 }}>{uf} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>UF/mes</span></div>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{desc}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--dim)', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 99, padding: '2px 8px' }}>👤 {users}</span>
        </div>
        <div style={{ height: 5, background: 'var(--track)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: highlight ? color : 'var(--dim)', opacity: highlight ? 1 : 0.5 }} />
        </div>
      </div>
    </div>
  );
}

function TrafficLight({ pct, color, label, action }: { pct: string; color: string; label: string; action: string }) {
  return (
    <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: alpha(color, 0.07), border: `1px solid ${alpha(color, 0.25)}`, borderRadius: 14, padding: '20px 14px' }}>
      <div style={{ width: 54, height: 54, borderRadius: 99, background: alpha(color, 0.18), border: `3px solid ${color}`, display: 'grid', placeItems: 'center', boxShadow: `0 0 18px ${alpha(color, 0.3)}` }}>
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 14, fontWeight: 800, color }}>{pct}</span>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color }}>{label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4, lineHeight: 1.4 }}>{action}</div>
      </div>
    </div>
  );
}

function FlowCard({ n, label, sub, color, accent }: { n: string; label: string; sub: string; color: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? alpha(color, 0.12) : 'var(--panel-2)', border: `1px solid ${accent ? alpha(color, 0.4) : 'var(--line)'}`, borderRadius: 14, padding: '16px 14px', boxShadow: accent ? `0 0 18px ${alpha(color, 0.2)}` : 'none' }}>
      <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: accent ? color : 'var(--muted)', marginBottom: 8 }}>PASO {n}</div>
      <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: '"IBM Plex Mono", monospace' }}>{sub}</div>
    </div>
  );
}

function RoleCard({ icon, role, items, color }: { icon: string; role: string; items: string[]; color: string }) {
  return (
    <div style={{ flex: '1 1 170px', background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: 14, padding: '18px 16px' }}>
      <div style={{ fontSize: 30, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: 14, color, marginBottom: 12 }}>{role}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {items.map((item) => (
          <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--muted)' }}>
            <span style={{ color, marginTop: 1, flexShrink: 0 }}>▸</span><span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Section content per id ─── */

function SectionContent({ id, color }: { id: string; color: string }) {
  switch (id) {
    case 's1': return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <BigStat value="20 días" label="hábiles de espera desde que se hace la OC" color={color} />
          <BigStat value="96 hrs" label="máximo para activar bolsas adicionales" color={color} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>¿Qué incluye el kit?</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <KitItem icon="🛰️" name="Antena Starlink" desc="Recepción satelital principal" color={color} />
            <KitItem icon="🔒" name="Firewall Fortinet FG40F" desc="Control de tráfico y seguridad" color={color} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Código para pedir en ReqLogic</div>
          <CodeCard code="ESTAR00000" label="Código del Kit Starlink" color={color} />
        </div>
        <Callout icon={<Icons.alert size={16} stroke="var(--warn)" />} color="var(--warn)"
          text="Apenas compres, avisa a TI por ticket adjuntando OC, FCN y número de PM. Los equipos llegan a Bodega Central — no a la obra directamente." />
      </div>
    );
    case 's2': return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <BigStat value="1 AP" label="cada 30–40 dispositivos conectados" color={color} />
          <BigStat value="~100 m" label="cobertura por punto de acceso WiFi" color={color} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Códigos ReqLogic</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <CodeCard code="XIC1174" label="🌐  AP WiFi" color={color} />
            <CodeCard code="XIC0322" label="⚡  Inyector POE" color={color} />
            <CodeCard code="XIC1200" label="🔌  Trébol triple" color={color} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <KitItem icon="🏢" name="1 AP por oficina" desc="Recomendación estándar" color={color} />
          <KitItem icon="🏗️" name="2 AP si hay obstáculos" desc="Muros, tabiques, vidrios" color={color} />
        </div>
        <Callout icon={<Icons.alert size={16} stroke="var(--warn)" />} color="var(--warn)"
          text="La señal se reduce con vidrios, muros de hormigón y tabiquería. Si la cobertura no llega, añade un AP extra." />
      </div>
    );
    case 's3': return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Callout icon="📋" color={color}
          text="El contrato se firma mediante una Ficha de Cierre de Negocio (FCN) con ENTEL. ENTEL factura mensualmente contra la HES correspondiente." />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>¿Qué plan me conviene?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <PlanRow gb="500 GB" uf="5,67"  desc="Obras medianas · uso controlado"         users="10–15"  color={color} />
            <PlanRow gb="1 TB"   uf="9,10"  desc="Obras medianas · Teams y Microsoft 365"  users="15–20"  color={color} highlight />
            <PlanRow gb="2 TB"   uf="15,96" desc="Obras grandes · alta demanda"             users="30–40"  color={color} />
            <PlanRow gb="6 TB"   uf="43,38" desc="Proyectos con múltiples frentes"          users="100+"   color={color} />
          </div>
        </div>
      </div>
    );
    case 's4': return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <BigStat value="50 GB" label="por bolsa adicional (compra múltiples si necesitas)" color={color} />
          <BigStat value="96 hrs" label="máximo de activación desde recepción de OC" color={color} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Códigos para pedir en ReqLogic</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <CodeCard code="XSE1287" label="🎒  Bolsa 50 GB · 1,78 UF c/u" color={color} />
            <CodeCard code="XSE1390" label="⚡  Activación · 1 UF por antena" color={color} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Ejemplos de costo total</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { title: '8 bolsas · 1 antena',  formula: '8 × 1,78 + 1 × 1,00',  total: '15,24 UF' },
              { title: '6 bolsas · 3 antenas', formula: '6 × 1,78 + 3 × 1,00',  total: '13,68 UF' },
            ].map((ex) => (
              <div key={ex.title} style={{ flex: '1 1 200px', background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{ex.title}</div>
                <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, color: 'var(--dim)', marginBottom: 6 }}>{ex.formula}</div>
                <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 22, fontWeight: 800, color }}>{ex.total}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
    case 's5': return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.6 }}>
          TI monitorea el consumo de cada antena y te avisa automáticamente por correo en estos 3 momentos:
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <TrafficLight pct="60%"  color="var(--accent)"  label="Alerta temprana"  action="Planifica posible recarga" />
          <TrafficLight pct="80%"  color="var(--warn)"    label="Advertencia"      action="Solicita bolsa adicional" />
          <TrafficLight pct="100%" color="var(--risk)"    label="¡Consumo total!"  action="Activación urgente" />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <KitItem icon="📧" name="Correo automático" desc="Recibes email en cada umbral de alerta" color={color} />
          <KitItem icon="📅" name="Reporte semanal"   desc="Todos los viernes TI envía el resumen"  color={color} />
        </div>
      </div>
    );
    case 's6': return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.6 }}>
          Tres equipos comparten la responsabilidad del correcto funcionamiento del servicio:
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <RoleCard icon="🏗️" role="Obra" color={color} items={[
            'Gestionar PM y FCN en ReqLogic',
            'Mantener equipos operativos',
            'Coordinar con TI ante problemas',
          ]} />
          <RoleCard icon="💻" role="TI Corporativo" color={color} items={[
            'Monitorear consumo de cada antena',
            'Generar alertas 60 / 80 / 100%',
            'Configurar y administrar equipos',
          ]} />
          <RoleCard icon="📡" role="ENTEL" color={color} items={[
            'Proveer conectividad satelital',
            'Ejecutar recargas de datos',
            'Cumplir plazos de activación',
          ]} />
        </div>
      </div>
    );
    case 's7': return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.6 }}>
          Desde que pides el equipo hasta que funciona en obra:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10 }}>
          <FlowCard n="01" label="Solicitud de PM"       sub="ESTAR00000 en ReqLogic"     color={color} />
          <FlowCard n="02" label="Recepción de equipo"   sub="20 días hábiles desde OC"   color={color} />
          <FlowCard n="03" label="Configuración por TI"  sub="Antes de enviar a obra"      color={color} />
          <FlowCard n="04" label="Envío a obra"          sub="Desde Bodega Central"        color={color} />
          <FlowCard n="05" label="Generación de FCN"     sub="Contrato plan datos ENTEL"   color={color} accent />
          <FlowCard n="06" label="Monitoreo continuo"    sub="Alertas 60 / 80 / 100%"      color={color} />
          <FlowCard n="07" label="Solicitud de bolsas"   sub="XSE1287 si se agota el plan" color={color} />
          <FlowCard n="08" label="Activación"            sub="Hasta 96 horas hábiles"      color={color} />
        </div>
        <Callout icon="💡" color={color}
          text="Los pasos 07 y 08 solo aplican si el plan mensual se agota antes del fin de ciclo." />
      </div>
    );
    default: return null;
  }
}

/* ─── Section metadata ─── */

const SECTIONS = [
  { id: 's1', num: '01', color: ACCENT, icon: Icons.box,      title: 'Compra del Kit Starlink',     summary: 'Cómo pedir el equipo en ReqLogic' },
  { id: 's2', num: '02', color: ACCENT, icon: Icons.wifi,     title: 'AP WiFi (FortiAP)',            summary: 'El router WiFi de la obra' },
  { id: 's3', num: '03', color: ACCENT, icon: Icons.file,     title: 'Contrato de Datos',            summary: 'Elige tu plan mensual con ENTEL' },
  { id: 's4', num: '04', color: ACCENT, icon: Icons.database, title: 'Bolsas Adicionales',          summary: '¿Se acabó el plan? Pide más datos' },
  { id: 's5', num: '05', color: ACCENT, icon: Icons.alert,    title: 'Alertas de Consumo',          summary: 'Cuándo te avisamos y qué hacer' },
  { id: 's6', num: '06', color: ACCENT, icon: Icons.users,    title: '¿Quién hace qué?',            summary: 'Responsabilidades de cada área' },
  { id: 's7', num: '07', color: ACCENT, icon: Icons.flow,     title: 'Proceso Completo',            summary: 'De inicio a fin, paso a paso' },
];

/* ─── Section card ─── */

function SectionCard({ id: _id, num, color, icon, title, summary, onClick }: typeof SECTIONS[0] & { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="panel"
      style={{
        background: hovered ? 'var(--panel-2)' : 'var(--panel)',
        border: `1px solid ${hovered ? 'var(--accent)' : 'var(--line)'}`,
        padding: '20px 20px 18px',
        cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'var(--text)',
        display: 'flex', flexDirection: 'column', gap: 14,
        transition: 'background .15s, border-color .15s',
      }}
    >
      {/* icon + number */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <IconBadge icon={icon} />
        <span style={{
          fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, fontWeight: 700,
          color: 'var(--dim)', background: 'var(--bg-2)', border: '1px solid var(--line)',
          borderRadius: 8, padding: '3px 8px', letterSpacing: '0.05em',
        }}>{num}</span>
      </div>

      {/* text */}
      <div>
        <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.015em', marginBottom: 5 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.4 }}>{summary}</div>
      </div>

      {/* cta */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontSize: 12, fontWeight: 700, color,
        opacity: hovered ? 1 : 0.5, transition: 'opacity 0.2s',
        marginTop: 'auto',
      }}>
        Ver procedimiento
        <span style={{ transform: hovered ? 'translateX(3px)' : 'translateX(0)', transition: 'transform 0.2s' }}>→</span>
      </div>
    </button>
  );
}

/* ─── Modal ─── */

function Modal({ section, onClose, onPrev, onNext, hasPrev, hasNext }: {
  section: typeof SECTIONS[0];
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  return (
    <>
      <style>{`
        @keyframes backdrop-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modal-in { from { opacity: 0; transform: scale(0.95) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>

      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 900,
          background: 'oklch(0 0 0 / 0.7)',
          backdropFilter: 'blur(6px)',
          animation: 'backdrop-in 0.2s ease',
        }}
      />

      {/* panel */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 901,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        pointerEvents: 'none',
      }}>
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 680,
            maxHeight: '88vh',
            background: 'var(--panel)',
            border: `1px solid ${alpha(section.color, 0.4)}`,
            borderRadius: 22,
            boxShadow: `0 32px 80px oklch(0 0 0 / 0.6), 0 0 0 1px ${alpha(section.color, 0.15)}`,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            animation: 'modal-in 0.22s ease',
            pointerEvents: 'all',
          }}
        >
          {/* modal header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '20px 22px 18px',
            borderBottom: `1px solid ${alpha(section.color, 0.2)}`,
            background: alpha(section.color, 0.06),
            flexShrink: 0,
          }}>
            <IconBadge icon={section.icon} size={40} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, fontWeight: 700,
                color: section.color, letterSpacing: '0.08em', marginBottom: 3,
              }}>PASO {section.num}</div>
              <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>{section.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{section.summary}</div>
            </div>

            <button
              className="btn-icon"
              onClick={onClose}
              style={{ width: 36, height: 36, borderRadius: 99, flexShrink: 0 }}
              aria-label="Cerrar"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 1l12 12M13 1L1 13"/>
              </svg>
            </button>
          </div>

          {/* modal body */}
          <div style={{ overflowY: 'auto', padding: '24px 22px', flex: 1 }}>
            <SectionContent id={section.id} color={section.color} />
          </div>

          {/* modal footer: prev/next */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 22px',
            borderTop: '1px solid var(--line)',
            background: 'var(--panel-2)',
            flexShrink: 0,
          }}>
            <button className="btn-ghost sm" onClick={onPrev} disabled={!hasPrev}>
              ← Anterior
            </button>

            <div style={{ display: 'flex', gap: 6 }}>
              {SECTIONS.map((s, _i) => (
                <div key={s.id} style={{
                  width: 6, height: 6, borderRadius: 99,
                  background: s.id === section.id ? section.color : 'var(--line)',
                  transition: 'background 0.2s',
                }} />
              ))}
            </div>

            <button
              className="btn-primary"
              onClick={onNext}
              disabled={!hasNext}
              style={{
                background: hasNext ? section.color : 'var(--panel-2)',
                border: `1px solid ${hasNext ? section.color : 'var(--line)'}`,
                color: hasNext ? '#fff' : 'var(--dim)',
              }}
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════ PAGE ═══════════════ */

/* ─── AP Coverage Calculator ─── */
function ApCalc({ onClose }: { onClose: () => void }) {
  const [area,       setArea      ] = useState('');
  const [apRange,    setApRange   ] = useState('30');
  const [efficiency, setEfficiency] = useState('70');

  const areaNum = parseFloat(area);
  const rangeNum = parseFloat(apRange);
  const effNum   = parseFloat(efficiency) / 100;

  const apAreaEff = rangeNum > 0 ? Math.PI * rangeNum * rangeNum * effNum : 0;
  const apCount   = areaNum > 0 && apAreaEff > 0 ? Math.ceil(areaNum / apAreaEff) : null;

  const presets = [
    { label: 'Interior estrecho',  range: '15', eff: '65', desc: 'Pasillos, bodegas con racks, pisos con muchas paredes o tabiques. Señal se degrada rápido.' },
    { label: 'Interior abierto',   range: '25', eff: '70', desc: 'Oficinas abiertas, comedores, salas de reunión sin divisiones. Paredes de yeso o vidrio.' },
    { label: 'Exterior / obra',    range: '40', eff: '60', desc: 'Faenas al aire libre, campamentos, patios de maniobra. Maquinaria y estructuras bloquean parte de la señal.' },
    { label: 'Exterior amplio',    range: '60', eff: '55', desc: 'Estacionamientos, canchas, terrenos planos sin obstáculos. Máxima distancia, mínima interferencia.' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: 'oklch(0 0 0 / 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div className="panel" style={{
        padding: 0, width: 420, maxWidth: '95vw', maxHeight: '88vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        border: `1px solid ${alpha(ACCENT, 0.4)}`,
        boxShadow: '0 24px 60px oklch(0 0 0 / 0.5)',
      }} onClick={(e) => e.stopPropagation()}>

        {/* header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
          padding: '20px 22px 18px', borderBottom: `1px solid ${alpha(ACCENT, 0.2)}`, background: alpha(ACCENT, 0.06),
        }}>
          <IconBadge icon={Icons.spark} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>Calculadora de APs</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>Estimación de puntos de acceso por cobertura</div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {/* body */}
        <div style={{ overflowY: 'auto', padding: '22px' }}>

        {/* presets */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Presets</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            {presets.map((p) => {
              const active = apRange === p.range && efficiency === p.eff;
              return (
                <button key={p.label} onClick={() => { setApRange(p.range); setEfficiency(p.eff); }}
                  style={{
                    background: active ? 'var(--accent-soft)' : 'var(--bg-2)',
                    color: 'var(--text)',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                    borderRadius: 'var(--r-sm)', padding: '9px 11px',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ color: active ? 'var(--accent-strong)' : 'var(--text)' }}>{p.label}</span>
                    {active && <span style={{ fontSize: 9, background: 'var(--accent)', color: '#fff', borderRadius: 99, padding: '1px 6px', fontWeight: 700, letterSpacing: '0.05em' }}>ACTIVO</span>}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)', fontFamily: 'monospace', marginBottom: 5 }}>r={p.range}m · {p.eff}% ef.</div>
                  <div style={{ fontSize: 11, color: 'var(--dim)', fontWeight: 400, lineHeight: 1.4 }}>{p.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Área total a cubrir', unit: 'm²', val: area,       set: setArea,       placeholder: 'ej: 1500' },
            { label: 'Radio de cobertura AP', unit: 'm', val: apRange,   set: setApRange,    placeholder: 'ej: 30' },
            { label: 'Eficiencia real',      unit: '%',  val: efficiency, set: setEfficiency, placeholder: 'ej: 70' },
          ].map(({ label, unit, val, set, placeholder }) => (
            <div key={label}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>{label}</label>
              <div style={{ display: 'flex', gap: 0 }}>
                <input
                  className="field-input"
                  type="number" min="0" value={val} placeholder={placeholder}
                  onChange={(e) => set(e.target.value)}
                  style={{
                    flex: 1, background: 'var(--bg-2)',
                    borderRight: 'none', borderRadius: '8px 0 0 8px',
                  }}
                />
                <span style={{
                  background: 'var(--bg-2)', border: '1px solid var(--line)', borderLeft: 'none',
                  borderRadius: '0 8px 8px 0', padding: '8px 12px',
                  fontSize: 12, color: 'var(--muted)', fontFamily: 'monospace', display: 'flex', alignItems: 'center',
                }}>{unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* result */}
        <div style={{
          background: apCount !== null ? 'var(--accent-soft)' : 'var(--bg-2)',
          border: `1px solid ${apCount !== null ? 'var(--accent)' : 'var(--line)'}`,
          borderRadius: 'var(--r-sm)', padding: '16px 18px',
        }}>
          {apCount !== null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ textAlign: 'center', minWidth: 64 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 40, fontWeight: 900, color: 'var(--accent-strong)', lineHeight: 1 }}>{apCount}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>APs necesarios</div>
              </div>
              <div style={{ flex: 1, fontSize: 12, color: 'var(--muted)', borderLeft: '1px solid var(--line)', paddingLeft: 16 }}>
                <div>Cobertura por AP: <b style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{Math.round(apAreaEff)} m²</b></div>
                <div style={{ marginTop: 5 }}>Cobertura total: <b style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{Math.round(apCount * apAreaEff)} m²</b></div>
                <div style={{ marginTop: 5, fontSize: 11, color: 'var(--accent-strong)' }}>
                  Fórmula: ⌈{areaNum} ÷ (π·{rangeNum}²·{effNum.toFixed(2)})⌉
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Ingresa el área para calcular
            </div>
          )}
        </div>

        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--dim)', textAlign: 'center' }}>
          La eficiencia real varía según obstáculos, interferencia y altura de instalación.
        </div>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCalc,  setShowCalc ] = useState(false);

  const activeIdx = SECTIONS.findIndex((s) => s.id === activeId);
  const activeSection = activeIdx >= 0 ? SECTIONS[activeIdx] : null;

  const openSection = useCallback((id: string) => setActiveId(id), []);
  const closeModal   = useCallback(() => setActiveId(null), []);
  const prevSection  = useCallback(() => { if (activeIdx > 0) setActiveId(SECTIONS[activeIdx - 1].id); }, [activeIdx]);
  const nextSection  = useCallback(() => { if (activeIdx < SECTIONS.length - 1) setActiveId(SECTIONS[activeIdx + 1].id); }, [activeIdx]);

  return (
    <Shell title="FAQ">
      <div className="page-header-row" style={{ marginBottom: 28 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div className="page-eyebrow">Referencia técnica</div>
          <h1>Procedimientos Starlink</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 13 }}>Todo lo que necesitas saber. Haz click en cualquier tarjeta para ver el detalle.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignSelf: 'flex-start', flexWrap: 'wrap' }}>
          <button className="btn-ghost" onClick={() => setShowCalc(true)}>
            <Icons.spark size={16} />
            Calc. APs
          </button>
          <a href={PDF_URL} download="Procedimiento_Starlink_ENTEL.pdf" className="btn-primary" style={{ textDecoration: 'none' }}>
            <Icons.download size={16} stroke="#fff" />
            Descargar PDF
          </a>
        </div>
        {showCalc && <ApCalc onClose={() => setShowCalc(false)} />}
      </div>

        {/* Quick reference strip */}
        <div className="stat-row" style={{ marginBottom: 28 }}>
          {[
            { icon: Icons.clock,    val: '20 días',     label: 'para recibir el equipo' },
            { icon: Icons.database, val: 'Hasta 6 TB',  label: 'de datos por plan' },
            { icon: Icons.alert,    val: '60/80/100%',  label: 'alertas automáticas' },
            { icon: Icons.mail,     val: 'Viernes',     label: 'reporte semanal de TI' },
          ].map((item) => (
            <div key={item.val} className="stat-card">
              <IconBadge icon={item.icon} size={32} />
              <div className="mono stat-card-value" style={{ marginTop: 10 }}>{item.val}</div>
              <div className="stat-card-sub">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Cards grid */}
        <div className="faq-cards-grid">
          {SECTIONS.map((s) => (
            <SectionCard key={s.id} {...s} onClick={() => openSection(s.id)} />
          ))}
        </div>

      {/* Modal */}
      {activeSection && (
        <Modal
          section={activeSection}
          onClose={closeModal}
          onPrev={prevSection}
          onNext={nextSection}
          hasPrev={activeIdx > 0}
          hasNext={activeIdx < SECTIONS.length - 1}
        />
      )}
    </Shell>
  );
}
