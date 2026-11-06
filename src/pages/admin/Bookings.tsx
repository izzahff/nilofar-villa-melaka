import { Download, KanbanSquare, List, Plus, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Empty, Input, PageLoader, Select, StatusChip, cx, useToast } from '../../components/ui'
import { api, friendlyError } from '../../lib/api'
import { STATUS_DOT, STATUS_LABEL, STATUS_ORDER, STATUS_SHORT, TYPE_LABEL, fmtDate, rm } from '../../lib/format'
import { summarize } from '../../lib/money'
import type { Booking, BookingStatus } from '../../lib/types'
import { PageHeader } from './AdminApp'
import { BookingFormModal } from './BookingFormModal'
import { useAdminData } from './adminData'
import { downloadCsv } from './csv'

export default function Bookings() {
  const { bookings, loading, paymentsFor, reload } = useAdminData()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const view = params.get('view') === 'list' ? 'list' : 'kanban'
  const status = (params.get('status') as BookingStatus | null) ?? ''
  const [q, setQ] = useState('')
  const [month, setMonth] = useState('')
  const [creating, setCreating] = useState(false)

  const setParam = (k: string, v: string) => {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v)
    else p.delete(k)
    setParams(p, { replace: true })
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    const digits = s.replace(/\D/g, '')
    return bookings
      .filter((b) => !status || b.status === status)
      .filter((b) => !month || b.check_in.startsWith(month) || b.check_out.startsWith(month))
      .filter(
        (b) =>
          !s ||
          b.guest_name.toLowerCase().includes(s) ||
          b.ref.toLowerCase().includes(s) ||
          (b.origin ?? '').toLowerCase().includes(s) ||
          (digits.length >= 3 && (b.phone ?? '').replace(/\D/g, '').includes(digits)),
      )
  }, [bookings, q, status, month])

  async function move(b: Booking, to: BookingStatus) {
    if (b.status === to) return
    try {
      await api.updateBooking(b.id, { status: to })
      await reload()
      toast(`${b.ref} dipindah ke ${STATUS_LABEL[to]}`)
    } catch (e) {
      toast(friendlyError(e), 'error')
    }
  }

  function exportCsv() {
    downloadCsv(
      `tempahan-nilofar-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        ['Rujukan', 'Nama', 'Telefon', 'Dari', 'Check in', 'Check out', 'Malam', 'Dewasa', 'Kanak-kanak', 'Jenis', 'Status', 'Harga', 'Sewa dibayar', 'Baki', 'Deposit dipegang', 'Sumber'],
        ...filtered.map((b) => {
          const m = summarize(b, paymentsFor(b.id))
          return [b.ref, b.guest_name, b.phone ?? '', b.origin ?? '', b.check_in, b.check_out, b.nights, b.adults, b.children, TYPE_LABEL[b.booking_type], STATUS_LABEL[b.status], b.total_price, m.rentPaid, m.rentBalance, m.depositHeld, b.source ?? '']
        }),
      ],
    )
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Tempahan"
        subtitle={`${filtered.length} daripada ${bookings.length} tempahan`}
        actions={
          <>
            <Button variant="outline" icon={<Download className="size-4" />} onClick={exportCsv}>
              CSV
            </Button>
            <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
              Baru
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, rujukan, telefon..." className="pl-10" />
        </div>
        <Select value={status} onChange={(e) => setParam('status', e.target.value)} className="w-auto">
          <option value="">Semua status</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto" aria-label="Bulan" />
        <div className="flex rounded-full bg-white p-1 ring-1 ring-sand-dark">
          {(
            [
              ['kanban', KanbanSquare],
              ['list', List],
            ] as const
          ).map(([v, Icon]) => (
            <button key={v} onClick={() => setParam('view', v === 'kanban' ? '' : v)} className={cx('relative grid h-9 w-11 place-items-center rounded-full', view === v ? 'text-white' : 'text-muted')} aria-label={v}>
              {view === v && <motion.span layoutId="view-pill" className="absolute inset-0 rounded-full bg-forest" />}
              <Icon className="relative size-4" />
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty title="Tiada tempahan" text="Cuba tukar carian atau tapisan." />
      ) : view === 'kanban' ? (
        <Kanban items={filtered} onMove={move} />
      ) : (
        <ListView items={filtered} />
      )}

      <BookingFormModal open={creating} onClose={() => setCreating(false)} onSaved={(b) => navigate(`/admin/tempahan/${b.id}`)} />
    </div>
  )
}

function ListView({ items }: { items: Booking[] }) {
  const { paymentsFor } = useAdminData()
  return (
    <div className="card overflow-hidden">
      <div className="hidden grid-cols-[1.4fr_1fr_0.7fr_0.8fr_0.9fr] gap-3 border-b border-sand bg-sand/40 px-5 py-3 text-xs font-semibold tracking-wide text-muted uppercase md:grid">
        <span>Tetamu</span>
        <span>Tarikh</span>
        <span>Harga</span>
        <span>Baki</span>
        <span>Status</span>
      </div>
      <ul className="divide-y divide-sand">
        {items.map((b) => {
          const m = summarize(b, paymentsFor(b.id))
          return (
            <li key={b.id}>
              <Link to={`/admin/tempahan/${b.id}`} className="grid gap-1 px-5 py-3.5 transition hover:bg-sand/40 md:grid-cols-[1.4fr_1fr_0.7fr_0.8fr_0.9fr] md:items-center md:gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{b.guest_name}</p>
                  <p className="truncate text-xs text-muted">
                    {b.ref} · {b.phone ?? 'tiada telefon'}
                  </p>
                </div>
                <p className="text-sm">
                  {fmtDate(b.check_in, 'd MMM')} → {fmtDate(b.check_out, 'd MMM yy')} <span className="text-muted">({b.nights}M)</span>
                </p>
                <p className="text-sm tabular-nums">{rm(b.total_price)}</p>
                <p className={cx('text-sm tabular-nums', m.rentBalance > 0 ? 'text-amber-700' : 'text-emerald-700')}>{m.rentBalance > 0 ? rm(m.rentBalance) : 'Lunas'}</p>
                <div>
                  <StatusChip status={b.status} />
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Kanban({ items, onMove }: { items: Booking[]; onMove: (b: Booking, s: BookingStatus) => void }) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [over, setOver] = useState<BookingStatus | null>(null)
  const { paymentsFor } = useAdminData()

  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
      {STATUS_ORDER.map((s) => {
        const col = items.filter((b) => b.status === s).sort((a, b) => a.check_in.localeCompare(b.check_in))
        return (
          <div
            key={s}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(s)
            }}
            onDragLeave={() => setOver(null)}
            onDrop={() => {
              const b = items.find((x) => x.id === dragId)
              if (b) onMove(b, s)
              setDragId(null)
              setOver(null)
            }}
            className={cx('flex w-[78vw] max-w-72 shrink-0 snap-start flex-col rounded-2xl bg-white/60 p-2 ring-1 ring-black/5 transition sm:w-64', over === s && 'bg-gold/15 ring-gold')}
          >
            <div className="flex items-center gap-2 px-2 py-2">
              <span className={cx('size-2.5 rounded-full', STATUS_DOT[s])} />
              <span className="text-[13px] font-semibold text-forest">{STATUS_SHORT[s]}</span>
              <span className="ml-auto rounded-full bg-sand px-2 text-xs text-muted">{col.length}</span>
            </div>
            <div className="flex min-h-24 flex-col gap-2">
              <AnimatePresence>
                {col.map((b) => {
                  const m = summarize(b, paymentsFor(b.id))
                  return (
                    <motion.div
                      layout
                      key={b.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: dragId === b.id ? 0.4 : 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      draggable
                      onDragStart={() => setDragId(b.id)}
                      onDragEnd={() => setDragId(null)}
                      className="group cursor-grab rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5 active:cursor-grabbing"
                    >
                      <Link to={`/admin/tempahan/${b.id}`} className="block" draggable={false}>
                        <p className="truncate text-[14px] font-medium">{b.guest_name}</p>
                        <p className="text-xs text-muted">
                          {fmtDate(b.check_in, 'd MMM')} → {fmtDate(b.check_out, 'd MMM')} · {b.adults + b.children} org
                        </p>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-muted">{b.ref}</span>
                          {b.total_price > 0 && <span className={cx('font-medium tabular-nums', m.rentBalance > 0 ? 'text-amber-700' : 'text-emerald-700')}>{m.rentBalance > 0 ? `Baki ${rm(m.rentBalance)}` : 'Lunas'}</span>}
                        </div>
                      </Link>
                      <select
                        aria-label="Pindah status"
                        value={b.status}
                        onChange={(e) => onMove(b, e.target.value as BookingStatus)}
                        className="mt-2 w-full rounded-lg bg-sand/60 px-2 py-1 text-xs text-forest outline-none lg:hidden"
                      >
                        {STATUS_ORDER.map((x) => (
                          <option key={x} value={x}>
                            Pindah ke: {STATUS_SHORT[x]}
                          </option>
                        ))}
                      </select>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        )
      })}
    </div>
  )
}
