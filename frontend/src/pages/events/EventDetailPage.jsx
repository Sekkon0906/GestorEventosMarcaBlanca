import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventosApi } from '../../api/eventos.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { EstadoBadge, ModalidadBadge } from '../../components/ui/Badge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario, hasPermiso } = useAuth();

  const [evento,     setEvento]     = useState(null);
  const [asistentes, setAsistentes] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [actionMsg,  setActionMsg]  = useState('');
  const [working,    setWorking]    = useState(false);

  useEffect(() => {
    setLoading(true);
    eventosApi.get(id)
      .then(data => setEvento(data.evento || data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const loadAsistentes = async () => {
    try {
      const data = await eventosApi.asistentes(id);
      setAsistentes(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAction = async (action, confirm_msg) => {
    if (confirm_msg && !window.confirm(confirm_msg)) return;
    setWorking(true);
    setError('');
    try {
      let data;
      if (action === 'publicar') data = await eventosApi.publicar(id);
      if (action === 'cancelar') data = await eventosApi.cancelar(id);
      if (action === 'inscribirse') data = await eventosApi.inscribirse(id);
      setEvento(prev => ({ ...prev, estado: data.evento?.estado || prev.estado }));
      setActionMsg(data.mensaje || 'Acción realizada.');
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar este evento? Esta acción no se puede deshacer.')) return;
    setWorking(true);
    try {
      await eventosApi.delete(id);
      navigate('/eventos');
    } catch (err) {
      setError(err.message);
      setWorking(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  if (!evento && error) return (
    <div className="max-w-xl mx-auto mt-10">
      <Alert message={error} type="error" />
      <Link to="/eventos" className="btn-secondary mt-4 inline-flex">← Volver</Link>
    </div>
  );
  if (!evento) return null;

  const esDueno = String(evento.organizador_id) === String(usuario?.id) || usuario?.rol === 'admin_global';
  const fmt = (d) => d ? new Date(d).toLocaleString('es-CO', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Link to="/eventos" className="hover:text-primary">Eventos</Link>
        <span>/</span>
        <span className="text-text-primary truncate">{evento.nombre}</span>
      </div>

      <Alert message={error}     type="error"   onClose={() => setError('')} />
      <Alert message={actionMsg} type="success" />

      {/* Header card */}
      <div className="card">
        {evento.imagen_portada && (
          <img src={evento.imagen_portada} alt={evento.nombre}
            className="w-full h-40 object-cover rounded-t-xl" />
        )}
        <div className="card-body">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold font-head text-text-primary">{evento.nombre}</h2>
              {evento.descripcion && (
                <p className="text-sm text-text-secondary mt-1">{evento.descripcion}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <EstadoBadge estado={evento.estado} />
              <ModalidadBadge modalidad={evento.modalidad} />
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-border">
            <InfoItem label="Inicio"   value={fmt(evento.fecha_inicio)} />
            <InfoItem label="Fin"      value={fmt(evento.fecha_fin)} />
            {evento.ubicacion?.ciudad && (
              <InfoItem label="Ciudad" value={evento.ubicacion.ciudad} />
            )}
            {evento.ubicacion?.lugar && (
              <InfoItem label="Venue"  value={evento.ubicacion.lugar} />
            )}
            {evento.ubicacion?.link_streaming && (
              <InfoItem label="Streaming" value={
                <a href={evento.ubicacion.link_streaming} target="_blank" rel="noreferrer"
                  className="text-primary hover:underline truncate block">
                  {evento.ubicacion.link_streaming}
                </a>
              } />
            )}
            <InfoItem label="Capacidad"
              value={`${evento.asistentes_count || 0} / ${evento.capacidad_total || '∞'}`} />
          </div>

          {/* Actions */}
          {esDueno && (
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-border">
              {hasPermiso('eventos:publicar') && evento.estado === 'borrador' && (
                <button onClick={() => handleAction('publicar')} disabled={working} className="btn-primary">
                  {working ? <Spinner size="sm" /> : '🚀 Publicar evento'}
                </button>
              )}
              {hasPermiso('eventos:editar') && evento.estado !== 'cancelado' && (
                <button onClick={() => handleAction('cancelar', '¿Cancelar este evento?')} disabled={working}
                  className="btn-secondary">
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
              <button onClick={() => handleAction('inscribirse')} disabled={working} className="btn-primary">
                {working ? <Spinner size="sm" /> : '✓ Inscribirme'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Entradas */}
      {evento.entradas?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-text-primary">Entradas disponibles</h3>
          </div>
          <div className="divide-y divide-border">
            {evento.entradas.map((e, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">{e.tipo}</p>
                  {e.descripcion && <p className="text-xs text-text-secondary">{e.descripcion}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-text-primary">
                    {e.precio === 0 ? 'Gratis' : `$${Number(e.precio).toLocaleString()} ${e.moneda || 'COP'}`}
                  </p>
                  <p className="text-xs text-text-secondary">{e.disponibles ?? e.capacidad} disponibles</p>
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
            <h3 className="text-sm font-semibold text-text-primary">Speakers</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 p-6">
            {evento.speakers.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold text-sm">{s.nombre?.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">{s.nombre}</p>
                  <p className="text-xs text-text-secondary truncate">{s.cargo}{s.empresa ? ` · ${s.empresa}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Asistentes (solo para organizador) */}
      {esDueno && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Asistentes</h3>
            {!asistentes && (
              <button onClick={loadAsistentes} className="btn-ghost text-xs">Cargar</button>
            )}
          </div>
          {asistentes ? (
            <>
              <div className="flex gap-4 px-6 py-3 border-b border-border">
                <Stat label="Total"       value={asistentes.stats?.total}       />
                <Stat label="Confirmados" value={asistentes.stats?.confirmados} color="text-success" />
                <Stat label="Pendientes"  value={asistentes.stats?.pendientes}  color="text-warning" />
                <Stat label="Cancelados"  value={asistentes.stats?.cancelados}  color="text-danger"  />
              </div>
              {asistentes.asistentes?.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-6">Sin asistentes aún.</p>
              ) : (
                <div className="divide-y divide-border max-h-72 overflow-y-auto">
                  {asistentes.asistentes.map((a, i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <p className="text-sm text-text-primary">{a.usuario?.nombre || 'Usuario'}</p>
                        <p className="text-xs text-text-secondary">{a.usuario?.email}</p>
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
            <p className="text-sm text-text-secondary text-center py-6">
              Haz clic en "Cargar" para ver los asistentes.
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
      <p className="text-xs font-medium text-text-secondary mb-0.5">{label}</p>
      <p className="text-sm text-text-primary">{value}</p>
    </div>
  );
}

function Stat({ label, value, color = 'text-text-primary' }) {
  return (
    <div className="text-center">
      <p className={`text-lg font-bold font-head ${color}`}>{value ?? 0}</p>
      <p className="text-xs text-text-secondary">{label}</p>
    </div>
  );
}
