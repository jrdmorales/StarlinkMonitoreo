import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../ui/Icons';
import { useObras } from '../../hooks/useObras';
import { useTheme } from '../../hooks/useTheme';

interface Props { title: string }

export default function Topbar({ title }: Props) {
  const navigate = useNavigate();
  const { data } = useObras();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const timeLabel = now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

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
        <div className="topbar-clock">
          <Icons.clock size={15} />
          {timeLabel}
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
