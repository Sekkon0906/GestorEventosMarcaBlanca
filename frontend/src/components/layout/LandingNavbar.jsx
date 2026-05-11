import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import GestekLogo from '../brand/GestekLogo.jsx';

const PRODUCT_LINKS = [
  { icon: '📅', label: 'Creación de eventos', desc: 'Presencial, virtual e híbrido', hash: 'funciones' },
  { icon: '👥', label: 'Gestión de asistentes', desc: 'Inscripciones, tickets y aprobación', hash: 'funciones' },
  { icon: '📊', label: 'Analytics en tiempo real', desc: 'Métricas y conversión instantáneas', hash: 'funciones' },
  { icon: '🏆', label: 'Gamificación', desc: 'Puntos, badges y leaderboard', hash: 'gamificacion' },
  { icon: '🎨', label: 'White-label total', desc: 'Tu marca, tu dominio, tu estética', hash: 'funciones' },
];

export default function LandingNavbar() {
  const { token } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdown(false);
  }, [location.pathname]);

  const isHome = location.pathname === '/';

  const navTo = (hash) => {
    if (isHome) {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return isHome ? '#' : `/#${hash}`;
  };

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled || mobileOpen
        ? 'bg-bg/90 backdrop-blur-xl border-b border-border shadow-lg shadow-black/30'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* ── Logo ── */}
        <Link to="/" className="flex-shrink-0">
          <GestekLogo size={38} showText tagline />
        </Link>

        {/* ── Nav links (desktop) ── */}
        <div className="hidden lg:flex items-center gap-1">

          <Link
            to="/"
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              location.pathname === '/'
                ? 'text-text-primary bg-surface-2/60'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-2/50'
            }`}
          >
            Inicio
          </Link>

          {/* Dropdown "Producto" */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdown(v => !v)}
              className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                dropdown
                  ? 'text-text-primary bg-surface-2/60'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-2/50'
              }`}
            >
              Producto
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdown ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {dropdown && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-surface border border-border rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
                <div className="p-2">
                  {PRODUCT_LINKS.map(item => (
                    <Link
                      key={item.label}
                      to={isHome ? '#' : `/#${item.hash}`}
                      onClick={() => {
                        setDropdown(false);
                        if (isHome) {
                          setTimeout(() => {
                            document.getElementById(item.hash)?.scrollIntoView({ behavior: 'smooth' });
                          }, 50);
                        }
                      }}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-2 transition-colors group"
                    >
                      <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-text-primary group-hover:text-white">{item.label}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{item.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="px-4 py-3 bg-surface-2/50 border-t border-border">
                  <Link
                    to="/"
                    onClick={() => {
                      setDropdown(false);
                      if (isHome) setTimeout(() => document.getElementById('funciones')?.scrollIntoView({ behavior: 'smooth' }), 50);
                    }}
                    className="text-xs text-primary hover:text-blue-400 font-medium transition-colors"
                  >
                    Ver todas las funciones →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            to="/planes"
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              location.pathname === '/planes'
                ? 'text-text-primary bg-surface-2/60'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-2/50'
            }`}
          >
            Planes
          </Link>

          <Link
            to={isHome ? '#' : '/#faq'}
            onClick={() => {
              if (isHome) {
                document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2/50 rounded-lg transition-colors"
          >
            FAQ
          </Link>
        </div>

        {/* ── Acciones derechas ── */}
        <div className="hidden lg:flex items-center gap-3">
          {token ? (
            <Link to="/dashboard" className="btn-primary text-sm px-5 py-2 group">
              Ir al panel
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm px-4 py-2 text-text-secondary hover:text-text-primary">
                Iniciar sesión
              </Link>
              <Link to="/login" className="btn-primary text-sm px-5 py-2 group">
                Acceder gratis
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </>
          )}
        </div>

        {/* ── Hamburger (mobile) ── */}
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="lg:hidden bg-bg/95 backdrop-blur-xl border-b border-border">
          <div className="px-4 py-4 space-y-1">
            <Link to="/" className="flex px-3 py-2.5 rounded-lg text-sm font-medium text-text-primary hover:bg-surface-2 transition-colors">
              Inicio
            </Link>
            <div className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">Producto</div>
            {PRODUCT_LINKS.map(item => (
              <Link
                key={item.label}
                to={isHome ? '#' : `/#${item.hash}`}
                onClick={() => {
                  setMobileOpen(false);
                  if (isHome) setTimeout(() => document.getElementById(item.hash)?.scrollIntoView({ behavior: 'smooth' }), 50);
                }}
                className="flex items-center gap-3 pl-5 pr-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <Link to="/planes" className="flex px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors">
              Planes
            </Link>
            <Link
              to={isHome ? '#' : '/#faq'}
              onClick={() => { setMobileOpen(false); if (isHome) setTimeout(() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }), 50); }}
              className="flex px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
            >
              FAQ
            </Link>
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              {token ? (
                <Link to="/dashboard" className="btn-primary text-sm">Ir al panel</Link>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary text-sm">Iniciar sesión</Link>
                  <Link to="/login" className="btn-primary text-sm">Acceder gratis</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
