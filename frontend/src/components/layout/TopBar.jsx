import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { RolBadge } from '../ui/Badge.jsx';

const CRUMBS = {
  '/dashboard'    : [{ label: 'Dashboard' }],
  '/eventos'      : [{ label: 'Eventos' }],
  '/eventos/nuevo': [{ to: '/eventos', label: 'Eventos' }, { label: 'Nuevo evento' }],
  '/usuarios'     : [{ label: 'Usuarios' }],
  '/configuracion': [{ label: 'Configuración' }],
};

const MOCK_NOTIFS = [
  { id: 1, text: 'Tu evento "Tech Summit" fue publicado.',     time: 'hace 2m',  read: false },
  { id: 2, text: 'Nuevo asistente en "UX Workshop".',         time: 'hace 15m', read: false },
  { id: 3, text: 'Recordatorio: evento en 24h.',              time: 'hace 1h',  read: true  },
];

export default function TopBar() {
  const { pathname }  = useLocation();
  const { usuario }   = useAuth();
  const navigate      = useNavigate();
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [notifs,      setNotifs]      = useState(MOCK_NOTIFS);

  const crumbs  = CRUMBS[pathname] || (pathname.startsWith('/eventos/') ? [{ to: '/eventos', label: 'Eventos' }, { label: 'Detalle' }] : [{ label: 'GESTEK' }]);
  const unread  = notifs.filter(n => !n.read).length;

  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })));

  return (
    <header className="h-14 flex-shrink-0 bg-surface border-b border-border flex items-center gap-4 px-6 relative z-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronIcon className="w-3 h-3 text-text-3 flex-shrink-0" />}
            {c.to
              ? <Link to={c.to} className="text-text-2 hover:text-text-1 transition-colors truncate">{c.label}</Link>
              : <span className="text-text-1 font-medium truncate">{c.label}</span>
            }
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Quick create */}
        <Link to="/eventos/nuevo" className="btn-primary btn-sm hidden sm:inline-flex">
          <PlusIcon className="w-3.5 h-3.5" />
          Nuevo evento
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="btn-icon btn-ghost relative"
          >
            <BellIcon className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full shadow-glow-sm" />
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-11 z-20 w-80 card-glass rounded-2xl overflow-hidden animate-[scaleIn_0.15s_ease_both] origin-top-right">
                <div className="card-header">
                  <h3 className="text-sm font-semibold text-text-1">Notificaciones</h3>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                      Marcar todas como leídas
                    </button>
                  )}
                </div>
                <div className="divide-y divide-border max-h-72 overflow-y-auto no-scrollbar">
                  {notifs.map(n => (
                    <div key={n.id} className={`px-4 py-3 ${n.read ? 'opacity-60' : ''}`}>
                      <div className="flex items-start gap-2.5">
                        {!n.read && <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />}
                        <div className={`flex-1 ${n.read ? 'pl-4' : ''}`}>
                          <p className="text-xs text-text-1 leading-relaxed">{n.text}</p>
                          <p className="text-[10px] text-text-3 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {notifs.length === 0 && (
                  <p className="text-xs text-text-2 text-center py-8">Sin notificaciones</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Role badge */}
        <RolBadge rol={usuario?.rol} />
      </div>
    </header>
  );
}

function BellIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
}
function PlusIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function ChevronIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
}
