import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { authApi } from '../../api/auth.js';

const TABS = [
  { label: 'Perfil',       icon: UserIcon       },
  { label: 'White-label',  icon: PaintIcon      },
  { label: 'API',          icon: CodeIcon       },
];

export default function SettingsPage() {
  const { usuario, refreshMe }     = useAuth();
  const { success, error, warning } = useToast();
  const [tab,     setTab]     = useState(0);
  const [loading, setLoading] = useState(false);

  const [perfil, setPerfil] = useState({
    nombre  : usuario?.nombre   || '',
    password: '',
    confirm : '',
  });

  const handlePerfilSave = async (e) => {
    e.preventDefault();
    if (perfil.password && perfil.password !== perfil.confirm) {
      error('Las contraseñas no coinciden.');
      return;
    }
    const updates = {};
    if (perfil.nombre !== usuario?.nombre) updates.nombre = perfil.nombre;
    if (perfil.password) updates.password = perfil.password;
    if (Object.keys(updates).length === 0) { warning('Sin cambios que guardar.'); return; }

    setLoading(true);
    try {
      await authApi.updateMe(updates);
      await refreshMe();
      success('Perfil actualizado correctamente.');
      setPerfil(p => ({ ...p, password: '', confirm: '' }));
    } catch (e) {
      error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const initials = usuario?.nombre?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'U';

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-[fadeUp_0.4s_ease_both]">
      <div>
        <h1 className="text-xl font-bold font-display text-text-1">Configuración</h1>
        <p className="text-sm text-text-2 mt-0.5">Administra tu cuenta y opciones de la plataforma.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t, i) => {
          const Icon = t.icon;
          return (
            <button
              key={i}
              onClick={() => setTab(i)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px
                ${tab === i
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-2 hover:text-text-1'}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Perfil */}
      {tab === 0 && (
        <div className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4 p-5 card">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary shadow-glow-sm flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold font-display">{initials}</span>
            </div>
            <div>
              <p className="text-base font-semibold text-text-1">{usuario?.nombre}</p>
              <p className="text-sm text-text-2">{usuario?.email}</p>
              <span className={`badge mt-1 ${usuario?.rol === 'admin_global' ? 'badge-purple' : usuario?.rol === 'organizador' ? 'badge-blue' : 'badge-gray'}`}>
                {usuario?.rol === 'admin_global' ? 'Admin Global' : usuario?.rol === 'organizador' ? 'Organizador' : 'Asistente'}
              </span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-text-1">Información personal</h3>
            </div>
            <form onSubmit={handlePerfilSave} className="card-body space-y-4">
              <div className="field">
                <label className="label">Email</label>
                <input type="email" value={usuario?.email || ''} disabled
                  className="input opacity-50 cursor-not-allowed" />
                <p className="text-xs text-text-3 mt-1">El email no se puede cambiar.</p>
              </div>
              <div className="field">
                <label className="label">Nombre completo</label>
                <input type="text" className="input" value={perfil.nombre}
                  onChange={e => setPerfil(p => ({ ...p, nombre: e.target.value }))} required />
              </div>

              <div className="pt-3 border-t border-border space-y-3">
                <p className="text-sm font-medium text-text-1">Cambiar contraseña</p>
                <div className="field">
                  <label className="label">Nueva contraseña</label>
                  <input type="password" className="input" placeholder="Dejar vacío para no cambiar"
                    value={perfil.password} onChange={e => setPerfil(p => ({ ...p, password: e.target.value }))}
                    minLength={perfil.password ? 8 : undefined} />
                </div>
                {perfil.password && (
                  <div className="field">
                    <label className="label">Confirmar contraseña</label>
                    <input type="password" className="input" placeholder="Repite la nueva contraseña"
                      value={perfil.confirm} onChange={e => setPerfil(p => ({ ...p, confirm: e.target.value }))} />
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? <><Spinner size="sm" /> Guardando...</> : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* White-label */}
      {tab === 1 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-text-1">Branding White-label</h3>
            <span className="badge-yellow">Próximamente</span>
          </div>
          <div className="card-body space-y-4">
            <div className="field">
              <label className="label">Nombre de la plataforma</label>
              <input type="text" className="input" placeholder="Mi Plataforma" defaultValue="GESTEK" />
            </div>
            <div className="field">
              <label className="label">URL del logo</label>
              <input type="url" className="input" placeholder="https://mi-empresa.com/logo.png" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="field">
                <label className="label">Color primario</label>
                <div className="flex gap-2">
                  <input type="color" className="h-10 w-10 rounded-lg cursor-pointer border border-border bg-surface-2" defaultValue="#3B82F6" />
                  <input type="text" className="input" defaultValue="#3B82F6" />
                </div>
              </div>
              <div className="field">
                <label className="label">Color accent</label>
                <div className="flex gap-2">
                  <input type="color" className="h-10 w-10 rounded-lg cursor-pointer border border-border bg-surface-2" defaultValue="#8B5CF6" />
                  <input type="text" className="input" defaultValue="#8B5CF6" />
                </div>
              </div>
            </div>
            <div className="field">
              <label className="label">Dominio personalizado</label>
              <input type="text" className="input" placeholder="eventos.mi-empresa.com" />
              <p className="text-xs text-text-3 mt-1">Requiere configuración DNS. Contacta soporte.</p>
            </div>
            <div className="flex justify-end">
              <button className="btn-primary" disabled>
                Guardar branding
                <span className="ml-1.5 badge-yellow text-[10px]">pronto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API */}
      {tab === 2 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-text-1">Referencia de la API</h3>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              <span className="text-xs text-success">Operativa</span>
            </div>
          </div>
          <div className="card-body space-y-5">
            <div className="bg-surface-2 rounded-xl p-4 border border-border space-y-2.5">
              {[
                { label: 'Base URL',  value: window.location.origin + '/'  },
                { label: 'Versión',   value: '2.0.0'                       },
                { label: 'Auth',      value: 'Bearer JWT (8h)'             },
                { label: 'Rate limit',value: '100 req/min'                 },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-xs text-text-2">{r.label}</span>
                  <code className="text-xs text-primary-light font-mono bg-primary/10 px-2 py-0.5 rounded">{r.value}</code>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-3 mb-3">Endpoints</p>
              <div className="space-y-1">
                {[
                  ['POST',   '/auth/register',          'Registrar usuario'    ],
                  ['POST',   '/auth/login',             'Iniciar sesión'       ],
                  ['GET',    '/auth/me',                'Perfil del usuario'   ],
                  ['GET',    '/eventos',                'Listar eventos'       ],
                  ['POST',   '/eventos',                'Crear evento'         ],
                  ['PATCH',  '/eventos/:id',            'Actualizar evento'    ],
                  ['DELETE', '/eventos/:id',            'Eliminar evento'      ],
                  ['POST',   '/eventos/:id/publicar',   'Publicar evento'      ],
                  ['POST',   '/eventos/:id/inscribirse','Inscribirse'          ],
                  ['GET',    '/usuarios',               'Listar usuarios'      ],
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors group">
                    <span className={`text-[10px] font-mono font-bold w-12 flex-shrink-0 ${
                      method === 'GET'    ? 'text-success'    :
                      method === 'POST'   ? 'text-primary'    :
                      method === 'PATCH'  ? 'text-warning'    :
                      'text-danger'
                    }`}>{method}</span>
                    <code className="text-xs font-mono text-text-2 flex-1">{path}</code>
                    <span className="text-[10px] text-text-3 hidden group-hover:block">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
}
function PaintIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
}
function CodeIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
}
