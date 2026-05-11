import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import logoUrl from '../assets/logo-gestek.svg';
import { InlineLoader } from '../components/ui/PageLoader.jsx';

export default function LoginPage() {
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
    <div className="relative min-h-screen grid lg:grid-cols-2 bg-bg text-text-1 overflow-hidden">
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

      {/* Left — branded panel */}
      <aside className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden bg-gradient-to-br from-primary/30 via-bg to-accent/20 animate-slide-in-left">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/20 blur-[100px]" />
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        </div>

        <Link to="/" className="relative flex items-center gap-2 w-fit">
          <img src={logoUrl} alt="GESTEK" className="h-14 w-auto" />
        </Link>

        <div className="relative space-y-6 max-w-md">
          <h2 className="text-4xl xl:text-5xl font-bold font-display tracking-tight leading-[1.1]">
            Bienvenido de vuelta.
          </h2>
          <p className="text-base text-text-2 leading-relaxed">
            Tu plataforma de eventos te está esperando. Gestiona inscripciones,
            asistencia, pagos y comunidad desde un solo lugar.
          </p>
          <div className="flex items-center gap-3 pt-4 border-t border-border-2">
            <div className="flex -space-x-2">
              {[0,1,2].map(i => (
                <div key={i} className={`w-8 h-8 rounded-full border-2 border-bg bg-gradient-to-br ${
                  i === 0 ? 'from-primary to-accent' : i === 1 ? 'from-accent to-success' : 'from-success to-primary'
                }`} />
              ))}
            </div>
            <p className="text-xs text-text-2">+2.000 organizadores ya usan GESTEK</p>
          </div>
        </div>

        <p className="relative text-xs text-text-3">© {new Date().getFullYear()} GESTEK. Manage. Automate. Scale.</p>
      </aside>

      {/* Right — form */}
      <main className="relative flex flex-col justify-center px-6 sm:px-12 py-12 overflow-hidden">
        <div className="w-full max-w-md mx-auto animate-slide-in-right">
          <Link to="/" className="lg:hidden inline-flex mb-8 mt-8">
            <img src={logoUrl} alt="GESTEK" className="h-12 w-auto" />
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-text-1 mb-2">
            Iniciar sesión
          </h1>
          <p className="text-sm text-text-2 mb-10">
            ¿Aún no tienes cuenta?{' '}
            <Link to="/register" className="text-primary-light hover:text-primary font-semibold transition-colors">
              Crear una gratis
            </Link>
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            {err && (
              <div className="px-4 py-3 rounded-2xl bg-danger/10 border border-danger/20 text-danger-light text-sm">
                {err}
              </div>
            )}

            <div className="field">
              <label className="label">Email</label>
              <input
                type="email" name="email" value={form.email} onChange={onChange}
                className="input rounded-2xl py-3.5" placeholder="tu@empresa.com"
                required autoFocus autoComplete="email"
              />
            </div>

            <div className="field">
              <div className="flex items-center justify-between mb-1.5">
                <label className="label !mb-0">Contraseña</label>
                <Link to="/recuperar" className="text-[11px] text-text-2 hover:text-primary-light transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} name="password"
                  value={form.password} onChange={onChange}
                  className="input rounded-2xl py-3.5 pr-12" placeholder="••••••••"
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
              className="w-full py-3.5 rounded-2xl text-sm font-semibold bg-text-1 text-bg hover:bg-white transition-all shadow-[0_0_30px_rgba(241,245,249,0.18)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <InlineLoader message="Iniciando sesión..." /> : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-[11px] text-text-3 mt-8">
            Al iniciar sesión aceptas nuestros términos de uso y política de privacidad.
          </p>
        </div>
      </main>
    </div>
  );
}
