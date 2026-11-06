import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, getDay, isSameMonth, parseISO, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { ms } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { iso, isRangeFree, todayIso } from '../lib/pricing'
import { cx } from './ui'

const WEEKDAYS = ['Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab', 'Ahd']

export interface RangeValue {
  checkIn: string | null
  checkOut: string | null
}

interface Props {
  busy: Set<string>
  holidays: Set<string>
  value: RangeValue
  onChange?: (v: RangeValue) => void
  months?: 1 | 2
  readOnly?: boolean
}

/**
 * Night-based calendar. A busy date means that night is taken, so it cannot be
 * a check in day, but it can still be the check out day of a stay.
 */
export function DateRangeCalendar({ busy, holidays, value, onChange, months = 2, readOnly }: Props) {
  const [cursor, setCursor] = useState(() => startOfMonth(value.checkIn ? parseISO(value.checkIn) : new Date()))
  const [dir, setDir] = useState(1)
  const [hover, setHover] = useState<string | null>(null)
  const today = todayIso()
  const minMonth = startOfMonth(new Date())

  const pick = (d: string) => {
    if (readOnly || !onChange) return
    const { checkIn, checkOut } = value
    if (!checkIn || checkOut || d <= checkIn) {
      if (busy.has(d) || d < today) return
      onChange({ checkIn: d, checkOut: null })
      return
    }
    if (isRangeFree(checkIn, d, busy)) onChange({ checkIn, checkOut: d })
    else if (!busy.has(d)) onChange({ checkIn: d, checkOut: null })
  }

  const go = (n: number) => {
    setDir(n)
    setCursor((c) => (n > 0 ? addMonths(c, 1) : subMonths(c, 1)))
  }

  const monthList = useMemo(() => Array.from({ length: months }, (_, i) => addMonths(cursor, i)), [cursor, months])
  const previewEnd = value.checkIn && !value.checkOut && hover && hover > value.checkIn && isRangeFree(value.checkIn, hover, busy) ? hover : null

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={cursor <= minMonth}
          className="grid size-9 place-items-center rounded-full ring-1 ring-sand-dark transition hover:bg-sand disabled:opacity-30"
          aria-label="Bulan sebelum"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="flex flex-1 justify-around gap-6 font-display text-xl font-semibold capitalize text-forest">
          {monthList.map((m, i) => (
            <span key={i} className={cx(i > 0 && 'hidden md:inline')}>
              {format(m, 'MMMM yyyy', { locale: ms })}
            </span>
          ))}
        </div>
        <button type="button" onClick={() => go(1)} className="grid size-9 place-items-center rounded-full ring-1 ring-sand-dark transition hover:bg-sand" aria-label="Bulan seterusnya">
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={iso(cursor)}
            custom={dir}
            initial={{ x: dir * 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: dir * -40, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={cx('grid gap-6', months === 2 && 'md:grid-cols-2')}
          >
            {monthList.map((m, i) => (
              <div key={i} className={cx(i > 0 && 'hidden md:block')}>
                <div className="grid grid-cols-7 pb-1 text-center text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {WEEKDAYS.map((w) => (
                    <div key={w} className="py-1">
                      {w}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                  {eachDayOfInterval({ start: startOfWeek(startOfMonth(m), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(m), { weekStartsOn: 1 }) }).map((day) => {
                    const d = iso(day)
                    const inMonth = isSameMonth(day, m)
                    const past = d < today
                    const isBusy = busy.has(d)
                    const isHoliday = holidays.has(d)
                    const dow = getDay(day)
                    const isWeekendNight = dow === 5 || dow === 6
                    const start = value.checkIn === d
                    const end = (value.checkOut ?? previewEnd) === d
                    const inRange = value.checkIn && (value.checkOut ?? previewEnd) && d > value.checkIn && d < (value.checkOut ?? previewEnd)!
                    if (!inMonth) return <div key={d} />
                    return (
                      <div key={d} className={cx('relative', (inRange || ((start || end) && (value.checkOut ?? previewEnd))) && 'bg-gold/15', start && 'rounded-l-full', end && 'rounded-r-full')}>
                        <button
                          type="button"
                          disabled={readOnly ? false : past}
                          onClick={() => pick(d)}
                          onMouseEnter={() => setHover(d)}
                          title={isBusy ? 'Sudah ditempah' : isHoliday ? 'Cuti umum (harga hujung minggu)' : undefined}
                          className={cx(
                            'relative mx-auto flex aspect-square w-full max-w-11 flex-col items-center justify-center rounded-full text-[14px] tabular-nums transition',
                            past && 'text-ink/25',
                            !past && isBusy && !start && !end && 'text-ink/35 line-through decoration-rose/70 decoration-2',
                            !past && !isBusy && !start && !end && !readOnly && 'hover:bg-sand hover:ring-1 hover:ring-gold/60',
                            (start || end) && 'bg-forest font-semibold text-white shadow-md',
                            !past && !isBusy && isWeekendNight && !start && !end && 'font-semibold text-forest',
                          )}
                        >
                          {format(day, 'd')}
                          {isHoliday && !past && <span className={cx('absolute bottom-1 size-1 rounded-full', start || end ? 'bg-gold' : 'bg-rose')} />}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-white ring-1 ring-sand-dark" /> Kosong
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-ink/40 line-through decoration-rose decoration-2">12</span> Sudah ditempah
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-rose" /> Cuti umum
        </span>
        <span className="flex items-center gap-1.5">
          <span className="font-semibold text-forest">15</span> Malam hujung minggu
        </span>
      </div>
    </div>
  )
}
