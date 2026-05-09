import React from 'react'
import styles from './Stepper.module.css'

const STEPS = [
  { num: 1, label: 'Información general' },
  { num: 2, label: 'Espacios y accesos' },
  { num: 3, label: 'Identidad y marca' },
  { num: 4, label: 'Revisión y publicar' },
]

export default function Stepper({ current }) {
  return (
    <div className={styles.stepper}>
      {STEPS.map((step, i) => (
        <React.Fragment key={step.num}>
          <div className={styles.stepItem}>
            <div className={`${styles.circle} ${step.num === current ? styles.active : step.num < current ? styles.done : styles.inactive}`}>
              {step.num < current ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : step.num}
            </div>
            <span className={`${styles.label} ${step.num === current ? styles.labelActive : styles.labelInactive}`}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`${styles.line} ${step.num < current ? styles.lineDone : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
