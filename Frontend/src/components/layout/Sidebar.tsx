import { useNavigate, useLocation } from 'react-router-dom';
import { Icons } from '../ui/Icons';
import { token, getTokenPayload } from '../../api/client';
import { useObras } from '../../hooks/useObras';

const MENU_ITEMS = [
  { label: 'Resumen', icon: Icons.grid,  path: '/' },
  { label: 'Obras',    icon: Icons.box,   path: '/obras' },
  { label: 'Antenas',  icon: Icons.sat,   path: '/antenas' },
  { label: 'Consumo',  icon: Icons.chart, path: '/consumo' },
  { label: 'Alertas',  icon: Icons.alert, path: '/alerts' },
];

const GENERAL_ITEMS = [
  { label: 'Ajustes', icon: Icons.settings, path: '/ajustes' },
];

export default function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = getTokenPayload();
  const isAdmin   = user?.role === 'admin';
  const { data }  = useObras();
  const alertCount = data ? data.kpis.riskCount + data.kpis.warnCount : 0;

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '··';

  function NavButton({ label, icon: I, path, count }: { label: string; icon: typeof Icons.grid; path: string; count?: number }) {
    return (
      <button
        type="button"
        className={'nav-btn' + (location.pathname === path ? ' active' : '')}
        onClick={() => navigate(path)}
      >
        <I size={18} />
        <span>{label}</span>
        {!!count && <span className="nav-count">{count}</span>}
      </button>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo"><Icons.sat size={19} stroke="#fff" /></div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-title">Starlink Obras</div>
          <div className="sidebar-brand-sub">Monitor de red</div>
        </div>
      </div>

      <div className="sidebar-section-label">Menú</div>
      <nav className="nav">
        {MENU_ITEMS.map((item) => (
          <NavButton key={item.path} {...item} count={item.path === '/antenas' ? alertCount : undefined} />
        ))}
      </nav>

      <div className="sidebar-section-label">General</div>
      <nav className="nav">
        {GENERAL_ITEMS.map((item) => (
          <NavButton key={item.path} {...item} />
        ))}
        <NavButton label="FAQ" icon={Icons.book} path="/faq" />
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user-ava">{initials}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.email ?? 'Invitado'}</div>
          <div className="sidebar-user-role">{user?.role === 'admin' ? 'Administrador' : isAdmin ? 'Sesión activa' : 'Solo lectura'}</div>
        </div>
        {isAdmin && (
          <button
            type="button"
            className="sidebar-user-logout"
            aria-label="Cerrar sesión"
            onClick={() => { token.clear(); navigate('/login'); }}
          >
            <Icons.logout size={17} />
          </button>
        )}
      </div>
    </aside>
  );
}
