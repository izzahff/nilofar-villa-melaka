import {
  ArrowLeft,
  CalendarDays,
  Copy,
  Download,
  FileText,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Receipt,
  Share2,
  Trash2,
  Undo2,
  Upload,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { WhatsAppIcon } from '../../components/BrandIcons'
import { Button, Empty, Field, Input, Modal, PageLoader, Select, StatusChip, Textarea, cx, useToast } from '../../components/ui'
import { api, friendlyError } from '../../lib/api'
import { DOC_LABEL, PAYMENT_LABEL, STATUS_LABEL, STATUS_ORDER, TYPE_LABEL, fmtDate, fmtDateTime, rm } from '../../lib/format'
import { useAsync } from '../../lib/hooks'
import { summarize } from '../../lib/money'
import { useSettings } from '../../lib/settings'
import type { Agreement, Booking, BookingStatus, DocKind, Payment, PaymentType, ScheduleItem, TemplateSettings } from '../../lib/types'
import { bookingVars, fillTemplate, waLink } from '../../lib/whatsapp'
import { BookingFormModal } from './BookingFormModal'
import { useAdminData } from './adminData'
import { sharePdf, siteUrl } from './share'

const TEMPLATE_LABEL: Record<keyof TemplateSettings, string> = {
  availability_reply: 'Balasan semakan',
  confirm: 'Sahkan tarikh & deposit',
  registration: 'Pautan borang',
  reminder: 'Peringatan bayaran',
  checkin: 'Info check in',
  thanks: 'Terima kasih',
}

export default function BookingDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { settings } = useSettings()
  const { bookings, paymentsFor, reload, loading } = useAdminData()
  const booking = bookings.find((b) => b.id === id) ?? null
  const payments = paymentsFor(id)
  const m = booking ? summarize(booking, payments) : null
  const [editing, setEditing] = useState(false)
  const [payOpen, setPayOpen] = useState<PaymentType | null>(null)

  if (loading) return <PageLoader />
  if (!booking || !m)
    return <Empty title="Tempahan tidak dijumpai" action={<Link to="/admin/tempahan" className="text-forest underline">Kembali</Link>} />

  const formUrl = `${siteUrl()}/borang/${booking.form_token}`
  const vars = bookingVars(booking, settings, { balance: m.rentBalance, formUrl })

  async function setStatus(s: BookingStatus) {
    try {
      await api.updateBooking(booking!.id, { status: s })
      await reload()
      toast(`Status: ${STATUS_LABEL[s]}`)
    } catch (e) {
      toast(friendlyError(e), 'error')
    }
  }

  async function remove() {
    if (!window.confirm(`Padam tempahan ${booking!.ref}? Semua bayaran dan dokumen berkaitan juga dipadam.`)) return
    try {
      await api.deleteBooking(booking!.id)
      await reload()
      toast('Tempahan dipadam')
      navigate('/admin/tempahan')
    } catch (e) {
      toast(friendlyError(e), 'error')
    }
  }

  async function shareReceipt(p: Payment) {
    const { receiptPdf } = await import('../../lib/pdf')
    const all = payments.some((x) => x.id === p.id) ? payments : [...payments, p]
    const doc = receiptPdf(settings, booking!, p, all)
    const text = `Resit ${p.receipt_no} untuk tempahan ${booking!.ref}, ${PAYMENT_LABEL[p.type]} ${rm(p.amount)}. Terima kasih.`
    await sharePdf(doc, `${p.receipt_no}.pdf`, text, booking!.phone ? waLink(booking!.phone, text) : undefined)
  }

  async function downloadReceipt(p: Payment) {
    const { receiptPdf } = await import('../../lib/pdf')
    receiptPdf(settings, booking!, p, payments).save(`${p.receipt_no}.pdf`)
  }

  async function deletePayment(p: Payment) {
    if (!window.confirm(`Padam ${p.receipt_no}? Rekod padam kekal dalam log aktiviti.`)) return
    try {
      await api.deletePayment(p.id)
      await reload()
      toast('Bayaran dipadam')
    } catch (e) {
      toast(friendlyError(e), 'error')
    }
  }

  return (
    <div>
      <Link to="/admin/tempahan" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-forest">
        <ArrowLeft className="size-4" /> Semua tempahan
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-4xl font-semibold text-forest">{booking.guest_name}</h1>
            <StatusChip status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {booking.ref} · {TYPE_LABEL[booking.booking_type]} · dicipta {fmtDateTime(booking.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={booking.status} onChange={(e) => setStatus(e.target.value as BookingStatus)} className="h-11 w-auto">
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
          <Button variant="outline" icon={<Pencil className="size-4" />} onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button variant="ghost" className="text-rose-600" onClick={remove} aria-label="Padam">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          {/* Info */}
          <section className="card p-5 sm:p-6">
            <div className="grid gap-5 sm:grid-cols-3">
              <Info icon={CalendarDays} label="Check in" value={fmtDate(booking.check_in, 'EEE, d MMM yyyy')} />
              <Info icon={CalendarDays} label="Check out" value={fmtDate(booking.check_out, 'EEE, d MMM yyyy')} />
              <Info icon={Users} label="Tetamu" value={`${booking.nights} malam · ${booking.adults} dewasa, ${booking.children} kanak-kanak`} />
              <Info icon={Phone} label="Telefon" value={booking.phone ?? '-'} href={booking.phone ? `tel:${booking.phone}` : undefined} />
              <Info icon={MapPin} label="Dari" value={booking.origin ?? '-'} />
              <Info icon={FileText} label="Sumber" value={booking.source ?? '-'} />
            </div>
            {(booking.address || booking.remarks || booking.notes || booking.organization) && (
              <div className="mt-5 grid gap-3 border-t border-sand pt-5 text-sm sm:grid-cols-2">
                {booking.address && <Detail label="Alamat" value={booking.address} />}
                {booking.organization && <Detail label="Organisasi" value={`${booking.organization}${booking.external_ref ? ` (${booking.external_ref})` : ''}`} />}
                {booking.remarks && <Detail label="Remarks tetamu" value={booking.remarks} />}
                {booking.notes && <Detail label="Nota dalaman" value={booking.notes} />}
              </div>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl bg-sand/50 p-3 text-sm">
              <span className="font-medium text-forest">Borang pendaftaran</span>
              <span className={cx('rounded-full px-2 py-0.5 text-xs', booking.registered_at ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-muted')}>{booking.registered_at ? `Diisi ${fmtDateTime(booking.registered_at)}` : 'Belum diisi'}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(formUrl)
                  toast('Pautan borang disalin')
                }}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium ring-1 ring-sand-dark hover:bg-sand"
              >
                <Copy className="size-3.5" /> Salin pautan
              </button>
            </div>
          </section>

          {/* Payments */}
          <section className="card p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold text-forest">
                <Receipt className="size-4 text-gold-dark" /> Bayaran & resit
              </h2>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="soft" onClick={() => setPayOpen('deposit')}>
                  + Deposit
                </Button>
                <Button size="sm" variant="soft" onClick={() => setPayOpen('rental')}>
                  + Sewa
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPayOpen('late_checkout')}>
                  + Lain
                </Button>
              </div>
            </div>
            {payments.length === 0 ? (
              <p className="rounded-xl bg-sand/40 py-6 text-center text-sm text-muted">Belum ada bayaran direkod.</p>
            ) : (
              <ul className="divide-y divide-sand">
                {payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium">
                        {PAYMENT_LABEL[p.type]} <span className="text-muted">· {p.receipt_no}</span>
                      </p>
                      <p className="text-xs text-muted">
                        {fmtDateTime(p.paid_at)} · {p.method}
                        {p.reference ? ` · ${p.reference}` : ''}
                      </p>
                    </div>
                    <span className={cx('font-semibold tabular-nums', p.type === 'deposit_refund' ? 'text-rose-600' : 'text-forest')}>
                      {p.type === 'deposit_refund' ? '-' : ''}
                      {rm(p.amount)}
                    </span>
                    <div className="flex gap-1">
                      <IconBtn title="Muat turun resit" onClick={() => downloadReceipt(p)}>
                        <Download className="size-4" />
                      </IconBtn>
                      <IconBtn title="Kongsi resit" onClick={() => shareReceipt(p)}>
                        <Share2 className="size-4" />
                      </IconBtn>
                      <IconBtn title="Padam" onClick={() => deletePayment(p)} className="text-rose-600">
                        <Trash2 className="size-4" />
                      </IconBtn>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {booking.booking_type === 'special' && <AgreementEditor booking={booking} />}
          <Documents booking={booking} />
        </div>

        <div className="space-y-6">
          {/* Money summary */}
          <section className="rounded-3xl bg-forest p-6 text-white">
            <p className="eyebrow text-gold">Ringkasan wang</p>
            <dl className="mt-4 space-y-2.5 text-sm">
              <Row label="Harga sewa" value={rm(booking.total_price)} />
              <Row label="Sewa dibayar" value={rm(m.rentPaid)} />
              <Row label="Baki sewa" value={rm(m.rentBalance)} strong tone={m.rentBalance > 0 ? 'text-gold' : 'text-emerald-300'} />
              <div className="my-3 border-t border-white/15" />
              <Row label="Deposit diterima" value={rm(m.depositReceived)} />
              {m.depositDeducted > 0 && <Row label="Potongan kerosakan" value={`-${rm(m.depositDeducted)}`} />}
              {m.depositRefunded > 0 && <Row label="Dipulangkan" value={`-${rm(m.depositRefunded)}`} />}
              <Row label="Deposit dipegang" value={rm(m.depositHeld)} strong />
              {m.lateFees > 0 && <Row label="Caj lewat check out" value={rm(m.lateFees)} />}
            </dl>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button disabled={m.rentBalance <= 0} onClick={() => setPayOpen('rental')} className="h-10 rounded-full bg-gold text-sm font-semibold text-forest-dark disabled:opacity-40">
                Terima baki
              </button>
              <button disabled={m.depositHeld <= 0} onClick={() => setPayOpen('deposit_refund')} className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-white/10 text-sm font-medium disabled:opacity-40">
                <Undo2 className="size-4" /> Pulang deposit
              </button>
            </div>
          </section>

          {/* WhatsApp */}
          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-forest">
              <WhatsAppIcon className="size-4 text-[#25D366]" /> Mesej WhatsApp
            </h2>
            {!booking.phone ? (
              <p className="text-sm text-muted">Tambah nombor telefon untuk hantar mesej.</p>
            ) : (
              <div className="grid gap-2">
                {(Object.keys(TEMPLATE_LABEL) as (keyof TemplateSettings)[]).map((k) => (
                  <a
                    key={k}
                    href={waLink(booking.phone!, fillTemplate(settings.templates[k], vars))}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-11 items-center justify-between rounded-xl bg-sand/50 px-4 text-sm font-medium text-forest transition hover:bg-[#25D366] hover:text-white"
                  >
                    {TEMPLATE_LABEL[k]} <span aria-hidden>→</span>
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <BookingFormModal open={editing} onClose={() => setEditing(false)} booking={booking} />
      <PaymentModal booking={booking} type={payOpen} onClose={() => setPayOpen(null)} heldDeposit={m.depositHeld} rentBalance={m.rentBalance} onSaved={shareReceipt} />
    </div>
  )
}

function Info({ icon: Icon, label, value, href }: { icon: typeof Phone; label: string; value: string; href?: string }) {
  const v = <p className="mt-0.5 text-[14.5px] font-medium">{value}</p>
  return (
    <div className="flex gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sand text-forest">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        {href ? (
          <a href={href} className="underline decoration-gold">
            {v}
          </a>
        ) : (
          v
        )}
      </div>
    </div>
  )
}

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-muted">{label}</p>
    <p className="whitespace-pre-wrap">{value}</p>
  </div>
)

const Row = ({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: string }) => (
  <div className="flex justify-between">
    <dt className="text-white/65">{label}</dt>
    <dd className={cx('tabular-nums', strong && 'text-base font-semibold', tone)}>{value}</dd>
  </div>
)

const IconBtn = ({ children, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className={cx('grid size-9 place-items-center rounded-full text-forest transition hover:bg-sand', className)} {...p}>
    {children}
  </button>
)

/* ---------------- Payment modal ---------------- */

function PaymentModal({
  booking,
  type,
  onClose,
  heldDeposit,
  rentBalance,
  onSaved,
}: {
  booking: Booking
  type: PaymentType | null
  onClose: () => void
  heldDeposit: number
  rentBalance: number
  onSaved: (p: Payment) => void
}) {
  const { reload } = useAdminData()
  const { settings } = useSettings()
  const toast = useToast()
  const [f, setF] = useState({ type: 'deposit' as PaymentType, amount: 0, method: 'Pindahan bank', paid_at: '', reference: '', notes: '', share: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!type) return
    const amount =
      type === 'deposit' ? booking.deposit_amount : type === 'rental' ? rentBalance : type === 'deposit_refund' ? heldDeposit : type === 'late_checkout' ? settings.prices.late_checkout_per_hour : 0
    const local = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    setF({ type, amount, method: 'Pindahan bank', paid_at: local, reference: '', notes: '', share: true })
  }, [type, booking.deposit_amount, rentBalance, heldDeposit, settings.prices.late_checkout_per_hour])

  async function save() {
    if (!(f.amount > 0)) return toast('Amaun mesti lebih daripada 0', 'error')
    setSaving(true)
    try {
      const p = await api.addPayment({
        booking_id: booking.id,
        type: f.type,
        amount: Number(f.amount),
        method: f.method,
        paid_at: new Date(f.paid_at).toISOString(),
        reference: f.reference || null,
        notes: f.notes || null,
      })
      await reload()
      toast(`Direkod. Resit ${p.receipt_no}`)
      onClose()
      if (f.share) onSaved(p)
    } catch (e) {
      toast(friendlyError(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={!!type}
      onClose={onClose}
      title="Rekod bayaran"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={save} loading={saving} icon={<Receipt className="size-4" />}>
            Simpan & jana resit
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jenis" className="sm:col-span-2">
          <Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as PaymentType })}>
            {Object.entries(PAYMENT_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Amaun (RM)">
          <Input type="number" min={0} step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: Number(e.target.value) })} />
        </Field>
        <Field label="Tarikh & masa">
          <Input type="datetime-local" value={f.paid_at} onChange={(e) => setF({ ...f, paid_at: e.target.value })} />
        </Field>
        <Field label="Kaedah">
          <Select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
            {['Pindahan bank', 'DuitNow', 'Tunai', 'Cek', 'Lain-lain'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Select>
        </Field>
        <Field label="No. rujukan">
          <Input value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} />
        </Field>
        <Field label="Catatan" className="sm:col-span-2" hint={f.type === 'deposit_deduction' ? 'Nyatakan kerosakan atau kehilangan' : undefined}>
          <Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className="min-h-16" />
        </Field>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={f.share} onChange={(e) => setF({ ...f, share: e.target.checked })} className="size-4 accent-forest" />
          Kongsi resit PDF selepas simpan
        </label>
      </div>
    </Modal>
  )
}

/* ---------------- Agreement ---------------- */

function AgreementEditor({ booking }: { booking: Booking }) {
  const { settings } = useSettings()
  const toast = useToast()
  const { data, loading, reload } = useAsync(() => api.getAgreement(booking.id), [booking.id])
  const [a, setA] = useState<Agreement | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (loading) return
    setA(
      data ?? {
        booking_id: booking.id,
        party_name: booking.organization || booking.guest_name,
        representative: booking.guest_name,
        position: '',
        contact: booking.phone,
        external_ref: booking.external_ref,
        agreed_total: booking.total_price,
        schedule: [],
        terms: '',
      },
    )
  }, [data, loading, booking])

  const sum = useMemo(() => (a ? a.schedule.reduce((x, s) => x + Number(s.amount || 0), 0) : 0), [a])
  if (!a) return null
  const setItem = (i: number, patch: Partial<ScheduleItem>) => setA({ ...a, schedule: a.schedule.map((s, j) => (j === i ? { ...s, ...patch } : s)) })

  async function save() {
    setSaving(true)
    try {
      await api.saveAgreement({ ...a!, agreed_total: Number(a!.agreed_total) })
      await reload()
      toast('Perjanjian disimpan')
    } catch (e) {
      toast(friendlyError(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function pdf() {
    const { agreementPdf } = await import('../../lib/pdf')
    agreementPdf(settings, booking, a!).save(`Perjanjian-${booking.ref}.pdf`)
  }

  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-forest">
          <FileText className="size-4 text-gold-dark" /> Perjanjian tempahan khas
        </h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" icon={<Download className="size-4" />} onClick={pdf}>
            PDF
          </Button>
          <Button size="sm" onClick={save} loading={saving}>
            Simpan
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pihak penyewa (jabatan / syarikat)">
          <Input value={a.party_name} onChange={(e) => setA({ ...a, party_name: e.target.value })} />
        </Field>
        <Field label="No. rujukan (LO / PO)">
          <Input value={a.external_ref ?? ''} onChange={(e) => setA({ ...a, external_ref: e.target.value })} />
        </Field>
        <Field label="Nama wakil">
          <Input value={a.representative ?? ''} onChange={(e) => setA({ ...a, representative: e.target.value })} />
        </Field>
        <Field label="Jawatan wakil">
          <Input value={a.position ?? ''} onChange={(e) => setA({ ...a, position: e.target.value })} />
        </Field>
        <Field label="Hubungan">
          <Input value={a.contact ?? ''} onChange={(e) => setA({ ...a, contact: e.target.value })} />
        </Field>
        <Field label="Jumlah dipersetujui (RM)">
          <Input type="number" value={a.agreed_total} onChange={(e) => setA({ ...a, agreed_total: Number(e.target.value) })} />
        </Field>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="label !mb-0">Jadual bayaran</p>
          <Button size="sm" variant="ghost" icon={<Plus className="size-4" />} onClick={() => setA({ ...a, schedule: [...a.schedule, { label: `Ansuran ${a.schedule.length + 1}`, due_date: booking.check_in, amount: 0 }] })}>
            Tambah
          </Button>
        </div>
        <div className="space-y-2">
          {a.schedule.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded-xl bg-sand/40 p-2 sm:grid-cols-[1.4fr_1fr_0.8fr_auto]">
              <Input value={s.label} onChange={(e) => setItem(i, { label: e.target.value })} className="col-span-2 sm:col-span-1" />
              <Input type="date" value={s.due_date} onChange={(e) => setItem(i, { due_date: e.target.value })} />
              <Input type="number" value={s.amount} onChange={(e) => setItem(i, { amount: Number(e.target.value) })} />
              <button onClick={() => setA({ ...a, schedule: a.schedule.filter((_, j) => j !== i) })} className="grid size-11 place-items-center rounded-xl text-rose-600 hover:bg-white" aria-label="Buang">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        {a.schedule.length > 0 && (
          <p className={cx('mt-2 text-sm', Math.abs(sum - a.agreed_total) > 0.01 ? 'text-rose-600' : 'text-emerald-700')}>
            Jumlah jadual {rm(sum)} {Math.abs(sum - a.agreed_total) > 0.01 ? `tidak sama dengan ${rm(a.agreed_total)}` : 'sepadan'}
          </p>
        )}
      </div>
      <Field label="Terma tambahan (satu baris satu terma)" className="mt-4">
        <Textarea value={a.terms ?? ''} onChange={(e) => setA({ ...a, terms: e.target.value })} />
      </Field>
    </section>
  )
}

/* ---------------- Documents ---------------- */

function Documents({ booking }: { booking: Booking }) {
  const toast = useToast()
  const { data, reload } = useAsync(() => api.listDocuments(booking.id), [booking.id])
  const [kind, setKind] = useState<DocKind>('deposit_slip')
  const [busy, setBusy] = useState(false)

  async function upload(file: File) {
    if (file.size > 10 * 1024 * 1024) return toast('Fail melebihi 10 MB', 'error')
    setBusy(true)
    try {
      await api.uploadDocument(booking.id, kind, file)
      await reload()
      toast('Dokumen dimuat naik')
    } catch (e) {
      toast(friendlyError(e), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function open(path: string) {
    const win = window.open('', '_blank')
    try {
      const url = await api.getDocumentUrl(path)
      if (win) {
        if (url.startsWith('data:')) win.document.write(`<iframe src="${url}" style="border:0;width:100%;height:100%"></iframe>`)
        else win.location.href = url
      }
    } catch (e) {
      win?.close()
      toast(friendlyError(e), 'error')
    }
  }

  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-forest">
          <Upload className="size-4 text-gold-dark" /> Dokumen
        </h2>
        <div className="flex gap-2">
          <Select value={kind} onChange={(e) => setKind(e.target.value as DocKind)} className="h-9 w-auto py-1 text-sm">
            {Object.entries(DOC_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <label className={cx('inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-forest px-4 text-[13px] font-medium text-white', busy && 'opacity-50')}>
            <Upload className="size-4" /> Muat naik
            <input type="file" accept="image/*,application/pdf" className="hidden" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
        </div>
      </div>
      {!data?.length ? (
        <p className="rounded-xl bg-sand/40 py-6 text-center text-sm text-muted">Tiada dokumen. Resit deposit, perjanjian bertandatangan atau Local Order boleh disimpan di sini.</p>
      ) : (
        <ul className="divide-y divide-sand">
          {data.map((d) => (
            <li key={d.id} className="flex items-center gap-3 py-2.5">
              <FileText className="size-5 text-gold-dark" />
              <button onClick={() => open(d.path)} className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium underline decoration-sand-dark">{d.file_name}</p>
                <p className="text-xs text-muted">
                  {DOC_LABEL[d.kind]} · {d.uploaded_by} · {fmtDateTime(d.created_at)}
                </p>
              </button>
              <IconBtn
                title="Padam"
                className="text-rose-600"
                onClick={async () => {
                  if (!window.confirm('Padam dokumen ini?')) return
                  await api.deleteDocument(d)
                  reload()
                }}
              >
                <Trash2 className="size-4" />
              </IconBtn>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
