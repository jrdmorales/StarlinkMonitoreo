import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../ui/Icons';
import StatusBadge from '../ui/StatusBadge';
import UsageBar from '../ui/UsageBar';
import Sparkline from '../charts/Sparkline';
import { STATUS_CONFIG } from '../../lib/constants';
import { fmtGB, fmtPct } from '../../lib/formatters';
import type { ObraDto } from '../../types/index';

interface SortState { key: keyof ObraDto; dir: 1 | -1 }

interface Props { obras: ObraDto[] }

export default function ObraTable({ obras }: Props) {
  const navigate = useNavigate();
  const [sort, setSort] = useState<SortState>({ key: 'usagePct', dir: -1 });

  const rows = useMemo(() => {
    return [...obras].sort((a, b) => {
      const av = a[sort.key] as number | string;
      const bv = b[sort.key] as number | string;
      if (typeof av === 'string') return (av as string).localeCompare(bv as string) * sort.dir;
      return ((av as number) - (bv as number)) * sort.dir;
    });
  }, [obras, sort]);

  function th(key: keyof ObraDto, label: string, align?: 'r') {
    return (
      <th className={align === 'r' ? 'r' : ''} onClick={() => setSort((s) => ({ key, dir: s.key === key ? (-s.dir as 1 | -1) : -1 }))}>
        <span className="th-in">{label}<Icons.sort size={13} stroke={sort.key === key ? 'var(--accent)' : 'var(--muted)'} /></span>
      </th>
    );
  }

  // Genera datos de tendencia para sparkline desde las antenas de la obra
  function sparkData(obra: ObraDto) {
    if (!obra.antennas.length) return [];
    // Proxy: usamos usagePct de cada antena como mini sparkline de estado
    return obra.antennas.map((a, i) => ({ date: String(i), daily: 0, cumulative: a.usagePct }));
  }

  return (
    <div className="table-scroll">
      <table className="atable obra-table">
        <thead>
          <tr>
            {th('label',       'Obra')}
            {th('antennaCount','Antenas', 'r')}
            {th('usagePct',    '% Uso')}
            <th>Uso vs. límite</th>
            {th('consumed',    'Consumo', 'r')}
            {th('minDaysLeft', 'Días rest.', 'r')}
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => {
            const st = STATUS_CONFIG[o.status];
            return (
              <tr key={o.key} onClick={() => navigate(`/obras/${o.key}`)}>
                <td>
                  <div className="cell-code">{o.label}</div>
                  <div className="cell-name">{o.key}</div>
                </td>
                <td className="r mono">{o.antennaCount}</td>
                <td><span className="mono" style={{ color: st.color, fontWeight: 700 }}>{fmtPct(o.usagePct)}</span></td>
                <td className="usage-cell"><UsageBar pct={o.usagePct} status={o.status} /></td>
                <td className="r mono">{fmtGB(o.consumed)}<span className="cell-dim"> / {fmtGB(o.limitGb)}</span></td>
                <td className="r"><span className="days" data-low={o.minDaysLeft <= 7}>{o.minDaysLeft} d</span></td>
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
