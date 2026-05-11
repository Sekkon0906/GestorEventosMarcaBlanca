import { Link } from 'react-router-dom';
import { useState } from 'react';

const PLANS = [
  {
    name: 'Free',
    tagline: 'Todo lo esencial para operar eventos. Sin límite artificial.',
    price: { monthly: 0, annual: 0 },
    cta: { label: 'Empezar gratis', to: '/register', primary: true },
    features: [
      'Eventos ilimitados',
      'Página pública por evento',
      'QR de check-in / check-out',
      'Recordatorios por email',
      'Gamificación (puntos, badges, ranking)',
      'API REST + webhooks',
      'Pasarela BRE-B (tu llave o QR)',
      'Inscripciones e invitaciones',
    ],
  },
  {
    name: 'Pro',
    tagline: 'Comodidad, branding y un agente IA que arma tus eventos por ti.',
    price: { monthly: 29, annual: 19 },
    highlight: true,
    cta: { label: 'Probar Pro', to: '/register?plan=pro' },
    features: [
      'Todo lo del plan gratis',
      'Agente IA que crea bloques iniciales según contexto',
      'Personalización de colores y tipografía',
      'White-label: tu logo en lugar de GESTEK',
      'Analytics avanzados',
      'Soporte prioritario',
      'Dominio personalizado',
      'Multi-usuario',
    ],
  },
];

export default function PlanesPage() {
  const [annual, setAnnual] = useState(false);
  return (
    <section className="px-5 sm:px-8 py-12 max-w-5xl mx-auto">
      <header className="text-center mb-12 max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-primary-light font-semibold mb-3">Planes</p>
        <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-text-1 mb-4">
          Empieza gratis. Sube a Pro cuando quieras.
        </h1>
        <p className="text-base text-text-2">
          Lo principal va siempre en el plan gratis. Pro existe para hacer tu vida más fácil, no para
          desbloquear lo básico.
        </p>

        <div className="inline-flex items-center gap-1 mt-8 p-1 rounded-full border border-border bg-surface/60">
          <button
            onClick={() => setAnnual(false)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${!annual ? 'bg-text-1 text-bg' : 'text-text-2'}`}
          >
            Mensual
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 ${annual ? 'bg-text-1 text-bg' : 'text-text-2'}`}
          >
            Anual <span className="text-[10px] text-success">−35%</span>
          </button>
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-5">
        {PLANS.map(p => {
          const price = p.price[annual ? 'annual' : 'monthly'];
          return (
            <div
              key={p.name}
              className={`relative rounded-3xl p-7 sm:p-8 flex flex-col ${p.highlight
                ? 'border border-primary/40 bg-surface/80 shadow-[0_0_60px_rgba(59,130,246,0.12)]'
                : 'border border-border bg-surface/40'}`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-semibold tracking-widest uppercase bg-primary text-white">
                  Recomendado
                </span>
              )}
              <h3 className="text-2xl font-bold font-display text-text-1">{p.name}</h3>
              <p className="text-sm text-text-2 mt-2 mb-6 leading-relaxed">{p.tagline}</p>
              <div className="flex items-end gap-1.5 mb-6">
                <span className="text-4xl font-bold font-display text-text-1">
                  {price === 0 ? 'Gratis' : `$${price}`}
                </span>
                {price > 0 && <span className="text-sm text-text-3 mb-1.5">USD/mes</span>}
              </div>
              <ul className="space-y-2.5 flex-1 mb-8">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-text-1">
                    <svg className="w-4 h-4 mt-0.5 text-primary-light flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to={p.cta.to}
                className={`w-full text-center py-3 rounded-full text-sm font-semibold transition-all ${
                  p.cta.primary || p.highlight
                    ? 'bg-text-1 text-bg hover:bg-white'
                    : 'border border-border-2 text-text-1 hover:bg-surface-2'
                }`}
              >
                {p.cta.label}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
