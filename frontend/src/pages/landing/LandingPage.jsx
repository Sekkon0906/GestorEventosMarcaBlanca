import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* ── Scroll-reveal hook ─────────────────────────────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ── Main page ──────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text-1 overflow-x-hidden">
      <Navbar />
      <Hero />
      <LogoStrip />
      <WhatIsGestek />
      <Features />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ── Navbar ─────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { label: 'Inicio',        href: '#hero'     },
    { label: 'Qué es GESTEK', href: '#que-es'   },
    { label: 'Planes',        href: '#planes'   },
  ];

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-surface/80 backdrop-blur-xl border-b border-border shadow-card' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#hero" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-primary shadow-glow-sm flex items-center justify-center">
            <BoltIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-text-1 tracking-tight">GESTEK</span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <a key={l.href} href={l.href}
              className="px-4 py-2 text-sm text-text-2 hover:text-text-1 transition-colors rounded-xl hover:bg-surface-2">
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/login"    className="btn-ghost btn-sm">Iniciar sesión</Link>
          <Link to="/register" className="btn-gradient btn-sm">Registrarse gratis</Link>
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(v => !v)} className="md:hidden btn-icon btn-ghost">
          <div className="w-4 h-3 flex flex-col justify-between">
            <span className={`block h-0.5 bg-text-2 transition-all ${open ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`block h-0.5 bg-text-2 transition-all ${open ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 bg-text-2 transition-all ${open ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-surface/95 backdrop-blur-xl border-b border-border px-5 py-4 space-y-1 animate-[slideIn_0.2s_ease_both]">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-text-2 hover:text-text-1 hover:bg-surface-2 rounded-xl transition-colors">
              {l.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-3 border-t border-border mt-2">
            <Link to="/login"    className="btn-secondary btn-sm w-full justify-center">Iniciar sesión</Link>
            <Link to="/register" className="btn-gradient btn-sm w-full justify-center">Registrarse gratis</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ── Hero ───────────────────────────────────────────────── */
function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center px-5 pt-24 pb-16 overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/12 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-primary/6 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-6xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-primary-light text-xs font-medium mb-8 animate-[fadeIn_0.6s_ease_both]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
          </span>
          The operating system for events
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display leading-[1.08] tracking-tight mb-6 animate-[fadeUp_0.7s_ease_both]">
          Gestiona eventos{' '}
          <span className="relative inline-block">
            <span className="text-gradient">sin límites</span>
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
              <path d="M2 10 Q150 2 298 10" stroke="url(#ug)" strokeWidth="2.5" strokeLinecap="round"/>
              <defs><linearGradient id="ug" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6"/><stop offset="100%" stopColor="#8B5CF6"/>
              </linearGradient></defs>
            </svg>
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-text-2 max-w-2xl mx-auto leading-relaxed mb-10 animate-[fadeUp_0.8s_ease_both]">
          Crea, publica y gestiona eventos profesionales desde un solo lugar.
          Con inteligencia artificial para los que quieren ir más lejos.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16 animate-[fadeUp_0.9s_ease_both]">
          <Link to="/register" className="btn-gradient text-base px-7 py-3.5 rounded-2xl shadow-glow">
            Empezar gratis
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
          <a href="#planes" className="btn-secondary text-base px-7 py-3.5 rounded-2xl">
            Ver planes
          </a>
        </div>

        {/* Hero visual — floating UI cards */}
        <div className="relative max-w-4xl mx-auto animate-[fadeUp_1s_ease_both]">
          <div className="relative">
            {/* Main dashboard mockup */}
            <div className="card-glass rounded-3xl overflow-hidden border border-border/60 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
              <div className="flex items-center gap-1.5 px-5 py-3.5 border-b border-border/50">
                <span className="w-2.5 h-2.5 rounded-full bg-danger/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-warning/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-success/70" />
                <span className="flex-1 mx-4 h-5 bg-surface-3 rounded-md text-[10px] text-text-3 flex items-center px-2">
                  app.gestek.io/dashboard
                </span>
              </div>
              <DashboardMockup />
            </div>

            {/* Floating cards */}
            <FloatingCard className="absolute -left-8 top-20 hidden lg:block animate-[float_4s_ease-in-out_infinite]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                  <CheckIcon className="w-4 h-4 text-success" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-1">Evento publicado</p>
                  <p className="text-[10px] text-text-3">Tech Summit 2026 — ahora en vivo</p>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard className="absolute -right-8 top-32 hidden lg:block animate-[float_4s_ease-in-out_infinite_1.5s]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <UsersIcon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-1">+23 inscritos</p>
                  <p className="text-[10px] text-text-3">en las últimas 2 horas</p>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard className="absolute -right-4 bottom-20 hidden lg:block animate-[float_4s_ease-in-out_infinite_0.8s]">
              <div className="flex items-center gap-2 text-xs text-text-2">
                <SparklesIcon className="w-4 h-4 text-accent-light" />
                <span className="font-medium">AI listo para ayudarte</span>
              </div>
            </FloatingCard>
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingCard({ className, children }) {
  return (
    <div className={`card-glass px-4 py-3 rounded-2xl border border-border/60 shadow-card backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

/* ── Dashboard mockup inside hero ─── */
function DashboardMockup() {
  return (
    <div className="flex bg-bg/50" style={{ height: 340 }}>
      {/* Sidebar */}
      <div className="w-44 flex-shrink-0 border-r border-border/50 p-3 space-y-1">
        <div className="flex items-center gap-2 px-2 py-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-gradient-primary flex items-center justify-center">
            <BoltIcon className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-bold font-display text-text-1">GESTEK</span>
        </div>
        {['Dashboard', 'Eventos', 'Usuarios', 'Configuración'].map((item, i) => (
          <div key={item} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] ${i === 0 ? 'bg-primary/10 text-primary-light border border-primary/15' : 'text-text-3'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-primary' : 'bg-surface-3'}`} />
            {item}
          </div>
        ))}
      </div>
      {/* Main */}
      <div className="flex-1 p-5 space-y-4 overflow-hidden">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Eventos', val: '12', color: 'text-primary' },
            { label: 'Publicados', val: '8',  color: 'text-success' },
            { label: 'Borradores', val: '3',  color: 'text-warning' },
            { label: 'Asistentes', val: '847', color: 'text-accent-light' },
          ].map(s => (
            <div key={s.label} className="bg-surface-2/60 rounded-xl p-3 border border-border/50">
              <p className="text-[9px] text-text-3 mb-1">{s.label}</p>
              <p className={`text-lg font-bold font-display ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>
        <div className="bg-surface-2/40 rounded-xl border border-border/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
            <span className="text-[11px] font-semibold text-text-1">Últimos eventos</span>
            <span className="text-[9px] text-primary">Ver todos →</span>
          </div>
          {['Tech Summit 2026', 'UX Workshop', 'AI Conference'].map((ev, i) => (
            <div key={ev} className="flex items-center justify-between px-4 py-2 border-b border-border/20 last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-gradient-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">{ev[0]}</div>
                <span className="text-[10px] text-text-2">{ev}</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${i === 0 ? 'bg-success/15 text-success' : i === 1 ? 'bg-primary/15 text-primary-light' : 'bg-warning/15 text-warning'}`}>
                {i === 0 ? 'publicado' : i === 1 ? 'publicado' : 'borrador'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Logo strip ─────────────────────────────────────────── */
function LogoStrip() {
  const logos = ['Techno Corp', 'Eventify', 'Summit Co', 'DigitalFest', 'Expo Global', 'NexEvent'];
  return (
    <div className="border-y border-border py-8 overflow-hidden">
      <p className="text-center text-xs font-medium text-text-3 uppercase tracking-widest mb-6">
        Empresas que confían en GESTEK
      </p>
      <div className="flex items-center gap-12 animate-[shimmer_20s_linear_infinite]" style={{ width: 'max-content' }}>
        {[...logos, ...logos].map((l, i) => (
          <span key={i} className="text-text-3 font-display font-bold text-sm whitespace-nowrap opacity-50 hover:opacity-80 transition-opacity">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── What is GESTEK ─────────────────────────────────────── */
function WhatIsGestek() {
  const [ref, visible] = useReveal();
  const cards = [
    {
      icon: CalendarIcon,
      color: 'blue',
      title: 'Gestión completa de eventos',
      desc: 'Crea, edita y publica eventos en minutos. Maneja inscripciones, entradas, speakers y capacidad desde un solo panel.',
    },
    {
      icon: UsersIcon,
      color: 'purple',
      title: 'Multi-tenant y colaborativo',
      desc: 'Cada organización tiene su propio espacio. Gestiona roles: admin, organizador y asistente con permisos granulares.',
    },
    {
      icon: ChartIcon,
      color: 'green',
      title: 'Analytics en tiempo real',
      desc: 'Visualiza métricas de asistencia, ocupación y conversión. Toma decisiones basadas en datos reales.',
    },
    {
      icon: SparklesIcon,
      color: 'gold',
      title: 'IA como asistente (Pro)',
      desc: 'Habla con tu asistente de IA para crear y editar eventos con lenguaje natural. El futuro de la gestión de eventos.',
    },
    {
      icon: PaintIcon,
      color: 'orange',
      title: 'White-label completo (Pro Max)',
      desc: 'Tu logo, tus colores, tu dominio. Presenta GESTEK como tu propia plataforma de eventos.',
    },
    {
      icon: ShieldIcon,
      color: 'red',
      title: 'Seguridad enterprise',
      desc: 'JWT con roles y permisos, CORS configurado, hashing bcrypt y base de datos PostgreSQL con Supabase.',
    },
  ];

  const colorMap = {
    blue  : { icon: 'bg-primary/15 text-primary',     border: 'hover:border-primary/30'   },
    purple: { icon: 'bg-accent/15 text-accent-light',  border: 'hover:border-accent/30'    },
    green : { icon: 'bg-success/15 text-success',      border: 'hover:border-success/30'   },
    gold  : { icon: 'bg-warning/15 text-warning',      border: 'hover:border-warning/30'   },
    orange: { icon: 'bg-orange-500/15 text-orange-400',border: 'hover:border-orange-500/30'},
    red   : { icon: 'bg-danger/15 text-danger-light',  border: 'hover:border-danger/30'    },
  };

  return (
    <section id="que-es" className="py-28 px-5">
      <div className="max-w-6xl mx-auto">
        <div ref={ref} className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary-light mb-4 px-3 py-1 rounded-full border border-primary/20 bg-primary/8">
            Qué es GESTEK
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold font-display text-text-1 mt-4 mb-5">
            El sistema operativo<br />
            <span className="text-gradient">para tus eventos</span>
          </h2>
          <p className="text-lg text-text-2 max-w-2xl mx-auto">
            GESTEK reúne todo lo que necesitas para producir eventos profesionales, desde la creación hasta el análisis post-evento.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card, i) => {
            const Icon = card.icon;
            const c = colorMap[card.color];
            return (
              <div
                key={i}
                style={{ transitionDelay: `${i * 80}ms` }}
                className={`card-hover p-6 border border-border ${c.border} transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${c.icon}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-text-1 mb-2">{card.title}</h3>
                <p className="text-sm text-text-2 leading-relaxed">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Features highlight ─────────────────────────────────── */
function Features() {
  const [ref, visible] = useReveal();
  return (
    <section className="py-24 px-5 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/6 rounded-full blur-[100px]" />
      </div>
      <div className="max-w-6xl mx-auto">
        <div ref={ref} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Left */}
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-accent-light mb-4 px-3 py-1 rounded-full border border-accent/20 bg-accent/8">
              Asistente IA — Plan Pro
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-text-1 mt-4 mb-5 leading-tight">
              Crea eventos con solo<br />
              <span className="text-gradient">hablar con la IA</span>
            </h2>
            <p className="text-text-2 leading-relaxed mb-8">
              Tu asistente inteligente vive dentro de la plataforma. Escríbele en lenguaje natural y él creará el evento, ajustará fechas, configurará entradas y publicará — todo sin salir de la conversación.
            </p>
            <ul className="space-y-3">
              {[
                'Crea eventos completos desde una descripción',
                'Modifica fechas, ubicación y entradas con chat',
                'Responde preguntas sobre tus métricas',
                'Sugiere mejoras para aumentar asistencia',
              ].map(f => (
                <li key={f} className="flex items-start gap-3 text-sm text-text-2">
                  <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckIcon className="w-3 h-3 text-accent-light" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link to="/register" className="btn-gradient">
                Probar IA gratis 14 días
                <SparklesIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right — chat mockup */}
          <div className="card-glass rounded-3xl overflow-hidden border border-accent/20 shadow-[0_20px_60px_rgba(139,92,246,0.15)]">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/50">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <SparklesIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-text-1">Asistente GESTEK</p>
                <p className="text-[10px] text-success flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-success" /> En línea
                </p>
              </div>
            </div>
            <div className="p-5 space-y-3 min-h-[300px]">
              <ChatBubble from="user" text="Crea un evento de tecnología para el 15 de agosto en Bogotá, capacidad 200 personas, entrada gratuita" />
              <ChatBubble from="ai" text="¡Perfecto! Creé el evento 'Tech Summit Bogotá' para el 15 de agosto. Ya configuré capacidad de 200 personas con entrada gratuita. ¿Lo publico ahora o prefieres añadir speakers primero?" delay={400} />
              <ChatBubble from="user" text="Añade a Maria García como speaker, CEO de TechCo" delay={800} />
              <ChatBubble from="ai" text="Agregado. María García (CEO · TechCo) aparece como speaker principal. El evento está listo para publicar." delay={1200} />
              <div className="flex items-center gap-2 mt-4">
                <input className="flex-1 input text-xs py-2" placeholder="Escribe algo al asistente..." disabled />
                <button className="btn-gradient btn-sm px-3" disabled>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChatBubble({ from, text, delay = 0 }) {
  const [show, setShow] = useState(delay === 0);
  useEffect(() => {
    if (delay > 0) {
      const t = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(t);
    }
  }, [delay]);
  if (!show) return null;
  return (
    <div className={`flex ${from === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeUp_0.3s_ease_both]`}>
      <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
        from === 'user'
          ? 'bg-primary text-white rounded-tr-sm'
          : 'bg-surface-3 text-text-1 rounded-tl-sm border border-border'
      }`}>
        {from === 'ai' && <span className="text-accent-light font-semibold text-[10px] block mb-1">IA</span>}
        {text}
      </div>
    </div>
  );
}

/* ── Pricing ────────────────────────────────────────────── */
function Pricing() {
  const [ref, visible] = useReveal();
  const [annual, setAnnual] = useState(false);

  const plans = [
    {
      name   : 'Free',
      price  : { monthly: 0,    annual: 0    },
      badge  : null,
      desc   : 'Para empezar a gestionar eventos sin costo.',
      color  : 'border-border',
      btn    : 'btn-secondary',
      btnText: 'Empezar gratis',
      href   : '/register',
      features: [
        { text: 'Hasta 3 eventos activos',     ok: true  },
        { text: 'Hasta 100 asistentes/evento', ok: true  },
        { text: 'Panel de inscripciones',      ok: true  },
        { text: 'Roles y permisos básicos',    ok: true  },
        { text: 'Exportar asistentes (CSV)',   ok: true  },
        { text: 'Asistente IA',                ok: false },
        { text: 'Personalización de marca',    ok: false },
        { text: 'Soporte prioritario',         ok: false },
      ],
    },
    {
      name   : 'Pro',
      price  : { monthly: 29,   annual: 19   },
      badge  : 'Más popular',
      desc   : 'Para equipos que quieren acelerar con IA.',
      color  : 'border-primary/40',
      glow   : true,
      btn    : 'btn-gradient',
      btnText: 'Empezar Pro',
      href   : '/register?plan=pro',
      features: [
        { text: 'Eventos ilimitados',              ok: true },
        { text: 'Asistentes ilimitados',           ok: true },
        { text: 'Asistente IA con chat nativo',    ok: true },
        { text: 'Crear eventos por voz / texto',   ok: true },
        { text: 'Analytics avanzados',             ok: true },
        { text: 'Multi-usuario (hasta 10)',        ok: true },
        { text: 'Personalización de marca',        ok: false },
        { text: 'Soporte prioritario',             ok: false },
      ],
    },
    {
      name   : 'Pro Max',
      price  : { monthly: 79,   annual: 55   },
      badge  : 'Todo incluido',
      desc   : 'Para marcas que quieren su propia plataforma.',
      color  : 'border-accent/40',
      btn    : 'btn-secondary',
      btnText: 'Contactar ventas',
      href   : '/register?plan=promax',
      features: [
        { text: 'Todo lo de Pro',                      ok: true },
        { text: 'White-label completo (logo, colores)',ok: true },
        { text: 'Dominio personalizado',               ok: true },
        { text: 'API pública + webhooks',              ok: true },
        { text: 'Multi-usuario ilimitado',             ok: true },
        { text: 'SLA 99.9% uptime',                    ok: true },
        { text: 'Soporte dedicado 24/7',               ok: true },
        { text: 'Onboarding personalizado',            ok: true },
      ],
    },
  ];

  return (
    <section id="planes" className="py-28 px-5 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[800px] h-[600px] bg-gradient-glow opacity-50" />
      </div>
      <div className="max-w-6xl mx-auto">
        <div ref={ref} className={`text-center mb-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary-light mb-4 px-3 py-1 rounded-full border border-primary/20 bg-primary/8">
            Planes GESTEK
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold font-display text-text-1 mt-4 mb-4">
            Elige tu plan
          </h2>
          <p className="text-lg text-text-2 mb-8">
            Empieza gratis, escala cuando lo necesites.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-surface-2 border border-border rounded-2xl p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${!annual ? 'bg-surface-3 text-text-1 shadow-card' : 'text-text-3'}`}
            >
              Mensual
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${annual ? 'bg-surface-3 text-text-1 shadow-card' : 'text-text-3'}`}
            >
              Anual
              <span className="text-[10px] badge-green py-0.5">−35%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              style={{ transitionDelay: `${i * 100}ms` }}
              className={`relative flex flex-col rounded-3xl border ${plan.color} p-7 transition-all duration-700
                ${plan.glow ? 'bg-surface shadow-[0_0_60px_rgba(59,130,246,0.15)]' : 'bg-surface'}
                ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                hover:-translate-y-1 hover:shadow-card-hover`}
            >
              {plan.badge && (
                <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold
                  ${plan.glow ? 'bg-gradient-primary text-white shadow-glow-sm' : 'bg-accent/20 text-accent-light border border-accent/30'}`}>
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm font-semibold text-text-2 uppercase tracking-wider mb-1">{plan.name}</p>
                <div className="flex items-end gap-1.5 mb-2">
                  <span className="text-4xl font-bold font-display text-text-1">
                    {plan.price[annual ? 'annual' : 'monthly'] === 0 ? 'Gratis' : `$${plan.price[annual ? 'annual' : 'monthly']}`}
                  </span>
                  {plan.price.monthly > 0 && (
                    <span className="text-text-3 text-sm mb-1">/mes</span>
                  )}
                </div>
                <p className="text-sm text-text-2">{plan.desc}</p>
              </div>

              <ul className="space-y-2.5 flex-1 mb-8">
                {plan.features.map(f => (
                  <li key={f.text} className="flex items-center gap-2.5 text-sm">
                    <span className={`w-4.5 h-4.5 flex-shrink-0 ${f.ok ? 'text-success' : 'text-text-3'}`}>
                      {f.ok
                        ? <CheckCircleIcon className="w-4.5 h-4.5" />
                        : <XCircleIcon className="w-4.5 h-4.5" />}
                    </span>
                    <span className={f.ok ? 'text-text-1' : 'text-text-3'}>{f.text}</span>
                  </li>
                ))}
              </ul>

              <Link to={plan.href} className={`${plan.btn} w-full justify-center`}>
                {plan.btnText}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-text-3 mt-8">
          Sin tarjeta de crédito para el plan gratuito · Cancela cuando quieras · Soporte incluido
        </p>
      </div>
    </section>
  );
}

/* ── Final CTA ──────────────────────────────────────────── */
function FinalCTA() {
  const [ref, visible] = useReveal();
  return (
    <section className="py-28 px-5">
      <div className="max-w-3xl mx-auto text-center" ref={ref}>
        <div className={`relative card-glass rounded-3xl border border-primary/20 px-8 py-16 overflow-hidden transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/15 blur-3xl" />
          </div>
          <div className="relative">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary shadow-glow mb-6">
              <BoltIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold font-display text-text-1 mb-4">
              Empieza hoy,<br />
              <span className="text-gradient">gratis para siempre</span>
            </h2>
            <p className="text-lg text-text-2 mb-10 max-w-xl mx-auto">
              Únete a los organizadores que ya gestionan sus eventos con GESTEK. Sin tarjeta de crédito, sin límites en el plan gratuito.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register" className="btn-gradient text-base px-8 py-4 rounded-2xl shadow-glow">
                Crear cuenta gratis
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link to="/login" className="btn-secondary text-base px-8 py-4 rounded-2xl">
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-border px-5 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
              <BoltIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-text-1">GESTEK</span>
            <span className="text-text-3 text-sm">— The operating system for events</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-3">
            {['Inicio', 'Planes', 'Iniciar sesión'].map(l => (
              <a key={l} href="#" className="hover:text-text-2 transition-colors">{l}</a>
            ))}
          </div>
          <p className="text-xs text-text-3">© 2026 GESTEK. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

/* ── Icons ──────────────────────────────────────────────── */
function BoltIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
}
function ArrowRightIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>;
}
function CheckIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
}
function CheckCircleIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function XCircleIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function CalendarIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function UsersIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
}
function ChartIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
}
function SparklesIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
}
function PaintIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
}
function ShieldIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
}
