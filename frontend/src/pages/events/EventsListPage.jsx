import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { eventosApi } from '../../api/eventos.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { EstadoBadge, ModalidadBadge } from '../../components/ui/Badge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Alert from '../../components/ui/Alert.jsx';

const MODALIDADES = [
  { value: '', label: 'Todas las modalidades' },
  { value: 'fisico',   label: 'Físico' },
  { value: 'virtual',  label: 'Virtual' },
  { value: 'hibrido',  label: 'Híbrido' },
];
const ESTADOS = [
  { value: '', label: 'Todos los estados' },
  { value: 'borrador',   label: 'Borrador' },
  { value: 'publicado',  label: 'Publicado' },
  { value: 'cancelado',  label: 'Cancelado' },
];

export default function EventsListPage() {
  const { hasPermiso } = useAuth();
  const [eventos,  setEventos]  = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [filters,  setFilters]  = useState({ q: '', modalidad: '', estado: '', page: 1 });
  const [deleting, setDeleting] = useState(null);

  const fetchEventos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 20, page: filters.page };
      if (filters.q)         params.q         = filters.q;
      if (filters.modalidad) params.modalidad  = filters.modalidad;
      if (filters.estado)    params.estado     = filters.estado;
      const data = await eventosApi.list(params);
      setEventos(data.eventos || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchEventos(); }, [fetchEventos]);

  const handleFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar el evento "${nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(id);
    try {
      await eventosApi.delete(id);
      setEventos(ev => ev.filter(e => e.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handlePublicar = async (id) => {
    try {
      const data = await eventosApi.publicar(id);
      setEventos(ev => ev.map(e => e.id === id ? { ...e, estado: 'publicado' } : e));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-head text-text-primary">Eventos</h2>
          <p className="text-sm text-text-secondary">{total} evento{total !== 1 ? 's' : ''} en total</p>
        </div>
        {hasPermiso('eventos:crear') && (
          <Link to="/eventos/nuevo" className="btn-primary">
            <PlusIcon className="w-4 h-4" />
            Crear evento
          </Link>
        )}
      </div>

      <Alert message={error} type="error" onClose={() => setError('')} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            className="input"
            placeholder="Buscar por nombre..."
            value={filters.q}
            onChange={e => handleFilter('q', e.target.value)}
          />
        </div>
        <select className="input w-auto" value={filters.modalidad} onChange={e => handleFilter('modalidad', e.target.value)}>
          {MODALIDADES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select className="input w-auto" value={filters.estado} onChange={e => handleFilter('estado', e.target.value)}>
          {ESTADOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
        ) : eventos.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            title="Sin eventos"
            description="No se encontraron eventos con los filtros actuales."
            action={hasPermiso('eventos:crear') && <Link to="/eventos/nuevo" className="btn-primary">Crear evento</Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="table-header text-left">Nombre</th>
                  <th className="table-header text-left hidden md:table-cell">Fecha</th>
                  <th className="table-header text-left hidden lg:table-cell">Modalidad</th>
                  <th className="table-header text-left">Estado</th>
                  <th className="table-header text-left hidden lg:table-cell">Asistentes</th>
                  <th className="table-header text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map(ev => (
                  <tr key={ev.id} className="table-row">
                    <td className="table-cell">
                      <Link to={`/eventos/${ev.id}`} className="font-medium hover:text-primary transition-colors">
                        {ev.nombre}
                      </Link>
                      {ev.descripcion && (
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{ev.descripcion}</p>
                      )}
                    </td>
                    <td className="table-cell hidden md:table-cell text-text-secondary text-xs">
                      {ev.fecha_inicio
                        ? new Date(ev.fecha_inicio).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })
                        : '—'}
                    </td>
                    <td className="table-cell hidden lg:table-cell">
                      <ModalidadBadge modalidad={ev.modalidad} />
                    </td>
                    <td className="table-cell">
                      <EstadoBadge estado={ev.estado} />
                    </td>
                    <td className="table-cell hidden lg:table-cell text-text-secondary text-sm">
                      {ev.asistentes_count || 0}
                      {ev.capacidad_total ? ` / ${ev.capacidad_total}` : ''}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/eventos/${ev.id}`} className="btn-ghost text-xs px-2 py-1">Ver</Link>
                        {hasPermiso('eventos:publicar') && ev.estado === 'borrador' && (
                          <button onClick={() => handlePublicar(ev.id)} className="btn-ghost text-xs px-2 py-1 text-success">
                            Publicar
                          </button>
                        )}
                        {hasPermiso('eventos:eliminar') && (
                          <button
                            onClick={() => handleDelete(ev.id, ev.nombre)}
                            disabled={deleting === ev.id}
                            className="btn-ghost text-xs px-2 py-1 text-danger"
                          >
                            {deleting === ev.id ? <Spinner size="sm" /> : 'Eliminar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 20 && (
          <div className="px-6 py-3 border-t border-border flex items-center justify-between">
            <p className="text-xs text-text-secondary">
              Página {filters.page} · {total} resultados
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters(f => ({ ...f, page: Math.max(1, f.page - 1) }))}
                disabled={filters.page === 1}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Anterior
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                disabled={filters.page * 20 >= total}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlusIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function CalendarIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
