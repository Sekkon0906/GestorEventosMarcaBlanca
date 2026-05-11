import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import logoUrl from '../assets/logo-gestek.svg';
import { InlineLoader } from '../components/ui/PageLoader.jsx';

const PARTICIPANTES = ['Menos de 50', '50 – 200', '200 – 1.000', 'Más de 1.000'];

export default function RegisterPage() {
  const { register } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Step 1
  const [paso1, setPaso1] = useState({
    nombre: '', email: '', telefono: '', participantes: '', contexto: '', password: '',
  });
  // Step 2
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
    <div className="relative min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-bg text-text-1 overflow-hidden">
      {/* Back button — fixed top-left */}
      <Link
        to="/"
        className="fixed top-5 left-5 z-30 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-surface/70 backdrop-blur-md text-sm font-medium text-text-2 hover:text-text-1 hover:bg-surface transition-all group"
      >
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver
      </Link>

      {/* Left hero */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-bg via-surface to-primary/20 animate-slide-in-right">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-primary/15 blur-[140px]" />
          <div className="absolute bottom-0 -left-20 w-[500px] h-[500px] rounded-full bg-accent/15 blur-[120px]" />
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        </div>

        <Link to="/" className="relative flex items-center gap-2 w-fit">
          <img src={logoUrl} alt="GESTEK" className="h-14 w-auto" />
        </Link>

        <div className="relative max-w-md">
          <p className="text-xs uppercase tracking-widest text-primary-light font-semibold mb-4">
            Plataforma todo-en-uno para gestión de eventos
          </p>
          <h2 className="text-4xl xl:text-5xl font-bold font-display tracking-tight leading-[1.05] mb-6">
            Estamos aquí para asegurar el éxito de tus eventos
          </h2>
          <p className="text-base text-text-2 leading-relaxed">
            Crea tu cuenta gratis y cuéntanos sobre tus eventos. Te ayudaremos a preparar tu
            entorno de trabajo con sugerencias adaptadas a tu contexto.
          </p>
        </div>

        <div className="relative flex items-center gap-3 text-xs text-text-3">
          <div className="flex -space-x-2">
            {[0, 1, 2].map(i => (
              <div key={i} className={`w-7 h-7 rounded-full border-2 border-bg bg-gradient-to-br ${
                i === 0 ? 'from-primary to-accent' : i === 1 ? 'from-accent to-success' : 'from-success to-primary'
              }`} />
            ))}
          </div>
          <span>Confía en GESTEK como +2.000 organizadores</span>
        </div>
      </aside>

      {/* Right form card */}
      <main className="relative flex flex-col justify-center px-6 sm:px-12 py-12 overflow-hidden">
        <div className="w-full max-w-lg mx-auto animate-slide-in-left">
          <Link to="/" className="lg:hidden inline-flex mb-6 mt-8">
            <img src={logoUrl} alt="GESTEK" className="h-12 w-auto" />
          </Link>

          {/* Stepper */}
          <div className="flex items-center gap-3 mb-8">
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
              <p className="text-sm text-text-2 mb-7">
                Cuéntanos lo básico. Con esto preparamos tu entorno de trabajo.
              </p>

              <form onSubmit={submitPaso1} className="space-y-4">
                {err && <div className="px-4 py-3 rounded-2xl bg-danger/10 border border-danger/20 text-danger-light text-sm">{err}</div>}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="field">
                    <label className="label">Nombre</label>
                    <input name="nombre" value={paso1.nombre} onChange={onChange1}
                      className="input rounded-2xl py-3" placeholder="Juan Pérez" required autoFocus />
                  </div>
                  <div className="field">
                    <label className="label">Email empresarial</label>
                    <input type="email" name="email" value={paso1.email} onChange={onChange1}
                      className="input rounded-2xl py-3" placeholder="juan@empresa.com" required />
                  </div>
                </div>

                <div className="field">
                  <label className="label">Teléfono</label>
                  <div className="grid grid-cols-[110px_1fr] gap-2">
                    <select className="input rounded-2xl py-3"><option>+57 CO</option><option>+1 US</option><option>+34 ES</option><option>+52 MX</option></select>
                    <input name="telefono" value={paso1.telefono} onChange={onChange1}
                      className="input rounded-2xl py-3" placeholder="300 000 0000" />
                  </div>
                </div>

                <div className="field">
                  <label className="label">Número esperado de participantes</label>
                  <select name="participantes" value={paso1.participantes} onChange={onChange1} className="input rounded-2xl py-3" required>
                    <option value="">Seleccionar...</option>
                    {PARTICIPANTES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="field">
                  <label className="label">Para preparar tu entorno de trabajo</label>
                  <textarea
                    name="contexto" value={paso1.contexto} onChange={onChange1} rows={3}
                    className="input rounded-2xl py-3 resize-none"
                    placeholder="Cuéntanos qué eventos organizas, frecuencia, tu industria. La IA usará esto para sugerir bloques iniciales."
                  />
                </div>

                <div className="field">
                  <label className="label">Contraseña</label>
                  <input type="password" name="password" value={paso1.password} onChange={onChange1}
                    className="input rounded-2xl py-3" placeholder="Mínimo 8 caracteres" minLength={8} required />
                </div>

                <p className="text-[11px] text-text-3 leading-relaxed">
                  Al continuar confirmas que has leído y aceptado nuestros{' '}
                  <a className="underline text-text-2 hover:text-text-1" href="#">términos de uso</a> y nuestra{' '}
                  <a className="underline text-text-2 hover:text-text-1" href="#">política de privacidad</a>.
                </p>

                <button type="submit" className="w-full py-3.5 rounded-2xl text-sm font-semibold bg-text-1 text-bg hover:bg-white transition-all">
                  Continuar
                </button>

                <p className="text-center text-sm text-text-2">
                  ¿Ya tienes cuenta?{' '}
                  <Link to="/login" className="text-primary-light hover:text-primary font-semibold transition-colors">Iniciar sesión</Link>
                </p>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-2">Perfil del organizador</h1>
              <p className="text-sm text-text-2 mb-7">
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
                      className="input rounded-2xl py-3" placeholder="https://..." />
                    <p className="text-[10px] text-text-3 mt-1.5">Subida directa de archivo llega en Fase 3 con Supabase Storage.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="field">
                    <label className="label">Ocupación</label>
                    <input name="ocupacion" value={paso2.ocupacion} onChange={onChange2}
                      className="input rounded-2xl py-3" placeholder="Productor de eventos" />
                  </div>
                  <div className="field">
                    <label className="label">Empresa u organización</label>
                    <input name="empresa" value={paso2.empresa} onChange={onChange2}
                      className="input rounded-2xl py-3" placeholder="Tu empresa" />
                  </div>
                </div>

                <div className="field">
                  <label className="label">Ciudad</label>
                  <input name="ciudad" value={paso2.ciudad} onChange={onChange2}
                    className="input rounded-2xl py-3" placeholder="Ibagué, Colombia" />
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" name="aceptar" checked={paso2.aceptar} onChange={onChange2}
                    className="mt-1 w-4 h-4 rounded border-border bg-surface-2 accent-primary" />
                  <span className="text-xs text-text-2 leading-relaxed">
                    Acepto recibir comunicaciones por correo de GESTEK. Puedo darme de baja en cualquier momento.
                  </span>
                </label>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-medium text-text-1 border border-border-2 hover:bg-surface-2 transition-colors">
                    Atrás
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-semibold bg-text-1 text-bg hover:bg-white transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading ? <InlineLoader message="Creando cuenta..." /> : 'Registrarme'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
