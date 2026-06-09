/* ============================================================
   APP — Dashboard de consumo Starlink por obra
   ============================================================ */
const { useState, useMemo } = React;

/* ---------- Sidebar ---------- */
function Sidebar({ view }) {
  const items = [
    { id: "grid", icon: Icons.grid, active: true },
    { id: "chart", icon: Icons.chart },
    { id: "alert", icon: Icons.alert },
    { id: "clock", icon: Icons.clock },
  ];
  return (
    <aside className="sidebar">
      <div className="logo"><Icons.sat size={22} stroke="#fff" /></div>
      <nav className="nav">
        {items.map((it) => (
          <button key={it.id} className={"nav-btn" + (it.active ? " active" : "")} aria-label={it.id}>
            <it.icon size={20} />
          </button>
        ))}
      </nav>
      <button className="nav-btn logout" aria-label="salir"><Icons.logout size={20} /></button>
    </aside>
  );
}

/* ---------- KPI Card ---------- */
function Kpi({ label, value, sub, accent, icon: I }) {
  return (
    <div className="kpi">
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        {I && <span className="kpi-ic" style={{ color: accent }}><I size={18} /></span>}
      </div>
      <div className="kpi-value" style={accent ? { color: accent } : null}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

/* ---------- Obra Table (lista de obras, filas cliqueables) ---------- */
function ObraTable({ obras, onOpen }) {
  const [sort, setSort] = useState({ key: "pct", dir: -1 });
  const rows = useMemo(() => {
    return [...obras].sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key];
      if (typeof av === "string") return av.localeCompare(bv) * sort.dir;
      return (av - bv) * sort.dir;
    });
  }, [obras, sort]);

  const th = (key, label, align) => (
    <th className={align === "r" ? "r" : ""} onClick={() => setSort((s) => ({ key, dir: s.key === key ? -s.dir : -1 }))}>
      <span className="th-in">{label}<Icons.sort size={13} stroke={sort.key === key ? "var(--accent)" : "var(--muted)"} /></span>
    </th>
  );

  return (
    <div className="table-scroll">
      <table className="atable obra-table">
        <thead>
          <tr>
            {th("label", "Obra")}
            {th("count", "Antenas", "r")}
            {th("pct", "% Uso")}
            <th>Uso vs. límite</th>
            {th("consumo", "Consumo", "r")}
            {th("minDays", "Días rest.", "r")}
            <th className="r">Tendencia</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => {
            const accent = o.status === "risk" ? "var(--risk)" : o.status === "warn" ? "var(--warn)" : "var(--accent)";
            const st = STATUS[o.status];
            return (
              <tr key={o.key} onClick={() => onOpen(o.key)}>
                <td>
                  <div className="cell-code">{o.label}</div>
                  <div className="cell-name">{o.key}</div>
                </td>
                <td className="r mono">{o.count}</td>
                <td><span className="mono" style={{ color: st.color, fontWeight: 700 }}>{fmtPct(o.pct)}</span></td>
                <td className="usage-cell"><UsageBar pct={o.pct} status={o.status} /></td>
                <td className="r mono">{fmtGB(o.consumo)}<span className="cell-dim"> / {nf0.format(o.limite)}</span></td>
                <td className="r"><span className="days" data-low={o.minDays <= 7}>{o.minDays} d</span></td>
                <td className="r"><Sparkline data={o.daily} valueKey="total" accent={accent} w={92} h={28} /></td>
                <td>
                  {o.riskCount > 0
                    ? <StatusBadge status="risk">{o.riskCount} en riesgo</StatusBadge>
                    : o.warnCount > 0
                      ? <StatusBadge status="warn">{o.warnCount} alerta</StatusBadge>
                      : <StatusBadge status="ok">OK</StatusBadge>}
                </td>
                <td className="go"><Icons.back size={16} stroke="var(--muted)" /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && <div className="empty wide">No hay obras con ese filtro.</div>}
    </div>
  );
}

/* ---------- Alert list ---------- */
function AlertPanel({ antennas, onOpen }) {
  const list = [...antennas].filter((a) => a.status !== "ok").sort((a, b) => b.pct - a.pct).slice(0, 6);
  return (
    <div className="panel alerts">
      <div className="panel-head">
        <h3><Icons.alert size={17} stroke="var(--risk)" /> Antenas en alerta</h3>
        <span className="pill">{antennas.filter((a) => a.status !== "ok").length}</span>
      </div>
      <div className="alert-list">
        {list.map((a) => {
          const st = STATUS[a.status];
          return (
            <button key={a.code} className="alert-row" onClick={() => onOpen(a.obra)}>
              <span className="alert-dot" style={{ background: st.color }} />
              <div className="alert-info">
                <div className="alert-code mono">{a.code}</div>
                <div className="alert-meta">{a.obraLabel} · {fmtGB(a.consumo)} / {fmtGB(a.limite)}</div>
              </div>
              <div className="alert-pct mono" style={{ color: st.color }}>{fmtPct(a.pct)}</div>
            </button>
          );
        })}
        {list.length === 0 && <div className="empty">Sin alertas 🎉</div>}
      </div>
    </div>
  );
}

/* ---------- Overview ---------- */
function Overview({ data, onOpen }) {
  const [q, setQ] = useState("");
  const [obraFilter, setObraFilter] = useState("all");

  const obras = useMemo(() => {
    return data.obras.filter((o) =>
      (obraFilter === "all" || o.status === obraFilter) &&
      (q === "" || o.label.toLowerCase().includes(q.toLowerCase()) || o.key.toLowerCase().includes(q.toLowerCase())));
  }, [data.obras, q, obraFilter]);

  const k = data.kpis;
  return (
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
          <button className="btn-ghost"><Icons.download size={16} /> Exportar</button>
        </div>
      </header>

      <div className="kpi-row">
        <Kpi label="Consumo total (ciclo)" value={fmtGB(k.totalConsumo)} sub={`de ${fmtGB(k.totalLimite)} contratados`} icon={Icons.chart} accent="var(--accent)" />
        <Kpi label="Uso global" value={fmtPct(k.pctGlobal)} sub={`${fmtGB(k.totalDisponible)} disponibles`} icon={Icons.spark} accent="var(--cyan)" />
        <Kpi label="Antenas en riesgo" value={k.riskCount} sub={`${k.warnCount} en advertencia`} icon={Icons.alert} accent="var(--risk)" />
        <Kpi label="Antenas activas" value={k.antennaCount} sub={`en ${k.obraCount} obras`} icon={Icons.sat} accent="var(--text)" />
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <h3>Tendencia de consumo diario</h3>
            <span className="muted">Últimos {data.HISTORY_DAYS} días · todas las obras</span>
          </div>
          <AreaChart data={data.globalDaily} valueKey="total" accent="var(--accent)" id="global" height={210} />
        </div>
        <AlertPanel antennas={data.antennas} onOpen={onOpen} />
      </div>

      <div className="panel obras-panel">
        <div className="panel-head">
          <h3><Icons.grid size={17} /> Obras <span className="count-dim">({obras.length})</span></h3>
          <div className="panel-head-right">
            <div className="seg">
              {[["all", "Todas"], ["risk", "En riesgo"], ["warn", "Advertencia"], ["ok", "OK"]].map(([v, l]) => (
                <button key={v} className={"seg-btn" + (obraFilter === v ? " on" : "")} onClick={() => setObraFilter(v)}>{l}</button>
              ))}
            </div>
            <button className="btn-ghost sm"><Icons.download size={15} /> CSV</button>
          </div>
        </div>
        <ObraTable obras={obras} onOpen={onOpen} />
      </div>
    </div>
  );
}

/* ---------- Antenna table (detalle) ---------- */
function AntennaTable({ antennas, onSelect, selected }) {
  const [sort, setSort] = useState({ key: "pct", dir: -1 });
  const [statusF, setStatusF] = useState("all");

  const rows = useMemo(() => {
    let r = antennas.filter((a) => statusF === "all" || a.status === statusF);
    r = [...r].sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key];
      if (typeof av === "string") return av.localeCompare(bv) * sort.dir;
      return (av - bv) * sort.dir;
    });
    return r;
  }, [antennas, sort, statusF]);

  const th = (key, label, align) => (
    <th className={align === "r" ? "r" : ""} onClick={() => setSort((s) => ({ key, dir: s.key === key ? -s.dir : -1 }))}>
      <span className="th-in">{label}<Icons.sort size={13} stroke={sort.key === key ? "var(--accent)" : "var(--muted)"} /></span>
    </th>
  );

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Antenas ({rows.length})</h3>
        <div className="seg sm">
          {[["all", "Todas"], ["risk", "Riesgo"], ["warn", "Adv."], ["ok", "OK"]].map(([v, l]) => (
            <button key={v} className={"seg-btn" + (statusF === v ? " on" : "")} onClick={() => setStatusF(v)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="table-scroll">
        <table className="atable">
          <thead>
            <tr>
              {th("code", "Antena")}
              {th("pct", "% Uso")}
              <th>Uso vs. límite</th>
              {th("consumo", "Consumo", "r")}
              {th("daysLeft", "Días rest.", "r")}
              <th className="r">Historial</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const st = STATUS[a.status];
              const accent = a.status === "risk" ? "var(--risk)" : a.status === "warn" ? "var(--warn)" : "var(--accent)";
              return (
                <tr key={a.code} className={selected === a.code ? "sel" : ""} onClick={() => onSelect(a)}>
                  <td>
                    <div className="cell-code mono">{a.code}</div>
                    <div className="cell-name">{a.name}</div>
                  </td>
                  <td><span className="mono" style={{ color: st.color, fontWeight: 700 }}>{fmtPct(a.pct)}</span></td>
                  <td className="usage-cell"><UsageBar pct={a.pct} status={a.status} /></td>
                  <td className="r mono">{fmtGB1(a.consumo)}<span className="cell-dim"> / {nf0.format(a.limite)}</span></td>
                  <td className="r"><span className="days" data-low={a.daysLeft <= 7}>{a.daysLeft} d</span></td>
                  <td className="r"><Sparkline data={a.history} accent={accent} w={88} h={28} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Detail panel (antena seleccionada) ---------- */
function AntennaDetail({ a }) {
  if (!a) return (
    <div className="panel detail empty-detail">
      <Icons.sat size={30} stroke="var(--muted)" />
      <p>Selecciona una antena para ver su detalle de consumo.</p>
    </div>
  );
  const accent = a.status === "risk" ? "var(--risk)" : a.status === "warn" ? "var(--warn)" : "var(--accent)";
  return (
    <div className="panel detail">
      <div className="detail-head">
        <div>
          <div className="mono detail-code">{a.code}</div>
          <div className="detail-name">{a.name}</div>
        </div>
        <StatusBadge status={a.status} />
      </div>
      <div className="detail-gauge">
        <DonutGauge pct={a.pct} size={150} stroke={14} label="de uso" />
      </div>
      <div className="detail-gauge-cap mono">{fmtGB1(a.consumo)} <span>/ {fmtGB(a.limite)}</span></div>
      <div className="detail-stats">
        <div><span>Disponible</span><b className="mono">{fmtGB1(a.disponible)}</b></div>
        <div><span>Fecha término</span><b>{fmtDateShort(a.fechaTermino)}</b></div>
        <div><span>Días restantes</span><b className={a.daysLeft <= 7 ? "danger" : ""}>{a.daysLeft} días</b></div>
      </div>
      <div className="detail-chart">
        <div className="dc-title">Consumo acumulado en el ciclo</div>
        <AreaChart data={a.history} valueKey="cumulative" accent={accent} id={"d" + a.code} height={150} />
      </div>
    </div>
  );
}

/* ---------- Obra detail view ---------- */
function ObraView({ obra, onBack }) {
  const [sel, setSel] = useState(obra.antennas.find((a) => a.status === "risk") || obra.antennas[0]);
  const accent = obra.status === "risk" ? "var(--risk)" : obra.status === "warn" ? "var(--warn)" : "var(--accent)";
  return (
    <div className="content">
      <header className="topbar">
        <div className="crumb-row">
          <button className="back" onClick={onBack}><Icons.back size={18} /></button>
          <div>
            <div className="crumb">Obras / {obra.key}</div>
            <h1>{obra.label}</h1>
          </div>
        </div>
        <div className="topbar-right">
          <StatusBadge status={obra.status}>{obra.riskCount > 0 ? `${obra.riskCount} en riesgo` : obra.warnCount > 0 ? `${obra.warnCount} en advertencia` : "Todo en orden"}</StatusBadge>
          <button className="btn-ghost"><Icons.download size={16} /> Exportar</button>
        </div>
      </header>

      <div className="kpi-row">
        <Kpi label="Consumo de la obra" value={fmtGB(obra.consumo)} sub={`de ${fmtGB(obra.limite)} contratados`} icon={Icons.chart} accent="var(--accent)" />
        <Kpi label="Uso promedio" value={fmtPct(obra.pct)} sub={`${fmtGB(obra.disponible)} disponibles`} icon={Icons.spark} accent="var(--cyan)" />
        <Kpi label="Antenas" value={obra.count} sub={`${obra.riskCount} en riesgo · ${obra.warnCount} adv.`} icon={Icons.sat} accent="var(--text)" />
        <Kpi label="Próximo corte" value={`${obra.minDays} días`} sub="antena más cercana al término" icon={Icons.clock} accent={obra.minDays <= 7 ? "var(--risk)" : "var(--text)"} />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Tendencia de consumo diario · {obra.label}</h3>
          <span className="muted">Últimos {window.DATA.HISTORY_DAYS} días</span>
        </div>
        <AreaChart data={obra.daily} valueKey="total" accent={accent} id={"obra" + obra.key} height={170} />
      </div>

      <div className="detail-layout">
        <AntennaTable antennas={obra.antennas} onSelect={setSel} selected={sel ? sel.code : null} />
        <AntennaDetail a={sel} />
      </div>
    </div>
  );
}

/* ---------- Root ---------- */
function App() {
  const data = window.DATA;
  const [route, setRoute] = useState({ view: "overview", obra: null });
  const obra = route.obra ? data.obras.find((o) => o.key === route.obra) : null;

  return (
    <div className="app">
      <Sidebar />
      {route.view === "overview" || !obra
        ? <Overview data={data} onOpen={(key) => setRoute({ view: "obra", obra: key })} />
        : <ObraView obra={obra} onBack={() => setRoute({ view: "overview", obra: null })} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
