import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Alert from '../components/ui/Alert.jsx';
import Spinner from '../components/ui/Spinner.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form,    setForm]    = useState({ nombre: '', email: '', password: '', rol: 'asistente' });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await register(form);
    setLoading(false);
    if (res.ok) {
      setSuccess('Cuenta creada. Ahora puedes iniciar sesión.');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary mb-4 glow-primary">
            <span className="text-white font-bold text-xl font-head">G</span>
          </div>
          <h1 className="text-2xl font-bold font-head text-text-primary">Crear cuenta</h1>
          <p className="text-sm text-text-secondary mt-1">Únete a GESTEK</p>
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Alert message={error}   type="error"   onClose={() => setError('')} />
              <Alert message={success} type="success" />

              <div>
                <label className="label">Nombre completo</label>
                <input type="text" name="nombre" value={form.nombre} onChange={handleChange}
                  className="input" placeholder="Juan Pérez" required autoFocus />
              </div>

              <div>
                <label className="label">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  className="input" placeholder="juan@empresa.com" required />
              </div>

              <div>
                <label className="label">Contraseña</label>
                <input type="password" name="password" value={form.password} onChange={handleChange}
                  className="input" placeholder="Mínimo 8 caracteres" minLength={8} required />
              </div>

              <div>
                <label className="label">Tipo de cuenta</label>
                <select name="rol" value={form.rol} onChange={handleChange} className="input">
                  <option value="asistente">Asistente — Me inscribo a eventos</option>
                  <option value="organizador">Organizador — Creo y gestiono eventos</option>
                </select>
              </div>

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? <><Spinner size="sm" /> Creando cuenta...</> : 'Crear cuenta'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-text-secondary mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary hover:text-primary-hover font-medium">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
