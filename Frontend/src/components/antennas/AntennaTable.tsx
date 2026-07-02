import { useState, useMemo } from 'react';
import { Icons } from '../ui/Icons';
import UsageBar from '../ui/UsageBar';
import { STATUS_CONFIG } from '../../lib/constants';
import { fmtGB, fmtGB1, fmtPct } from '../../lib/formatters';
import type { AntennaDto } from '../../types/index';

interface Props {
  antennas:  AntennaDto[];
  onSelect:  (a: AntennaDto) => void;
  selected:  string | null;
  showObraColumn?: boolean;
}

type SortKey = 'code' | 'usagePct' | 'consumed' | 'daysLeft';
interface SortState { key: SortKey; dir: 1 | -1 }

export default function AntennaTable({ antennas, onSelect, selected, showObraColumn }: Props) {
  const [sort, setSort]   = useState<SortState>({ key: 'usagePct', dir: -1 });
  const [filter, setFilter] = useState<'all' | 'risk' | 'warn' | 'ok'>('all');

  const rows = useMemo(() => {
    let r = filter === 'all' ? antennas : antennas.filter((a) => a.status === filter);
    return [...r].sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key];
      if (typeof av === 'string') return av.localeCompare(bv as string) * sort.dir;
      return ((av as number) - (bv as number)) * sort.dir;
    });
  }, [antennas, sort, filter]);

  function th(key: SortKey, label: string, align?: 'r') {
    return (
      <th className={align === 'r' ? 'r' : ''} onClick={() => setSort((s) => ({ key, dir: s.key === key ? (-s.dir as 1 | -1) : -1 }))}>
        <span className="th-in">{label}<Icons.sort size={13} stroke={sort.key === key ? 'var(--accent)' : 'var(--muted)'} /></span>
      </th>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Antenas ({rows.length})</h3>
        <div className="seg sm">
          {(['all', 'risk', 'warn', 'ok'] as const).map((v) => (
            <button key={v} className={'seg-btn' + (filter === v ? ' on' : '')} onClick={() => setFilter(v)}>
              {v === 'all' ? 'Todas' : v === 'risk' ? 'Riesgo' : v === 'warn' ? 'Adv.' : 'OK'}
            </button>
          ))}
        </div>
      </div>
      <div className="table-scroll table-scroll-y">
        <table className="atable">
          <thead>
            <tr>
              {th('code',     'Antena')}
              {showObraColumn && <th className="static">Obra</th>}
              {th('usagePct', '% Uso')}
              <th>Uso vs. límite</th>
              {th('consumed',  'Consumo', 'r')}
              {th('daysLeft',  'Días rest.', 'r')}
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const st = STATUS_CONFIG[a.status];
              return (
                <tr key={a.code} className={selected === a.code ? 'sel' : ''} onClick={() => onSelect(a)}>
                  <td>
                    <div className="cell-code mono">{a.code}</div>
                    <div className="cell-name">{a.name}</div>
                  </td>
                  {showObraColumn && <td style={{ fontSize: 13, fontWeight: 700 }}>{a.obraLabel}</td>}
                  <td><span className="mono" style={{ color: st.color, fontWeight: 700 }}>{fmtPct(a.usagePct)}</span></td>
                  <td className="usage-cell"><UsageBar pct={a.usagePct} status={a.status} /></td>
                  <td className="r mono">{fmtGB1(a.consumed)}<span className="cell-dim"> / {fmtGB(a.limitGb)}</span></td>
                  <td className="r"><span className="days" data-low={a.daysLeft <= 7}>{a.daysLeft} d</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
