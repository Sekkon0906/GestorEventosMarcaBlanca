import { Link } from 'react-router-dom';
import LandingNavbar from '../components/layout/LandingNavbar.jsx';
import LandingFooter from '../components/layout/LandingFooter.jsx';
import GestekLogo from '../components/brand/GestekLogo.jsx';

// ════════════════════════════════════════════════════════════
//  Datos
// ════════════════════════════════════════════════════════════
const PLANS = [
  {
    name: 'Gratis',
    price: '$0',
    period: '/ siempre',
    tagline: 'Para empezar a explorar la plataforma',
    color: 'border-border',
    glow: '',
    badge: null,
    features: [
      { text: 'Hasta 3 eventos activos', included: true },
      { text: 'Hasta 100 asistentes por evento', included: true },
      { text: 'Gestión básica de inscripciones', included: true },
      { text: 'Tickets gratuitos ilimitados', included: true },
      { text: 'Analytics básicos', included: true },
      { text: 'Soporte por email', included: true },
      { text: 'Tickets de pago', included: false },
      { text: 'Gamificación completa', included: false },
      { text: 'White-label y dominio propio', included: false },
      { text: 'API + webhooks', included: false },
    ],
    cta: 'Crear cuenta gratis',
    ctaLink: '/login',
    ctaStyle: 'bg-surface-2 hover:bg-border text-text-primary border border-border',
    highlight: false,
  },
  {
    name: 'Premium',
    price: '$29',
    period: '/ mes',
    tagline: 'Para profesionales y empresas en crecimiento',
    color: 'border-primary',
    glow: 'shadow-glow',
    badge: 'Más popular',
    features: [
      { text: 'Eventos y asistentes ilimitados', included: true },
      { text: 'Gestión avanzada de inscripciones', included: true },
      { text: 'Tickets pagos + códigos de descuento', included: true },
      { text: 'Analytics avanzados en tiempo real', included: true },
      { text: 'Soporte prioritario 24/7', included: true },
      { text: 'Tickets de pago (Stripe, MercadoPago)', included: true },
      { text: 'Gamificación completa con leaderboard', included: true },
      { text: 'White-label total (marca y dominio)', included: true },
      { text: 'Notificaciones push y email', included: true },
      { text: 'API completa + webhooks', included: true },
    ],
    cta: 'Empezar gratis — actualizar después',
    ctaLink: '/login',
    ctaStyle: 'bg-primary hover:bg-primary-hover text-white',
    highlight: true,
  },
];

const COMPARISON_ROWS = [
  { feature: 'Eventos activos', free: '3', premium: 'Ilimitados' },
  { feature: 'Asistentes por evento', free: '100', premium: 'Ilimitados' },
  { feature: 'Tickets gratuitos', free: true, premium: true },
  { feature: 'Tickets de pago', free: false, premium: true },
  { feature: 'Códigos de descuento', free: false, premium: true },
  { feature: 'Gamificación', free: false, premium: true },
  { feature: 'Analytics avanzados', free: false, premium: true },
  { feature: 'White-label y dominio propio', free: false, premium: true },
  { feature: 'Notificaciones push', free: false, premium: true },
  { feature: 'API + webhooks', free: false, premium: true },
  { feature: 'Soporte', free: 'Email', premium: 'Prioritario 24/7' },
];

const FAQ_PLANES = [
  {
    q: '¿Necesito tarjeta de crédito para registrarme?',
    a: 'No. Puedes crear tu cuenta y empezar a usar GESTEK completamente gratis. Solo pedimos método de pago cuando decides activar el plan Premium.',
  },
  {
    q: '¿Cómo actualizo al plan Premium?',
    a: 'Desde tu panel de control, en la sección Configuración > Plan, podrás activar el Premium en cualquier momento. Todos tus datos y eventos se conservan.',
  },
  {
    q: '¿Puedo cancelar el Premium cuando quiera?',
    a: 'Sí. No hay permanencia. Puedes cancelar en cualquier momento y volverás automáticamente al plan Gratis sin perder tus datos históricos.',
  },
  {
    q: '¿Hay descuento por pago anual?',
    a: 'Próximamente. Estamos preparando un plan anual con descuento del 20%. Por ahora el plan Premium se cobra mensualmente a $29/mes.',
  },
];

function CheckIcon({ included }) {
  if (included === true) {
    return (
      <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    );
  }
  if (included === false) {
    return (
      <svg className="w-5 h-5 text-border flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    );
  }
  return null;
}

// ════════════════════════════════════════════════════════════
//  Página Planes
// ════════════════════════════════════════════════════════════
export default function PlanesPage() {
  return (
    <div className="min-h-screen bg-bg text-text-primary overflow-x-hidden">
      <LandingNavbar />

      {/* ════════════════════════════════════════════════════
          HERO PLANES
      ════════════════════════════════════════════════════ */}
      <section className="relative pt-36 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute inset-0 bg-radial-glow" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-10 right-1/4 w-80 h-80 bg-primary/15 rounded-full blur-3xl animate-blob animation-delay-400" />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">Planes y precios</span>
          <h1 className="text-5xl sm:text-6xl font-extrabold font-head leading-tight mt-4 mb-5">
            Empieza gratis,{' '}
            <span className="text-gradient">crece sin límites</span>
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary max-w-xl mx-auto mb-4 leading-relaxed">
            Al registrarte siempre comienzas en el plan Gratis.
            Activa Premium desde tu panel cuando lo necesites.
          </p>
          <p className="text-sm text-text-secondary/70">Sin contratos. Sin sorpresas. Cancela cuando quieras.</p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          TARJETAS DE PLANES
      ════════════════════════════════════════════════════ */}
      <section className="relative py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`relative card p-8 border-2 ${plan.color} ${plan.glow} lift ${
                  plan.highlight ? 'sm:scale-105' : ''
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-white text-xs font-bold uppercase tracking-wide shadow-lg">
                    {plan.badge}
                  </span>
                )}

                <div className="mb-6">
                  <h2 className="text-2xl font-bold font-head mb-1">{plan.name}</h2>
                  <p className="text-sm text-text-secondary">{plan.tagline}</p>
                </div>

                <div className="mb-8 flex items-baseline gap-1.5">
                  <span className="text-5xl font-extrabold font-head text-text-primary">{plan.price}</span>
                  <span className="text-text-secondary text-sm">{plan.period}</span>
                </div>

                <Link
                  to={plan.ctaLink}
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all mb-8 ${plan.ctaStyle} ${
                    plan.highlight ? 'glow-primary' : ''
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="space-y-3">
                  {plan.features.map(f => (
                    <li key={f.text} className="flex items-center gap-3 text-sm">
                      <CheckIcon included={f.included} />
                      <span className={f.included ? 'text-text-secondary' : 'text-text-secondary/40 line-through'}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-text-secondary mt-8">
            💡 El plan Premium se activa desde el dashboard. Al registrarte, accedes automáticamente al plan Gratis.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          TABLA COMPARATIVA
      ════════════════════════════════════════════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-head">
              Comparación <span className="text-gradient">detallada</span>
            </h2>
            <p className="text-text-secondary mt-3">Todo lo que incluye cada plan, sin letra pequeña.</p>
          </div>

          <div className="card overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 bg-surface-2/50 border-b border-border">
              <div className="px-6 py-4 text-sm font-semibold text-text-secondary">Función</div>
              <div className="px-6 py-4 text-sm font-semibold text-text-primary text-center">Gratis</div>
              <div className="px-6 py-4 text-sm font-semibold text-primary text-center">Premium</div>
            </div>

            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 border-b border-border last:border-0 ${
                  i % 2 === 0 ? '' : 'bg-surface-2/20'
                }`}
              >
                <div className="px-6 py-3.5 text-sm text-text-secondary">{row.feature}</div>
                <div className="px-6 py-3.5 text-sm text-center flex items-center justify-center">
                  {typeof row.free === 'boolean' ? (
                    <CheckIcon included={row.free} />
                  ) : (
                    <span className="text-text-secondary text-xs">{row.free}</span>
                  )}
                </div>
                <div className="px-6 py-3.5 text-sm text-center flex items-center justify-center">
                  {typeof row.premium === 'boolean' ? (
                    <CheckIcon included={row.premium} />
                  ) : (
                    <span className="text-primary text-xs font-medium">{row.premium}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          FAQ PLANES
      ════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-surface/30 border-y border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase">Preguntas frecuentes</span>
            <h2 className="text-3xl sm:text-4xl font-bold font-head mt-3">
              Sobre los <span className="text-gradient">planes</span>
            </h2>
          </div>

          <div className="space-y-4">
            {FAQ_PLANES.map((item, i) => (
              <div key={i} className="card p-6">
                <h3 className="font-semibold font-head text-text-primary mb-2">{item.q}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          CTA FINAL
      ════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <GestekLogo size={56} className="animate-float" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-head mb-4">
            Comienza con el plan <span className="text-gradient">Gratis hoy</span>
          </h2>
          <p className="text-text-secondary mb-8">
            Sin tarjeta de crédito. Sin compromiso. Actualiza cuando crezcas.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login" className="btn-primary px-8 py-3.5 text-base glow-primary">
              Crear cuenta gratis
            </Link>
            <Link to="/" className="btn-secondary px-8 py-3.5 text-base">
              Ver funciones
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
