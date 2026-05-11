import { Link } from 'react-router-dom';
import GestekLogo from '../brand/GestekLogo.jsx';

export default function LandingFooter() {
  return (
    <footer className="border-t border-border py-12 px-6 bg-surface/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-2">
            <GestekLogo size={36} showText tagline />
            <p className="text-xs text-text-secondary mt-3 max-w-xs leading-relaxed">
              Manage. Automate. Scale.<br />
              La plataforma white-label para gestión integral de eventos presenciales, virtuales e híbridos.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">Plataforma</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Inicio', to: '/' },
                { label: 'Funciones', to: '/#funciones' },
                { label: 'Gamificación', to: '/#gamificacion' },
                { label: 'Planes', to: '/planes' },
                { label: 'FAQ', to: '/#faq' },
              ].map(l => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">Cuenta</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Iniciar sesión', to: '/login' },
                { label: 'Crear cuenta gratis', to: '/login' },
                { label: 'Panel de control', to: '/dashboard' },
              ].map(l => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-secondary">
          <p>GestorEventosMarcaBlanca &copy; {new Date().getFullYear()} — Todos los derechos reservados.</p>
          <p>Hecho con <span className="text-pink-400">♥</span> para organizadores de eventos.</p>
        </div>
      </div>
    </footer>
  );
}
