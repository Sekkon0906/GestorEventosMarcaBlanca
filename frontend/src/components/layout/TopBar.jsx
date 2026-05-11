import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const TITLES = {
  '/dashboard'    : 'Dashboard',
  '/eventos'      : 'Eventos',
  '/eventos/nuevo': 'Crear Evento',
  '/usuarios'     : 'Usuarios',
  '/configuracion': 'Configuración',
};

export default function TopBar() {
  const { pathname } = useLocation();
  const { usuario }  = useAuth();

  const title = TITLES[pathname] || (pathname.startsWith('/eventos/') ? 'Detalle del Evento' : 'GESTEK');

  return (
    <header className="h-14 flex-shrink-0 bg-surface border-b border-border flex items-center justify-between px-6">
      <h1 className="text-base font-semibold text-text-primary">{title}</h1>

      <div className="flex items-center gap-3">
        <span className={`badge ${roleBadge(usuario?.rol)}`}>
          {roleLabel(usuario?.rol)}
        </span>
      </div>
    </header>
  );
}

function roleBadge(rol) {
  if (rol === 'admin_global') return 'badge-purple';
  if (rol === 'organizador')  return 'badge-blue';
  return 'badge-gray';
}

function roleLabel(rol) {
  if (rol === 'admin_global') return 'Admin';
  if (rol === 'organizador')  return 'Organizador';
  return 'Asistente';
}
