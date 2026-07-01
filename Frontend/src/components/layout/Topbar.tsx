import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../ui/Icons';
import { useObras } from '../../hooks/useObras';
import { useTheme } from '../../hooks/useTheme';

interface Props { title: string; onBack?: () => void }

export default function Topbar({ title, onBack }: Props) {
  const navigate = useNavigate();
  const { data } = useObras();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');

  const lastUpdatedLabel = useMemo(() => {
    if (!data?.lastUpdated) return 'Sin datos';
    const d = new Date(data.lastUpdated);
    const time = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    const isToday = d.toDateString() === new Date().toDateString();
    const dateStr = isToday ? 'hoy' : d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
    return `${time} · ${dateStr}`;
  }, [data?.lastUpdated]);

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q || !data) return;

    const obraMatch = data.obras.find(
      (o) => o.key.toLowerCase().includes(q) || o.label.toLowerCase().includes(q),
    );
    if (obraMatch) {
      navigate(`/obras/${obraMatch.key}`);
      setQuery('');
      return;
    }

    const antennaMatch = data.obras.flatMap((o) => o.antennas).find((a) => a.code.includes(q));
    if (antennaMatch) {
      navigate(`/antenas?code=${antennaMatch.code}`);
      setQuery('');
    }
  }

  return (
    <div className="topbar-new">
      <div className="topbar-crumb">
        {onBack && (
          <button type="button" className="topbar-back-btn" aria-label="Volver" title="Volver" onClick={onBack}>
            <Icons.back size={15} />
          </button>
        )}
        <span>Starlink Obras</span>
        <Icons.chevron size={13} />
        <strong>{title}</strong>
      </div>
      <div className="topbar-tools">
        <form className="topbar-search" onSubmit={onSearchSubmit}>
          <Icons.search size={16} stroke="var(--dim)" />
          <input
            placeholder="Buscar obra o antena…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
        <div className="topbar-clock" title="Última actualización de datos">
          <Icons.clock size={15} />
          {lastUpdatedLabel}
        </div>
        <button
          type="button"
          className="topbar-icon-btn"
          aria-label="Cambiar tema"
          onClick={toggleTheme}
        >
          {theme === 'light' ? <Icons.sun size={17} /> : <Icons.moon size={17} />}
        </button>
      </div>
    </div>
  );
}
