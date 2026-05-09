import React from 'react'
import styles from './Sidebar.module.css'

export default function Sidebar({ formData }) {
  return (
    <aside className={styles.sidebar}>

      {/* Imagen portada */}
      <div className={styles.section}>
        <p className={styles.fieldLabel}>Imagen de portada</p>
        <div className={styles.uploadBox}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
          </svg>
          <span>Subir imagen</span>
          <span className={styles.hint}>PNG, JPG — máx. 5MB</span>
        </div>
      </div>

      {/* Organizador */}
      <div className={styles.section}>
        <p className={styles.fieldLabel}>Organizador</p>
        <div className={styles.organizerCard}>
          <div className={styles.avatar} />
          <div className={styles.organizerInfo}>
            <div className={styles.skeletonLine} style={{ width: '80%' }} />
            <div className={styles.skeletonLine} style={{ width: '55%', height: '8px', marginTop: '5px' }} />
          </div>
        </div>
      </div>

      {/* Etiquetas */}
      <div className={styles.section}>
        <p className={styles.fieldLabel}>Etiquetas</p>
        <div className={styles.tagsBox}>
          {formData.tags.map((tag, i) => (
            <span key={i} className={styles.tag}>{tag} ×</span>
          ))}
          <span className={styles.tagAdd}>+ agregar</span>
        </div>
      </div>

      {/* Estado */}
      <div className={styles.section}>
        <p className={styles.fieldLabel}>Estado inicial</p>
        <div className={styles.selectBox}>
          <span>Borrador</span>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6l4 4 4-4" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Vista previa card */}
      <div className={styles.section}>
        <p className={styles.previewLabel}>Vista previa card</p>
        <div className={styles.previewCard}>
          <div className={styles.previewImg}>
            <span className={styles.previewImgText}>IMAGEN</span>
          </div>
          <div className={styles.previewBody}>
            <div className={styles.skeletonLine} style={{ width: '90%', marginBottom: '5px' }} />
            <div className={styles.skeletonLine} style={{ width: '60%', height: '8px', marginBottom: '8px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={styles.previewTag}>{formData.categoria || 'Categoría'}</span>
              <div className={styles.skeletonLine} style={{ width: '36px', height: '8px' }} />
            </div>
          </div>
        </div>
      </div>

    </aside>
  )
}
