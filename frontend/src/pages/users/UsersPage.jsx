import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { usuariosApi } from '../../api/usuarios.js';
import { RolBadge } from '../../components/ui/Badge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const ROLES = ['admin_global', 'organizador', 'asistente'];

export default function UsersPage() {
  const { hasPermiso, usuario: me } = useAuth();
  const [usuarios,  setUsuarios]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [editingId, setEditingId] = useState(null);
  const [newRol,    setNewRol]    = useState('');
  const [deleting,  setDeleting]  = useState(null);

  useEffect(() => {
    if (!hasPermiso('usuarios:ver')) { setLoading(false); return; }
    usuariosApi.list()
      .then(data => setUsuarios(data.usuarios || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleRolChange = async (id) => {
    if (!newRol) return;
    try {
      const data = await usuariosApi.updateRol(id, newRol);
      setUsuarios(us => us.map(u => u.id === id ? { ...u, rol: data.usuario.rol } : u));
      setSuccess(`Rol actualizado a "${newRol}".`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar a "${nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(id);
    try {
      await usuariosApi.delete(id);
      setUsuarios(us => us.filter(u => u.id !== id));
      setSuccess('Usuario eliminado.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  if (!hasPermiso('usuarios:ver')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-text-primary">Acceso restringido</p>
          <p className="text-sm text-text-secondary mt-1">No tienes permiso para ver esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold font-head text-text-primary">Usuarios</h2>
        <p className="text-sm text-text-secondary">{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrados</p>
      </div>

      <Alert message={error}   type="error"   onClose={() => setError('')} />
      <Alert message={success} type="success" />

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
        ) : usuarios.length === 0 ? (
          <EmptyState icon={UsersIcon} title="Sin usuarios" description="Aún no hay usuarios registrados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="table-header text-left">Usuario</th>
                  <th className="table-header text-left">Rol</th>
                  <th className="table-header text-left hidden md:table-cell">Permisos</th>
                  <th className="table-header text-left hidden lg:table-cell">Registrado</th>
                  {hasPermiso('usuarios:editar') && <th className="table-header text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary text-xs font-semibold">
                            {u.nombre?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {u.nombre}
                            {String(u.id) === String(me?.id) && (
                              <span className="ml-1.5 text-[10px] text-text-secondary">(tú)</span>
                            )}
                          </p>
                          <p className="text-xs text-text-secondary">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      {editingId === u.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            className="input text-xs py-1 w-36"
                            value={newRol}
                            onChange={e => setNewRol(e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <button onClick={() => handleRolChange(u.id)} className="text-xs text-success hover:underline">
                            Guardar
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-text-secondary hover:underline">
                            ✕
                          </button>
                        </div>
                      ) : (
                        <RolBadge rol={u.rol} />
                      )}
                    </td>
                    <td className="table-cell hidden md:table-cell">
                      <p className="text-xs text-text-secondary">
                        {(u.permisos_efectivos || u.permisos || []).length} permisos
                      </p>
                    </td>
                    <td className="table-cell hidden lg:table-cell text-text-secondary text-xs">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('es-CO') : '—'}
                    </td>
                    {hasPermiso('usuarios:editar') && (
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-1">
                          {hasPermiso('usuarios:asignar_rol') && String(u.id) !== String(me?.id) && (
                            <button
                              onClick={() => { setEditingId(u.id); setNewRol(u.rol); }}
                              className="btn-ghost text-xs px-2 py-1"
                            >
                              Cambiar rol
                            </button>
                          )}
                          {hasPermiso('usuarios:eliminar') && String(u.id) !== String(me?.id) && (
                            <button
                              onClick={() => handleDelete(u.id, u.nombre)}
                              disabled={deleting === u.id}
                              className="btn-ghost text-xs px-2 py-1 text-danger"
                            >
                              {deleting === u.id ? <Spinner size="sm" /> : 'Eliminar'}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function UsersIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
}
