const FEATURES = [
  { cat: 'Eventos',  items: ['Creación con wizard de 4 pasos', 'Edición y publicación en un clic', 'Eventos presenciales, virtuales e híbridos', 'Categorías, etiquetas, visibilidad pública o privada', 'Página pública individual por evento'] },
  { cat: 'Asistencia y boletas', items: ['QR único de check-in / check-out', 'Inscripciones e invitaciones', 'Cupos limitados con lista de espera', 'Exportar asistentes a CSV', 'Página de compra con BRE-B'] },
  { cat: 'Comunicación', items: ['Recordatorios automáticos por email', 'Notificaciones in-app', 'Confirmaciones de inscripción', 'Recuperación de cuenta por correo'] },
  { cat: 'Gamificación', items: ['Puntos por asistencia y participación', 'Badges desbloqueables', 'Ranking entre asistentes', 'Misiones por evento'] },
  { cat: 'Pagos (BRE-B)', items: ['El organizador pega su llave o QR', 'Cobro directo al organizador', 'Sin comisiones extra de la plataforma en el plan gratis', 'Gestión manual de reembolsos'] },
  { cat: 'API y webhooks', items: ['API REST completa con API key', 'Webhooks para inscripción, pago, check-in', 'Documentación con ejemplos', 'Rate limits razonables'] },
  { cat: 'Cuentas y seguridad', items: ['Auth con Supabase (email + contraseña)', 'Confirmación y recuperación por correo', 'JWT + sesión persistente', 'Roles: organizador / asistente / admin'] },
  { cat: 'Plan Pro', items: ['Agente IA que arma eventos a partir de un contexto', 'Personalización de colores y tipografía', 'White-label: tu logo en lugar de GESTEK', 'Soporte prioritario', 'Analytics avanzados'] },
];

export default function ProductoPage() {
  return (
    <section className="px-5 sm:px-8 py-12 max-w-6xl mx-auto">
      <header className="text-center mb-16 max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-primary-light font-semibold mb-3">Producto</p>
        <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-text-1 mb-4">
          Todo lo que GESTEK ofrece
        </h1>
        <p className="text-base text-text-2">
          Lo principal va siempre incluido en el plan gratuito. El plan Pro añade comodidad,
          personalización y un agente IA — no funciones esenciales.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        {FEATURES.map(group => (
          <div key={group.cat} className="rounded-3xl border border-border bg-surface/40 p-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-primary-light mb-4">{group.cat}</h3>
            <ul className="space-y-2.5">
              {group.items.map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-text-1">
                  <svg className="w-4 h-4 mt-0.5 text-primary-light flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
