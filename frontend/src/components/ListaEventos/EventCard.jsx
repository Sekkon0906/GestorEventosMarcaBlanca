import React from 'react'
import styles from './EventCard.module.css'

const BADGE_MAP = {
  destacado: { label: 'Destacado',     cls: 'info' },
  gratuito:  { label: 'Gratuito',      cls: 'success' },
  ultimos:   { label: 'Últimos cupos', cls: 'warning' },
  soldout:   { label: 'Sold out',      cls: 'danger' },
}

export default function EventCard({ event }) {
  const badge = BADGE_MAP[event.badge]

  return (
    <div className={[
      styles.card,
      event.badge === 'destacado' ? styles.featured : '',
      event.badge === 'soldout'   ? styles.soldOut  : '',
    ].join(' ')}>

      <div className={styles.imgArea}>
        {badge && (
          <span className={`${styles.badge} ${styles[badge.cls]}`}>
            {badge.label}
          </span>
        )}
      </div>

      <div className={styles.body}>
        <p className={styles.title}>{event.nombre}</p>
        <p className={styles.org}>{event.organizador}</p>

        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="3" width="14" height="11" rx="2"/>
              <path d="M5 1v3M11 1v3M1 7h14" strokeLinecap="round"/>
            </svg>
            <span>{event.fecha}</span>
          </div>
          <div className={styles.metaItem}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 1a5 5 0 0 1 5 5c0 3.5-5 9-5 9S3 9.5 3 6a5 5 0 0 1 5-5z"/>
            </svg>
            <span>{event.lugar}</span>
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.categoria}>{event.categoria}</span>
          <span className={styles.precio}>{event.precio}</span>
        </div>
      </div>
    </div>
  )
}
