import React, { useState } from 'react'
import Stepper from './Stepper.jsx'
import Sidebar from './Sidebar.jsx'
import styles from './CrearEvento.module.css'

const CATEGORIAS = ['Conferencia', 'Taller', 'Networking', 'Concierto', 'Deporte', 'Otro']

const initialForm = {
  nombre: '',
  descripcion: '',
  categoria: '',
  visibilidad: '',
  fechaInicio: '',
  fechaCierre: '',
  horaInicio: '',
  horaFin: '',
  modalidad: '',
  ubicacion: '',
  capacidad: '',
  requiereRegistro: false,
  tags: ['tecnología', '2026'],
}

export default function CrearEvento() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido'
    if (!form.categoria) e.categoria = 'Selecciona una categoría'
    if (!form.visibilidad) e.visibilidad = 'Selecciona la visibilidad'
    if (!form.fechaInicio) e.fechaInicio = 'Fecha de inicio requerida'
    if (!form.fechaCierre) e.fechaCierre = 'Fecha de cierre requerida'
    if (!form.modalidad) e.modalidad = 'Selecciona una modalidad'
    return e
  }

  const handleNext = () => {
    const e = validate()
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }
    setStep(s => Math.min(s + 1, 4))
  }

  const handleBack = () => setStep(s => Math.max(s - 1, 1))

  return (
    <div className={styles.page}>

      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>SEMB</div>
        <div className={styles.navRight}>
          <div className={styles.avatar} />
          <span className={styles.userName}>Alejandro M.</span>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <span className={styles.breadcrumbLink}>Mis eventos</span>
        <span className={styles.breadcrumbSep}>›</span>
        <span className={styles.breadcrumbCurrent}>Crear nuevo evento</span>
      </div>

      {/* Stepper */}
      <Stepper current={step} />

      {/* Frame principal */}
      <div className={styles.frame}>
        <div className={styles.formWrapper}>

          {/* Formulario */}
          <div className={styles.formArea}>

            {step === 1 && (
              <>
                {/* Datos básicos */}
                <section className={styles.section}>
                  <p className={styles.sectionLabel}>DATOS BÁSICOS</p>

                  <div className={styles.field}>
                    <label className={styles.label}>Nombre del evento *</label>
                    <input
                      className={`${styles.input} ${errors.nombre ? styles.inputError : ''}`}
                      type="text"
                      placeholder="Ej: Summit Tech Ibagué 2026"
                      value={form.nombre}
                      onChange={e => update('nombre', e.target.value)}
                    />
                    {errors.nombre && <span className={styles.error}>{errors.nombre}</span>}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Descripción</label>
                    <textarea
                      className={styles.textarea}
                      placeholder="Describe de qué trata el evento..."
                      rows={3}
                      value={form.descripcion}
                      onChange={e => update('descripcion', e.target.value)}
                    />
                  </div>

                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <label className={styles.label}>Categoría *</label>
                      <select
                        className={`${styles.select} ${errors.categoria ? styles.inputError : ''}`}
                        value={form.categoria}
                        onChange={e => update('categoria', e.target.value)}
                      >
                        <option value="">Seleccionar</option>
                        {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.categoria && <span className={styles.error}>{errors.categoria}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Visibilidad *</label>
                      <select
                        className={`${styles.select} ${errors.visibilidad ? styles.inputError : ''}`}
                        value={form.visibilidad}
                        onChange={e => update('visibilidad', e.target.value)}
                      >
                        <option value="">Seleccionar</option>
                        <option value="publico">Público</option>
                        <option value="privado">Privado</option>
                      </select>
                      {errors.visibilidad && <span className={styles.error}>{errors.visibilidad}</span>}
                    </div>
                  </div>
                </section>

                {/* Fecha y lugar */}
                <section className={styles.section}>
                  <p className={styles.sectionLabel}>FECHA Y LUGAR</p>

                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <label className={styles.label}>Fecha inicio *</label>
                      <div className={styles.inputIcon}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="1" y="3" width="14" height="11" rx="2"/>
                          <path d="M5 1v3M11 1v3M1 7h14" strokeLinecap="round"/>
                        </svg>
                        <input
                          type="date"
                          className={`${styles.inputBare} ${errors.fechaInicio ? styles.inputError : ''}`}
                          value={form.fechaInicio}
                          onChange={e => update('fechaInicio', e.target.value)}
                        />
                      </div>
                      {errors.fechaInicio && <span className={styles.error}>{errors.fechaInicio}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Fecha cierre *</label>
                      <div className={styles.inputIcon}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="1" y="3" width="14" height="11" rx="2"/>
                          <path d="M5 1v3M11 1v3M1 7h14" strokeLinecap="round"/>
                        </svg>
                        <input
                          type="date"
                          className={`${styles.inputBare} ${errors.fechaCierre ? styles.inputError : ''}`}
                          value={form.fechaCierre}
                          onChange={e => update('fechaCierre', e.target.value)}
                        />
                      </div>
                      {errors.fechaCierre && <span className={styles.error}>{errors.fechaCierre}</span>}
                    </div>
                  </div>

                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <label className={styles.label}>Hora inicio</label>
                      <input
                        type="time"
                        className={styles.input}
                        value={form.horaInicio}
                        onChange={e => update('horaInicio', e.target.value)}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Hora fin</label>
                      <input
                        type="time"
                        className={styles.input}
                        value={form.horaFin}
                        onChange={e => update('horaFin', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Modalidad *</label>
                    <div className={styles.radioGroup}>
                      {['Presencial', 'Virtual', 'Híbrido'].map(m => (
                        <button
                          key={m}
                          type="button"
                          className={`${styles.radioBtn} ${form.modalidad === m ? styles.radioBtnActive : ''}`}
                          onClick={() => update('modalidad', m)}
                        >
                          <div className={`${styles.radioCircle} ${form.modalidad === m ? styles.radioCircleActive : ''}`} />
                          {m}
                        </button>
                      ))}
                    </div>
                    {errors.modalidad && <span className={styles.error}>{errors.modalidad}</span>}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Ubicación / URL</label>
                    <div className={styles.inputIcon}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M8 1a5 5 0 0 1 5 5c0 3.5-5 9-5 9S3 9.5 3 6a5 5 0 0 1 5-5z"/>
                        <circle cx="8" cy="6" r="1.5"/>
                      </svg>
                      <input
                        className={styles.inputBare}
                        type="text"
                        placeholder="Dirección o enlace del evento"
                        value={form.ubicacion}
                        onChange={e => update('ubicacion', e.target.value)}
                      />
                    </div>
                  </div>
                </section>

                {/* Capacidad */}
                <section className={styles.section}>
                  <p className={styles.sectionLabel}>CAPACIDAD Y ACCESO</p>
                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <label className={styles.label}>Capacidad máxima</label>
                      <input
                        className={styles.input}
                        type="number"
                        placeholder="N.° de asistentes"
                        min="1"
                        value={form.capacidad}
                        onChange={e => update('capacidad', e.target.value)}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Requiere registro</label>
                      <div className={styles.toggleRow}>
                        <span className={styles.toggleLabel}>{form.requiereRegistro ? 'Sí' : 'No'}</span>
                        <button
                          type="button"
                          className={`${styles.toggle} ${form.requiereRegistro ? styles.toggleOn : ''}`}
                          onClick={() => update('requiereRegistro', !form.requiereRegistro)}
                        >
                          <div className={styles.toggleThumb} />
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}

            {step === 2 && (
              <section className={styles.section}>
                <p className={styles.sectionLabel}>ESPACIOS Y ACCESOS</p>
                <div className={styles.placeholder}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <path d="M3 9h18M9 21V9" strokeLinecap="round"/>
                  </svg>
                  <p>Configuración de espacios internos</p>
                  <span>Próximamente — Semana 2</span>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className={styles.section}>
                <p className={styles.sectionLabel}>IDENTIDAD Y MARCA</p>
                <div className={styles.placeholder}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M12 3v18M3 12h18" strokeLinecap="round"/>
                  </svg>
                  <p>Personalización de identidad visual</p>
                  <span>Próximamente — Semana 2</span>
                </div>
              </section>
            )}

            {step === 4 && (
              <section className={styles.section}>
                <p className={styles.sectionLabel}>REVISIÓN Y PUBLICAR</p>

                <div className={styles.reviewGrid}>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewKey}>Nombre</span>
                    <span className={styles.reviewVal}>{form.nombre || '—'}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewKey}>Categoría</span>
                    <span className={styles.reviewVal}>{form.categoria || '—'}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewKey}>Visibilidad</span>
                    <span className={styles.reviewVal}>{form.visibilidad || '—'}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewKey}>Modalidad</span>
                    <span className={styles.reviewVal}>{form.modalidad || '—'}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewKey}>Fecha inicio</span>
                    <span className={styles.reviewVal}>{form.fechaInicio || '—'}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewKey}>Fecha cierre</span>
                    <span className={styles.reviewVal}>{form.fechaCierre || '—'}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewKey}>Ubicación</span>
                    <span className={styles.reviewVal}>{form.ubicacion || '—'}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewKey}>Capacidad</span>
                    <span className={styles.reviewVal}>{form.capacidad || '—'}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewKey}>Registro</span>
                    <span className={styles.reviewVal}>{form.requiereRegistro ? 'Sí' : 'No'}</span>
                  </div>
                  {form.descripcion && (
                    <div className={styles.reviewItem} style={{ gridColumn: '1 / -1' }}>
                      <span className={styles.reviewKey}>Descripción</span>
                      <span className={styles.reviewVal}>{form.descripcion}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Acciones */}
            <div className={styles.actions}>
              <button className={styles.btnSecondary} onClick={handleBack} disabled={step === 1}>
                ← Anterior
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className={styles.btnGhost}>Guardar borrador</button>
                {step < 4 ? (
                  <button className={styles.btnPrimary} onClick={handleNext}>
                    Siguiente paso →
                  </button>
                ) : (
                  <button className={styles.btnPublish}>
                    Publicar evento ✓
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <Sidebar formData={form} />
        </div>
      </div>
    </div>
  )
}
