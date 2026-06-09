/* ============================================================
   COMPONENTES COMPARTIDOS — charts, gauges, barras, iconos
   ============================================================ */

/* ---------- Formateadores ---------- */
const nf0 = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtGB = (n) => nf0.format(Math.round(n)) + " GB";
const fmtGB1 = (n) => nf1.format(n) + " GB";
const fmtPct = (n) => nf1.format(n) + "%";
const fmtDateShort = (iso) => {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
};

const STATUS = {
  ok:   { color: "var(--ok)",   bg: "var(--ok-bg)",   label: "OK" },
  warn: { color: "var(--warn)", bg: "var(--warn-bg)", label: "Advertencia" },
  risk: { color: "var(--risk)", bg: "var(--risk-bg)", label: "En riesgo" },
};

/* ---------- Iconos (stroke simple) ---------- */
const Icon = ({ d, size = 20, fill = "none", stroke = "currentColor", sw = 1.8, children, vb = 24 }) => (
  <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill={fill} stroke={stroke}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d ? <path d={d} /> : children}
  </svg>
);
const Icons = {
  grid:   (p) => <Icon {...p} children={<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>} />,
  chart:  (p) => <Icon {...p} children={<><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16l3-4 3 2 4-6"/></>} />,
  alert:  (p) => <Icon {...p} children={<><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></>} />,
  sat:    (p) => <Icon {...p} children={<><path d="M5 13a7 7 0 0 1 6 6"/><path d="M5 18a2 2 0 0 1 1 1"/><path d="m13.4 10.6 3-3"/><path d="M19 4a2.8 2.8 0 0 0-4 0l-3 3 4 4 3-3a2.8 2.8 0 0 0 0-4Z"/><path d="m9.5 14.5-5 5"/></>} />,
  search: (p) => <Icon {...p} children={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></>} />,
  back:   (p) => <Icon {...p} children={<><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></>} />,
  sort:   (p) => <Icon {...p} children={<><path d="m8 9 4-4 4 4"/><path d="m16 15-4 4-4-4"/></>} />,
  clock:  (p) => <Icon {...p} children={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>} />,
  download:(p)=> <Icon {...p} children={<><path d="M12 3v12"/><path d="m7 11 5 4 5-4"/><path d="M5 21h14"/></>} />,
  logout: (p) => <Icon {...p} children={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></>} />,
  arrowUp:(p) => <Icon {...p} children={<><path d="m6 15 6-6 6 6"/></>} />,
  spark:  (p) => <Icon {...p} children={<><path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/><circle cx="12" cy="12" r="3.5"/></>} />,
  filter: (p) => <Icon {...p} children={<><path d="M3 5h18"/><path d="M6 12h12"/><path d="M10 19h4"/></>} />,
};

/* ---------- Helpers de path SVG ---------- */
function smoothLine(pts) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

/* ---------- AreaChart (tendencia diaria) ---------- */
function AreaChart({ data, height = 200, valueKey = "total", accent = "var(--accent)", id = "g" }) {
  const W = 800, H = height, padX = 8, padТ = 16, padB = 26;
  const vals = data.map((d) => d[valueKey]);
  const max = Math.max(...vals) * 1.12 || 1;
  const innerW = W - padX * 2;
  const innerH = H - padТ - padB;
  const x = (i) => padX + (innerW * i) / (data.length - 1);
  const y = (v) => padТ + innerH - (v / max) * innerH;
  const pts = data.map((d, i) => [x(i), y(d[valueKey])]);
  const line = smoothLine(pts);
  const area = `${line} L ${x(data.length - 1)} ${padТ + innerH} L ${x(0)} ${padТ + innerH} Z`;
  const grid = [0.25, 0.5, 0.75, 1].map((g) => padТ + innerH - g * innerH);

  const [hover, setHover] = React.useState(null);
  const ref = React.useRef(null);
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0, bd = Infinity;
    pts.forEach((p, i) => { const dd = Math.abs(p[0] - px); if (dd < bd) { bd = dd; best = i; } });
    setHover(best);
  };
  const ticks = data.map((d, i) => i).filter((i) => i % Math.ceil(data.length / 6) === 0);

  return (
    <div className="chart-wrap">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="area-svg"
           onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.42" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        {grid.map((gy, i) => (
          <line key={i} x1={padX} x2={W - padX} y1={gy} y2={gy} stroke="var(--grid)" strokeWidth="1" />
        ))}
        <path d={area} fill={`url(#area-${id})`} />
        <path d={line} fill="none" stroke={accent} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        {hover != null && (
          <g>
            <line x1={pts[hover][0]} x2={pts[hover][0]} y1={padТ} y2={padТ + innerH} stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <circle cx={pts[hover][0]} cy={pts[hover][1]} r="4.5" fill="var(--accent)" stroke="var(--panel)" strokeWidth="2" />
          </g>
        )}
      </svg>
      <div className="chart-xaxis">
        {ticks.map((i) => (
          <span key={i} style={{ left: `${(i / (data.length - 1)) * 100}%` }}>{fmtDateShort(data[i].date)}</span>
        ))}
      </div>
      {hover != null && (
        <div className="chart-tip" style={{ left: `${(hover / (data.length - 1)) * 100}%` }}>
          <strong>{fmtGB1(data[hover][valueKey])}</strong>
          <span>{fmtDateShort(data[hover].date)}</span>
        </div>
      )}
    </div>
  );
}

/* ---------- Sparkline (mini línea por antena) ---------- */
function Sparkline({ data, valueKey = "cumulative", accent = "var(--accent)", w = 96, h = 30 }) {
  const vals = data.map((d) => d[valueKey]);
  const max = Math.max(...vals) || 1, min = Math.min(...vals);
  const x = (i) => (w * i) / (data.length - 1);
  const y = (v) => h - 3 - ((v - min) / (max - min || 1)) * (h - 6);
  const pts = data.map((d, i) => [x(i), y(d[valueKey])]);
  const line = smoothLine(pts);
  return (
    <svg width={w} height={h} className="spark">
      <path d={`${line} L ${w} ${h} L 0 ${h} Z`} fill={accent} opacity="0.12" />
      <path d={line} fill="none" stroke={accent} strokeWidth="1.6" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.2" fill={accent} />
    </svg>
  );
}

/* ---------- DonutGauge ---------- */
function DonutGauge({ pct, size = 168, stroke = 16, label, sub }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const st = STATUS[pct >= window.DATA.RISK ? "risk" : pct >= window.DATA.WARN ? "warn" : "ok"];
  const off = c * (1 - Math.min(pct, 100) / 100);
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={st.color} strokeWidth={stroke}
                strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset .9s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div className="donut-center">
        <div className="donut-pct" style={{ color: st.color }}>{fmtPct(pct)}</div>
        {label && <div className="donut-label">{label}</div>}
        {sub && <div className="donut-sub">{sub}</div>}
      </div>
    </div>
  );
}

/* ---------- UsageBar (barra de uso con límite) ---------- */
function UsageBar({ pct, status, height = 8 }) {
  const st = STATUS[status];
  return (
    <div className="usage" style={{ height }}>
      <div className="usage-fill" style={{ width: `${Math.min(pct, 100)}%`, background: st.color }} />
      <span className="usage-warn" style={{ left: `${window.DATA.WARN}%` }} />
      <span className="usage-risk" style={{ left: `${window.DATA.RISK}%` }} />
    </div>
  );
}

/* ---------- Badge de estado ---------- */
function StatusBadge({ status, children }) {
  const st = STATUS[status];
  return (
    <span className="badge" style={{ color: st.color, background: st.bg }}>
      <span className="badge-dot" style={{ background: st.color }} />
      {children || st.label}
    </span>
  );
}

Object.assign(window, {
  nf0, nf1, fmtGB, fmtGB1, fmtPct, fmtDateShort, STATUS, Icons,
  AreaChart, Sparkline, DonutGauge, UsageBar, StatusBadge,
});
