import { clsx } from 'clsx'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Loader2, X } from 'lucide-react'
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import type { BookingStatus } from '../lib/types'
import { STATUS_LABEL, STATUS_STYLE } from '../lib/format'

export const cx = clsx

/* ---------------- Reveal on scroll ---------------- */

export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = 'div',
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  as?: 'div' | 'section' | 'li' | 'article'
}) {
  const reduce = useReducedMotion()
  const M = motion[as]
  if (reduce) return <M className={className}>{children}</M>
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </M>
  )
}

/* ---------------- Button ---------------- */

type Variant = 'primary' | 'gold' | 'ghost' | 'outline' | 'danger' | 'bubble' | 'soft'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-forest text-white hover:bg-forest-light shadow-sm',
  gold: 'bg-gold text-forest-dark hover:bg-gold-dark hover:text-white shadow-sm',
  ghost: 'text-ink hover:bg-sand/70',
  outline: 'ring-1 ring-inset ring-sand-dark bg-white text-ink hover:bg-sand/50',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  bubble: 'bubble text-white',
  soft: 'bg-forest/8 text-forest hover:bg-forest/15',
}
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-[14px] gap-2',
  lg: 'h-13 px-7 text-[15px] gap-2.5',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, className, children, disabled, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      className={cx(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...(rest as object)}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </motion.button>
  )
})

/* ---------------- Form fields ---------------- */

export function Field({ label, hint, error, children, className }: { label?: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="label">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cx('input', className)} {...p} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cx('input min-h-24 resize-y', className)} {...p} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...p }, ref) {
  return (
    <select ref={ref} className={cx('input appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9', className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%235f6b67' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...p}>
      {children}
    </select>
  )
})

export function Stepper({ value, onChange, min = 0, max = 60 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex h-11 items-center justify-between rounded-xl border border-sand-dark bg-white px-1.5">
      <button type="button" className="grid size-8 place-items-center rounded-lg text-lg text-forest hover:bg-sand disabled:opacity-30" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} aria-label="Kurang">
        −
      </button>
      <span className="text-[15px] font-semibold tabular-nums">{value}</span>
      <button type="button" className="grid size-8 place-items-center rounded-lg text-lg text-forest hover:bg-sand disabled:opacity-30" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} aria-label="Tambah">
        +
      </button>
    </div>
  )
}

/* ---------------- Status chip ---------------- */

export function StatusChip({ status, className }: { status: BookingStatus; className?: string }) {
  return <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ring-1 ring-inset', STATUS_STYLE[status], className)}>{STATUS_LABEL[status]}</span>
}

/* ---------------- Modal ---------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cx('relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          >
            <div className="flex items-center justify-between border-b border-sand px-5 py-4">
              <h3 className="font-display text-2xl font-semibold text-forest">{title}</h3>
              <button onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-sand" aria-label="Tutup">
                <X className="size-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-5">{children}</div>
            {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-sand bg-ivory/60 px-5 py-3.5 pb-safe">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/* ---------------- Toasts ---------------- */

interface Toast {
  id: number
  text: string
  tone: 'ok' | 'error'
}
const ToastCtx = createContext<(text: string, tone?: 'ok' | 'error') => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const push = useCallback((text: string, tone: 'ok' | 'error' = 'ok') => {
    const id = Date.now() + Math.random()
    setItems((x) => [...x, { id, text, tone }])
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 4200)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[90] flex flex-col items-center gap-2 px-4">
          <AnimatePresence>
            {items.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className={cx('pointer-events-auto max-w-md rounded-2xl px-4 py-3 text-sm font-medium shadow-lg', t.tone === 'ok' ? 'bg-forest text-white' : 'bg-rose-600 text-white')}
              >
                {t.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)

/* ---------------- Misc ---------------- */

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx('size-6 animate-spin text-forest', className)} />
}

export function PageLoader() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <Spinner />
    </div>
  )
}

export function Empty({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sand-dark bg-white/60 px-6 py-12 text-center">
      {icon && <div className="mb-3 text-gold">{icon}</div>}
      <p className="font-display text-xl font-semibold text-forest">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function SectionTitle({ eyebrow, title, text, center, light }: { eyebrow?: string; title: ReactNode; text?: ReactNode; center?: boolean; light?: boolean }) {
  return (
    <Reveal className={cx('mb-10 max-w-2xl sm:mb-14', center && 'mx-auto text-center')}>
      {eyebrow && <p className={cx('eyebrow mb-3', light && 'text-gold')}>{eyebrow}</p>}
      <h2 className={cx('font-display text-4xl font-semibold leading-[1.05] sm:text-5xl', light ? 'text-white' : 'text-forest')}>{title}</h2>
      {text && <p className={cx('mt-4 text-[15.5px] leading-relaxed', light ? 'text-white/75' : 'text-muted')}>{text}</p>}
    </Reveal>
  )
}

export function useConfirm() {
  return (msg: string) => window.confirm(msg)
}
