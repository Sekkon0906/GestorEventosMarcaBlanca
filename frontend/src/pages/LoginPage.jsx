import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';

export default function LoginPage() {
  const { login }  = useAuth();
  const { error: toastError } = useToast();
  const navigate   = useNavigate();

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  const handleChange = e => { setErr(''); setForm(f => ({ ...f, [e.target.name]: e.target.value })); };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    const res = await login(form.email, form.password);
    setLoading(false);
    if (res.ok) {
      navigate('/dashboard');
    } else {
      setErr(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-accent/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative animate-[fadeUp_0.5s_ease_both]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-primary shadow-glow mb-5">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold font-display text-text-1">Bienvenido a GESTEK</h1>
          <p className="text-sm text-text-2 mt-1">The operating system for events</p>
        </div>

        <div className="card-glass rounded-2xl overflow-hidden">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              {err && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-danger/10 border border-danger/20 text-danger-light text-sm">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{err}</span>
                </div>
              )}

              <div className="field">
                <label className="label">Email</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3">
                    <MailIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="input input-icon"
                    placeholder="admin@gestek.io"
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="field">
                <label className="label">Contraseña</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3">
                    <LockIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="input input-icon"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button type="submit" className="btn-gradient w-full mt-2" disabled={loading}>
                {loading ? <><Spinner size="sm" /> Iniciando sesión...</> : 'Iniciar sesión'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-text-2 mt-5">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-primary-light hover:text-primary font-medium transition-colors">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}

function MailIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
}
function LockIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
}
