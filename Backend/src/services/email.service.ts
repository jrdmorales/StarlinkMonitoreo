import nodemailer from 'nodemailer';
import type { AntennaDto, ObraDto } from '../types/index.js';
import { config } from '../lib/config.js';

// Transporter lazy-init: se crea solo cuando hay configuración SMTP
let _transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!config.SMTP_HOST) {
    throw new Error('SMTP no configurado. Definir SMTP_HOST en .env');
  }
  if (!_transporter) {
    const hasAuth = Boolean(config.SMTP_USER && config.SMTP_PASS);
    _transporter = nodemailer.createTransport({
      host:   config.SMTP_HOST,
      port:   config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      ...(hasAuth ? { auth: { user: config.SMTP_USER!, pass: config.SMTP_PASS! } } : {}),
      tls:    { rejectUnauthorized: false },
    });
  }
  return _transporter;
}

export async function sendEmail(params: {
  to:      string;
  subject: string;
  html:    string;
}): Promise<void> {
  const transporter = getTransporter();
  await transporter.sendMail({
    from:    config.SMTP_FROM ?? config.SMTP_USER,
    to:      params.to,
    subject: params.subject,
    html:    params.html,
  });
}

// ── Frases del día ────────────────────────────────────────────────────────────

const FRASES = [
  "Todo bajo control… excepto el café que ya se acabó ☕😅",
  "Si algo falla, no fuimos nosotros… fue Mercurio retrógrado 🚀",
  "Detectamos problemas más rápido que el jefe preguntando '¿y eso?' 👀",
  "Monitoreando 24/7… porque dormir es opcional 😴",
  "La red está estable… milagro nivel TI ✨",
  "Si ves esto, todo va bien. Si no… también lo sabremos 😂",
  "Menos bugs, más cariño digital 💚",
  "Aquí los errores duran menos que dieta en diciembre 🎄",
  "Todo funcionando… sospechosamente perfecto 🤨",
  "Porque reiniciar también es una forma de terapia 🔄",
  "Más alertas que grupo de WhatsApp familiar 📱",
  "Si se cae algo, caemos primero nosotros en pánico 😬",
  "Cuidando tu red como mamá con la chaqueta 🧥",
  "Tecnología estable… con ansiedad controlada 😅",
  "Resolviendo problemas antes de que culpen al WiFi 🙄",
  "Todo fluye… o lo hacemos fluir a la fuerza 💪",
  "Aquí amamos tanto los datos que hasta los vigilamos dormir 🛌",
  "Red optimizada… y milagros en proceso ✝️😂",
  "El sistema está bien… nosotros no tanto 🤯",
  "Si algo explota… al menos tendremos el log 🔥",
  "Antenas apuntando al cielo, igual que nuestras esperanzas 🛰️",
  "El uptime no se negocia, el café sí ☕",
  "Bytes monitoreados con amor y un poco de fe 🙏",
  "Si el internet cae, el problema es cósmico. Si no, somos nosotros 🌌",
  "Cada GB consumido es un paso más hacia la gloria 📈",
  "Nada falla hoy… toca madera 🪵",
  "TI: los que nadie llama hasta que algo no funciona 📞",
  "Tu red está más cuidada que tu planta de oficina 🌱",
  "Estamos en todas partes… menos en el break room 🚪",
  "Los datos no mienten. Los humanos sí, pero eso no es nuestro problema 😇",
  "Si el satélite lo ve, nosotros también lo vemos 🔭",
  "Alertas enviadas con cariño y cafeína ☕💙",
  "El 100% de consumo no es una meta, es una señal de auxilio 🆘",
  "Más confiable que la promesa del viernes de salir a las 5 🕔",
  "Monitoreo automático: porque los humanos necesitan dormir 😪",
  "Sistema funcionando. Jefe contento. Nosotros sobreviviendo 🫡",
  "Cada antena, un ojo abierto en el cosmos 🌐",
  "Cuando todo va bien, el mérito es nuestro. Cuando falla… es el proveedor 😂",
  "Más dedicados que el guardia nocturno del edificio 🏢",
  "La latencia baja, el ánimo sube 📶",
  "Tecnología: la única magia que TI acepta 🪄",
  "Vivimos en los logs y morimos en producción 💀",
  "Aquí nadie descansa hasta que el ping sea verde 🟢",
  "GB monitoreados = problemas prevenidos = jefes felices = nosotros también 🤝",
  "Automatizado, pero con alma 💫",
  "Si hay datos, hay vida. Si no hay datos… también lo sabremos 📡",
  "El internet es la quinta necesidad básica. Nosotros la cuidamos 🛡️",
  "Más vigilantes que vecino con ventana a la calle 👁️",
  "Redes sanas, equipos felices 😊",
  "Todo bajo control, como siempre dijimos que estaría 😎",
  "El satellite no duerme. Nosotros tampoco 🛸",
  "Problema detectado = problema a medias resuelto 🔧",
  "Cada reporte es un abrazo tecnológico 🤗",
  "Funcionando perfecto… hasta que no 🫠",
  "Si el plan de datos se acaba, ya lo sabemos antes que tú 😏",
  "TI: los héroes sin capa… ni crédito 🦸",
  "Datos en orden, universo en paz ☮️",
  "Alertas automáticas: porque la memoria humana es pésima 🧠",
  "Red estable = equipo de obra contento = obra avanza = todos felices 🏗️",
  "Cero sorpresas. Solo datos, hechos y un poco de drama 🎭",
];

function randomFrase(): string {
  return FRASES[Math.floor(Math.random() * FRASES.length)];
}

function fraseRow(bgColor = '#f8fafc'): string {
  return `
  <tr>
    <td bgcolor="${bgColor}" style="background:${bgColor};padding:12px 24px;border-top:1px dashed #cbd5e1;text-align:center;">
      <span style="font-size:11.5px;color:#64748b;font-style:italic;font-family:Arial,'Helvetica Neue',sans-serif;">
        ${randomFrase()}
      </span>
    </td>
  </tr>`;
}

// ── Template helpers ──────────────────────────────────────────────────────────

const CLR = {
  bg:      '#ffffff',
  panel:   '#ffffff',
  panel2:  '#f8fafc',
  line:    '#94a3b8',
  text:    '#0f172a',
  muted:   '#64748b',
  dim:     '#94a3b8',
  accent:  '#4f63d2',
  ok:      '#16a34a',
  warn:    '#b45309',
  risk:    '#dc2626',
  okBg:    '#f0fdf4',
  warnBg:  '#fffbeb',
  riskBg:  '#fef2f2',
  mono:    "Consolas,'Courier New',monospace",
  sans:    "Arial,'Helvetica Neue',sans-serif",
};

const THRESHOLD_CFG: Record<number, { label: string; hdrBg: string; accent: string }> = {
  60:  { label: 'Primer aviso — 60%',        hdrBg: '#15803d', accent: '#bbf7d0' },
  80:  { label: 'Advertencia — 80%',          hdrBg: '#b45309', accent: '#fde68a' },
  100: { label: '¡Límite alcanzado — 100%!',  hdrBg: '#b91c1c', accent: '#fecaca' },
};

function statusColor(s: 'ok' | 'warn' | 'risk'): string {
  return s === 'risk' ? CLR.risk : s === 'warn' ? CLR.warn : CLR.ok;
}
function statusBg(s: 'ok' | 'warn' | 'risk'): string {
  return s === 'risk' ? CLR.riskBg : s === 'warn' ? CLR.warnBg : CLR.okBg;
}
function statusLabel(s: 'ok' | 'warn' | 'risk'): string {
  return s === 'risk' ? 'En riesgo' : s === 'warn' ? 'Advertencia' : 'OK';
}
function f1(n: number): string { return n.toFixed(1); }
function f2(n: number): string { return n.toFixed(2); }
function fmtDate(iso: string): string {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

/* Barra de consumo — 100% compatible email, sin SVG */
function usageBar(pct: number, sc: string, consumed: number, limitGb: number): string {
  const fill = Math.min(Math.round(pct), 100);
  const empty = 100 - fill;
  return `
    <div style="text-align:center;margin-bottom:10px;">
      <span style="font-family:${CLR.mono};font-size:32px;font-weight:800;color:${sc};letter-spacing:-0.03em;">${f1(pct)}%</span>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
      <tr>
        <td width="${fill}%" bgcolor="${sc}" style="background:${sc};height:10px;font-size:0;line-height:0;border-radius:6px 0 0 6px;">&nbsp;</td>
        <td width="${empty}%" bgcolor="#e2e8f0" style="background:#e2e8f0;height:10px;font-size:0;line-height:0;border-radius:0 6px 6px 0;">&nbsp;</td>
      </tr>
    </table>
    <div style="text-align:center;font-family:${CLR.mono};font-size:11px;color:${CLR.muted};">
      ${f1(consumed)} GB <span style="color:${CLR.dim};">/ ${limitGb} GB</span>
    </div>`;
}

/* Antenna card — mirrors AntennaDetail panel */
function antennaCard(ant: AntennaDto): string {
  const sc   = statusColor(ant.status);
  const sb   = statusBg(ant.status);
  const dClr = ant.daysLeft <= 7 ? CLR.risk : CLR.muted;
  const bClr = ant.projection.bagsNeeded > 0 ? CLR.risk : CLR.muted;

  return `
  <tr><td style="padding:12px 0 0;">
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="${CLR.panel}"
      style="background:${CLR.panel};border:1px solid ${CLR.line};border-radius:12px;overflow:hidden;">

      <!-- header: code + name + badge -->
      <tr>
        <td bgcolor="${CLR.panel}" style="background:${CLR.panel};padding:14px 18px 12px;border-bottom:1px solid ${CLR.line};">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <div style="font-family:${CLR.mono};font-size:14px;font-weight:700;color:${CLR.text};letter-spacing:0.02em;">${ant.code}</div>
              <div style="font-size:11px;color:${CLR.dim};margin-top:3px;font-family:${CLR.mono};word-break:break-all;">${ant.name ?? ''}</div>
            </td>
            <td align="right" valign="top">
              <span style="display:inline-block;background:${sb};color:${sc};font-size:11px;font-weight:700;
                padding:3px 10px;border-radius:99px;letter-spacing:0.04em;">&#9679; ${statusLabel(ant.status)}</span>
            </td>
          </tr></table>
        </td>
      </tr>

      <!-- usage bar -->
      <tr>
        <td bgcolor="${CLR.panel}" style="background:${CLR.panel};padding:18px 18px 14px;">
          ${usageBar(ant.usagePct, sc, ant.consumed, ant.limitGb)}
        </td>
      </tr>

      <!-- stats — mirrors detail-stats -->
      <tr>
        <td bgcolor="${CLR.panel2}" style="background:${CLR.panel2};padding:14px 18px 14px;border-top:1px solid ${CLR.line};">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${statCell('Disponible',    `${f1(ant.available)} GB`,              CLR.text, CLR.mono)}
              ${statCell('Fecha término', fmtDate(ant.cycleEnd),                  CLR.text, CLR.sans)}
              ${statCell('Días restantes',`${ant.daysLeft} días`,                 dClr,     CLR.sans)}
            </tr>
            <tr><td colspan="3" style="height:10px;"></td></tr>
            <tr>
              ${statCell('Prom. diario',  `${f1(ant.projection.dailyAvg)} GB/d`,  CLR.text, CLR.mono)}
              ${statCell('Proyección',    `${f1(ant.projection.projectedTotal)} GB`, CLR.text, CLR.mono)}
              ${statCell('Bolsas extra',  `${ant.projection.bagsNeeded} recomendadas`, bClr, CLR.sans)}
            </tr>
          </table>
        </td>
      </tr>


    </table>
  </td></tr>`;
}

function statCell(label: string, value: string, valColor: string, valFont: string): string {
  return `<td style="vertical-align:top;padding-right:8px;">
    <div style="font-size:10px;font-weight:700;color:${CLR.muted};text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px;font-family:${CLR.sans};">${label}</div>
    <div style="font-size:14px;font-weight:700;color:${valColor};font-family:${valFont};">${value}</div>
  </td>`;
}

function kpiCell(label: string, value: string, valColor: string): string {
  return `<td style="text-align:center;padding:0 6px;">
    <div style="font-size:9.5px;color:${CLR.muted};text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px;font-family:${CLR.sans};">${label}</div>
    <div style="font-size:16px;font-weight:800;color:${valColor};font-family:${CLR.mono};">${value}</div>
  </td>`;
}

// ── Public exports ─────────────────────────────────────────────────────────────

export function buildAlertEmailHtml(params: {
  obra:       ObraDto;
  threshold:  number;
  antennas:   AntennaDto[];
  cycleStart: string;
  cycleEnd:   string;
}): string {
  const tCfg       = THRESHOLD_CFG[params.threshold] ?? THRESHOLD_CFG[100];
  const count      = params.antennas.length;
  const sc         = statusColor(params.obra.status);
  const reportDate = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  const light      = '#ffffff';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <style>
    :root, body { color-scheme: light only !important; }
  </style>
</head>
<body bgcolor="#ffffff" style="margin:0;padding:0;background:#ffffff;font-family:${CLR.sans};">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="background:#ffffff;padding:20px 12px;">
<tr><td align="center">

  <table width="560" cellpadding="0" cellspacing="0"
    style="max-width:560px;width:100%;">

    <!-- ── Top bar (dark) ── -->
    <tr>
      <td bgcolor="${CLR.panel}" style="background:${CLR.panel};padding:14px 22px;border-radius:12px 12px 0 0;border:1px solid ${CLR.line};border-bottom:none;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:13px;font-weight:800;color:${CLR.text};letter-spacing:-0.01em;font-family:${CLR.sans};">
            &#128752;&nbsp; STARLINK CONTROL
          </td>
          <td align="right">
            <span style="background:${tCfg.hdrBg};color:${tCfg.accent};font-size:11px;font-weight:700;
              padding:4px 12px;border-radius:99px;letter-spacing:0.05em;text-transform:uppercase;">
              &#9888; ${tCfg.label}
            </span>
          </td>
        </tr></table>
      </td>
    </tr>

    <!-- ── Obra header (colored) ── -->
    <tr>
      <td bgcolor="${tCfg.hdrBg}" style="background:${tCfg.hdrBg};padding:20px 22px 16px;border-left:4px solid ${tCfg.accent};border-right:1px solid ${CLR.line};">
        <div style="font-size:10px;font-weight:700;color:${tCfg.accent};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:5px;font-family:${CLR.sans};">Obra</div>
        <div style="font-size:21px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;margin-bottom:4px;font-family:${CLR.sans};">${params.obra.label}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.6);font-family:${CLR.sans};">
          Ciclo ${params.cycleStart} &#8212; ${params.cycleEnd}
          &nbsp;&#183;&nbsp;
          ${count} antena${count === 1 ? '' : 's'} ${count === 1 ? 'super&#243;' : 'superaron'} el ${params.threshold}% de consumo
        </div>
      </td>
    </tr>

    <!-- ── KPI strip (dark) ── -->
    <tr>
      <td bgcolor="${CLR.panel}" style="background:${CLR.panel};padding:12px 22px;border:1px solid ${CLR.line};border-top:none;border-bottom:none;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          ${kpiCell('Consumo obra',  `${f1(params.obra.consumed)} GB`, CLR.accent)}
          ${kpiCell('Uso global',    `${f2(params.obra.usagePct)}%`,   sc)}
          ${kpiCell('Antenas',       `${params.obra.antennaCount}`,    CLR.muted)}
          ${kpiCell('D&#237;as al corte', `${params.obra.minDaysLeft} d`, params.obra.minDaysLeft <= 7 ? CLR.risk : CLR.muted)}
        </tr></table>
      </td>
    </tr>

    <!-- ── Antenna cards (dark, each its own box) ── -->
    <tr>
      <td bgcolor="${light}" style="background:${light};padding:12px 0 0;border:1px solid ${CLR.line};border-top:none;border-bottom:none;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:0 22px;">
          ${params.antennas.map(antennaCard).join('')}
          <tr><td style="height:12px;"></td></tr>
        </table>
      </td>
    </tr>

    <!-- ── Frase del día ── -->
    <tr>
      <td bgcolor="${light}" style="background:${light};padding:10px 24px 14px;border:1px solid ${CLR.line};border-top:1px dashed #cbd5e1;border-bottom:none;text-align:center;">
        <span style="font-size:11.5px;color:#64748b;font-style:italic;font-family:${CLR.sans};">${randomFrase()}</span>
      </td>
    </tr>

    <!-- ── Footer ── -->
    <tr>
      <td bgcolor="${CLR.panel}" style="background:${CLR.panel};padding:12px 22px;border-radius:0 0 12px 12px;border:1px solid ${CLR.line};border-top:1px solid ${CLR.line};">
        <p style="margin:0;font-size:11px;color:${CLR.dim};font-family:${CLR.sans};">
          Starlink Control &nbsp;&#183;&nbsp; ${reportDate} &nbsp;&#183;&nbsp; Generado autom&#225;ticamente
        </p>
      </td>
    </tr>

  </table>

</td></tr>
</table>
</body>
</html>`;
}

export function buildAlertSubject(obraLabel: string, threshold: number, _count: number): string {
  if (threshold >= 100) return `🔴 URGENTE - Límite Alcanzado - ${obraLabel} - Superó el 100% de consumo`;
  if (threshold >= 80)  return `🟠 Advertencia - ${obraLabel} - Superó el ${threshold}% de consumo`;
  return                       `🟡 Primer aviso - ${obraLabel} - Superó el ${threshold}% de consumo`;
}

// ── Reporte semanal ───────────────────────────────────────────────────────────

export function buildReportSubject(obraLabel: string, date: string): string {
  return `📊 Reporte Semanal - ${obraLabel} - ${date}`;
}

export function buildReportEmailHtml(params: {
  obra:       ObraDto;
  reportDate: string;
  cycleStart: string;
  cycleEnd:   string;
}): string {
  const hdrBg  = '#1e3a5f';
  const accent = '#7dd3fc';
  const sc     = statusColor(params.obra.status);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <style>:root, body { color-scheme: light only !important; }</style>
</head>
<body bgcolor="#ffffff" style="margin:0;padding:0;background:#ffffff;font-family:${CLR.sans};">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="background:#ffffff;padding:20px 12px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <!-- top bar -->
  <tr>
    <td bgcolor="${hdrBg}" style="background:${hdrBg};padding:14px 24px;border-radius:12px 12px 0 0;border:1px solid #2d4a6e;border-bottom:none;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="font-size:13px;font-weight:800;color:#ffffff;font-family:${CLR.sans};">
          &#128752;&nbsp; STARLINK CONTROL
        </td>
        <td align="right">
          <span style="background:#2d4a6e;color:${accent};font-size:11px;font-weight:700;
            padding:4px 12px;border-radius:99px;letter-spacing:0.05em;text-transform:uppercase;">
            &#128202; Reporte Semanal
          </span>
        </td>
      </tr></table>
    </td>
  </tr>

  <!-- obra header -->
  <tr>
    <td bgcolor="${hdrBg}" style="background:${hdrBg};padding:20px 24px 16px;border-left:4px solid ${accent};border-right:1px solid #2d4a6e;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>
          <div style="font-size:10px;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:5px;font-family:${CLR.sans};">Obra</div>
          <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;margin-bottom:4px;font-family:${CLR.sans};">${params.obra.label}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.6);font-family:${CLR.sans};">
            ${params.reportDate} &nbsp;&#183;&nbsp; Ciclo ${params.cycleStart} &#8212; ${params.cycleEnd}
          </div>
        </td>
        <td align="right" valign="middle" style="padding-left:12px;">
          <div style="font-family:${CLR.mono};font-size:28px;font-weight:800;color:${sc};line-height:1;">${f2(params.obra.usagePct)}%</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.5);text-align:right;margin-top:3px;font-family:${CLR.sans};">${f1(params.obra.consumed)} GB / ${params.obra.limitGb} GB</div>
        </td>
      </tr></table>
    </td>
  </tr>

  <!-- kpi strip -->
  <tr>
    <td bgcolor="${CLR.panel}" style="background:${CLR.panel};padding:12px 24px;border:1px solid ${CLR.line};border-top:none;border-bottom:none;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        ${kpiCell('Consumido',     `${f1(params.obra.consumed)} GB`,      '#4f63d2')}
        ${kpiCell('Disponible',    `${f1(params.obra.available)} GB`,     CLR.muted)}
        ${kpiCell('En riesgo',     `${params.obra.riskCount}`,            CLR.risk)}
        ${kpiCell('Días al corte', `${params.obra.minDaysLeft} d`,        params.obra.minDaysLeft <= 7 ? CLR.risk : CLR.muted)}
      </tr></table>
    </td>
  </tr>

  <!-- antenna cards -->
  <tr>
    <td bgcolor="#ffffff" style="background:#ffffff;padding:12px 20px;border:1px solid ${CLR.line};border-top:none;border-bottom:none;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${params.obra.antennas.map(antennaCard).join('')}
        <tr><td style="height:8px;"></td></tr>
      </table>
    </td>
  </tr>

  <!-- frase del día -->
  <tr>
    <td bgcolor="#ffffff" style="background:#ffffff;padding:10px 24px 14px;border:1px solid ${CLR.line};border-top:1px dashed #cbd5e1;border-bottom:none;text-align:center;">
      <span style="font-size:11.5px;color:#64748b;font-style:italic;font-family:${CLR.sans};">${randomFrase()}</span>
    </td>
  </tr>

  <!-- footer -->
  <tr>
    <td bgcolor="${CLR.panel}" style="background:${CLR.panel};padding:12px 24px;border-radius:0 0 12px 12px;border:1px solid ${CLR.line};border-top:1px solid ${CLR.line};">
      <p style="margin:0;font-size:11px;color:${CLR.dim};font-family:${CLR.sans};">
        Starlink Control &nbsp;&#183;&nbsp; Reporte semanal autom&#225;tico &nbsp;&#183;&nbsp; ${params.reportDate}
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
