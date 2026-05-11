import { Link } from 'react-router-dom';
import { EstadoBadge, ModalidadBadge } from './Badge.jsx';

export default function EventCard({ evento, onPublicar, onDelete, canEdit, canDelete }) {
  const pct = evento.capacidad_total > 0
    ? Math.min(100, Math.round((evento.asistentes_count || 0) / evento.capacidad_total * 100))
    : 0;

  const barColor = pct >= 90 ? 'bg-danger' : pct >= 70 ? 'bg-warning' : 'bg-success';

  const fmt = (d) => d
    ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="card-hover flex flex-col overflow-hidden group">
      {/* Cover image */}
      <div className="relative h-36 bg-gradient-dark overflow-hidden flex-shrink-0">
        {evento.imagen_portada
          ? <img src={evento.imagen_portada} alt={evento.nombre} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
          : <PlaceholderCover nombre={evento.nombre} />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <EstadoBadge estado={evento.estado} />
          <ModalidadBadge modalidad={evento.modalidad} />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div className="flex-1">
          <Link to={`/eventos/${evento.id}`} className="text-sm font-semibold text-text-1 hover:text-primary transition-colors line-clamp-2 leading-snug">
            {evento.nombre}
          </Link>
          {evento.descripcion && (
            <p className="text-xs text-text-2 mt-1 line-clamp-2 leading-relaxed">{evento.descripcion}</p>
          )}
        </div>

        {/* Meta */}
        <div className="space-y-1.5 text-xs text-text-2">
          {fmt(evento.fecha_inicio) && (
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{fmt(evento.fecha_inicio)}</span>
            </div>
          )}
          {evento.ubicacion?.ciudad && (
            <div className="flex items-center gap-1.5">
              <LocationIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{evento.ubicacion.ciudad}{evento.ubicacion.lugar ? ` · ${evento.ubicacion.lugar}` : ''}</span>
            </div>
          )}
        </div>

        {/* Capacity bar */}
        {evento.capacidad_total > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-text-2">
              <span>{evento.asistentes_count || 0} asistentes</span>
              <span>{pct}% · {evento.capacidad_total} cap.</span>
            </div>
            <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-border">
          <Link to={`/eventos/${evento.id}`} className="btn btn-ghost btn-sm flex-1 justify-center">
            Ver detalle
          </Link>
          {canEdit && evento.estado === 'borrador' && onPublicar && (
            <button onClick={() => onPublicar(evento.id)} className="btn btn-primary btn-sm flex-1 justify-center">
              Publicar
            </button>
          )}
          {canDelete && onDelete && (
            <button onClick={() => onDelete(evento.id, evento.nombre)} className="btn btn-ghost btn-sm text-danger px-2">
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PlaceholderCover({ nombre }) {
  const hue = nombre ? (nombre.charCodeAt(0) * 7) % 360 : 220;
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, hsl(${hue},60%,15%), hsl(${(hue + 40) % 360},60%,20%))` }}
    >
      <span className="text-4xl font-bold font-display opacity-30 select-none">
        {nombre?.charAt(0)?.toUpperCase() || '?'}
      </span>
    </div>
  );
}

function CalendarIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function LocationIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function TrashIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}
