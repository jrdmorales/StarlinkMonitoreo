import { smoothLine } from './chartUtils';
import type { HistoryPoint } from '../../types/index';

interface Props {
  data:     HistoryPoint[];
  valueKey?: keyof HistoryPoint;
  accent?:  string;
  w?:       number;
  h?:       number;
}

export default function Sparkline({ data, valueKey = 'cumulative', accent = 'var(--accent)', w = 96, h = 30 }: Props) {
  if (data.length < 2) return <svg width={w} height={h} />;

  const vals = data.map((d) => Number(d[valueKey]));
  const max  = Math.max(...vals) || 1;
  const min  = Math.min(...vals);
  const x    = (i: number) => (w * i) / (data.length - 1);
  const y    = (v: number) => h - 3 - ((v - min) / (max - min || 1)) * (h - 6);
  const pts: [number, number][] = data.map((d, i) => [x(i), y(Number(d[valueKey]))]);
  const line = smoothLine(pts);

  return (
    <svg width={w} height={h} className="spark">
      <path d={`${line} L ${w} ${h} L 0 ${h} Z`} fill={accent} opacity="0.12" />
      <path d={line} fill="none" stroke={accent} strokeWidth="1.6" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.2" fill={accent} />
    </svg>
  );
}
