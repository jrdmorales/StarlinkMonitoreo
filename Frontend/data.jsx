/* ============================================================
   DATA MODEL — Antenas Starlink agrupadas por OBRA
   Reemplaza esta capa por tu fuente real (API / CSV).
   Estructura esperada por antena:
     { code, obra, name, pct, consumo, limite, fechaTermino, daysLeft, status, history:[{date, daily, cumulative}] }
   ============================================================ */
(function () {
  "use strict";

  // --- Config de umbrales (se puede tunear) ---
  const RISK = 85;   // rojo  >= 85% de uso
  const WARN = 75;   // ámbar >= 75% de uso
  const TODAY = new Date("2026-06-03T00:00:00");
  const HISTORY_DAYS = 30;

  // --- Mapeo obra -> códigos de antena (tal cual lo entregaste) ---
  const groupMapping = {
    "SALAR-CLIENTES":   { prefix: "SAL", label: "Salar",       codes: ["10000697951", "10000697963", "10000698005", "10000698006", "10000698012", "10000698009"] },
    "LOPINTO-CLIENTES": { prefix: "LOP", label: "Lo Pinto",    codes: ["10000698019", "10000698003", "10000698018"] },
    "QB-CLIENTES":      { prefix: "QB",  label: "Quebrada B.", codes: ["10000697942"] },
    "ZALD-CLIENTES":    { prefix: "ZAL", label: "Zaldívar Muro",    codes: ["10000697998", "10000697999", "10000697944"] },
    "NEGR-CLIENTES":    { prefix: "NEG", label: "La Negra",    codes: ["10000697973"] },
    "ALB-CLIENTES":     { prefix: "ALB", label: "Albemarle",   codes: ["10000698022"] },
  };

  // --- RNG determinista por semilla (mulberry32) ---
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seedFromCode(code) {
    let h = 2166136261;
    for (let i = 0; i < code.length; i++) { h ^= code.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function fmtDate(d) {
    return d.toISOString().slice(0, 10);
  }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

  function statusFor(pct) {
    if (pct >= RISK) return "risk";
    if (pct >= WARN) return "warn";
    return "ok";
  }

  // Algunos códigos forzados a valores notables para mostrar el rango completo
  const forced = {
    "10000697951": { pct: 94.2, limite: 2000 },   // SALAR — crítico
    "10000698005": { pct: 88.7, limite: 2000 },   // SALAR — riesgo
    "10000697942": { pct: 96.8, limite: 1000 },   // QB — crítico (única antena)
    "10000697973": { pct: 41.3, limite: 2000 },   // NEGR — holgado
    "10000698022": { pct: 60.0, limite: 2000 },   // ALB — el ejemplo que diste
    "10000697998": { pct: 79.5, limite: 3000 },   // ZALD — advertencia
  };

  function buildAntenna(code, group, key) {
    const r = rng(seedFromCode(code));
    const f = forced[code] || {};
    const limite = f.limite || ([1000, 2000, 2000, 2000, 3000][Math.floor(r() * 5)]);
    let pct = f.pct != null ? f.pct : 28 + r() * 62;          // 28% – 90%
    pct = Math.round(pct * 10) / 10;
    const consumo = Math.round(limite * pct) / 100;

    // Fecha término: la mayoría 2026-06-14, algunas distintas
    const cycleEndChoices = ["2026-06-14", "2026-06-14", "2026-06-30", "2026-06-08", "2026-07-05"];
    const fechaTermino = f.fechaTermino || cycleEndChoices[Math.floor(r() * cycleEndChoices.length)];
    const endD = new Date(fechaTermino + "T00:00:00");
    const daysLeft = Math.max(0, Math.round((endD - TODAY) / 86400000));

    // Historial: 30 días terminando hoy, acumulando hasta `consumo`
    const weights = [];
    let drift = 0;
    for (let i = 0; i < HISTORY_DAYS; i++) {
      const dow = (addDays(TODAY, -(HISTORY_DAYS - 1 - i)).getDay());
      const weekend = (dow === 0 || dow === 6) ? 0.55 : 1;   // menos consumo fin de semana
      drift += (r() - 0.45) * 0.15;                           // leve tendencia
      const w = Math.max(0.05, (0.7 + r() * 0.6 + drift) * weekend);
      weights.push(w);
    }
    const sumW = weights.reduce((a, b) => a + b, 0);
    const history = [];
    let cum = 0;
    for (let i = 0; i < HISTORY_DAYS; i++) {
      const daily = Math.round((weights[i] / sumW) * consumo * 100) / 100;
      cum = Math.round((cum + daily) * 100) / 100;
      history.push({
        date: fmtDate(addDays(TODAY, -(HISTORY_DAYS - 1 - i))),
        daily,
        cumulative: cum,
      });
    }
    // ajustar último acumulado exacto
    if (history.length) history[history.length - 1].cumulative = consumo;

    const idx = group.codes.indexOf(code) + 1;
    const name = `EXC-${group.prefix}-OF-${idx}_STLK_PIC_${code}`;

    return {
      code,
      obra: key,
      obraLabel: group.label,
      name,
      pct,
      consumo,
      limite,
      disponible: Math.round((limite - consumo) * 100) / 100,
      fechaTermino,
      daysLeft,
      status: statusFor(pct),
      history,
    };
  }

  // --- Construir todas las antenas ---
  const antennas = [];
  Object.keys(groupMapping).forEach((key) => {
    const g = groupMapping[key];
    g.codes.forEach((code) => antennas.push(buildAntenna(code, g, key)));
  });

  // --- Agregados por obra ---
  const obras = Object.keys(groupMapping).map((key) => {
    const g = groupMapping[key];
    const ants = antennas.filter((a) => a.obra === key);
    const consumo = ants.reduce((s, a) => s + a.consumo, 0);
    const limite = ants.reduce((s, a) => s + a.limite, 0);
    const pct = limite ? Math.round((consumo / limite) * 1000) / 10 : 0;
    const riskCount = ants.filter((a) => a.status === "risk").length;
    const warnCount = ants.filter((a) => a.status === "warn").length;
    // tendencia diaria agregada de la obra
    const daily = [];
    for (let i = 0; i < HISTORY_DAYS; i++) {
      const date = ants[0].history[i].date;
      const total = ants.reduce((s, a) => s + a.history[i].daily, 0);
      daily.push({ date, total: Math.round(total * 100) / 100 });
    }
    const minDays = Math.min(...ants.map((a) => a.daysLeft));
    return {
      key,
      label: g.label,
      prefix: g.prefix,
      antennas: ants,
      count: ants.length,
      consumo: Math.round(consumo * 100) / 100,
      limite,
      disponible: Math.round((limite - consumo) * 100) / 100,
      pct,
      status: statusFor(pct),
      riskCount,
      warnCount,
      minDays,
      daily,
    };
  });

  // --- Tendencia global diaria (todas las obras) ---
  const globalDaily = [];
  for (let i = 0; i < HISTORY_DAYS; i++) {
    const date = antennas[0].history[i].date;
    const total = antennas.reduce((s, a) => s + a.history[i].daily, 0);
    globalDaily.push({ date, total: Math.round(total * 100) / 100 });
  }

  // --- KPIs globales ---
  const totalConsumo = Math.round(antennas.reduce((s, a) => s + a.consumo, 0) * 100) / 100;
  const totalLimite = antennas.reduce((s, a) => s + a.limite, 0);
  const kpis = {
    totalConsumo,
    totalLimite,
    totalDisponible: Math.round((totalLimite - totalConsumo) * 100) / 100,
    pctGlobal: Math.round((totalConsumo / totalLimite) * 1000) / 10,
    riskCount: antennas.filter((a) => a.status === "risk").length,
    warnCount: antennas.filter((a) => a.status === "warn").length,
    antennaCount: antennas.length,
    obraCount: obras.length,
    avgPct: Math.round((antennas.reduce((s, a) => s + a.pct, 0) / antennas.length) * 10) / 10,
  };

  window.DATA = {
    RISK, WARN, TODAY, HISTORY_DAYS,
    antennas, obras, globalDaily, kpis, groupMapping,
  };
})();
