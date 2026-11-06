import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { ms } from 'date-fns/locale'
import { Ban, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Field, Input, Modal, PageLoader, cx, useToast } from '../../components/ui'
import { api, friendlyError } from '../../lib/api'
import { STATUS_DOT, STATUS_LABEL, STATUS_STYLE, fmtDate } from '../../lib/format'
import { iso, todayIso } from '../../lib/pricing'
import { useSettings } from '../../lib/settings'
import type { BookingInput } from '../../lib/types'
import { PageHeader } from './AdminApp'
import { BookingFormModal } from './BookingFormModal'
import { useAdminData } from './adminData'

const WEEKDAYS = ['Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab', 'Ahd']

export default function CalendarPage() {
  const { bookings, blocks, loading, reload } = useAdminData()
  const { holidaySet, holidays } = useSettings()
  const navigate = useNavigate()
  const toast = useToast()
  const [cursor, setCursor] = useState(startOfMonth(new Date()))
  const [dir, setDir] = useState(1)
  const [newBooking, setNewBooking] = useState<Partial<BookingInput> | null>(null)
  const [blockOpen, setBlockOpen] = useState(false)
  const [block, setBlock] = useState({ start: '', end: '', reason: 'Guna sendiri' })
  const [showCancelled, setShowCancelled] = useState(false)
  const today = todayIso()

  const days = useMemo(() => eachDayOfInterval({ start: startOfWeek(cursor, { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }) }), [cursor])
  const visible = bookings.filter((b) => showCancelled || b.status !== 'cancelled')

  const go = (n: number) => {
    setDir(n)
    setCursor((c) => (n > 0 ? addMonths(c, 1) : subMonths(c, 1)))
  }

  async function addBlock() {
    try {
      await api.addBlock(block.start, block.end, block.reason || 'Tutup')
      await reload()
      setBlockOpen(false)
      toast('Tarikh diblok')
    } catch (e) {
      toast(friendlyError(e), 'error')
    }
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Kalendar"
        subtitle="Tekan tarikh kosong untuk tambah tempahan. Tekan tempahan untuk butiran."
        actions={
          <>
            <Button variant="outline" icon={<Ban className="size-4" />} onClick={() => setBlockOpen(true)}>
              Blok tarikh
            </Button>
            <Button icon={<Plus className="size-4" />} onClick={() => setNewBooking({})}>
              Tempahan
            </Button>
          </>
        }
      />

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-sand px-4 py-3">
          <button onClick={() => go(-1)} className="grid size-9 place-items-center rounded-full hover:bg-sand" aria-label="Bulan sebelum">
            <ChevronLeft className="size-5" />
          </button>
          <div className="text-center">
            <p className="font-display text-2xl font-semibold text-forest capitalize">{format(cursor, 'MMMM yyyy', { locale: ms })}</p>
            <button onClick={() => setCursor(startOfMonth(new Date()))} className="text-xs text-muted underline">
              Hari ini
            </button>
          </div>
          <button onClick={() => go(1)} className="grid size-9 place-items-center rounded-full hover:bg-sand" aria-label="Bulan seterusnya">
            <ChevronRight className="size-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 border-b border-sand bg-sand/40 text-center text-[11px] font-semibold tracking-wider text-muted uppercase">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-2">
              {w}
            </div>
          ))}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={iso(cursor)} initial={{ opacity: 0, x: dir * 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -30 }} transition={{ duration: 0.25 }} className="grid grid-cols-7">
            {days.map((day) => {
              const d = iso(day)
              const inMonth = isSameMonth(day, cursor)
              const nights = visible.filter((b) => b.check_in <= d && d < b.check_out)
              const outs = visible.filter((b) => b.check_out === d && b.status !== 'cancelled')
              const blk = blocks.find((k) => k.start_date <= d && d < k.end_date)
              const free = !blk && !nights.some((b) => b.status !== 'enquiry' && b.status !== 'cancelled')
              const hol = holidays.find((h) => h.date === d)
              return (
                <div
                  key={d}
                  onClick={() => free && d >= today && setNewBooking({ check_in: d, check_out: iso(new Date(day.getTime() + 86400000)) })}
                  className={cx(
                    'group relative min-h-24 border-r border-b border-sand p-1.5 text-left sm:min-h-28',
                    !inMonth && 'bg-sand/25 text-muted/50',
                    free && d >= today && 'cursor-pointer hover:bg-gold/10',
                    blk && 'bg-[repeating-linear-gradient(135deg,#f1ece4_0_6px,#e8e0d3_6px_12px)]',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cx('grid size-6 place-items-center rounded-full text-[12.5px] tabular-nums', d === today && 'bg-forest font-semibold text-white', holidaySet.has(d) && d !== today && 'text-rose font-semibold')}>{format(day, 'd')}</span>
                    {free && d >= today && inMonth && <Plus className="size-3.5 text-gold-dark opacity-0 transition group-hover:opacity-100" />}
                  </div>
                  {hol && <p className="truncate text-[10px] text-rose">{hol.name}</p>}
                  {blk && <p className="mt-0.5 truncate text-[10.5px] font-medium text-muted">⛔ {blk.reason}</p>}
                  <div className="mt-0.5 space-y-0.5">
                    {outs.map((b) => (
                      <p key={b.id + 'o'} className="truncate text-[10px] text-muted">
                        ↩ {b.guest_name.split(' ')[0]} keluar
                      </p>
                    ))}
                    {nights.map((b) => (
                      <button
                        key={b.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/admin/tempahan/${b.id}`)
                        }}
                        title={`${b.guest_name} · ${STATUS_LABEL[b.status]}`}
                        className={cx('flex w-full items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-left text-[10.5px] font-medium ring-1 ring-inset', STATUS_STYLE[b.status])}
                      >
                        {b.check_in === d && <span className={cx('size-1.5 shrink-0 rounded-full', STATUS_DOT[b.status])} />}
                        <span className="truncate">{b.guest_name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
        {(['enquiry', 'pending', 'deposit_paid', 'fully_paid', 'checked_in', 'completed'] as const).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={cx('size-2.5 rounded-full', STATUS_DOT[s])} /> {STATUS_LABEL[s]}
          </span>
        ))}
        <label className="ml-auto flex items-center gap-1.5">
          <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} className="accent-forest" /> Papar dibatalkan
        </label>
      </div>

      {blocks.length > 0 && (
        <div className="card mt-6 p-5">
          <h2 className="mb-3 text-[15px] font-semibold text-forest">Tarikh diblok</h2>
          <ul className="divide-y divide-sand">
            {blocks.map((k) => (
              <li key={k.id} className="flex items-center gap-3 py-2.5 text-sm">
                <Ban className="size-4 text-muted" />
                <span className="flex-1">
                  {fmtDate(k.start_date)} → {fmtDate(k.end_date)} · <span className="text-muted">{k.reason}</span>
                </span>
                <button
                  onClick={async () => {
                    if (!window.confirm('Buang blok ini?')) return
                    await api.deleteBlock(k.id)
                    reload()
                  }}
                  className="grid size-8 place-items-center rounded-full text-rose-600 hover:bg-rose-50"
                  aria-label="Buang"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <BookingFormModal open={!!newBooking} onClose={() => setNewBooking(null)} initial={newBooking ?? undefined} onSaved={(b) => navigate(`/admin/tempahan/${b.id}`)} />

      <Modal
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        title="Blok tarikh"
        footer={
          <>
            <Button variant="ghost" onClick={() => setBlockOpen(false)}>
              Batal
            </Button>
            <Button onClick={addBlock} disabled={!block.start || !block.end || block.end <= block.start}>
              Blok
            </Button>
          </>
        }
      >
        <p className="mb-4 text-sm text-muted">Malam dari tarikh mula hingga sehari sebelum tarikh akhir akan ditunjuk penuh kepada pelanggan.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tarikh mula">
            <Input type="date" value={block.start} onChange={(e) => setBlock({ ...block, start: e.target.value })} />
          </Field>
          <Field label="Tarikh akhir">
            <Input type="date" value={block.end} min={block.start} onChange={(e) => setBlock({ ...block, end: e.target.value })} />
          </Field>
          <Field label="Sebab" className="sm:col-span-2">
            <Input value={block.reason} onChange={(e) => setBlock({ ...block, reason: e.target.value })} />
          </Field>
        </div>
      </Modal>
    </div>
  )
}
