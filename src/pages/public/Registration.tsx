import { CheckCircle2, FileUp, Link2Off, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, Field, Input, PageLoader, Select, Stepper, Textarea, cx, useToast } from '../../components/ui'
import { api, friendlyError } from '../../lib/api'
import { SOURCES, fmtDate, rm } from '../../lib/format'
import { useAsync } from '../../lib/hooks'
import { useSettings } from '../../lib/settings'

export default function Registration() {
  const { token = '' } = useParams()
  const { settings } = useSettings()
  const toast = useToast()
  const { data, loading } = useAsync(() => api.getBookingForm(token), [token])
  const [f, setF] = useState({ guest_name: '', address: '', phone: '', adults: 1, children: 0, source: '', remarks: '' })
  const [slip, setSlip] = useState<File | null>(null)
  const [agree, setAgree] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (data)
      setF({
        guest_name: data.guest_name ?? '',
        address: data.address ?? '',
        phone: data.phone ?? '',
        adults: data.adults ?? 1,
        children: data.children ?? 0,
        source: data.source ?? '',
        remarks: data.remarks ?? '',
      })
  }, [data])

  if (loading) return <PageLoader />
  if (!data)
    return (
      <div className="container-x max-w-lg py-24 text-center">
        <Link2Off className="mx-auto size-12 text-rose" />
        <h1 className="mt-4 font-display text-4xl font-semibold text-forest">Pautan tidak sah</h1>
        <p className="mt-2 text-muted">Pautan borang ini tidak wujud atau tempahan telah tamat. Sila hubungi tuan rumah melalui WhatsApp.</p>
        <Link to="/" className="mt-6 inline-block text-forest underline">
          Ke laman utama
        </Link>
      </div>
    )

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!agree) return toast('Sila setuju dengan peraturan homestay', 'error')
    if (f.guest_name.trim().length < 2 || f.phone.replace(/\D/g, '').length < 9 || f.address.trim().length < 5) return toast('Sila lengkapkan nama, alamat dan nombor telefon', 'error')
    if (slip && slip.size > 10 * 1024 * 1024) return toast('Fail resit melebihi 10 MB', 'error')
    setSaving(true)
    try {
      await api.submitRegistration(token, f)
      if (slip) await api.uploadSlip(token, slip)
      setDone(true)
    } catch (err) {
      toast(friendlyError(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  if (done)
    return (
      <div className="container-x max-w-lg py-24 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
          <CheckCircle2 className="mx-auto size-16 text-forest" />
        </motion.div>
        <h1 className="mt-4 font-display text-4xl font-semibold text-forest">Terima kasih!</h1>
        <p className="mt-2 text-muted">Maklumat tempahan {data.ref} telah diterima. Tuan rumah akan sahkan penginapan anda melalui WhatsApp.</p>
      </div>
    )

  return (
    <div className="bg-gradient-to-b from-sand/70 to-ivory pb-24">
      <div className="container-x max-w-3xl pt-10">
        <p className="eyebrow">Borang pendaftaran homestay</p>
        <h1 className="mt-2 font-display text-5xl font-semibold text-forest">Assalamualaikum {data.guest_name.split(' ')[0]}</h1>
        <p className="mt-2 text-muted">Terima kasih kerana memilih Nilofar Villa Melaka. Lengkapkan maklumat di bawah supaya kami boleh sahkan penginapan anda.</p>

        <div className="mt-6 grid gap-3 rounded-3xl bg-forest p-5 text-sm text-white sm:grid-cols-4">
          <div>
            <p className="text-white/60">Rujukan</p>
            <p className="font-semibold">{data.ref}</p>
          </div>
          <div>
            <p className="text-white/60">Check in</p>
            <p className="font-semibold">{fmtDate(data.check_in)}</p>
          </div>
          <div>
            <p className="text-white/60">Check out</p>
            <p className="font-semibold">{fmtDate(data.check_out)}</p>
          </div>
          <div>
            <p className="text-white/60">Deposit</p>
            <p className="font-semibold">{rm(data.deposit_amount)}</p>
          </div>
        </div>

        <form onSubmit={submit} className="card mt-6 space-y-5 p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="1. Nama penuh" className="sm:col-span-2">
              <Input value={f.guest_name} onChange={(e) => setF({ ...f, guest_name: e.target.value })} required />
            </Field>
            <Field label="2. Alamat" className="sm:col-span-2">
              <Textarea value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} required />
            </Field>
            <Field label="3. No. telefon">
              <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="tel" required />
            </Field>
            <Field label="Di mana dapat maklumat tentang kami?">
              <Select value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}>
                <option value="">Pilih</option>
                {SOURCES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field label="4. Dewasa">
              <Stepper value={f.adults} onChange={(n) => setF({ ...f, adults: n })} min={1} />
            </Field>
            <Field label="5. Kanak-kanak">
              <Stepper value={f.children} onChange={(n) => setF({ ...f, children: n })} />
            </Field>
            <Field label="Catatan" className="sm:col-span-2">
              <Textarea value={f.remarks} onChange={(e) => setF({ ...f, remarks: e.target.value })} />
            </Field>
          </div>

          <div className="rounded-2xl border border-dashed border-sand-dark bg-ivory p-4">
            <p className="label flex items-center gap-2">
              <FileUp className="size-4" /> Resit deposit {rm(data.deposit_amount)} (pilihan)
            </p>
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setSlip(e.target.files?.[0] ?? null)} className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-white" />
            <p className="mt-2 text-xs text-muted">
              {settings.contacts.whatsapp[0] && `Atau hantar resit terus kepada ${settings.contacts.whatsapp[0].name} melalui WhatsApp.`}
            </p>
          </div>

          <div className="rounded-2xl bg-sand/50 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-forest">
              <ShieldCheck className="size-4" /> Makluman awal
            </p>
            <ul className="list-disc space-y-1 pl-5 text-[13.5px] text-ink/80">
              <li>
                Check in {settings.site.checkin_time}, check out {settings.site.checkout_time}. Tambahan masa {rm(settings.prices.late_checkout_per_hour)} sejam sehingga {settings.prices.late_checkout_until}, bergantung pada kekosongan.
              </li>
              <li>Deposit keselamatan dipulangkan selewat-lewatnya 24 jam selepas check out jika tiada kerosakan atau kehilangan dan rumah dikembalikan bersih.</li>
              <li>Set BBQ percuma, arang tidak disediakan.</li>
              {settings.rules.house.concat(settings.rules.policies).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-5 accent-forest" />
              <span>Saya bersetuju dengan semua makluman dan peraturan di atas.</span>
            </label>
          </div>

          <Button type="submit" size="lg" className={cx('w-full')} loading={saving}>
            Hantar borang
          </Button>
        </form>
      </div>
    </div>
  )
}
