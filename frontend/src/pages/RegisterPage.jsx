import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';

const ROLES = [
  { value: 'asistente',   label: 'Asistente',   desc: 'Me inscribo a eventos'        },
  { value: 'organizador', label: 'Organizador',  desc: 'Creo y gestiono eventos'      },
];

export default function RegisterPage() {
  const { register }       = useAuth();
  const { success, error } = useToast();
  const navigate           = useNavigate();

  const [form,    setForm]    = useState({ nombre: '', email: '', password: '', rol: 'asistente' });
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  const handleChange = e => { setErr(''); setForm(f => ({ ...f, [e.target.name]: e.target.value })); };

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password.length < 8) { setErr('La contraseña debe tener al menos 8 caracteres.'); return; }
    setLoading(true);
    setErr('');
    const res = await register(form);
    setLoading(false);
    if (res.ok) {
      success('Cuenta creada exitosamente. ¡Inicia sesión!');
      setTimeout(() => navigate('/login'), 1500);
    } else {
      setErr(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative animate-[fadeUp_0.5s_ease_both]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-primary shadow-glow mb-5">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold font-display text-text-1">Crear cuenta</h1>
          <p className="text-sm text-text-2 mt-1">Únete a GESTEK — gratis, siempre</p>
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
                <label className="label">Nombre completo</label>
                <input type="text" name="nombre" value={form.nombre} onChange={handleChange}
                  className="input" placeholder="Juan Pérez" required autoFocus />
              </div>

              <div className="field">
                <label className="label">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  className="input" placeholder="juan@empresa.com" required />
              </div>

              <div className="field">
                <label className="label">Contraseña</label>
                <input type="password" name="password" value={form.password} onChange={handleChange}
                  className="input" placeholder="Mínimo 8 caracteres" minLength={8} required />
              </div>

              <div className="field">
                <label className="label">Tipo de cuenta</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, rol: r.value }))}
                      className={`p-3 rounded-xl border text-left transition-all duration-150
                        ${form.rol === r.value
                          ? 'border-primary/40 bg-primary/10 text-text-1'
                          : 'border-border bg-surface-2 text-text-2 hover:border-border-2'}`}
                    >
                      <p className="text-xs font-semibold">{r.label}</p>
                      <p className="text-[10px] mt-0.5 opacity-70">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-gradient w-full" disabled={loading}>
                {loading ? <><Spinner size="sm" /> Creando cuenta...</> : 'Crear cuenta gratis'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-text-2 mt-5">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary-light hover:text-primary font-medium transition-colors">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
