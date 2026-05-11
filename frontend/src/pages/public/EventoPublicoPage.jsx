import { useParams, Link } from 'react-router-dom';

export default function EventoPublicoPage() {
  const { slug } = useParams();
  return (
    <section className="px-5 sm:px-8 py-12 max-w-5xl mx-auto">
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8">
        <div>
          <div className="aspect-video rounded-3xl border border-border bg-gradient-to-br from-primary/20 via-accent/10 to-bg mb-6 flex items-center justify-center">
            <span className="text-xs uppercase tracking-widest text-text-3">Portada del evento</span>
          </div>
          <p className="text-xs uppercase tracking-widest text-primary-light font-semibold mb-3">Evento público</p>
          <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-text-1 mb-3">
            {slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Evento'}
          </h1>
          <p className="text-base text-text-2 leading-relaxed mb-8">
            Esta es la página pública del evento. Aquí se mostrará la descripción real, agenda,
            speakers, ubicación, política de reembolso y un botón de compra de boleta o registro
            según la configuración del organizador.
          </p>

          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {[
              ['Fecha', '15 — 16 Agosto 2026'],
              ['Ciudad', 'Ibagué, Colombia'],
              ['Modalidad', 'Híbrido'],
              ['Categoría', 'Tecnología'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-border bg-surface/40 px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-text-3 mb-1">{k}</p>
                <p className="text-sm text-text-1 font-medium">{v}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-text-3">
            Esta vista es un placeholder. En Fase 5 se conecta a datos reales del evento publicado.
          </p>
        </div>

        <aside className="rounded-3xl border border-border-2 bg-surface/60 p-6 h-fit sticky top-28">
          <p className="text-xs uppercase tracking-widest text-text-3 mb-2">Boleta</p>
          <p className="text-3xl font-bold font-display text-text-1 mb-1">Gratis</p>
          <p className="text-xs text-text-2 mb-6">o paga con BRE-B si el organizador lo configura</p>
          <button className="w-full py-3.5 rounded-2xl text-sm font-semibold bg-text-1 text-bg hover:bg-white transition-colors mb-3">
            Reservar mi cupo
          </button>
          <Link to="/explorar" className="block text-center text-xs text-text-2 hover:text-text-1 transition-colors">
            ← Volver a explorar
          </Link>
        </aside>
      </div>
    </section>
  );
}
