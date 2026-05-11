import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Alert from '../components/ui/Alert.jsx';
import Spinner from '../components/ui/Spinner.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(form.email, form.password);
    setLoading(false);
    if (res.ok) {
      navigate('/dashboard');
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary mb-4 glow-primary">
            <span className="text-white font-bold text-xl font-head">G</span>
          </div>
          <h1 className="text-2xl font-bold font-head text-text-primary">Bienvenido a GESTEK</h1>
          <p className="text-sm text-text-secondary mt-1">The operating system for events</p>
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Alert message={error} type="error" onClose={() => setError('')} />

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input"
                  placeholder="admin@gestek.io"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? <><Spinner size="sm" /> Iniciando sesión...</> : 'Iniciar sesión'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-text-secondary mt-4">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-primary hover:text-primary-hover font-medium">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
