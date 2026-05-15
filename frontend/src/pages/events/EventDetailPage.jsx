import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventosApi } from '../../api/eventos.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { EstadoBadge, ModalidadBadge } from '../../components/ui/Badge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

export default function EventDetailPage() {
  const { id }               = useParams();
  const navigate             = useNavigate();
  const { usuario, hasPermiso } = useAuth();
  const { success, error: toastErr } = useToast();

  const [evento,     setEvento]     = useState(null);
  const [asistentes, setAsistentes] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [working,    setWorking]    = useState(false);
  const [err,        setErr]        = useState('');

  useEffect(() => {
    setLoading(true);
    eventosApi.get(id)
      .then(data => setEvento(data.evento || data))
      .catch(e   => setErr(e.message))
      .finally(()=> setLoading(false));
  }, [id]);

  const loadAsistentes = async () => {
    try {
      const data = await eventosApi.asistentes(id);
      setAsistentes(data);
    } catch (e) { toastErr(e.message); }
  };

  const doAction = async (action, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setWorking(true);
    try {
      let data;
      if (action === 'publicar')   data = await eventosApi.publicar(id);
      if (action === 'cancelar')   data = await eventosApi.cancelar(id);
      if (action === 'inscribirse') data = await eventosApi.inscribirse(id);
      setEvento(prev => ({ ...prev, estado: data.evento?.estado || prev.estado }));
      success(data.mensaje || 'Acción realizada correctamente.');
    } catch (e) {
      toastErr(e.message);
    } finally {
      setWorking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar este evento? Esta acción no se puede deshacer.')) return;
    setWorking(true);
    try {
      await eventosApi.delete(id);
      success('Evento eliminado.');
      navigate('/eventos');
    } catch (e) {
      toastErr(e.message);
      setWorking(false);
    }
  };

  const fmt = (d) => d
    ? new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  );

  if (!evento) return (
    <div className="max-w-lg mx-auto mt-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-text-2 mb-4">{err || 'Evento no encontrado.'}</p>
      <Link to="/eventos" className="btn-secondary">← Volver a eventos</Link>
    </div>
  );

  const esDueno = String(evento.organizador_id) === String(usuario?.id) || usuario?.rol === 'admin_global';
  const pct     = evento.capacidad_total > 0 ? Math.min(100, Math.round((evento.asistentes_count || 0) / evento.capacidad_total * 100)) : 0;
  const barColor = pct >= 90 ? 'bg-danger' : pct >= 70 ? 'bg-warning' : 'bg-success';

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-[fadeUp_0.4s_ease_both]">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-text-2">
        <Link to="/eventos" className="hover:text-text-1 transition-colors">Eventos</Link>
        <ChevronIcon className="w-3 h-3 text-text-3" />
        <span className="text-text-1 truncate">{evento.nombre}</span>
      </nav>

      {/* Header card */}
      <div className="card overflow-hidden">
        {evento.imagen_portada ? (
          <div className="relative h-48 overflow-hidden">
            <img src={evento.imagen_portada} alt={evento.nombre} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent" />
            <div className="absolute bottom-4 left-6 flex gap-2">
              <EstadoBadge estado={evento.estado} />
              <ModalidadBadge modalidad={evento.modalidad} />
            </div>
          </div>
        ) : (
          <div className="h-20 bg-gradient-primary relative overflow-hidden">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgba(255,255,255,0.1)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e\")" }} />
          </div>
        )}

        <div className="card-body">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold font-display text-text-1">{evento.nombre}</h1>
              {evento.descripcion && <p className="text-sm text-text-2 mt-1 leading-relaxed">{evento.descripcion}</p>}
            </div>
            {!evento.imagen_portada && (
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <EstadoBadge estado={evento.estado} />
                <ModalidadBadge modalidad={evento.modalidad} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-border">
            <InfoItem label="Inicio"  value={fmt(evento.fecha_inicio)} />
            <InfoItem label="Fin"     value={fmt(evento.fecha_fin)}    />
            {evento.ubicacion?.ciudad && <InfoItem label="Ciudad" value={evento.ubicacion.ciudad} />}
            {evento.ubicacion?.lugar  && <InfoItem label="Venue"  value={evento.ubicacion.lugar}  />}
            {evento.ubicacion?.link_streaming && (
              <InfoItem label="Streaming" value={
                <a href={evento.ubicacion.link_streaming} target="_blank" rel="noreferrer"
                  className="text-primary hover:underline text-xs truncate block">
                  Ver enlace →
                </a>
              } />
            )}
            <div>
              <p className="text-xs font-medium text-text-2 mb-1">Capacidad</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-1">
                  {evento.asistentes_count || 0}{evento.capacidad_total ? ` / ${evento.capacidad_total}` : ''}
                </span>
                {evento.capacidad_total > 0 && (
                  <span className="text-xs text-text-3">({pct}%)</span>
                )}
              </div>
              {evento.capacidad_total > 0 && (
                <div className="h-1 bg-surface-3 rounded-full mt-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {esDueno && (
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-border">
              {hasPermiso('eventos:publicar') && evento.estado === 'borrador' && (
                <button onClick={() => doAction('publicar')} disabled={working} className="btn-gradient">
                  {working ? <Spinner size="sm" /> : <><RocketIcon className="w-4 h-4" /> Publicar evento</>}
                </button>
              )}
              {hasPermiso('eventos:editar') && evento.estado !== 'cancelado' && (
                <button onClick={() => doAction('cancelar', '¿Cancelar este evento?')} disabled={working} className="btn-secondary">
                  Cancelar evento
                </button>
              )}
              {hasPermiso('eventos:eliminar') && (
                <button onClick={handleDelete} disabled={working} className="btn-danger ml-auto">
                  Eliminar
                </button>
              )}
            </div>
          )}

          {!esDueno && evento.estado === 'publicado' && (
            <div className="mt-5 pt-5 border-t border-border">
              <button onClick={() => doAction('inscribirse')} disabled={working} className="btn-gradient">
                {working ? <Spinner size="sm" /> : 'Inscribirme a este evento'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Entradas */}
      {evento.entradas?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-text-1">Entradas disponibles</h3>
          </div>
          <div className="divide-y divide-border">
            {evento.entradas.map((e, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-surface-2/40 transition-colors">
                <div>
                  <p className="text-sm font-medium text-text-1">{e.tipo}</p>
                  {e.descripcion && <p className="text-xs text-text-2 mt-0.5">{e.descripcion}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-text-1">
                    {e.precio === 0 ? <span className="badge-green">Gratis</span> : `$${Number(e.precio).toLocaleString()} ${e.moneda || 'COP'}`}
                  </p>
                  <p className="text-xs text-text-2 mt-0.5">{e.disponibles ?? e.capacidad} disponibles</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Speakers */}
      {evento.speakers?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-text-1">Speakers</h3>
            <span className="badge-gray">{evento.speakers.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 p-6">
            {evento.speakers.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary/20 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold text-sm font-display">{s.nombre?.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-1 truncate">{s.nombre}</p>
                  <p className="text-xs text-text-2 truncate">{s.cargo}{s.empresa ? ` · ${s.empresa}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Asistentes (solo para dueño) */}
      {esDueno && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-text-1">Asistentes</h3>
            {!asistentes && (
              <button onClick={loadAsistentes} className="btn-ghost btn-sm">
                Cargar lista
              </button>
            )}
          </div>

          {asistentes ? (
            <>
              <div className="flex gap-6 px-6 py-4 border-b border-border">
                <Stat label="Total"       value={asistentes.stats?.total}       />
                <Stat label="Confirmados" value={asistentes.stats?.confirmados} color="text-success" />
                <Stat label="Pendientes"  value={asistentes.stats?.pendientes}  color="text-warning" />
                <Stat label="Cancelados"  value={asistentes.stats?.cancelados}  color="text-danger"  />
              </div>
              {asistentes.asistentes?.length === 0 ? (
                <p className="text-sm text-text-2 text-center py-8">Sin asistentes aún.</p>
              ) : (
                <div className="divide-y divide-border max-h-72 overflow-y-auto no-scrollbar">
                  {asistentes.asistentes.map((a, i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-surface-3 flex items-center justify-center text-[11px] font-semibold text-text-2 flex-shrink-0">
                          {a.usuario?.nombre?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm text-text-1">{a.usuario?.nombre || 'Usuario'}</p>
                          <p className="text-xs text-text-3">{a.usuario?.email}</p>
                        </div>
                      </div>
                      <span className={`badge text-xs ${
                        a.estado_registro === 'confirmado' ? 'badge-green' :
                        a.estado_registro === 'pendiente'  ? 'badge-yellow' : 'badge-red'
                      }`}>
                        {a.estado_registro}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-text-2 text-center py-8">
              Haz clic en "Cargar lista" para ver los asistentes.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-2 mb-0.5">{label}</p>
      <div className="text-sm text-text-1">{value}</div>
    </div>
  );
}

function Stat({ label, value, color = 'text-text-1' }) {
  return (
    <div className="text-center">
      <p className={`text-xl font-bold font-display tabular-nums ${color}`}>{value ?? 0}</p>
      <p className="text-xs text-text-3 mt-0.5">{label}</p>
    </div>
  );
}

function ChevronIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
}
function RocketIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>;
}
