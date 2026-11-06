import { endOfMonth, format, getDaysInMonth, startOfMonth, subMonths } from 'date-fns'
import { ms } from 'date-fns/locale'
import { Download } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo } from 'react'
import { Button, PageLoader, cx } from '../../components/ui'
import { ACTIVE_STATUSES, PAYMENT_LABEL, rm } from '../../lib/format'
import { iso, stayNights } from '../../lib/pricing'
import { PageHeader } from './AdminApp'
import { useAdminData } from './adminData'
import { downloadCsv } from './csv'

const INCOME = ['rental', 'late_checkout', 'deposit_deduction']

export default function Reports() {
  const { bookings, payments, loading } = useAdminData()

  const rows = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = subMonths(new Date(), 11 - i)
      const s = iso(startOfMonth(m))
      const e = iso(endOfMonth(m))
      const income = payments.filter((p) => INCOME.includes(p.type) && p.paid_at.slice(0, 10) >= s && p.paid_at.slice(0, 10) <= e).reduce((a, p) => a + Number(p.amount), 0)
      const nights = new Set<string>()
      let stays = 0
      for (const b of bookings.filter((b) => ACTIVE_STATUSES.includes(b.status))) {
        const ns = stayNights(b.check_in, b.check_out).filter((n) => n >= s && n <= e)
        ns.forEach((n) => nights.add(n))
        if (b.check_in >= s && b.check_in <= e) stays++
      }
      return { key: format(m, 'yyyy-MM'), label: format(m, 'MMM yy', { locale: ms }), income, stays, occupancy: Math.round((nights.size / getDaysInMonth(m)) * 100) }
    })
  }, [bookings, payments])

  const sources = useMemo(() => {
    const m = new Map<string, number>()
    for (const b of bookings.filter((b) => b.status !== 'cancelled')) m.set(b.source || 'Tidak dinyatakan', (m.get(b.source || 'Tidak dinyatakan') ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [bookings])

  if (loading) return <PageLoader />
  const max = Math.max(1, ...rows.map((r) => r.income))
  const year = rows.reduce((a, r) => a + r.income, 0)
  const totalSources = sources.reduce((a, [, n]) => a + n, 0) || 1

  function exportPayments() {
    const byId = new Map(bookings.map((b) => [b.id, b]))
    downloadCsv(`bayaran-nilofar-${iso(new Date())}.csv`, [
      ['No. resit', 'Tarikh', 'Tempahan', 'Tetamu', 'Jenis', 'Kaedah', 'Rujukan', 'Amaun'],
      ...payments.map((p) => [p.receipt_no, p.paid_at.slice(0, 10), byId.get(p.booking_id)?.ref ?? '', byId.get(p.booking_id)?.guest_name ?? '', PAYMENT_LABEL[p.type], p.method, p.reference ?? '', p.amount]),
    ])
  }

  return (
    <div>
      <PageHeader
        title="Laporan"
        subtitle="Kutipan termasuk sewa, caj lewat check out dan potongan deposit. Deposit keselamatan tidak dikira."
        actions={
          <Button variant="outline" icon={<Download className="size-4" />} onClick={exportPayments}>
            Eksport bayaran
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Kutipan 12 bulan" value={rm(year)} />
        <Stat label="Purata sebulan" value={rm(Math.round(year / 12))} />
        <Stat label="Kadar isi purata" value={`${Math.round(rows.reduce((a, r) => a + r.occupancy, 0) / 12)}%`} />
      </div>

      <section className="card mt-6 p-5 sm:p-6">
        <h2 className="mb-6 text-[15px] font-semibold text-forest">Kutipan bulanan</h2>
        <div className="flex h-60 items-end gap-1.5 sm:gap-3">
          {rows.map((r, i) => (
            <div key={r.key} className="group relative flex flex-1 flex-col items-center gap-1.5">
              <span className="pointer-events-none absolute -top-7 hidden rounded-md bg-forest px-2 py-0.5 text-[11px] whitespace-nowrap text-white group-hover:block">{rm(r.income)}</span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(3, (r.income / max) * 200)}px` }}
                transition={{ delay: i * 0.04, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className={cx('w-full rounded-t-lg', i === 11 ? 'bg-gold' : 'bg-forest/80 group-hover:bg-forest')}
              />
              <span className="text-[10px] text-muted capitalize sm:text-[11px]">{r.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-sand/40 text-left text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Bulan</th>
                <th className="px-4 py-3 text-right">Tempahan</th>
                <th className="px-4 py-3 text-right">Kadar isi</th>
                <th className="px-4 py-3 text-right">Kutipan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {[...rows].reverse().map((r) => (
                <tr key={r.key}>
                  <td className="px-4 py-2.5 capitalize">{r.label}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.stays}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.occupancy}%</td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums">{rm(r.income)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card p-5 sm:p-6">
          <h2 className="mb-4 text-[15px] font-semibold text-forest">Sumber tempahan</h2>
          <ul className="space-y-3">
            {sources.map(([s, n], i) => (
              <li key={s}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{s}</span>
                  <span className="text-muted tabular-nums">{n}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-sand">
                  <motion.div className="h-full rounded-full bg-gold" initial={{ width: 0 }} animate={{ width: `${(n / totalSources) * 100}%` }} transition={{ delay: i * 0.05, duration: 0.6 }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="card p-5">
    <p className="font-display text-3xl font-semibold text-forest">{value}</p>
    <p className="text-[13px] text-muted">{label}</p>
  </div>
)
