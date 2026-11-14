import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'

export interface LightboxItem {
  url: string
  caption?: string | null
}

export function Lightbox({ items, index, onChange }: { items: LightboxItem[]; index: number | null; onChange: (i: number | null) => void }) {
  useEffect(() => {
    if (index === null) return
    const on = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onChange(null)
      if (e.key === 'ArrowRight') onChange((index + 1) % items.length)
      if (e.key === 'ArrowLeft') onChange((index - 1 + items.length) % items.length)
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [index, items.length, onChange])
  const item = index !== null ? items[index] : null
  return (
    <AnimatePresence>
      {item && index !== null && (
        <motion.div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/92 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => onChange(null)}>
          <button className="absolute top-4 right-4 grid size-11 place-items-center rounded-full bg-white/10 text-white" aria-label="Tutup">
            <X className="size-5" />
          </button>
          <motion.img
            key={item.url}
            src={item.url}
            alt={item.caption ?? ''}
            className="max-h-[82dvh] max-w-full rounded-xl object-contain"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, i) => {
              if (i.offset.x < -60) onChange((index + 1) % items.length)
              if (i.offset.x > 60) onChange((index - 1 + items.length) % items.length)
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-4 text-white" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => onChange((index - 1 + items.length) % items.length)} className="grid size-11 place-items-center rounded-full bg-white/10" aria-label="Sebelum">
              <ChevronLeft className="size-5" />
            </button>
            <span className="min-w-40 text-center text-sm text-white/80">
              {item.caption} · {index + 1}/{items.length}
            </span>
            <button onClick={() => onChange((index + 1) % items.length)} className="grid size-11 place-items-center rounded-full bg-white/10" aria-label="Seterusnya">
              <ChevronRight className="size-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
