import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LandingNavbar from '../components/layout/LandingNavbar.jsx';
import LandingFooter from '../components/layout/LandingFooter.jsx';
import GestekLogo from '../components/brand/GestekLogo.jsx';

// ════════════════════════════════════════════════════════════
//  Datos
// ════════════════════════════════════════════════════════════
const FEATURES = [
  {
    color: 'from-blue-500 to-cyan-400',
    title: 'Crea eventos en minutos',
    desc: 'Presenciales, virtuales o híbridos. Agenda, speakers, patrocinadores, tickets y códigos de descuento en un solo flujo.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />,
  },
  {
    color: 'from-purple-500 to-pink-400',
    title: 'Inscripciones inteligentes',
    desc: 'Gestiona asistentes con aprobación manual, listas de espera y tickets personalizados (general, VIP, early bird).',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />,
  },
  {
    color: 'from-emerald-500 to-teal-400',
    title: 'Analytics en tiempo real',
    desc: 'Asistentes confirmados, vistas, conversión y ocupación. Métricas que se actualizan al instante.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />,
  },
  {
    color: 'from-amber-500 to-orange-400',
    title: 'Roles y permisos',
    desc: 'Admin, organizador y asistente con permisos granulares. Total control de quién hace qué.',
    icon: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </>
    ),
  },
  {
    color: 'from-rose-500 to-red-400',
    title: 'Notificaciones push',
    desc: 'Alerta a tus asistentes en tiempo real con notificaciones del navegador y email.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />,
  },
  {
    color: 'from-indigo-500 to-violet-400',
    title: '100% white-label',
    desc: 'Tu marca, tu dominio, tu estética. GESTEK se adapta a tu identidad corporativa.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />,
  },
];

const EVENT_TYPES = [
  { emoji: '🎤', label: 'Conferencias', desc: 'Charlas magistrales y paneles de expertos.' },
  { emoji: '💼', label: 'Corporativos', desc: 'Lanzamientos, capacitaciones, kick-offs.' },
  { emoji: '🎓', label: 'Educación', desc: 'Talleres, cursos y webinars.' },
  { emoji: '🎵', label: 'Conciertos', desc: 'Música en vivo y festivales.' },
  { emoji: '🏆', label: 'Deportivos', desc: 'Torneos, carreras y competencias.' },
  { emoji: '🤝', label: 'Networking', desc: 'Meetups y encuentros profesionales.' },
  { emoji: '🎉', label: 'Sociales', desc: 'Bodas, cumpleaños, celebraciones.' },
  { emoji: '🚀', label: 'Startups', desc: 'Demo days, hackathons y pitchings.' },
];

const GAMIFICATION = [
  { icon: '⭐', title: 'Puntos por interacción', desc: 'Cada acción del asistente suma: check-in, participación en charlas, encuestas, networking.' },
  { icon: '🏅', title: 'Insignias y logros', desc: 'Desbloquea badges al cumplir hitos. Coleccionables únicos por evento.' },
  { icon: '📊', title: 'Leaderboard en vivo', desc: 'Ranking público de los asistentes más activos durante el evento.' },
  { icon: '🎁', title: 'Premios canjeables', desc: 'Convierte los puntos en merchandising, descuentos y experiencias VIP.' },
];

const FAQ = [
  {
    q: '¿Cómo empiezo a usar GESTEK?',
    a: 'Solo crea una cuenta gratis, configura tu primer evento y compártelo. El plan gratuito incluye hasta 3 eventos activos con 100 asistentes cada uno, sin tarjeta de crédito.',
  },
  {
    q: '¿Puedo migrar al plan Premium después?',
    a: 'Sí. Al registrarte siempre comienzas en el plan Gratis. Desde tu panel de control podrás comprar el plan Premium cuando lo necesites y todos tus datos se conservan.',
  },
  {
    q: '¿Qué incluye la gamificación?',
    a: 'Sistema de puntos por interacción, insignias coleccionables, leaderboard público en vivo durante el evento y la posibilidad de canjear puntos por premios, merchandising o experiencias VIP.',
  },
  {
    q: '¿GESTEK sirve para eventos virtuales?',
    a: 'Sí. Soportamos tres modalidades: presencial, virtual (con link de streaming) e híbrido. Cada modalidad tiene su flujo optimizado.',
  },
  {
    q: '¿Cómo funciona el white-label?',
    a: 'En el plan Premium puedes personalizar colores, logo, dominio propio y emails. Tus asistentes nunca verán la marca GESTEK — solo la tuya.',
  },
  {
    q: '¿Puedo cobrar por las entradas?',
    a: 'Sí, en el plan Premium. Definí múltiples tipos de tickets (general, VIP, early bird) con precios distintos, fechas límite y descuentos.',
  },
];

// ════════════════════════════════════════════════════════════
//  Página principal
// ════════════════════════════════════════════════════════════
export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-bg text-text-primary overflow-x-hidden">
      <LandingNavbar />

      {/* ════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════ */}
      <section id="home" className="relative pt-36 pb-28 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute inset-0 bg-radial-glow" />
        <div className="absolute inset-0 bg-radial-accent" />
        <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-40 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-blob animation-delay-400" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl animate-blob animation-delay-800" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="flex justify-center mb-8 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-pulse" />
              <GestekLogo size={88} className="relative animate-float" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-text-secondary text-xs font-medium mb-8 animate-fade-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-text-primary">Manage. Automate. Scale.</span>
            <span>· Event Operations</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold font-head leading-[1.05] mb-6 animate-fade-up animation-delay-200">
            El sistema operativo<br />
            <span className="text-gradient-cyan animate-gradient inline-block">
              para tus eventos
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up animation-delay-400">
            Crea, gestiona y publica eventos presenciales, virtuales e híbridos.
            Premia la participación de tus asistentes con{' '}
            <span className="text-cyan-400 font-semibold">gamificación</span>{' '}
            y mide todo en tiempo real.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up animation-delay-600">
            <Link to="/login" className="btn-primary px-8 py-3.5 text-base w-full sm:w-auto group glow-primary">
              Acceder ahora
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link to="/planes" className="btn-secondary px-8 py-3.5 text-base w-full sm:w-auto">
              Ver planes y precios
            </Link>
          </div>

          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto animate-fade-up animation-delay-800">
            {[
              { v: '100%', l: 'White-label' },
              { v: '3',    l: 'Modalidades' },
              { v: '24/7', l: 'Soporte Premium' },
              { v: '∞',    l: 'Eventos Premium' },
            ].map(s => (
              <div key={s.l} className="text-center">
                <p className="text-3xl sm:text-4xl font-extrabold font-head text-gradient">{s.v}</p>
                <p className="text-xs sm:text-sm text-text-secondary mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          FUNCIONES
      ════════════════════════════════════════════════════ */}
      <section id="funciones" className="relative py-28 px-6">
        <div className="absolute top-1/2 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-primary uppercase">Funciones</span>
            <h2 className="text-4xl sm:text-5xl font-bold font-head mt-3 mb-4">
              Todo lo que necesitas,{' '}
              <br className="hidden sm:block" />
              <span className="text-gradient">en un solo lugar</span>
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto text-lg">
              Desde la creación del evento hasta el análisis post-evento.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="card p-7 lift relative overflow-hidden group">
                <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 rounded-full`} />
                <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-5 shadow-lg`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    {f.icon}
                  </svg>
                </div>
                <h3 className="font-semibold font-head text-lg text-text-primary mb-2.5">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          TIPOS DE EVENTOS
      ════════════════════════════════════════════════════ */}
      <section id="eventos" className="relative py-28 px-6 bg-surface/30 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-accent uppercase">Para todos</span>
            <h2 className="text-4xl sm:text-5xl font-bold font-head mt-3 mb-4">
              Cualquier evento, <span className="text-gradient">cualquier tamaño</span>
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto text-lg">
              Diseñado para adaptarse a cualquier tipo de experiencia presencial, virtual o híbrida.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {EVENT_TYPES.map(t => (
              <div key={t.label} className="card p-6 text-center lift group">
                <div className="text-5xl mb-3 inline-block group-hover:scale-110 transition-transform duration-300">
                  {t.emoji}
                </div>
                <h3 className="font-semibold font-head text-text-primary mb-1">{t.label}</h3>
                <p className="text-xs text-text-secondary">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          GAMIFICACIÓN
      ════════════════════════════════════════════════════ */}
      <section id="gamificacion" className="relative py-28 px-6 overflow-hidden">
        <div className="absolute top-20 right-10 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-blob animation-delay-400" />

        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <span className="text-xs font-bold tracking-widest text-yellow-400 uppercase">Gamificación</span>
              <h2 className="text-4xl sm:text-5xl font-bold font-head mt-3 mb-5 leading-tight">
                Premia la participación<br />
                <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  de tus asistentes
                </span>
              </h2>
              <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                Invita a interactuar y conectar cada vez más con tu evento.
                Los asistentes ganan puntos al interactuar con la app del evento y sus diferentes opciones.
              </p>
              <div className="space-y-4">
                {GAMIFICATION.map(g => (
                  <div key={g.title} className="flex gap-4 items-start">
                    <div className="text-3xl flex-shrink-0">{g.icon}</div>
                    <div>
                      <h4 className="font-semibold font-head text-text-primary mb-1">{g.title}</h4>
                      <p className="text-sm text-text-secondary">{g.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard mockup */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-purple-500/20 rounded-3xl blur-2xl animate-pulse" />
              <div className="relative card p-7 border-2 border-yellow-500/30 shadow-glow">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    <h3 className="font-bold font-head text-lg">Leaderboard</h3>
                  </div>
                  <span className="badge-yellow text-xs">EN VIVO</span>
                </div>
                <div className="space-y-3">
                  {[
                    { pos: 1, emoji: '🥇', name: 'Carolina M.',   pts: 2840, color: 'from-yellow-400 to-amber-500' },
                    { pos: 2, emoji: '🥈', name: 'Andrés T.',     pts: 2105, color: 'from-slate-300 to-slate-400' },
                    { pos: 3, emoji: '🥉', name: 'Valentina P.',  pts: 1798, color: 'from-orange-400 to-amber-600' },
                    { pos: 4, emoji: '4️⃣', name: 'Miguel H.',     pts: 1342, color: 'from-primary to-accent' },
                    { pos: 5, emoji: '5️⃣', name: 'Laura G.',      pts: 1180, color: 'from-primary to-accent' },
                  ].map(u => (
                    <div key={u.pos} className="flex items-center gap-4 p-3 bg-surface-2/50 rounded-xl hover:bg-surface-2 transition-colors">
                      <span className="text-2xl">{u.emoji}</span>
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${u.color} flex items-center justify-center font-bold text-white text-sm`}>
                        {u.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-text-primary truncate">{u.name}</p>
                        <p className="text-xs text-text-secondary">Posición #{u.pos}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-text-primary text-sm">{u.pts.toLocaleString()}</p>
                        <p className="text-[10px] text-text-secondary uppercase tracking-wide">pts</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-text-secondary">Tus puntos:</span>
                  <span className="font-bold text-yellow-400 text-lg">⭐ 1,180</span>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-3xl shadow-2xl animate-float-slow">
                🏅
              </div>
              <div className="absolute -bottom-4 -left-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-2xl shadow-2xl animate-float-delay">
                ⭐
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          FAQ
      ════════════════════════════════════════════════════ */}
      <section id="faq" className="relative py-28 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase">Preguntas frecuentes</span>
            <h2 className="text-4xl sm:text-5xl font-bold font-head mt-3 mb-4">
              ¿Tienes <span className="text-gradient">dudas?</span>
            </h2>
            <p className="text-text-secondary text-lg">Resolvemos las más comunes.</p>
          </div>

          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div
                key={i}
                className={`card overflow-hidden transition-all duration-300 ${openFaq === i ? 'border-primary/50' : ''}`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-surface-2/30 transition-colors"
                >
                  <span className="font-semibold font-head text-text-primary">{item.q}</span>
                  <svg
                    className={`w-5 h-5 text-text-secondary flex-shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-primary' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                <div className={`grid transition-all duration-300 ${openFaq === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-sm text-text-secondary leading-relaxed">{item.a}</p>
                  </div>
                </div>
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
        <div className="relative max-w-3xl mx-auto">
          <div
            className="card p-12 text-center border-primary/30 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.10) 0%, rgba(124,58,237,0.10) 100%)' }}
          >
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-accent/20 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex justify-center mb-6 animate-float">
                <GestekLogo size={64} />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-head mb-4">
                ¿Listo para <span className="text-gradient">comenzar?</span>
              </h2>
              <p className="text-text-secondary mb-8 max-w-md mx-auto">
                Únete gratis a GESTEK y crea tu primer evento en menos de 5 minutos. Sin tarjeta de crédito.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/login" className="btn-primary px-8 py-3.5 text-base glow-primary">
                  Crear cuenta gratis
                </Link>
                <Link to="/planes" className="btn-secondary px-8 py-3.5 text-base">
                  Ver planes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
