import { Calculator, TriangleAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button, Field, Input, Modal, Select, Stepper, Textarea, useToast } from '../../components/ui'
import { api, friendlyError } from '../../lib/api'
import { ACTIVE_STATUSES, SOURCES, STATUS_LABEL, STATUS_ORDER, TYPE_LABEL, rm } from '../../lib/format'
import { estimatePrice, nightsBetween, rangesOverlap } from '../../lib/pricing'
import { useSettings } from '../../lib/settings'
import type { Booking, BookingInput, BookingStatus, BookingType } from '../../lib/types'
import { useAdminData } from './adminData'

const empty = (deposit: number): BookingInput => ({
  guest_name: '',
  phone: '',
  origin: '',
  address: '',
  adults: 2,
  children: 0,
  check_in: '',
  check_out: '',
  booking_type: 'standard',
  status: 'pending',
  source: '',
  remarks: '',
  notes: '',
  total_price: 0,
  deposit_amount: deposit,
  organization: '',
  external_ref: '',
})

export function BookingFormModal({
  open,
  onClose,
  booking,
  initial,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  booking?: Booking | null
  initial?: Partial<BookingInput>
  onSaved?: (b: Booking) => void
}) {
  const { settings, holidaySet } = useSettings()
  const { bookings, blocks, reload } = useAdminData()
  const toast = useToast()
  const [f, setF] = useState<BookingInput>(() => empty(settings.prices.deposit_standard))
  const [saving, setSaving] = useState(false)
  const [priceTouched, setPriceTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    if (booking) {
      const { id: _i, ref: _r, nights: _n, form_token: _t, registered_at: _ra, created_at: _c, updated_at: _u, ...rest } = booking
      setF({ ...rest, phone: rest.phone ?? '', origin: rest.origin ?? '', address: rest.address ?? '', source: rest.source ?? '', remarks: rest.remarks ?? '', notes: rest.notes ?? '', organization: rest.organization ?? '', external_ref: rest.external_ref ?? '' })
      setPriceTouched(true)
    } else {
      setF({ ...empty(settings.prices.deposit_standard), ...initial })
      setPriceTouched(false)
    }
  }, [open, booking, initial, settings.prices.deposit_standard])

  const set = <K extends keyof BookingInput>(k: K, v: BookingInput[K]) => setF((x) => ({ ...x, [k]: v }))
  const valid = f.check_in && f.check_out && f.check_out > f.check_in
  const est = valid ? estimatePrice(f.check_in, f.check_out, settings.prices, holidaySet) : null

  // Fill the price from the rate table until the admin types a price
  useEffect(() => {
    if (!priceTouched && est && f.booking_type !== 'special') setF((x) => ({ ...x, total_price: est.total }))
  }, [est?.total, priceTouched, f.booking_type]) // eslint-disable-line react-hooks/exhaustive-deps

  const clash = useMemo(() => {
    if (!valid || !ACTIVE_STATUSES.includes(f.status)) return null
    const b = bookings.find((o) => o.id !== booking?.id && ACTIVE_STATUSES.includes(o.status) && rangesOverlap(o.check_in, o.check_out, f.check_in, f.check_out))
    if (b) return `Bertindih dengan ${b.ref} (${b.guest_name})`
    const k = blocks.find((o) => rangesOverlap(o.start_date, o.end_date, f.check_in, f.check_out))
    if (k) return `Bertindih dengan blok "${k.reason}"`
    return null
  }, [valid, f.status, f.check_in, f.check_out, bookings, blocks, booking?.id])

  async function save() {
    if (f.guest_name.trim().length < 2) return toast('Nama tetamu diperlukan', 'error')
    if (!valid) return toast('Tarikh check out mesti selepas check in', 'error')
    setSaving(true)
    try {
      const payload: BookingInput = {
        ...f,
        guest_name: f.guest_name.trim(),
        phone: f.phone?.trim() || null,
        origin: f.origin?.trim() || null,
        address: f.address?.trim() || null,
        source: f.source || null,
        remarks: f.remarks?.trim() || null,
        notes: f.notes?.trim() || null,
        organization: f.organization?.trim() || null,
        external_ref: f.external_ref?.trim() || null,
        total_price: Number(f.total_price) || 0,
        deposit_amount: Number(f.deposit_amount) || 0,
      }
      const saved = booking ? await api.updateBooking(booking.id, payload) : await api.createBooking(payload)
      await reload()
      toast(booking ? 'Tempahan dikemas kini' : `Tempahan ${saved.ref} dicipta`)
      onSaved?.(saved)
      onClose()
    } catch (e) {
      toast(friendlyError(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={booking ? `Edit ${booking.ref}` : 'Tempahan baru'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={save} loading={saving}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama tetamu">
          <Input value={f.guest_name} onChange={(e) => set('guest_name', e.target.value)} />
        </Field>
        <Field label="No. telefon">
          <Input value={f.phone ?? ''} onChange={(e) => set('phone', e.target.value)} inputMode="tel" />
        </Field>
        <Field label="Check in">
          <Input type="date" value={f.check_in} onChange={(e) => set('check_in', e.target.value)} />
        </Field>
        <Field label="Check out">
          <Input type="date" value={f.check_out} min={f.check_in || undefined} onChange={(e) => set('check_out', e.target.value)} />
        </Field>
        {valid && (
          <p className="text-sm text-muted sm:col-span-2">
            {nightsBetween(f.check_in, f.check_out)} malam · {est?.category === 'weekend' ? 'kadar hujung minggu / cuti' : 'kadar hari bekerja'} · anggaran {est ? rm(est.total) : '-'}
          </p>
        )}
        {clash && (
          <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2">
            <TriangleAlert className="size-4 shrink-0" /> {clash}
          </p>
        )}
        <Field label="Jenis tempahan">
          <Select
            value={f.booking_type}
            onChange={(e) => {
              const t = e.target.value as BookingType
              setF((x) => ({ ...x, booking_type: t, deposit_amount: t === 'event' ? settings.prices.deposit_event : settings.prices.deposit_standard }))
            }}
          >
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={f.status} onChange={(e) => set('status', e.target.value as BookingStatus)}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Harga sewa (RM)" hint={f.booking_type === 'special' ? 'Harga khas mengikut perjanjian' : undefined}>
          <div className="flex gap-2">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={f.total_price}
              onChange={(e) => {
                setPriceTouched(true)
                set('total_price', Number(e.target.value))
              }}
            />
            {est && (
              <Button type="button" variant="outline" size="md" className="!px-3" title="Guna anggaran" onClick={() => set('total_price', est.total)}>
                <Calculator className="size-4" />
              </Button>
            )}
          </div>
        </Field>
        <Field label="Deposit keselamatan (RM)">
          <Input type="number" min={0} value={f.deposit_amount} onChange={(e) => set('deposit_amount', Number(e.target.value))} />
        </Field>
        <Field label="Dewasa">
          <Stepper value={f.adults} onChange={(n) => set('adults', n)} />
        </Field>
        <Field label="Kanak-kanak">
          <Stepper value={f.children} onChange={(n) => set('children', n)} />
        </Field>
        <Field label="Dari mana">
          <Input value={f.origin ?? ''} onChange={(e) => set('origin', e.target.value)} />
        </Field>
        <Field label="Sumber">
          <Select value={f.source ?? ''} onChange={(e) => set('source', e.target.value)}>
            <option value="">-</option>
            {SOURCES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label="Alamat" className="sm:col-span-2">
          <Input value={f.address ?? ''} onChange={(e) => set('address', e.target.value)} />
        </Field>
        {f.booking_type === 'special' && (
          <>
            <Field label="Organisasi / jabatan">
              <Input value={f.organization ?? ''} onChange={(e) => set('organization', e.target.value)} />
            </Field>
            <Field label="No. rujukan luar (LO / PO)">
              <Input value={f.external_ref ?? ''} onChange={(e) => set('external_ref', e.target.value)} />
            </Field>
          </>
        )}
        <Field label="Remarks tetamu" className="sm:col-span-2">
          <Textarea value={f.remarks ?? ''} onChange={(e) => set('remarks', e.target.value)} className="min-h-16" />
        </Field>
        <Field label="Nota dalaman" className="sm:col-span-2" hint="Tidak dilihat oleh tetamu">
          <Textarea value={f.notes ?? ''} onChange={(e) => set('notes', e.target.value)} className="min-h-16" />
        </Field>
      </div>
    </Modal>
  )
}
