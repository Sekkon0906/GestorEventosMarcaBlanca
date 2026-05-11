import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { eventosApi } from '../../api/eventos.js';
import { useToast } from '../../context/ToastContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

const STEPS = ['Información básica', 'Fechas y lugar', 'Entradas', 'Revisión'];

export default function EventCreatePage() {
  const navigate          = useNavigate();
  const { success, error } = useToast();
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nombre        : '',
    descripcion   : '',
    modalidad     : 'fisico',
    visibilidad   : 'publico',
    fecha_inicio  : '',
    fecha_fin     : '',
    ubicacion     : { ciudad: '', lugar: '', direccion: '', link_streaming: '' },
    entradas      : [{ tipo: 'General', precio: 0, capacidad: 100, descripcion: '' }],
    imagen_portada: '',
  });

  const update      = (key, val)     => setForm(f => ({ ...f, [key]: val }));
  const updateUbic  = (key, val)     => setForm(f => ({ ...f, ubicacion: { ...f.ubicacion, [key]: val } }));
  const updateEnt   = (i, key, val)  => setForm(f => {
    const e = [...f.entradas]; e[i] = { ...e[i], [key]: val }; return { ...f, entradas: e };
  });
  const addEntrada    = () => setForm(f => ({ ...f, entradas: [...f.entradas, { tipo: '', precio: 0, capacidad: 50, descripcion: '' }] }));
  const removeEntrada = (i) => setForm(f => ({ ...f, entradas: f.entradas.filter((_, idx) => idx !== i) }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        fecha_inicio: form.fecha_inicio || undefined,
        fecha_fin   : form.fecha_fin    || undefined,
        entradas    : form.entradas.map(e => ({ ...e, precio: parseFloat(e.precio) || 0, capacidad: parseInt(e.capacidad) || 1 })),
      };
      const data = await eventosApi.create(payload);
      success('Evento creado exitosamente como borrador.');
      navigate(`/eventos/${data.evento.id}`);
    } catch (e) {
      error(e.message);
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-[fadeUp_0.4s_ease_both]">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-text-2">
        <Link to="/eventos" className="hover:text-text-1 transition-colors">Eventos</Link>
        <ChevronIcon className="w-3 h-3 text-text-3" />
        <span className="text-text-1">Crear evento</span>
      </nav>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-1 flex-1">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-semibold transition-all flex-shrink-0
                ${i < step  ? 'bg-success text-white cursor-pointer' :
                  i === step ? 'bg-gradient-primary text-white shadow-glow-sm' :
                  'bg-surface-2 text-text-3 cursor-default border border-border'}`}
            >
              {i < step ? '✓' : i + 1}
            </button>
            <span className={`text-xs font-medium hidden sm:block flex-shrink-0 ${i === step ? 'text-text-1' : 'text-text-3'}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-success' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-text-1">{STEPS[step]}</h3>
          <span className="text-xs text-text-3">{step + 1} de {STEPS.length}</span>
        </div>
        <div className="card-body space-y-4">

          {step === 0 && (
            <>
              <div className="field">
                <label className="label">Nombre del evento *</label>
                <input type="text" className="input" placeholder="Ej: Tech Summit 2026"
                  value={form.nombre} onChange={e => update('nombre', e.target.value)} required />
              </div>
              <div className="field">
                <label className="label">Descripción</label>
                <textarea rows={3} className="input resize-none" placeholder="Describe brevemente tu evento..."
                  value={form.descripcion} onChange={e => update('descripcion', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="field">
                  <label className="label">Modalidad *</label>
                  <select className="input bg-surface-2" value={form.modalidad} onChange={e => update('modalidad', e.target.value)}>
                    <option value="fisico">Físico</option>
                    <option value="virtual">Virtual</option>
                    <option value="hibrido">Híbrido</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label">Visibilidad</label>
                  <select className="input bg-surface-2" value={form.visibilidad} onChange={e => update('visibilidad', e.target.value)}>
                    <option value="publico">Público</option>
                    <option value="privado">Privado</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="label">URL imagen de portada</label>
                <input type="url" className="input" placeholder="https://..."
                  value={form.imagen_portada} onChange={e => update('imagen_portada', e.target.value)} />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="field">
                  <label className="label">Fecha de inicio</label>
                  <input type="datetime-local" className="input bg-surface-2"
                    value={form.fecha_inicio} onChange={e => update('fecha_inicio', e.target.value)} />
                </div>
                <div className="field">
                  <label className="label">Fecha de fin</label>
                  <input type="datetime-local" className="input bg-surface-2"
                    value={form.fecha_fin} onChange={e => update('fecha_fin', e.target.value)} />
                </div>
              </div>
              {(form.modalidad === 'fisico' || form.modalidad === 'hibrido') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="field">
                      <label className="label">Ciudad *</label>
                      <input type="text" className="input" placeholder="Bogotá"
                        value={form.ubicacion.ciudad} onChange={e => updateUbic('ciudad', e.target.value)} />
                    </div>
                    <div className="field">
                      <label className="label">Lugar / Venue</label>
                      <input type="text" className="input" placeholder="Centro de Convenciones"
                        value={form.ubicacion.lugar} onChange={e => updateUbic('lugar', e.target.value)} />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Dirección</label>
                    <input type="text" className="input" placeholder="Calle 26 # 59-51"
                      value={form.ubicacion.direccion} onChange={e => updateUbic('direccion', e.target.value)} />
                  </div>
                </>
              )}
              {(form.modalidad === 'virtual' || form.modalidad === 'hibrido') && (
                <div className="field">
                  <label className="label">Link de streaming *</label>
                  <input type="url" className="input" placeholder="https://zoom.us/j/..."
                    value={form.ubicacion.link_streaming} onChange={e => updateUbic('link_streaming', e.target.value)} />
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {form.entradas.map((entrada, i) => (
                <div key={i} className="bg-surface-2 rounded-xl p-4 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-1">Entrada #{i + 1}</span>
                    {form.entradas.length > 1 && (
                      <button onClick={() => removeEntrada(i)} className="text-xs text-danger hover:underline">Eliminar</button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="field">
                      <label className="label">Tipo *</label>
                      <input type="text" className="input" placeholder="General / VIP"
                        value={entrada.tipo} onChange={e => updateEnt(i, 'tipo', e.target.value)} />
                    </div>
                    <div className="field">
                      <label className="label">Precio (COP)</label>
                      <input type="number" min="0" className="input"
                        value={entrada.precio} onChange={e => updateEnt(i, 'precio', e.target.value)} />
                    </div>
                    <div className="field">
                      <label className="label">Capacidad *</label>
                      <input type="number" min="1" className="input"
                        value={entrada.capacidad} onChange={e => updateEnt(i, 'capacidad', e.target.value)} />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Descripción</label>
                    <input type="text" className="input" placeholder="Acceso general al evento"
                      value={entrada.descripcion} onChange={e => updateEnt(i, 'descripcion', e.target.value)} />
                  </div>
                </div>
              ))}
              <button onClick={addEntrada} className="btn-secondary w-full">
                <PlusIcon className="w-4 h-4" />
                Agregar tipo de entrada
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <ReviewRow label="Nombre"      value={form.nombre || '—'} />
              <ReviewRow label="Modalidad"   value={form.modalidad}     />
              <ReviewRow label="Visibilidad" value={form.visibilidad}   />
              <ReviewRow label="Fecha inicio" value={form.fecha_inicio ? new Date(form.fecha_inicio).toLocaleString('es-CO') : '—'} />
              {form.modalidad !== 'virtual' && (
                <ReviewRow label="Ciudad / Venue" value={[form.ubicacion.ciudad, form.ubicacion.lugar].filter(Boolean).join(' — ') || '—'} />
              )}
              {form.modalidad !== 'fisico' && (
                <ReviewRow label="Streaming" value={form.ubicacion.link_streaming || '—'} />
              )}
              <div className="pt-1">
                <p className="label mb-2">Entradas</p>
                {form.entradas.map((e, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-text-1">{e.tipo}</span>
                    <span className="text-sm text-text-2">
                      {Number(e.precio) === 0 ? 'Gratis' : `$${Number(e.precio).toLocaleString()}`}
                      {' · '}{e.capacidad} cupos
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20 text-sm text-warning">
                <InfoIcon className="w-4 h-4 flex-shrink-0" />
                El evento se creará como <strong>borrador</strong>. Podrás publicarlo cuando esté listo.
              </div>
            </div>
          )}
        </div>

        <div className="card-footer flex items-center justify-between">
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
            <button onClick={handleSubmit} disabled={loading} className="btn-gradient">
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
    <div className="flex items-start justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs font-medium text-text-2 w-32 flex-shrink-0">{label}</span>
      <span className="text-sm text-text-1 text-right flex-1">{value}</span>
    </div>
  );
}

function PlusIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function ChevronIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
}
function InfoIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
