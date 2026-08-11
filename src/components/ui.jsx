import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

export function Card({ children, className = '', onClick, flash }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-surface p-4 shadow-md shadow-black/20 ring-1 ring-white/[0.04] ${onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''} ${flash ? 'flash-update' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ children, right }) {
  return (
    <div className="mt-5 mb-2 flex items-baseline justify-between px-1">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-3">{children}</h2>
      {right}
    </div>
  )
}

export function Chip({ children, tone = 'neutral', className = '' }) {
  const tones = {
    neutral: 'bg-surface-2 text-ink-2',
    good: 'bg-good/15 text-good',
    warning: 'bg-warning/15 text-warning',
    serious: 'bg-serious/15 text-serious',
    critical: 'bg-critical/15 text-critical',
    accent: 'bg-series-1/15 text-series-1',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

// Score bands: color + label together (never color alone).
export function scoreBand(kind, value) {
  if (kind === 'strain') {
    // Strain is magnitude, not good/bad.
    if (value >= 75) return { color: 'var(--color-series-1)', label: 'All out', tone: 'accent' }
    if (value >= 45) return { color: 'var(--color-series-1)', label: 'Solid', tone: 'accent' }
    return { color: 'var(--color-series-1)', label: 'Light', tone: 'accent' }
  }
  if (kind === 'stress') {
    if (value <= 30) return { color: 'var(--color-good)', label: 'Calm', tone: 'good' }
    if (value <= 60) return { color: 'var(--color-warning)', label: 'Elevated', tone: 'warning' }
    return { color: 'var(--color-serious)', label: 'High', tone: 'serious' }
  }
  if (value >= 67) return { color: 'var(--color-good)', label: 'Good', tone: 'good' }
  if (value >= 40) return { color: 'var(--color-warning)', label: 'Fair', tone: 'warning' }
  return { color: 'var(--color-serious)', label: 'Low', tone: 'serious' }
}

// ---------- Toast ----------

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)
  const show = useCallback((content) => {
    setToast(content)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2600)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div className="animate-toast pointer-events-none absolute bottom-24 left-1/2 z-50 -translate-x-1/2">
          <div className="rounded-full bg-surface-3 px-4 py-2.5 text-[13px] font-medium text-ink shadow-lg shadow-black/40">
            {toast}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
