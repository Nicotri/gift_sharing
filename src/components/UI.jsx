import { useEffect, useRef } from 'react'
import styles from './UI.module.css'

/* ── BUTTON ──────────────────────────────────────────────── */
export function Button({ children, variant = 'primary', size = 'md', fullWidth, loading, ...props }) {
  return (
    <button
      className={[
        styles.btn,
        styles[`btn-${variant}`],
        styles[`btn-${size}`],
        fullWidth ? styles.fullWidth : '',
        loading   ? styles.loading   : '',
      ].join(' ')}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className={styles.spinner} /> : children}
    </button>
  )
}

/* ── INPUT ───────────────────────────────────────────────── */
export function Input({ label, error, hint, ...props }) {
  return (
    <div className={styles.fieldWrap}>
      {label && <label className={styles.label}>{label}</label>}
      <input className={`${styles.input} ${error ? styles.inputError : ''}`} {...props} />
      {hint  && !error && <span className={styles.hint}>{hint}</span>}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}

/* ── TEXTAREA ────────────────────────────────────────────── */
export function Textarea({ label, error, ...props }) {
  return (
    <div className={styles.fieldWrap}>
      {label && <label className={styles.label}>{label}</label>}
      <textarea className={`${styles.input} ${styles.textarea} ${error ? styles.inputError : ''}`} {...props} />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}

/* ── CARD ────────────────────────────────────────────────── */
export function Card({ children, className = '', ...props }) {
  return (
    <div className={`${styles.card} ${className}`} {...props}>
      {children}
    </div>
  )
}

/* ── MODAL ───────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className={styles.modalOverlay}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className={`${styles.modal} animate-slide-up`}>
        <div className={styles.modalHeader}>
          <h2 className={`${styles.modalTitle} display`}>{title}</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Fermer">✕</button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  )
}

/* ── TOAST ───────────────────────────────────────────────── */
export function Toast({ message, type = 'success', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className={`${styles.toast} ${styles[`toast-${type}`]} animate-fade-up`}>
      <span>{type === 'success' ? '✓' : '!'}</span>
      {message}
    </div>
  )
}

/* ── SPINNER ─────────────────────────────────────────────── */
export function Spinner({ size = 24 }) {
  return (
    <div
      className={styles.spinnerLg}
      style={{ width: size, height: size }}
      aria-label="Chargement…"
    />
  )
}

/* ── SKELETON ────────────────────────────────────────────── */
export function Skeleton({ height = 80, className = '' }) {
  return <div className={`${styles.skeleton} ${className}`} style={{ height }} />
}

/* ── CHIP / BADGE ────────────────────────────────────────── */
export function StatusBadge({ status }) {
  const map = {
    available: { label: 'Disponible',         cls: 'available' },
    blocked:   { label: 'Réservé 🔒',          cls: 'blocked'   },
    partial:   { label: 'Cagnotte en cours',   cls: 'partial'   },
    full:      { label: 'Cagnotte complète 🎉', cls: 'full'      },
    received:  { label: 'Reçu 🎁',             cls: 'received'  },
  }
  const { label, cls } = map[status] || map.available
  return <span className={`${styles.badge} ${styles[`badge-${cls}`]}`}>{label}</span>
}

/* ── PROGRESS BAR ────────────────────────────────────────── */
export function ProgressBar({ value, max, label }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className={styles.progressWrap}>
      {label && <div className={styles.progressLabel}>{label}</div>}
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.progressPct}>{pct}%</div>
    </div>
  )
}
