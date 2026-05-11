import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { eventosApi } from '../../api/eventos.js';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

const STEPS = ['Información básica', 'Fechas y lugar', 'Entradas', 'Revisión'];

export default function EventCreatePage() {
  const navigate = useNavigate();
  const [step,    setStep]    = useState(0);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nombre         : '',
    descripcion    : '',
    modalidad      : 'fisico',
    visibilidad    : 'publico',
    fecha_inicio   : '',
    fecha_fin      : '',
    ubicacion      : { ciudad: '', lugar: '', direccion: '', link_streaming: '' },
    entradas       : [{ tipo: 'General', precio: 0, capacidad: 100, descripcion: '' }],
    imagen_portada : '',
  });

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const updateUbic = (key, val) => setForm(f => ({ ...f, ubicacion: { ...f.ubicacion, [key]: val } }));
  const updateEntrada = (i, key, val) => setForm(f => {
    const entradas = [...f.entradas];
    entradas[i] = { ...entradas[i], [key]: val };
    return { ...f, entradas };
  });
  const addEntrada = () => setForm(f => ({
    ...f,
    entradas: [...f.entradas, { tipo: '', precio: 0, capacidad: 50, descripcion: '' }],
  }));
  const removeEntrada = (i) => setForm(f => ({
    ...f,
    entradas: f.entradas.filter((_, idx) => idx !== i),
  }));

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        fecha_inicio: form.fecha_inicio || undefined,
        fecha_fin   : form.fecha_fin    || undefined,
        entradas    : form.entradas.map(e => ({
          ...e,
          precio   : parseFloat(e.precio)    || 0,
          capacidad: parseInt(e.capacidad)   || 1,
        })),
      };
      const data = await eventosApi.create(payload);
      navigate(`/eventos/${data.evento.id}`);
    } catch (err) {
      setError(err.message);
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Link to="/eventos" className="hover:text-primary">Eventos</Link>
        <span>/</span>
        <span className="text-text-primary">Crear evento</span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all
                ${i < step  ? 'bg-success text-white cursor-pointer' :
                  i === step ? 'bg-primary text-white' :
                  'bg-surface-2 text-text-secondary cursor-default'}`}
            >
              {i < step ? '✓' : i + 1}
            </button>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-text-primary' : 'text-text-secondary'}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && <div className={`h-px w-6 ${i < step ? 'bg-success' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      <Alert message={error} type="error" onClose={() => setError('')} />

      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-text-primary">{STEPS[step]}</h3>
        </div>
        <div className="card-body space-y-4">

          {/* Step 0: Info básica */}
          {step === 0 && (
            <>
              <div>
                <label className="label">Nombre del evento *</label>
                <input type="text" className="input" placeholder="Ej: Tech Summit 2026"
                  value={form.nombre} onChange={e => update('nombre', e.target.value)} required />
              </div>
              <div>
                <label className="label">Descripción</label>
                <textarea rows={3} className="input resize-none" placeholder="Descripción del evento..."
                  value={form.descripcion} onChange={e => update('descripcion', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Modalidad *</label>
                  <select className="input" value={form.modalidad} onChange={e => update('modalidad', e.target.value)}>
                    <option value="fisico">Físico</option>
                    <option value="virtual">Virtual</option>
                    <option value="hibrido">Híbrido</option>
                  </select>
                </div>
                <div>
                  <label className="label">Visibilidad</label>
                  <select className="input" value={form.visibilidad} onChange={e => update('visibilidad', e.target.value)}>
                    <option value="publico">Público</option>
                    <option value="privado">Privado</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">URL de imagen de portada</label>
                <input type="url" className="input" placeholder="https://..."
                  value={form.imagen_portada} onChange={e => update('imagen_portada', e.target.value)} />
              </div>
            </>
          )}

          {/* Step 1: Fechas y lugar */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Fecha de inicio</label>
                  <input type="datetime-local" className="input"
                    value={form.fecha_inicio} onChange={e => update('fecha_inicio', e.target.value)} />
                </div>
                <div>
                  <label className="label">Fecha de fin</label>
                  <input type="datetime-local" className="input"
                    value={form.fecha_fin} onChange={e => update('fecha_fin', e.target.value)} />
                </div>
              </div>

              {(form.modalidad === 'fisico' || form.modalidad === 'hibrido') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Ciudad *</label>
                      <input type="text" className="input" placeholder="Bogotá"
                        value={form.ubicacion.ciudad} onChange={e => updateUbic('ciudad', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Lugar / Venue *</label>
                      <input type="text" className="input" placeholder="Centro de Convenciones"
                        value={form.ubicacion.lugar} onChange={e => updateUbic('lugar', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Dirección</label>
                    <input type="text" className="input" placeholder="Calle 26 # 59-51"
                      value={form.ubicacion.direccion} onChange={e => updateUbic('direccion', e.target.value)} />
                  </div>
                </>
              )}

              {(form.modalidad === 'virtual' || form.modalidad === 'hibrido') && (
                <div>
                  <label className="label">Link de streaming *</label>
                  <input type="url" className="input" placeholder="https://zoom.us/j/..."
                    value={form.ubicacion.link_streaming} onChange={e => updateUbic('link_streaming', e.target.value)} />
                </div>
              )}
            </>
          )}

          {/* Step 2: Entradas */}
          {step === 2 && (
            <div className="space-y-4">
              {form.entradas.map((entrada, i) => (
                <div key={i} className="bg-surface-2 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">Entrada #{i + 1}</span>
                    {form.entradas.length > 1 && (
                      <button onClick={() => removeEntrada(i)} className="text-xs text-danger hover:underline">
                        Eliminar
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="label">Tipo *</label>
                      <input type="text" className="input" placeholder="General / VIP"
                        value={entrada.tipo} onChange={e => updateEntrada(i, 'tipo', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Precio (COP)</label>
                      <input type="number" min="0" className="input"
                        value={entrada.precio} onChange={e => updateEntrada(i, 'precio', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Capacidad *</label>
                      <input type="number" min="1" className="input"
                        value={entrada.capacidad} onChange={e => updateEntrada(i, 'capacidad', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Descripción de la entrada</label>
                    <input type="text" className="input" placeholder="Acceso general al evento"
                      value={entrada.descripcion} onChange={e => updateEntrada(i, 'descripcion', e.target.value)} />
                  </div>
                </div>
              ))}
              <button onClick={addEntrada} className="btn-secondary w-full">
                + Agregar tipo de entrada
              </button>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <ReviewRow label="Nombre"    value={form.nombre || '—'} />
              <ReviewRow label="Modalidad" value={form.modalidad} />
              <ReviewRow label="Visibilidad" value={form.visibilidad} />
              <ReviewRow label="Fecha inicio"
                value={form.fecha_inicio ? new Date(form.fecha_inicio).toLocaleString('es-CO') : '—'} />
              {(form.modalidad !== 'virtual') && (
                <ReviewRow label="Ciudad / Lugar"
                  value={[form.ubicacion.ciudad, form.ubicacion.lugar].filter(Boolean).join(' — ') || '—'} />
              )}
              {(form.modalidad !== 'fisico') && (
                <ReviewRow label="Streaming" value={form.ubicacion.link_streaming || '—'} />
              )}
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Entradas</p>
                {form.entradas.map((e, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <span className="text-sm text-text-primary">{e.tipo}</span>
                    <span className="text-sm text-text-secondary">
                      {Number(e.precio) === 0 ? 'Gratis' : `$${Number(e.precio).toLocaleString()}`}
                      {' · '}{e.capacidad} cupos
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-secondary bg-surface-2 rounded-lg p-3">
                El evento se creará como <strong className="text-warning">borrador</strong>. Podrás publicarlo cuando esté listo.
              </p>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/eventos')}
            className="btn-secondary"
          >
            {step === 0 ? 'Cancelar' : '← Atrás'}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && !form.nombre.trim()}
              className="btn-primary"
            >
              Continuar →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="btn-primary">
              {loading ? <><Spinner size="sm" /> Creando...</> : 'Crear evento'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-border last:border-0">
      <span className="text-xs font-medium text-text-secondary w-32 flex-shrink-0">{label}</span>
      <span className="text-sm text-text-primary text-right">{value}</span>
    </div>
  );
}
