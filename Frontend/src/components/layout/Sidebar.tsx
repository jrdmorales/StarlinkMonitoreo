import { useNavigate, useLocation } from 'react-router-dom';
import { Icons } from '../ui/Icons';
import { token } from '../../api/client';

const NAV_ITEMS = [
  { id: 'grid',   icon: Icons.grid,   path: '/' },
  { id: 'alert',  icon: Icons.alert,  path: '/alerts' },
  { id: 'book',   icon: Icons.book,   path: '/faq' },
  { id: 'shield', icon: Icons.shield, path: '/admin', authOnly: true },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin  = !!token.get();

  return (
    <aside className="sidebar">
      <div className="logo"><Icons.sat size={22} stroke="#fff" /></div>
      <nav className="nav">
        {NAV_ITEMS
          .filter((item) => !item.authOnly || isAdmin)
          .map((item) => (
            <button
              key={item.id}
              className={'nav-btn' + (location.pathname === item.path ? ' active' : '')}
              aria-label={item.id}
              onClick={() => navigate(item.path)}
            >
              <item.icon size={20} />
            </button>
          ))}
      </nav>
      {isAdmin && (
        <button
          className="nav-btn logout"
          aria-label="salir"
          onClick={() => { token.clear(); navigate('/login'); }}
        >
          <Icons.logout size={20} />
        </button>
      )}
    </aside>
  );
}
