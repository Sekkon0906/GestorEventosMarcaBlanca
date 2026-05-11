import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

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

export default function LandingHomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <Pillars />
      <PreviewSection />
      <CTASection />
    </>
  );
}

function Hero() {
  return (
    <section className="relative px-5 sm:px-8 pt-12 sm:pt-20 pb-20 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 blur-[160px] rounded-full" />
      </div>
      <div className="relative max-w-5xl mx-auto text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface/60 backdrop-blur text-[11px] font-medium text-text-2 mb-8 tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-[pulseSoft_2s_ease-in-out_infinite]" />
          Plataforma todo-en-uno para eventos
        </span>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display tracking-tight leading-[1.05] text-text-1">
          Gestión de eventos,
          <br />
          <span className="bg-gradient-to-br from-primary-light via-accent-light to-primary bg-clip-text text-transparent">
            simplificada
          </span>
        </h1>

        <p className="mt-7 text-base sm:text-lg text-text-2 max-w-2xl mx-auto leading-relaxed">
          GESTEK reúne creación, ventas, asistencia, pagos y analítica de tus eventos en
          un solo lugar. Empieza gratis con todo incluido.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/register"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full text-sm font-semibold text-bg bg-text-1 hover:bg-white transition-all shadow-[0_0_40px_rgba(241,245,249,0.18)]"
          >
            Empezar gratis
          </Link>
          <Link
            to="/como-funciona"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full text-sm font-medium text-text-1 border border-border-2 hover:bg-surface-2 transition-colors"
          >
            Ver cómo funciona
          </Link>
        </div>

        <p className="mt-5 text-xs text-text-3">
          Sin tarjeta de crédito · Todo lo principal incluido en el plan gratis
        </p>
      </div>
    </section>
  );
}

function Marquee() {
  const items = ['Crear eventos', 'QR de asistencia', 'Recordatorios email', 'Gamificación', 'Pagos BRE-B', 'API + Webhooks', 'Página pública', 'Multi-tenant'];
  return (
    <div className="border-y border-border py-6 overflow-hidden">
      <div className="flex items-center gap-12 animate-[shimmer_30s_linear_infinite]" style={{ width: 'max-content' }}>
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} className="text-xs font-medium tracking-widest uppercase text-text-3 whitespace-nowrap">
            {t} <span className="text-text-3/40 ml-12">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Pillars() {
  const [ref, visible] = useReveal();
  const items = [
    { title: 'Todo en gratis', desc: 'Eventos ilimitados, QR de asistencia, recordatorios, gamificación, API completa y página pública. Todo lo esencial sin pagar.' },
    { title: 'Pagos sin fricción', desc: 'Conecta tu llave o QR de BRE-B y empieza a vender boletas. El dinero va directo a tu cuenta.' },
    { title: 'IA opcional (Pro)', desc: 'Cuando quieras acelerar, el asistente IA crea bloques de evento listos según tu contexto. Solo si lo necesitas.' },
  ];
  return (
    <section className="px-5 sm:px-8 py-24">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <div className={`text-center mb-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-xs uppercase tracking-widest text-primary-light font-semibold mb-3">Por qué GESTEK</p>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-text-1 tracking-tight">
            Lo principal, en gratis.<br />Lo cómodo, en Pro.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {items.map((it, i) => (
            <div
              key={it.title}
              style={{ transitionDelay: `${i * 80}ms` }}
              className={`p-6 rounded-3xl border border-border bg-surface/40 hover:bg-surface/60 hover:border-border-2 transition-all duration-700
                ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            >
              <div className="w-9 h-9 rounded-2xl bg-primary/15 border border-primary/20 mb-4 flex items-center justify-center">
                <span className="text-primary-light text-sm font-bold">{i + 1}</span>
              </div>
              <h3 className="text-lg font-semibold text-text-1 mb-2">{it.title}</h3>
              <p className="text-sm text-text-2 leading-relaxed">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PreviewSection() {
  const [ref, visible] = useReveal();
  return (
    <section className="px-5 sm:px-8 py-24">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <div className={`text-center mb-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-xs uppercase tracking-widest text-accent-light font-semibold mb-3">Crear un evento</p>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-text-1 tracking-tight mb-3">
            Un wizard claro, sin pasos de más
          </h2>
          <p className="text-sm sm:text-base text-text-2 max-w-xl mx-auto">
            Información general, espacios y accesos, identidad y marca, revisar y publicar. Listo.
          </p>
        </div>

        <div className={`rounded-3xl border border-border-2 bg-surface/60 backdrop-blur p-2 transition-all duration-700 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="rounded-2xl bg-bg/50 p-8">
            <div className="flex flex-wrap items-center gap-6 sm:gap-10 mb-8">
              {['Información general', 'Espacios y accesos', 'Identidad y marca', 'Revisión y publicar'].map((s, i) => (
                <div key={s} className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${i === 0 ? 'bg-text-1 text-bg' : 'bg-surface-3 text-text-2 border border-border'}`}>{i + 1}</span>
                  <span className={`text-xs font-medium ${i === 0 ? 'text-text-1' : 'text-text-3'}`}>{s}</span>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <FakeField label="Nombre del evento" value="Summit Tech Ibagué 2026" />
              <FakeField label="Categoría" value="Tecnología" />
              <FakeField label="Fecha inicio" value="15 / 08 / 2026" />
              <FakeField label="Fecha cierre" value="16 / 08 / 2026" />
              <FakeField label="Modalidad" value="Híbrido" />
              <FakeField label="Capacidad" value="200 asistentes" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FakeField({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-bg/40 px-4 py-3">
      <p className="text-[10px] uppercase tracking-widest text-text-3 mb-1">{label}</p>
      <p className="text-sm text-text-1 font-medium">{value}</p>
    </div>
  );
}

function CTASection() {
  return (
    <section className="px-5 sm:px-8 py-24">
      <div className="max-w-3xl mx-auto text-center rounded-3xl border border-border-2 bg-gradient-to-br from-surface/80 to-surface/30 p-12 sm:p-16">
        <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-text-1 mb-4">
          Listo para organizar tu próximo evento
        </h2>
        <p className="text-sm sm:text-base text-text-2 max-w-lg mx-auto mb-8">
          Crea tu cuenta en menos de un minuto. Todo lo esencial es gratis, para siempre.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register" className="w-full sm:w-auto px-7 py-3.5 rounded-full text-sm font-semibold text-bg bg-text-1 hover:bg-white transition-colors">
            Crear cuenta gratis
          </Link>
          <Link to="/planes" className="w-full sm:w-auto px-7 py-3.5 rounded-full text-sm font-medium text-text-1 border border-border-2 hover:bg-surface-2 transition-colors">
            Ver planes
          </Link>
        </div>
      </div>
    </section>
  );
}
