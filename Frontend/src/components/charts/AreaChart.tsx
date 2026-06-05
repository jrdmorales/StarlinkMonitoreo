import { useState, useRef } from 'react';
import { smoothLine } from './chartUtils';
import { fmtGB1, fmtDateShort } from '../../lib/formatters';

interface DataPoint { [key: string]: number | string }

interface Props {
  data:      DataPoint[];
  valueKey?: string;
  height?:   number;
  accent?:   string;
  id?:       string;
}

export default function AreaChart({ data, height = 200, valueKey = 'total', accent = 'var(--accent)', id = 'g' }: Props) {
  const W = 800, H = height, padX = 8, padT = 16, padB = 26;
  const vals = data.map((d) => Number(d[valueKey]));
  const max  = Math.max(...vals) * 1.12 || 1;
  const innerW = W - padX * 2;
  const innerH = H - padT - padB;
  const x = (i: number) => padX + (innerW * i) / (data.length - 1);
  const y = (v: number) => padT + innerH - (v / max) * innerH;
  const pts: [number, number][] = data.map((d, i) => [x(i), y(Number(d[valueKey]))]);
  const line = smoothLine(pts);
  const area = `${line} L ${x(data.length - 1)} ${padT + innerH} L ${x(0)} ${padT + innerH} Z`;
  const grid = [0.25, 0.5, 0.75, 1].map((g) => padT + innerH - g * innerH);
  const ticks = data.map((_, i) => i).filter((i) => i % Math.ceil(data.length / 6) === 0);

  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const onMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const r  = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0, bd = Infinity;
    pts.forEach((p, i) => { const dd = Math.abs(p[0] - px); if (dd < bd) { bd = dd; best = i; } });
    setHover(best);
  };

  if (data.length < 2) {
    return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>Sin datos de historial aún</div>;
  }

  return (
    <div className="chart-wrap">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="area-svg"
           onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={accent} stopOpacity="0.42" />
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
            <line x1={pts[hover][0]} x2={pts[hover][0]} y1={padT} y2={padT + innerH}
                  stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <circle cx={pts[hover][0]} cy={pts[hover][1]} r="4.5"
                    fill="var(--accent)" stroke="var(--panel)" strokeWidth="2" />
          </g>
        )}
      </svg>
      <div className="chart-xaxis">
        {ticks.map((i) => (
          <span key={i} style={{ left: `${(i / (data.length - 1)) * 100}%` }}>
            {fmtDateShort(String(data[i].date))}
          </span>
        ))}
      </div>
      {hover != null && (
        <div className="chart-tip" style={{ left: `${(hover / (data.length - 1)) * 100}%` }}>
          <strong>{fmtGB1(Number(data[hover][valueKey]))}</strong>
          <span>{fmtDateShort(String(data[hover].date))}</span>
        </div>
      )}
    </div>
  );
}
