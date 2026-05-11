const STEPS = [
  { n: '01', title: 'Crea tu cuenta', desc: 'Regístrate en 30 segundos. Todo cliente nuevo es organizador. Sin tarjeta de crédito.' },
  { n: '02', title: 'Configura tu entorno', desc: 'Cuéntanos en lenguaje natural qué evento quieres organizar. La IA propone bloques iniciales (en Pro) o llena los datos a mano.' },
  { n: '03', title: 'Crea el evento', desc: 'Wizard de 4 pasos: información general, espacios y accesos, identidad y marca, revisión y publicar.' },
  { n: '04', title: 'Comparte y vende', desc: 'Tu evento tiene página pública propia. La gente se inscribe, compra boletas con BRE-B e interactúa.' },
  { n: '05', title: 'Mide y mejora', desc: 'QR de asistencia, recordatorios por email, gamificación, analytics. Mejora cada edición.' },
];

export default function ComoFuncionaPage() {
  return (
    <section className="px-5 sm:px-8 py-12 max-w-5xl mx-auto">
      <header className="text-center mb-16">
        <p className="text-xs uppercase tracking-widest text-primary-light font-semibold mb-3">Cómo funciona</p>
        <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-text-1 mb-4">
          De idea a evento, en 5 pasos
        </h1>
        <p className="text-base text-text-2 max-w-xl mx-auto">
          Diseñado para que arranques rápido sin saltar pasos importantes.
        </p>
      </header>

      <div className="space-y-4">
        {STEPS.map(s => (
          <div key={s.n} className="rounded-3xl border border-border bg-surface/40 hover:bg-surface/60 hover:border-border-2 transition-all p-6 sm:p-8 grid sm:grid-cols-[auto_1fr] gap-5 sm:gap-8">
            <div className="text-5xl sm:text-6xl font-bold font-display text-text-3/50 leading-none">{s.n}</div>
            <div>
              <h3 className="text-xl font-semibold text-text-1 mb-2">{s.title}</h3>
              <p className="text-sm sm:text-base text-text-2 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
