import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import logoG from '../assets/logo-g.svg';
import { InlineLoader } from '../components/ui/PageLoader.jsx';

const PARTICIPANTES = ['Menos de 50', '50 – 200', '200 – 1.000', 'Más de 1.000'];
const DUR_OUT = 420;
const DUR_IN  = 520;

export default function AuthPage() {
  const { pathname } = useLocation();
  const mode = pathname.startsWith('/register') ? 'register' : 'login';

  const [displayMode, setDisplayMode] = useState(mode);
  const [phase, setPhase] = useState('idle'); // idle | out | in

  useEffect(() => {
    if (mode === displayMode) return;
    setPhase('out');
    const t1 = setTimeout(() => {
      setDisplayMode(mode);
      setPhase('in');
      const t2 = setTimeout(() => setPhase('idle'), DUR_IN);
      return () => clearTimeout(t2);
    }, DUR_OUT);
    return () => clearTimeout(t1);
  }, [mode, displayMode]);

  const isLogin = displayMode === 'login';

  /* Animations:
     Login: form izquierda, texto derecha
     Register: form derecha, texto izquierda
     OUT: cada lado se desplaza hacia el centro y desaparece
     IN: nuevo contenido aparece desde el centro hacia su lado final  */
  const formAnim =
    phase === 'out'
      ? (isLogin ? 'animate-auth-out-right' : 'animate-auth-out-left')
      : phase === 'in'
      ? (isLogin ? 'animate-auth-in-right' : 'animate-auth-in-left')
      : '';
  const textAnim =
    phase === 'out'
      ? (isLogin ? 'animate-auth-out-left' : 'animate-auth-out-right')
      : phase === 'in'
      ? (isLogin ? 'animate-auth-in-left' : 'animate-auth-in-right')
      : '';

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-bg text-text-1 overflow-hidden px-4 sm:px-8 py-12">
      <BackgroundGlows isLogin={isLogin} />

      {/* Back button — top left of viewport, always visible */}
      <Link
        to="/"
        className="fixed top-5 left-5 z-30 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-surface/80 backdrop-blur-md text-sm font-medium text-text-2 hover:text-text-1 hover:bg-surface transition-all group"
      >
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver
      </Link>

      <div className="relative w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        {/* FORM panel */}
        <div className={`${isLogin ? 'lg:order-1' : 'lg:order-2'} ${formAnim} will-change-transform`}>
          <div className="w-full max-w-md mx-auto">
            {isLogin ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>

        {/* TEXT panel */}
        <div className={`${isLogin ? 'lg:order-2' : 'lg:order-1'} ${textAnim} will-change-transform hidden lg:block`}>
          <div className="max-w-md mx-auto">
            {isLogin ? <LoginText /> : <RegisterText />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Background ─────────── */
function BackgroundGlows({ isLogin }) {
  return (
    <div className="fixed inset-0 pointer-events-none -z-0">
      <div className={`absolute w-[700px] h-[700px] rounded-full blur-[160px] transition-all duration-1000 ${isLogin ? 'top-1/3 left-0 bg-primary/15' : 'top-1/3 right-0 bg-accent/15'}`} />
      <div className={`absolute w-[500px] h-[500px] rounded-full blur-[140px] transition-all duration-1000 ${isLogin ? 'bottom-0 right-1/4 bg-accent/10' : 'bottom-0 left-1/4 bg-primary/10'}`} />
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
    </div>
  );
}

/* ─────────── LOGIN ─────────── */
function LoginText() {
  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-3 group">
        <img src={logoG} alt="GESTEK" className="h-12 w-12 transition-transform group-hover:scale-110 drop-shadow-[0_0_18px_rgba(59,130,246,0.45)]" />
        <span className="text-2xl font-bold font-display tracking-tight">GESTEK</span>
      </Link>
      <h2 className="text-4xl xl:text-5xl font-bold font-display tracking-tight leading-[1.05]">
        Bienvenido de vuelta.
      </h2>
      <p className="text-lg text-text-2 leading-relaxed">
        Tu plataforma de eventos te está esperando. Gestiona inscripciones,
        asistencia, pagos y comunidad desde un solo lugar.
      </p>
      <div className="flex items-center gap-3 pt-4 border-t border-border-2">
        <div className="flex -space-x-2">
          {[0, 1, 2].map(i => (
            <div key={i} className={`w-9 h-9 rounded-full border-2 border-bg bg-gradient-to-br ${
              i === 0 ? 'from-primary to-accent' : i === 1 ? 'from-accent to-success' : 'from-success to-primary'
            }`} />
          ))}
        </div>
        <p className="text-sm text-text-2">Únete a los organizadores que ya usan GESTEK</p>
      </div>
    </div>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const { error: toastError } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const onChange = e => { setErr(''); setForm(f => ({ ...f, [e.target.name]: e.target.value })); };

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    const res = await login(form.email, form.password);
    setLoading(false);
    if (res.ok) navigate('/dashboard');
    else { setErr(res.error); toastError(res.error); }
  };

  return (
    <div>
      <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-8">
        <img src={logoG} alt="GESTEK" className="h-10 w-10" />
        <span className="text-xl font-bold font-display tracking-tight">GESTEK</span>
      </Link>

      <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-text-1 mb-2">
        Iniciar sesión
      </h1>
      <p className="text-base text-text-2 mb-8">
        ¿Aún no tienes cuenta?{' '}
        <Link to="/register" className="text-primary-light hover:text-primary font-semibold transition-colors">
          Crear una gratis
        </Link>
      </p>

      <form onSubmit={onSubmit} className="space-y-5">
        {err && (
          <div className="px-4 py-3 rounded-2xl bg-danger/10 border border-danger/20 text-danger-light text-sm">{err}</div>
        )}

        <div className="field">
          <label className="label">Email</label>
          <input
            type="email" name="email" value={form.email} onChange={onChange}
            className="input rounded-2xl py-3.5 text-base" placeholder="tu@empresa.com"
            required autoFocus autoComplete="email"
          />
        </div>

        <div className="field">
          <div className="flex items-center justify-between mb-1.5">
            <label className="label !mb-0">Contraseña</label>
            <Link to="/recuperar" className="text-xs text-text-2 hover:text-primary-light transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'} name="password"
              value={form.password} onChange={onChange}
              className="input rounded-2xl py-3.5 pr-12 text-base" placeholder="••••••••"
              required autoComplete="current-password"
            />
            <button
              type="button" onClick={() => setShowPwd(v => !v)}
              aria-label={showPwd ? 'Ocultar' : 'Mostrar'}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-text-3 hover:text-text-1 hover:bg-surface-2"
            >
              {showPwd
                ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-3.42M9.88 4.24A10.07 10.07 0 0112 4c5 0 9 4 10 8a13.43 13.43 0 01-2.6 3.94M6.6 6.6A13.43 13.43 0 002 12c1 4 5 8 10 8 1.59 0 3.07-.39 4.36-1.06"/></svg>
                : <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl text-base font-semibold bg-text-1 text-bg hover:bg-white transition-all shadow-[0_0_30px_rgba(241,245,249,0.18)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <InlineLoader message="Iniciando sesión..." /> : 'Iniciar sesión'}
        </button>
      </form>

      <p className="text-center text-xs text-text-3 mt-8">
        Al iniciar sesión aceptas nuestros términos de uso y política de privacidad.
      </p>
    </div>
  );
}

/* ─────────── REGISTER ─────────── */
function RegisterText() {
  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-3 group">
        <img src={logoG} alt="GESTEK" className="h-12 w-12 transition-transform group-hover:scale-110 drop-shadow-[0_0_18px_rgba(139,92,246,0.45)]" />
        <span className="text-2xl font-bold font-display tracking-tight">GESTEK</span>
      </Link>
      <p className="text-xs uppercase tracking-widest text-accent-light font-semibold">
        Plataforma todo-en-uno · Gratis para siempre
      </p>
      <h2 className="text-4xl xl:text-5xl font-bold font-display tracking-tight leading-[1.05]">
        Crea tu cuenta y monta tu primer evento hoy.
      </h2>
      <p className="text-lg text-text-2 leading-relaxed">
        Cuéntanos lo básico y preparamos tu entorno de trabajo. Si tienes Pro,
        el agente IA propone bloques iniciales según tu contexto.
      </p>
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border-2">
        {[
          ['Eventos ilimitados', 'Sin caducidad'],
          ['Pagos BRE-B', 'Sin comisión'],
          ['QR + Gamificación', 'Incluido'],
          ['Multi-usuario', 'Roles granulares'],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-border bg-surface/40 p-3">
            <p className="text-sm font-semibold text-text-1">{k}</p>
            <p className="text-xs text-text-3 mt-0.5">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegisterForm() {
  const { register } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [paso1, setPaso1] = useState({
    nombre: '', email: '', telefono: '', participantes: '', contexto: '', password: '',
  });
  const [paso2, setPaso2] = useState({
    fotoUrl: '', ocupacion: '', empresa: '', ciudad: '', aceptar: false,
  });

  const onChange1 = e => { setErr(''); setPaso1(f => ({ ...f, [e.target.name]: e.target.value })); };
  const onChange2 = e => { setErr(''); setPaso2(f => ({ ...f, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })); };

  const submitPaso1 = e => {
    e.preventDefault();
    if (paso1.password.length < 8) { setErr('La contraseña debe tener al menos 8 caracteres.'); return; }
    setStep(2);
  };

  const submitFinal = async e => {
    e.preventDefault();
    if (!paso2.aceptar) { setErr('Debes aceptar los términos para continuar.'); return; }
    setLoading(true);
    setErr('');
    const res = await register({
      nombre: paso1.nombre,
      email: paso1.email,
      password: paso1.password,
      rol: 'organizador',
      telefono: paso1.telefono,
      participantes: paso1.participantes,
      contexto: paso1.contexto,
      foto: paso2.fotoUrl,
      ocupacion: paso2.ocupacion,
      empresa: paso2.empresa,
      ciudad: paso2.ciudad,
    });
    setLoading(false);
    if (res.ok) {
      success('Cuenta creada. Revisa tu correo para confirmar.');
      setTimeout(() => navigate('/login'), 1500);
    } else {
      setErr(res.error);
      toastError(res.error);
    }
  };

  return (
    <div>
      <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-6">
        <img src={logoG} alt="GESTEK" className="h-10 w-10" />
        <span className="text-xl font-bold font-display tracking-tight">GESTEK</span>
      </Link>

      <div className="flex items-center gap-3 mb-7">
        {[1, 2].map(n => (
          <div key={n} className="flex items-center gap-2 flex-1">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              step >= n ? 'bg-text-1 text-bg' : 'bg-surface-2 text-text-3 border border-border'
            }`}>{n}</span>
            <span className={`text-xs font-medium ${step >= n ? 'text-text-1' : 'text-text-3'}`}>
              {n === 1 ? 'Acceso gratis' : 'Perfil del organizador'}
            </span>
            {n === 1 && <span className="flex-1 h-px bg-border" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <>
          <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-2">Acceder gratis</h1>
          <p className="text-base text-text-2 mb-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary-light hover:text-primary font-semibold transition-colors">Iniciar sesión</Link>
          </p>

          <form onSubmit={submitPaso1} className="space-y-4">
            {err && <div className="px-4 py-3 rounded-2xl bg-danger/10 border border-danger/20 text-danger-light text-sm">{err}</div>}

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="field">
                <label className="label">Nombre</label>
                <input name="nombre" value={paso1.nombre} onChange={onChange1}
                  className="input rounded-2xl py-3 text-base" placeholder="Juan Pérez" required autoFocus />
              </div>
              <div className="field">
                <label className="label">Email empresarial</label>
                <input type="email" name="email" value={paso1.email} onChange={onChange1}
                  className="input rounded-2xl py-3 text-base" placeholder="juan@empresa.com" required />
              </div>
            </div>

            <div className="field">
              <label className="label">Teléfono</label>
              <div className="grid grid-cols-[110px_1fr] gap-2">
                <select className="input rounded-2xl py-3"><option>+57 CO</option><option>+1 US</option><option>+34 ES</option><option>+52 MX</option></select>
                <input name="telefono" value={paso1.telefono} onChange={onChange1}
                  className="input rounded-2xl py-3 text-base" placeholder="300 000 0000" />
              </div>
            </div>

            <div className="field">
              <label className="label">Número esperado de participantes</label>
              <select name="participantes" value={paso1.participantes} onChange={onChange1} className="input rounded-2xl py-3 text-base" required>
                <option value="">Seleccionar...</option>
                {PARTICIPANTES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="field">
              <label className="label">Para preparar tu entorno de trabajo</label>
              <textarea
                name="contexto" value={paso1.contexto} onChange={onChange1} rows={2}
                className="input rounded-2xl py-3 text-base resize-none"
                placeholder="Qué eventos organizas, frecuencia e industria. El agente IA usará esto."
              />
            </div>

            <div className="field">
              <label className="label">Contraseña</label>
              <input type="password" name="password" value={paso1.password} onChange={onChange1}
                className="input rounded-2xl py-3 text-base" placeholder="Mínimo 8 caracteres" minLength={8} required />
            </div>

            <p className="text-[11px] text-text-3 leading-relaxed">
              Al continuar aceptas nuestros{' '}
              <a className="underline text-text-2 hover:text-text-1" href="#">términos</a> y{' '}
              <a className="underline text-text-2 hover:text-text-1" href="#">política de privacidad</a>.
            </p>

            <button type="submit" className="w-full py-3.5 rounded-2xl text-base font-semibold bg-text-1 text-bg hover:bg-white transition-all">
              Continuar
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-2">Perfil del organizador</h1>
          <p className="text-base text-text-2 mb-6">
            Estos datos aparecen en tu página pública y en los correos a tus asistentes.
          </p>

          <form onSubmit={submitFinal} className="space-y-4">
            {err && <div className="px-4 py-3 rounded-2xl bg-danger/10 border border-danger/20 text-danger-light text-sm">{err}</div>}

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-surface-2 border-2 border-dashed border-border-2 flex items-center justify-center overflow-hidden flex-shrink-0">
                {paso2.fotoUrl
                  ? <img src={paso2.fotoUrl} alt="" className="w-full h-full object-cover" />
                  : <svg className="w-8 h-8 text-text-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16l5-5a3 3 0 014 0l4 4m-2-2l1-1a3 3 0 014 0l2 2M14 7h.01M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>}
              </div>
              <div className="flex-1">
                <label className="label">Foto de perfil (URL)</label>
                <input name="fotoUrl" value={paso2.fotoUrl} onChange={onChange2}
                  className="input rounded-2xl py-3 text-base" placeholder="https://..." />
                <p className="text-[10px] text-text-3 mt-1.5">Upload directo llega con Supabase Storage en Fase 3.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="field">
                <label className="label">Ocupación</label>
                <input name="ocupacion" value={paso2.ocupacion} onChange={onChange2}
                  className="input rounded-2xl py-3 text-base" placeholder="Productor de eventos" />
              </div>
              <div className="field">
                <label className="label">Empresa</label>
                <input name="empresa" value={paso2.empresa} onChange={onChange2}
                  className="input rounded-2xl py-3 text-base" placeholder="Tu empresa" />
              </div>
            </div>

            <div className="field">
              <label className="label">Ciudad</label>
              <input name="ciudad" value={paso2.ciudad} onChange={onChange2}
                className="input rounded-2xl py-3 text-base" placeholder="Ibagué, Colombia" />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" name="aceptar" checked={paso2.aceptar} onChange={onChange2}
                className="mt-1 w-4 h-4 rounded border-border bg-surface-2 accent-primary" />
              <span className="text-xs text-text-2 leading-relaxed">
                Acepto recibir comunicaciones por correo de GESTEK. Puedo darme de baja cuando quiera.
              </span>
            </label>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 py-3.5 rounded-2xl text-base font-medium text-text-1 border border-border-2 hover:bg-surface-2 transition-colors">
                Atrás
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-3.5 rounded-2xl text-base font-semibold bg-text-1 text-bg hover:bg-white transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <InlineLoader message="Creando cuenta..." /> : 'Registrarme'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
