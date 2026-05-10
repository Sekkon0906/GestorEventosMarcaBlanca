import React from 'react'
import styles from './FiltrosSidebar.module.css'

const CATEGORIAS = [
  { label: 'Conferencias', count: 12 },
  { label: 'Talleres',     count: 8  },
  { label: 'Networking',   count: 5  },
  { label: 'Conciertos',   count: 4  },
  { label: 'Deportes',     count: 3  },
]

const MODALIDADES = ['Presencial', 'Virtual', 'Híbrido']

export default function FiltrosSidebar({ filtros, onChange, onClear }) {
  const toggleCategoria = (cat) => {
    const next = filtros.categorias.includes(cat)
      ? filtros.categorias.filter(c => c !== cat)
      : [...filtros.categorias, cat]
    onChange({ ...filtros, categorias: next })
  }

  const toggleModalidad = (mod) => {
    onChange({ ...filtros, modalidad: filtros.modalidad === mod ? '' : mod })
  }

  const togglePrecio = (tipo) => {
    const next = filtros.precio.includes(tipo)
      ? filtros.precio.filter(p => p !== tipo)
      : [...filtros.precio, tipo]
    onChange({ ...filtros, precio: next })
  }

  return (
    <aside className={styles.sidebar}>

      <div className={styles.filterSection}>
        <p className={styles.filterTitle}>Categorías</p>
        {CATEGORIAS.map(cat => (
          <div key={cat.label} className={styles.filterItem} onClick={() => toggleCategoria(cat.label)}>
            <div className={`${styles.checkbox} ${filtros.categorias.includes(cat.label) ? styles.checked : ''}`}>
              {filtros.categorias.includes(cat.label) && (
                <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className={styles.filterLabel}>{cat.label}</span>
            <span className={styles.filterCount}>{cat.count}</span>
          </div>
        ))}
      </div>

      <div className={styles.filterSection}>
        <p className={styles.filterTitle}>Modalidad</p>
        {MODALIDADES.map(mod => (
          <div key={mod} className={styles.filterItem} onClick={() => toggleModalidad(mod)}>
            <div className={`${styles.radio} ${filtros.modalidad === mod ? styles.radioChecked : ''}`} />
            <span className={styles.filterLabel}>{mod}</span>
          </div>
        ))}
      </div>

      <div className={styles.filterSection}>
        <p className={styles.filterTitle}>Precio</p>
        {['Gratuito', 'De pago'].map(tipo => (
          <div key={tipo} className={styles.filterItem} onClick={() => togglePrecio(tipo)}>
            <div className={`${styles.checkbox} ${filtros.precio.includes(tipo) ? styles.checked : ''}`}>
              {filtros.precio.includes(tipo) && (
                <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className={styles.filterLabel}>{tipo}</span>
          </div>
        ))}
      </div>

      <div className={styles.filterSection}>
        <p className={styles.filterTitle}>Rango de fechas</p>
        <div className={styles.dateInput}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="3" width="14" height="11" rx="2"/>
            <path d="M5 1v3M11 1v3M1 7h14" strokeLinecap="round"/>
          </svg>
          <input
            type="date"
            className={styles.dateBare}
            value={filtros.fechaDesde}
            onChange={e => onChange({ ...filtros, fechaDesde: e.target.value })}
          />
        </div>
        <div className={styles.dateInput} style={{ marginTop: '6px' }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="3" width="14" height="11" rx="2"/>
            <path d="M5 1v3M11 1v3M1 7h14" strokeLinecap="round"/>
          </svg>
          <input
            type="date"
            className={styles.dateBare}
            value={filtros.fechaHasta}
            onChange={e => onChange({ ...filtros, fechaHasta: e.target.value })}
          />
        </div>
      </div>

      <button className={styles.clearBtn} onClick={onClear}>
        Limpiar filtros
      </button>

    </aside>
  )
}
