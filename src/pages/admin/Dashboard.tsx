import { addDays, endOfMonth, format, parseISO, startOfMonth, subDays, subMonths } from 'date-fns'
import { ms } from 'date-fns/locale'
import { ArrowRight, BellRing, CalendarClock, CircleDollarSign, Inbox, Percent, Plus, Undo2, Wallet } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Empty, PageLoader, StatusChip, cx } from '../../components/ui'
import { ACTIVE_STATUSES, fmtDate, rm } from '../../lib/format'
import { summarize } from '../../lib/money'
import { iso, stayNights, todayIso } from '../../lib/pricing'
import { useSettings } from '../../lib/settings'
import type { Booking } from '../../lib/types'
import { PageHeader } from './AdminApp'
import { BookingFormModal } from './BookingFormModal'
import { useAdminData } from './adminData'

export default function Dashboard() {
  const { bookings, payments, loading, paymentsFor } = useAdminData()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const today = todayIso()

  const d = useMemo(() => {
    const active = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status))
    const in30 = iso(addDays(new Date(), 30))
    const in7 = iso(addDays(new Date(), 7))
    const upcoming = active.filter((b) => b.check_in >= today && b.check_in <= in30)
    const enquiries = bookings.filter((b) => b.status === 'enquiry' && b.check_out >= today)
    const owing = active
      .filter((b) => b.check_out >= today && !['completed'].includes(b.status))
      .map((b) => ({ b, m: summarize(b, paymentsFor(b.id)) }))
      .filter((x) => x.m.rentBalance > 0 && x.b.total_price > 0)
    const owed = owing.reduce((a, x) => a + x.m.rentBalance, 0)
    const dueSoon = owing
      .filter((x) => iso(subDays(parseISO(x.b.check_in), settings.prices.full_payment_days_before)) <= iso(addDays(new Date(), 3)))
      .sort((a, b) => a.b.check_in.localeCompare(b.b.check_in))
    const refunds = bookings
      .filter((b) => b.status !== 'cancelled' && (b.status === 'completed' || b.check_out < today))
      .map((b) => ({ b, m: summarize(b, paymentsFor(b.id)) }))
      .filter((x) => x.m.depositHeld > 0)
    const checkins = active.filter((b) => b.check_in >= today && b.check_in <= in7).sort((a, b) => a.check_in.localeCompare(b.check_in))

    const ms0 = startOfMonth(new Date())
    const me = endOfMonth(new Date())
    const monthDays = me.getDate()
    const occ = new Set<string>()
    for (const b of active) for (const n of stayNights(b.check_in, b.check_out)) if (n >= iso(ms0) && n <= iso(me)) occ.add(n)
    const occupancy = Math.round((occ.size / monthDays) * 100)

    const collectedIn = (start: Date, end: Date) =>
      payments
        .filter((p) => ['rental', 'late_checkout', 'deposit_deduction'].includes(p.type))
        .filter((p) => p.paid_at.slice(0, 10) >= iso(start) && p.paid_at.slice(0, 10) <= iso(end))
        .reduce((a, p) => a + Number(p.amount), 0)
    const months = Array.from({ length: 6 }, (_, i) => {
      const m = subMonths(new Date(), 5 - i)
      return { label: format(m, 'MMM', { locale: ms }), v: collectedIn(startOfMonth(m), endOfMonth(m)) }
    })
    return { upcoming, enquiries, owed, dueSoon, refunds, checkins, occupancy, collected: months[5].v, months }
  }, [bookings, payments, paymentsFor, settings.prices.full_payment_days_before, today])

  if (loading) return <PageLoader />

  const kpis = [
    { label: 'Tempahan 30 hari', value: String(d.upcoming.length), icon: CalendarClock, tone: 'bg-forest text-gold' },
    { label: 'Semakan baru', value: String(d.enquiries.length), icon: Inbox, tone: 'bg-sky-100 text-sky-700' },
    { label: 'Baki belum bayar', value: rm(d.owed), icon: Wallet, tone: 'bg-amber-100 text-amber-700' },
    { label: 'Kadar isi bulan ini', value: `${d.occupancy}%`, icon: Percent, tone: 'bg-violet-100 text-violet-700' },
    { label: 'Kutipan bulan ini', value: rm(d.collected), icon: CircleDollarSign, tone: 'bg-emerald-100 text-emerald-700' },
  ]
  const max = Math.max(1, ...d.months.map((m) => m.v))

  return (
    <div>
      <PageHeader
        title={`Selamat ${greeting()}`}
        subtitle={format(new Date(), 'EEEE, d MMMM yyyy', { locale: ms })}
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
            Tempahan baru
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={cx('card p-4', i === 0 && 'col-span-2 md:col-span-1')}>
            <span className={cx('grid size-9 place-items-center rounded-xl', k.tone)}>
              <k.icon className="size-[18px]" />
            </span>
            <p className="mt-3 font-display text-3xl font-semibold text-forest">{k.value}</p>
            <p className="text-[12.5px] text-muted">{k.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Check in 7 hari" icon={CalendarClock} className="xl:col-span-2">
          {d.checkins.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Tiada check in minggu ini.</p>
          ) : (
            <ul className="divide-y divide-sand">
              {d.checkins.map((b) => (
                <BookingRow key={b.id} b={b} right={<StatusChip status={b.status} />} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Kutipan 6 bulan" icon={CircleDollarSign}>
          <div className="flex h-44 items-end gap-2">
            {d.months.map((m, i) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] text-muted tabular-nums">{m.v ? Math.round(m.v / 100) / 10 + 'k' : ''}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(4, (m.v / max) * 130)}px` }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className={cx('w-full rounded-t-lg', i === 5 ? 'bg-gold' : 'bg-forest/80')}
                />
                <span className="text-[11px] text-muted capitalize">{m.label}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Semakan baru" icon={Inbox} action={<Link to="/admin/tempahan?status=enquiry" className="text-xs text-forest underline">Semua</Link>}>
          {d.enquiries.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Tiada semakan baru.</p>
          ) : (
            <ul className="divide-y divide-sand">
              {d.enquiries.slice(0, 6).map((b) => (
                <BookingRow key={b.id} b={b} right={<span className="text-xs text-muted">{b.adults + b.children} org</span>} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Bayaran penuh hampir tamat tempoh" icon={BellRing}>
          {d.dueSoon.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Semua bayaran terkini.</p>
          ) : (
            <ul className="divide-y divide-sand">
              {d.dueSoon.map(({ b, m }) => (
                <BookingRow key={b.id} b={b} right={<span className="text-sm font-semibold text-amber-700">{rm(m.rentBalance)}</span>} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Deposit perlu dipulangkan" icon={Undo2}>
          {d.refunds.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Tiada deposit tertangguh.</p>
          ) : (
            <ul className="divide-y divide-sand">
              {d.refunds.map(({ b, m }) => (
                <BookingRow key={b.id} b={b} right={<span className="text-sm font-semibold text-forest">{rm(m.depositHeld)}</span>} />
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {bookings.length === 0 && (
        <div className="mt-6">
          <Empty title="Belum ada tempahan" text="Tambah tempahan pertama anda atau tunggu semakan daripada laman web." />
        </div>
      )}

      <BookingFormModal open={creating} onClose={() => setCreating(false)} onSaved={(b) => navigate(`/admin/tempahan/${b.id}`)} />
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'pagi'
  if (h < 15) return 'tengah hari'
  if (h < 19) return 'petang'
  return 'malam'
}

function Panel({ title, icon: Icon, children, className, action }: { title: string; icon: typeof Inbox; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={cx('card min-w-0 p-5', className)}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-forest">
          <Icon className="size-4 text-gold-dark" /> {title}
        </h2>
        {action}
      </div>
      {children}
    </motion.section>
  )
}

function BookingRow({ b, right }: { b: Booking; right?: React.ReactNode }) {
  return (
    <li>
      <Link to={`/admin/tempahan/${b.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-sand/50">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand text-center leading-none">
          <span className="text-[15px] font-semibold text-forest">{format(parseISO(b.check_in), 'd')}</span>
          <span className="text-[9px] text-muted uppercase">{format(parseISO(b.check_in), 'MMM', { locale: ms })}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium">{b.guest_name}</p>
          <p className="truncate text-xs text-muted">
            {b.ref} · {b.nights} malam · hingga {fmtDate(b.check_out, 'd MMM')}
          </p>
        </div>
        {right}
        <ArrowRight className="size-4 text-muted" />
      </Link>
    </li>
  )
}
