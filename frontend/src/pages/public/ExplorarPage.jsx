import { Link } from 'react-router-dom';

const MOCK_EVENTS = [
  { slug: 'summit-tech-ibague-2026', title: 'Summit Tech Ibagué 2026', date: '15 Ago 2026', city: 'Ibagué', cat: 'Tecnología', price: 'Gratis' },
  { slug: 'ux-workshop-bogota',      title: 'UX Workshop Bogotá',      date: '22 Sep 2026', city: 'Bogotá', cat: 'Diseño',    price: '$ 80.000' },
  { slug: 'ai-conference-medellin',  title: 'AI Conference Medellín',  date: '04 Oct 2026', city: 'Medellín', cat: 'IA',     price: '$ 120.000' },
  { slug: 'startup-pitch-cali',      title: 'Startup Pitch Night Cali', date: '10 Oct 2026', city: 'Cali',   cat: 'Negocios', price: 'Gratis' },
  { slug: 'devfest-bucaramanga',     title: 'DevFest Bucaramanga',     date: '18 Nov 2026', city: 'Bucaramanga', cat: 'Tecnología', price: '$ 50.000' },
  { slug: 'mkt-summit-2026',         title: 'Marketing Summit 2026',   date: '25 Nov 2026', city: 'Online', cat: 'Marketing', price: '$ 65.000' },
];

export default function ExplorarPage() {
  return (
    <section className="px-5 sm:px-8 py-12 max-w-6xl mx-auto">
      <header className="mb-12">
        <p className="text-xs uppercase tracking-widest text-primary-light font-semibold mb-3">Explorar</p>
        <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-text-1 mb-3">
          Eventos públicos
        </h1>
        <p className="text-base text-text-2 max-w-xl">
          Descubre qué se está organizando con GESTEK ahora mismo. Reserva tu cupo o compra tu boleta
          desde la página pública de cada evento.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_EVENTS.map(ev => (
          <Link
            key={ev.slug}
            to={`/explorar/${ev.slug}`}
            className="group rounded-3xl border border-border bg-surface/40 hover:bg-surface/60 hover:border-border-2 transition-all overflow-hidden flex flex-col"
          >
            <div className="aspect-video bg-gradient-to-br from-primary/20 via-accent/10 to-bg flex items-center justify-center border-b border-border">
              <span className="text-xs font-medium text-text-3 uppercase tracking-widest">{ev.cat}</span>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-base font-semibold text-text-1 mb-2 group-hover:text-primary-light transition-colors">{ev.title}</h3>
              <p className="text-xs text-text-2 mb-4">{ev.date} · {ev.city}</p>
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                <span className="text-sm font-semibold text-text-1">{ev.price}</span>
                <span className="text-xs text-primary-light group-hover:translate-x-0.5 transition-transform">Ver →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-text-3">
        Esta es una vista preliminar. Los eventos públicos reales aparecerán cuando los organizadores empiecen a publicar.
      </p>
    </section>
  );
}
