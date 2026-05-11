import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

const TABS = ['Perfil', 'White-label', 'API'];

export default function SettingsPage() {
  const { usuario, refreshMe } = useAuth();
  const [tab,     setTab]     = useState(0);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const [perfil, setPerfil] = useState({ nombre: usuario?.nombre || '', password: '', confirm: '' });

  const handlePerfilSave = async (e) => {
    e.preventDefault();
    if (perfil.password && perfil.password !== perfil.confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { authApi } = await import('../../api/auth.js');
      const updates = {};
      if (perfil.nombre !== usuario?.nombre) updates.nombre = perfil.nombre;
      if (perfil.password) updates.password = perfil.password;
      if (Object.keys(updates).length === 0) { setSuccess('Sin cambios.'); return; }
      await authApi.updateMe(updates);
      await refreshMe();
      setSuccess('Perfil actualizado correctamente.');
      setPerfil(p => ({ ...p, password: '', confirm: '' }));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-bold font-head text-text-primary">Configuración</h2>
        <p className="text-sm text-text-secondary">Administra tu cuenta y opciones de la plataforma.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
              ${tab === i
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <Alert message={error}   type="error"   onClose={() => setError('')} />
      <Alert message={success} type="success" />

      {/* Tab: Perfil */}
      {tab === 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-text-primary">Información personal</h3>
          </div>
          <form onSubmit={handlePerfilSave} className="card-body space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" value={usuario?.email || ''} disabled className="input opacity-60 cursor-not-allowed" />
              <p className="text-xs text-text-secondary mt-1">El email no se puede cambiar.</p>
            </div>
            <div>
              <label className="label">Nombre completo</label>
              <input
                type="text"
                className="input"
                value={perfil.nombre}
                onChange={e => setPerfil(p => ({ ...p, nombre: e.target.value }))}
                required
              />
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-sm font-medium text-text-primary mb-3">Cambiar contraseña</p>
              <div className="space-y-3">
                <div>
                  <label className="label">Nueva contraseña</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Dejar vacío para no cambiar"
                    value={perfil.password}
                    onChange={e => setPerfil(p => ({ ...p, password: e.target.value }))}
                    minLength={perfil.password ? 8 : undefined}
                  />
                </div>
                {perfil.password && (
                  <div>
                    <label className="label">Confirmar contraseña</label>
                    <input
                      type="password"
                      className="input"
                      placeholder="Repite la nueva contraseña"
                      value={perfil.confirm}
                      onChange={e => setPerfil(p => ({ ...p, confirm: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <><Spinner size="sm" /> Guardando...</> : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: White-label */}
      {tab === 1 && (
        <div className="space-y-4">
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-text-primary">Branding White-label</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label">Nombre de la plataforma</label>
                <input type="text" className="input" placeholder="Mi Plataforma de Eventos" defaultValue="GESTEK" />
              </div>
              <div>
                <label className="label">URL del logo</label>
                <input type="url" className="input" placeholder="https://mi-empresa.com/logo.png" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Color primario</label>
                  <div className="flex gap-2">
                    <input type="color" className="w-10 h-10 rounded cursor-pointer bg-surface-2 border border-border" defaultValue="#2563EB" />
                    <input type="text" className="input" defaultValue="#2563EB" />
                  </div>
                </div>
                <div>
                  <label className="label">Color accent</label>
                  <div className="flex gap-2">
                    <input type="color" className="w-10 h-10 rounded cursor-pointer bg-surface-2 border border-border" defaultValue="#7C3AED" />
                    <input type="text" className="input" defaultValue="#7C3AED" />
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Dominio personalizado</label>
                <input type="text" className="input" placeholder="eventos.mi-empresa.com" />
                <p className="text-xs text-text-secondary mt-1">Requiere configuración DNS. Contacta soporte.</p>
              </div>
              <div className="flex justify-end">
                <button className="btn-primary" disabled>Guardar branding <span className="ml-1 text-[10px] opacity-70">(próximamente)</span></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: API */}
      {tab === 2 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-text-primary">Información de la API</h3>
          </div>
          <div className="card-body space-y-4">
            <div className="bg-surface-2 rounded-lg p-4 space-y-3">
              <ApiRow label="Base URL"    value={window.location.origin + '/'} />
              <ApiRow label="Versión"     value="2.0.0" />
              <ApiRow label="Auth"        value="Bearer JWT (8h)" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary mb-2">Endpoints principales</p>
              <div className="space-y-1 font-mono text-xs text-text-secondary">
                {[
                  'POST   /auth/register',
                  'POST   /auth/login',
                  'GET    /auth/me',
                  'GET    /eventos',
                  'POST   /eventos',
                  'PATCH  /eventos/:id',
                  'DELETE /eventos/:id',
                  'POST   /eventos/:id/publicar',
                  'GET    /usuarios',
                ].map(ep => (
                  <div key={ep} className="bg-surface-2 px-3 py-1.5 rounded">{ep}</div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              <span className="text-xs text-text-secondary">API operativa</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ApiRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-secondary">{label}</span>
      <span className="text-xs text-text-primary font-mono">{value}</span>
    </div>
  );
}
