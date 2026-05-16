import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import AvatarUploader from '../../components/ui/AvatarUploader.jsx';
import { supabase } from '../../lib/supabase.js';
import { pagosApi } from '../../api/pagos.js';
import { usePush } from '../../hooks/usePush.js';

const TABS = [
  { label: 'Perfil',         icon: UserIcon       },
  { label: 'Pagos',          icon: WalletIcon     },
  { label: 'Notificaciones', icon: BellIcon       },
  { label: 'White-label',    icon: PaintIcon      },
  { label: 'API',            icon: CodeIcon       },
];

export default function SettingsPage() {
  const { usuario, updateProfile, updatePassword } = useAuth();
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
    const hayNombre = perfil.nombre && perfil.nombre !== usuario?.nombre;
    const hayPassword = Boolean(perfil.password);
    if (!hayNombre && !hayPassword) { warning('Sin cambios que guardar.'); return; }

    setLoading(true);
    try {
      if (hayNombre) {
        const r = await updateProfile({ nombre: perfil.nombre });
        if (!r.ok) throw new Error(r.error);
      }
      if (hayPassword) {
        const r = await updatePassword(perfil.password);
        if (!r.ok) throw new Error(r.error);
      }
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
          {/* Avatar + datos */}
          <div className="card p-5">
            <div className="flex items-center gap-5 flex-wrap">
              <AvatarUploader
                value={usuario?.foto}
                onChange={async (url) => {
                  try {
                    await supabase.auth.updateUser({ data: { foto: url } });
                    await supabase.from('profiles').update({ avatar_url: url || null }).eq('id', usuario.id);
                    success(url ? 'Avatar actualizado.' : 'Avatar quitado.');
                  } catch (e) { error(e.message); }
                }}
                userId={usuario?.id}
                initials={initials}
                size={88}
              />
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-text-1">{usuario?.nombre}</p>
                <p className="text-sm text-text-2">{usuario?.email}</p>
                <span className={`badge mt-2 ${usuario?.rol === 'admin_global' ? 'badge-purple' : usuario?.rol === 'organizador' ? 'badge-blue' : 'badge-gray'}`}>
                  {usuario?.rol === 'admin_global' ? 'Admin Global' : usuario?.rol === 'organizador' ? 'Organizador' : 'Asistente'}
                </span>
              </div>
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

      {/* Pagos */}
      {tab === 1 && <PagosTab />}

      {/* Notificaciones */}
      {tab === 2 && <NotificacionesTab />}

      {/* White-label */}
      {tab === 3 && <WhiteLabelTab />}

      {/* API */}
      {tab === 4 && (
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

/* ──────────── White-label Tab ──────────── */
function WhiteLabelTab() {
  const { usuario } = useAuth();
  const { success, error } = useToast();
  const branding = usuario?.raw?.user_metadata?.branding || {};
  const [logo,     setLogo]    = useState(usuario?.raw?.user_metadata?.empresa_logo_url || '');
  const [primary,  setPrimary] = useState(branding.primary || '#3B82F6');
  const [accent,   setAccent]  = useState(branding.accent || '#8B5CF6');
  const [plataforma, setPlataforma] = useState(branding.plataforma || '');
  const [saving, setSaving] = useState(false);

  const onGuardar = async () => {
    setSaving(true);
    try {
      const newBranding = { primary, accent, plataforma };
      await supabase.auth.updateUser({
        data: { branding: newBranding, empresa_logo_url: logo || null },
      });
      await supabase.from('profiles').update({
        empresa_logo_url: logo || null,
        branding: newBranding,
      }).eq('id', usuario.id);
      success('Branding guardado.');
    } catch (e) { error(e.message); }
    finally    { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="card-header">
          <h3 className="text-base font-semibold text-text-1">Marca de tu empresa</h3>
          <span className="badge-yellow text-xs">Plan Pro</span>
        </div>
        <div className="card-body grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Form */}
          <div className="space-y-5">
            <div className="field">
              <label className="label">Logo de tu empresa</label>
              <AvatarUploader
                value={logo}
                onChange={setLogo}
                userId={usuario?.id}
                initials={(usuario?.empresa || usuario?.nombre || 'U').charAt(0).toUpperCase()}
                size={96}
              />
            </div>

            <div className="field">
              <label className="label">Nombre de tu plataforma</label>
              <input
                value={plataforma} onChange={e => setPlataforma(e.target.value)}
                placeholder="Eventos de mi empresa"
                className="input rounded-2xl py-3"
              />
              <p className="text-xs text-text-3 mt-1.5">Lo que verán tus asistentes en lugar de &quot;GESTEK&quot;.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ColorField label="Color primario"  value={primary} onChange={setPrimary} />
              <ColorField label="Color accent"    value={accent}  onChange={setAccent} />
            </div>

            <div className="flex justify-end">
              <button onClick={onGuardar} disabled={saving} className="btn-gradient">
                {saving ? <><Spinner size="sm" /> Guardando...</> : 'Guardar branding'}
              </button>
            </div>
          </div>

          {/* Preview */}
          <aside>
            <p className="label">Vista previa</p>
            <div className="rounded-3xl border border-border-2 overflow-hidden">
              {/* "Navbar" simulado */}
              <div className="px-4 py-3 flex items-center gap-2 border-b border-border" style={{ background: `linear-gradient(90deg, ${primary}15, ${accent}10)` }}>
                {logo
                  ? <img src={logo} alt="" className="w-7 h-7 rounded-lg object-cover" />
                  : <div className="w-7 h-7 rounded-lg" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }} />}
                <span className="text-sm font-bold text-text-1">{plataforma || 'Tu plataforma'}</span>
              </div>
              <div className="p-4 space-y-3 bg-surface">
                <div className="aspect-video rounded-xl" style={{ background: `linear-gradient(135deg, ${primary}30, ${accent}20)` }} />
                <p className="text-base font-semibold text-text-1">Tu evento aquí</p>
                <p className="text-sm text-text-2 leading-relaxed">Así se vería el header de tus páginas públicas con tus colores.</p>
                <button className="px-4 py-2 rounded-full text-sm font-semibold text-white" style={{ background: primary }}>
                  Reservar
                </button>
              </div>
            </div>
            <p className="text-xs text-text-3 mt-3 leading-relaxed">
              La aplicación real del branding en las páginas públicas se habilita con el plan Pro. Por ahora guardas tus preferencias.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color" value={value}
          onChange={e => onChange(e.target.value)}
          className="h-12 w-14 rounded-xl cursor-pointer border border-border bg-transparent"
        />
        <input
          type="text" value={value}
          onChange={e => onChange(e.target.value)}
          className="input rounded-xl py-2.5 text-base font-mono tabular-nums"
        />
      </div>
    </div>
  );
}

/* ──────────── Pagos Tab (Mercado Pago) ──────────── */
function PagosTab() {
  const { usuario } = useAuth();
  const { success, error } = useToast();

  /* mp_* viven en la fila de profiles. AuthContext suele exponer raw user metadata,
     no necesariamente las columnas SQL. Hacemos un fetch directo a Supabase. */
  const [loading, setLoading] = useState(true);
  const [estado,  setEstado]  = useState({ conectado: false, mp_user_id: null, mp_public_key: '', mp_connected_at: null });
  const [accessToken, setAccessToken] = useState('');
  const [publicKey,   setPublicKey]   = useState('');
  const [working, setWorking] = useState(false);
  const [testInfo, setTestInfo] = useState(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const { data, error: e } = await supabase
        .from('profiles')
        .select('mp_user_id, mp_public_key, mp_connected_at')
        .eq('id', usuario.id).single();
      if (e) throw e;
      setEstado({
        conectado: !!data?.mp_user_id,
        mp_user_id: data?.mp_user_id,
        mp_public_key: data?.mp_public_key || '',
        mp_connected_at: data?.mp_connected_at,
      });
      setPublicKey(data?.mp_public_key || '');
    } catch (e) { error(e.message); }
    finally    { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const onConectar = async () => {
    if (!accessToken.trim()) { error('Pega tu access token.'); return; }
    setWorking(true);
    try {
      const r = await pagosApi.conectar(accessToken.trim(), publicKey.trim() || null);
      success(`Conectado a Mercado Pago como ${r.mp_user?.nickname || r.profile?.mp_user_id}.`);
      setAccessToken('');
      await cargar();
    } catch (e) { error(e.response?.data?.error || e.message); }
    finally    { setWorking(false); }
  };

  const onTest = async () => {
    setWorking(true);
    setTestInfo(null);
    try {
      const r = await pagosApi.test();
      setTestInfo(r.mp_user);
      success('Conexión OK con Mercado Pago.');
    } catch (e) { error(e.response?.data?.error || e.message); }
    finally    { setWorking(false); }
  };

  const onDesconectar = async () => {
    if (!window.confirm('¿Desconectar tu cuenta de Mercado Pago? Los pagos quedarán deshabilitados.')) return;
    setWorking(true);
    try {
      await pagosApi.desconectar();
      success('Cuenta desconectada.');
      setTestInfo(null);
      await cargar();
    } catch (e) { error(e.response?.data?.error || e.message); }
    finally    { setWorking(false); }
  };

  if (loading) return <div className="card p-6"><Spinner size="md" /></div>;

  return (
    <div className="space-y-5">
      <PlanProCard />

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="text-base font-semibold text-text-1">Mercado Pago</h3>
            <p className="text-xs text-text-3 mt-0.5">Procesa pagos de tus boletas usando tu propia cuenta MP.</p>
          </div>
          {estado.conectado ? (
            <span className="badge badge-green">Conectado</span>
          ) : (
            <span className="badge badge-gray">Sin conectar</span>
          )}
        </div>

        <div className="card-body space-y-5">
          {estado.conectado ? (
            <div className="bg-surface-2 rounded-2xl p-4 border border-border space-y-2">
              <Row label="MP User ID"   value={estado.mp_user_id} />
              <Row label="Public Key"   value={estado.mp_public_key || '—'} mono />
              <Row label="Conectado el" value={estado.mp_connected_at ? new Date(estado.mp_connected_at).toLocaleString() : '—'} />
              {testInfo && (
                <>
                  <div className="border-t border-border my-2" />
                  <Row label="Nickname" value={testInfo.nickname} />
                  <Row label="Email"    value={testInfo.email} />
                  <Row label="País"     value={testInfo.country_id} />
                </>
              )}
              <div className="flex gap-2 pt-3">
                <button onClick={onTest} disabled={working} className="btn-secondary btn-sm">
                  {working ? <Spinner size="sm" /> : null} Probar conexión
                </button>
                <button onClick={onDesconectar} disabled={working} className="btn-ghost btn-sm text-danger/80 hover:text-danger">
                  Desconectar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-text-2 leading-relaxed bg-primary/5 border border-primary/20 rounded-2xl p-4">
                <p className="font-medium text-text-1 mb-1">¿Dónde obtengo mis credenciales?</p>
                <p>Entrá a <a className="text-primary underline" href="https://www.mercadopago.com.co/developers/panel/app" target="_blank" rel="noreferrer">developers.mercadopago.com</a> → tu aplicación → <em>Credenciales de producción</em>. Copiá el <code className="font-mono text-xs">Access Token</code> y la <code className="font-mono text-xs">Public Key</code>.</p>
              </div>

              <div className="field">
                <label className="label">Access Token</label>
                <input
                  type="password" value={accessToken}
                  onChange={e => setAccessToken(e.target.value)}
                  placeholder="APP_USR-..."
                  className="input font-mono"
                />
                <p className="text-xs text-text-3 mt-1">Se guarda cifrado del lado servidor. Nunca se expone al frontend.</p>
              </div>

              <div className="field">
                <label className="label">Public Key (opcional)</label>
                <input
                  type="text" value={publicKey}
                  onChange={e => setPublicKey(e.target.value)}
                  placeholder="APP_USR-xxxxxxxx-..."
                  className="input font-mono"
                />
              </div>

              <div className="flex justify-end">
                <button onClick={onConectar} disabled={working || !accessToken.trim()} className="btn-gradient">
                  {working ? <><Spinner size="sm" /> Conectando...</> : 'Conectar cuenta'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-text-1">Cómo funciona</h3>
        </div>
        <ul className="card-body text-sm text-text-2 space-y-2 leading-relaxed list-disc pl-5">
          <li>Cada comprador paga directo a TU cuenta de Mercado Pago. GESTEK no toca el dinero.</li>
          <li>Cuando MP confirma el pago, recibimos un webhook y marcamos la boleta como <strong>pagada</strong> automáticamente.</li>
          <li>El comprador queda redirigido a su página <code className="font-mono">/mi-ticket/&lt;código&gt;</code> con el QR listo para el check-in.</li>
          <li>Si configuras la URL pública del backend en <code className="font-mono">API_PUBLIC_URL</code>, los webhooks llegarán incluso desde producción.</li>
        </ul>
      </div>
    </div>
  );
}

function formatPrecio(plan) {
  if (!plan) return '$79.900 COP';
  const cur = plan.currency || 'COP';
  if (cur === 'USD') return `USD $${plan.precio_usd || plan.precio || 19.99}`;
  return `$${Number(plan.precio || 79900).toLocaleString('es-CO')} ${cur}`;
}

function PlanProCard() {
  const { success, error } = useToast();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try { setPlan(await pagosApi.planEstado()); } catch (e) { /* silencioso */ }
    finally { setLoading(false); }
  };
  useEffect(() => { cargar(); }, []);

  /* Si volvemos del checkout MP con ?plan=ok, refrescá y avisá */
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('plan') === 'ok') {
      success('¡Pago recibido! Tu plan Pro se activará en cuanto MP nos confirme (suele ser instantáneo).');
      url.searchParams.delete('plan');
      window.history.replaceState({}, '', url.toString());
      setTimeout(cargar, 2500);
    }
  }, []);

  const comprar = async () => {
    setWorking(true);
    try {
      const r = await pagosApi.comprarPro();
      const link = r.checkout?.init_point || r.checkout?.sandbox_init_point;
      if (!link) throw new Error('Mercado Pago no devolvió el link.');
      window.location.href = link;
    } catch (e) { error(e.response?.data?.error || e.message); setWorking(false); }
  };

  if (loading) return null;
  const esPro = plan?.plan === 'pro';

  return (
    <div className="card border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="card-header">
        <div>
          <h3 className="text-base font-semibold text-text-1">Plan {esPro ? 'Pro' : 'Free'}</h3>
          <p className="text-xs text-text-3 mt-0.5">
            {esPro
              ? `Activo hasta ${plan.expires_at ? new Date(plan.expires_at).toLocaleDateString() : '—'}`
              : `Subí a Pro por ${formatPrecio(plan)} y desbloqueá white-label, dominio propio y la API.`}
          </p>
        </div>
        {esPro
          ? <span className="badge badge-green">Pro</span>
          : <span className="badge badge-gray">Free</span>}
      </div>
      <div className="card-body flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-text-2 max-w-md">
          {esPro
            ? 'Renovás manualmente cuando se acerque la fecha. Sin cobros automáticos.'
            : 'Pago único de 30 días vía Mercado Pago. Sin renovación automática, sin atarte a nada.'}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {plan?.dev_activation && (
            <button onClick={async () => {
              setWorking(true);
              try { await pagosApi.activarProDev(); success('Pro activado (modo dev).'); await cargar(); }
              catch (e) { error(e.response?.data?.error || e.message); }
              finally    { setWorking(false); }
            }} disabled={working} className="btn-secondary btn-sm" title="Activa Pro sin pasar por MP (solo dev)">
              <DevIcon /> Activar dev
            </button>
          )}
          <button onClick={comprar} disabled={working} className="btn-gradient">
            {working ? <><Spinner size="sm" /> Redirigiendo...</> : (esPro ? 'Renovar Pro 30 días más' : 'Pagar y activar Pro')}
          </button>
        </div>
      </div>
    </div>
  );
}

function DevIcon() { return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>; }

/* ──────────── Notificaciones Tab ──────────── */
function NotificacionesTab() {
  const { success, error: toastErr } = useToast();
  const { supported, permission, subscribed, working, subscribe, unsubscribe, test } = usePush();

  const onActivar = async () => {
    try { await subscribe(); success('Notificaciones activadas en este dispositivo.'); }
    catch (e) { toastErr(e.response?.data?.error || e.message); }
  };
  const onDesactivar = async () => {
    try { await unsubscribe(); success('Notificaciones desactivadas.'); }
    catch (e) { toastErr(e.message); }
  };
  const onTest = async () => {
    try {
      const r = await test();
      if (r.enviadas > 0) success(`Push enviado a ${r.enviadas} dispositivo${r.enviadas === 1 ? '' : 's'}.`);
      else toastErr('No se pudo enviar (¿permitiste notificaciones?)');
    } catch (e) { toastErr(e.response?.data?.error || e.message); }
  };

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="text-base font-semibold text-text-1">Notificaciones push</h3>
            <p className="text-xs text-text-3 mt-0.5">Recibí avisos del navegador sin tener GESTEK abierto.</p>
          </div>
          {subscribed
            ? <span className="badge badge-green">Activas</span>
            : <span className="badge badge-gray">Inactivas</span>}
        </div>

        <div className="card-body space-y-4">
          {!supported && (
            <div className="rounded-2xl bg-warning/10 border border-warning/20 px-4 py-3 text-sm text-text-2">
              Tu navegador no soporta notificaciones push. Probá con Chrome, Edge, Firefox o Safari 16+.
            </div>
          )}

          {supported && permission === 'denied' && (
            <div className="rounded-2xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-text-2">
              Bloqueaste las notificaciones para este sitio. Habilitalas desde la configuración del navegador (candado en la barra de URL) y volvé a intentar.
            </div>
          )}

          {supported && permission !== 'denied' && (
            <>
              <p className="text-sm text-text-2 leading-relaxed">
                {subscribed
                  ? 'Este dispositivo recibirá notificaciones. Podés activar otros (móvil, laptop) repitiendo el paso desde cada uno.'
                  : 'Activá notificaciones en este dispositivo. Si tenés otros, repetí el proceso desde cada uno.'}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                {!subscribed ? (
                  <button onClick={onActivar} disabled={working} className="btn-gradient">
                    {working ? <><Spinner size="sm" /> Activando...</> : 'Activar notificaciones'}
                  </button>
                ) : (
                  <>
                    <button onClick={onTest} disabled={working} className="btn-secondary btn-sm">
                      {working ? <Spinner size="sm" /> : null} Enviar push de prueba
                    </button>
                    <button onClick={onDesactivar} disabled={working} className="btn-ghost btn-sm text-danger/80 hover:text-danger">
                      Desactivar
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-text-1">Cómo funciona</h3>
        </div>
        <ul className="card-body text-sm text-text-2 space-y-2 leading-relaxed list-disc pl-5">
          <li>Cada dispositivo (laptop, móvil, tablet) se suscribe por separado. Activalas en cada uno donde uses GESTEK.</li>
          <li>Si cerrás el navegador o reiniciás el dispositivo, las notificaciones siguen llegando.</li>
          <li>El broadcast a asistentes desde un evento requiere plan Pro.</li>
        </ul>
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-text-3 uppercase tracking-wider">{label}</span>
      <span className={`text-sm text-text-1 truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}

function UserIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
}
function PaintIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
}
function BellIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
}
function WalletIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zm12 6h.01" /></svg>;
}
function CodeIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
}
