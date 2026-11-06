import { History } from 'lucide-react'
import { Empty, PageLoader, cx } from '../../components/ui'
import { api } from '../../lib/api'
import { STATUS_LABEL, fmtDateTime } from '../../lib/format'
import { useAsync } from '../../lib/hooks'
import type { AuditEntry, BookingStatus } from '../../lib/types'
import { PageHeader } from './AdminApp'

const TABLE: Record<string, string> = {
  bookings: 'Tempahan',
  payments: 'Bayaran',
  blocked_dates: 'Blok tarikh',
  settings: 'Tetapan',
  agreements: 'Perjanjian',
}
const ACTION: Record<string, string> = { INSERT: 'dicipta', UPDATE: 'dikemas kini', DELETE: 'dipadam', UPSERT: 'disimpan' }

function describe(e: AuditEntry) {
  const n = (e.new_data ?? e.old_data ?? {}) as Record<string, unknown>
  const name = (n.ref as string) || (n.receipt_no as string) || (n.reason as string) || e.record_id || ''
  const changes: string[] = []
  if (e.action === 'UPDATE' && e.old_data && e.new_data) {
    for (const k of Object.keys(e.new_data)) {
      if (['updated_at', 'nights'].includes(k)) continue
      if (JSON.stringify(e.old_data[k]) !== JSON.stringify(e.new_data[k])) {
        if (k === 'status') changes.push(`status ${STATUS_LABEL[e.old_data[k] as BookingStatus]} → ${STATUS_LABEL[e.new_data[k] as BookingStatus]}`)
        else if (e.table_name !== 'settings') changes.push(k)
      }
    }
  }
  return { name, changes }
}

export default function AuditPage() {
  const { data, loading } = useAsync(() => api.listAudit(200), [])
  if (loading) return <PageLoader />
  return (
    <div>
      <PageHeader title="Log aktiviti" subtitle="200 perubahan terkini oleh admin dan tetamu" />
      {!data?.length ? (
        <Empty icon={<History className="size-8" />} title="Belum ada aktiviti" />
      ) : (
        <ol className="card divide-y divide-sand">
          {data.map((e) => {
            const d = describe(e)
            return (
              <li key={e.id} className="flex gap-3 px-5 py-3">
                <span className={cx('mt-1.5 size-2 shrink-0 rounded-full', e.action === 'DELETE' ? 'bg-rose-500' : e.action === 'INSERT' ? 'bg-emerald-500' : 'bg-gold')} />
                <div className="min-w-0 flex-1 text-sm">
                  <p>
                    <b className="text-forest">{TABLE[e.table_name] ?? e.table_name}</b> {d.name} {ACTION[e.action] ?? e.action}
                  </p>
                  {d.changes.length > 0 && <p className="truncate text-xs text-muted">{d.changes.join(', ')}</p>}
                </div>
                <time className="shrink-0 text-xs text-muted">{fmtDateTime(e.at)}</time>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
