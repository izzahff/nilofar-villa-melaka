import { ArrowLeft, ArrowRight, CalendarDays, Check, ClipboardList, MessageCircle, ShieldCheck, Users } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { WhatsAppIcon } from '../../components/BrandIcons'
import { DateRangeCalendar, type RangeValue } from '../../components/DateRangeCalendar'
import { TURNSTILE_KEY, Turnstile } from '../../components/Turnstile'
import { Button, Field, Input, Stepper, Textarea, cx, useToast } from '../../components/ui'
import { api, friendlyError } from '../../lib/api'
import { fmtDate, rm } from '../../lib/format'
import { useBusyNights, useMediaQuery } from '../../lib/hooks'
import { checkMinimumStay, estimatePrice, isRangeFree } from '../../lib/pricing'
import { useSettings } from '../../lib/settings'
import { waLink } from '../../lib/whatsapp'

const STEPS = ['Tarikh', 'Maklumat', 'WhatsApp']
const isoRe = /^\d{4}-\d{2}-\d{2}$/

export default function Booking() {
  const { settings, holidaySet } = useSettings()
  const { busy } = useBusyNights()
  const toast = useToast()
  const wide = useMediaQuery('(min-width: 768px)')
  const [params] = useSearchParams()
  const initIn = params.get('in')
  const initOut = params.get('out')

  const [step, setStep] = useState(0)
  const [range, setRange] = useState<RangeValue>({
    checkIn: initIn && isoRe.test(initIn) ? initIn : null,
    checkOut: initOut && isoRe.test(initOut) ? initOut : null,
  })
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [form, setForm] = useState({ name: '', phone: '', origin: '', remarks: '' })
  const [contactIdx, setContactIdx] = useState(0)
  const [agree, setAgree] = useState(false)
  const [token, setToken] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ link: string; ref: string | null } | null>(null)
  const onToken = useCallback((t: string) => setToken(t), [])

  const est = range.checkIn && range.checkOut ? estimatePrice(range.checkIn, range.checkOut, settings.prices, holidaySet) : null
  const stay = range.checkIn && range.checkOut ? checkMinimumStay(range.checkIn, range.checkOut, settings.prices, holidaySet) : null
  const free = range.checkIn && range.checkOut ? isRangeFree(range.checkIn, range.checkOut, busy) : true
  const total = adults + children
  const overCap = total > settings.site.capacity_max
  const step1Ok = !!est && !!stay?.ok && free && !overCap && adults > 0

  const contact = settings.contacts.whatsapp[contactIdx] ?? settings.contacts.whatsapp[0]

  const message = useMemo(() => {
    if (!est) return ''
    const lines = [
      'Assalamualaikum. Saya ingin semak kekosongan Nilofar Villa Melaka.',
      '',
      `Nama : ${form.name}`,
      `Dari mana : ${form.origin || '-'}`,
      `Tarikh Check In : ${fmtDate(range.checkIn)}`,
      `Tarikh Check Out : ${fmtDate(range.checkOut)}`,
      `Jumlah Dewasa : ${adults}`,
      `Jumlah Kanak2 : ${children}`,
      `Remarks : ${form.remarks || '-'}`,
      `Tel No : ${form.phone}`,
      '',
      `Anggaran harga ${est.label}: ${rm(est.total)} (${est.category === 'weekend' ? 'hujung minggu/cuti' : 'hari bekerja'})`,
      'Saya telah membaca dan bersetuju dengan peraturan homestay.',
    ]
    return lines.join('\n')
  }, [est, form, range, adults, children])

  function validate() {
    const e: Record<string, string> = {}
    if (form.name.trim().length < 2) e.name = 'Sila isi nama penuh'
    if (form.phone.replace(/\D/g, '').length < 9) e.phone = 'Nombor telefon tidak lengkap'
    if (!agree) e.agree = 'Sila baca dan setuju dengan peraturan'
    if (TURNSTILE_KEY && !token) e.token = 'Sila lengkapkan pengesahan'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit() {
    if (!validate() || !est || !contact) return
    setSending(true)
    // Open the tab now so mobile browsers do not block it as a popup
    const win = window.open('', '_blank')
    let ref: string | null = null
    try {
      const r = await api.submitEnquiry({
        guest_name: form.name.trim(),
        phone: form.phone.trim(),
        origin: form.origin.trim(),
        adults,
        children,
        check_in: range.checkIn!,
        check_out: range.checkOut!,
        remarks: form.remarks.trim(),
        estimate: est.total,
        turnstileToken: token,
      })
      ref = r.ref
    } catch (err) {
      toast(friendlyError(err), 'error')
    }
    const text = ref ? `${message}\nNo. rujukan: ${ref}` : message
    const link = waLink(contact.phone, text)
    if (win) win.location.href = link
    setResult({ link, ref })
    setStep(2)
    setSending(false)
  }

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-sand/70 to-ivory pb-24">
      <div className="container-x max-w-5xl pt-8 sm:pt-12">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-forest">
          <ArrowLeft className="size-4" /> Kembali
        </Link>
        <h1 className="font-display text-5xl font-semibold text-forest sm:text-6xl">Semak kekosongan</h1>
        <p className="mt-2 max-w-xl text-muted">Isi maklumat ringkas. Kami hantar terus ke WhatsApp tuan rumah untuk pengesahan, tiada bayaran online.</p>

        {/* Progress */}
        <ol className="mt-8 mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-2">
              <span className={cx('grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold transition', i < step ? 'bg-gold text-forest-dark' : i === step ? 'bg-forest text-white' : 'bg-white text-muted ring-1 ring-sand-dark')}>
                {i < step ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cx('hidden text-sm font-medium sm:block', i === step ? 'text-forest' : 'text-muted')}>{s}</span>
              {i < STEPS.length - 1 && (
                <span className="relative h-0.5 flex-1 overflow-hidden rounded bg-sand-dark">
                  <motion.span className="absolute inset-y-0 left-0 bg-gold" animate={{ width: i < step ? '100%' : '0%' }} transition={{ duration: 0.5 }} />
                </span>
              )}
            </li>
          ))}
        </ol>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }} className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              <div className="card p-5 sm:p-7">
                <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-semibold text-forest">
                  <CalendarDays className="size-5 text-gold-dark" /> Pilih tarikh
                </h2>
                <DateRangeCalendar busy={busy} holidays={holidaySet} value={range} onChange={setRange} months={wide ? 2 : 1} />
              </div>
              <div className="space-y-6">
                <div className="card p-5 sm:p-6">
                  <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-semibold text-forest">
                    <Users className="size-5 text-gold-dark" /> Tetamu
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Dewasa">
                      <Stepper value={adults} onChange={setAdults} min={1} max={40} />
                    </Field>
                    <Field label="Kanak-kanak">
                      <Stepper value={children} onChange={setChildren} max={40} />
                    </Field>
                  </div>
                  <p className={cx('mt-3 text-xs', overCap ? 'font-medium text-rose-600' : 'text-muted')}>
                    {overCap ? `Melebihi had maksimum ${settings.site.capacity_max} orang.` : `Ideal ${settings.site.capacity_ideal} orang, maksimum ${settings.site.capacity_max}.`}
                  </p>
                </div>
                <Summary est={est} range={range} stayMsg={stay && !stay.ok ? stay.reason : !free ? 'Tarikh dipilih bertindih dengan tempahan lain.' : undefined} />
                <Button size="lg" className="w-full" disabled={!step1Ok} onClick={() => setStep(1)}>
                  Seterusnya <ArrowRight className="size-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }} className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              <div className="card space-y-5 p-5 sm:p-7">
                <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-forest">
                  <ClipboardList className="size-5 text-gold-dark" /> Maklumat anda
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nama" error={errors.name}>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" placeholder="Nama penuh" />
                  </Field>
                  <Field label="No. telefon" error={errors.phone}>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" autoComplete="tel" placeholder="012-345 6789" />
                  </Field>
                  <Field label="Dari mana" className="sm:col-span-2">
                    <Input value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="Contoh: Shah Alam" />
                  </Field>
                  <Field label="Remarks" className="sm:col-span-2" hint="Contoh: majlis akikah, bawa warga emas, datang lewat malam">
                    <Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} maxLength={500} />
                  </Field>
                </div>

                {settings.contacts.whatsapp.length > 1 && (
                  <div>
                    <p className="label">Hantar kepada</p>
                    <div className="flex flex-wrap gap-2">
                      {settings.contacts.whatsapp.map((c, i) => (
                        <button
                          key={c.phone}
                          type="button"
                          onClick={() => setContactIdx(i)}
                          className={cx('flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium ring-1 transition', contactIdx === i ? 'bg-forest text-white ring-forest' : 'bg-white ring-sand-dark hover:bg-sand')}
                        >
                          <WhatsAppIcon className={cx('size-4', contactIdx === i ? 'text-[#25D366]' : 'text-[#128C7E]')} /> {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className={cx('rounded-2xl border p-4', errors.agree ? 'border-rose-300 bg-rose-50' : 'border-sand-dark bg-ivory')}>
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-forest">
                    <ShieldCheck className="size-4" /> Peraturan homestay
                  </p>
                  <ol className="mb-3 list-decimal space-y-1 pl-5 text-[13.5px] text-ink/80">
                    {settings.rules.house.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ol>
                  <ul className="mb-3 list-disc space-y-1 pl-5 text-[13px] text-muted">
                    {settings.rules.policies.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-5 accent-forest" />
                    <span>Saya telah membaca dan bersetuju dengan peraturan Nilofar Villa Melaka.</span>
                  </label>
                  {errors.agree && <p className="mt-1 text-xs text-rose-600">{errors.agree}</p>}
                </div>
                <Turnstile onToken={onToken} />
                {errors.token && <p className="text-xs text-rose-600">{errors.token}</p>}
              </div>
              <div className="space-y-4">
                <Summary est={est} range={range} adults={adults} children={children} />
                <Button size="lg" className="w-full !bg-[#1f8f4e] hover:!bg-[#187a42]" loading={sending} onClick={submit} icon={<WhatsAppIcon className="size-5" />}>
                  Hantar ke WhatsApp
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setStep(0)}>
                  <ArrowLeft className="size-4" /> Tukar tarikh
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && result && (
            <motion.div key="s2" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="card mx-auto max-w-2xl p-7 text-center sm:p-10">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.15 }} className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-[#25D366] text-white">
                <MessageCircle className="size-8" />
              </motion.div>
              <h2 className="font-display text-4xl font-semibold text-forest">Hampir siap!</h2>
              <p className="mx-auto mt-3 max-w-md text-muted">
                WhatsApp sepatutnya sudah dibuka dengan mesej lengkap. Tekan <b>Hantar</b> di WhatsApp supaya {contact?.name} boleh semak kekosongan.
              </p>
              {result.ref && <p className="mt-3 text-sm text-forest">No. rujukan anda: <b>{result.ref}</b></p>}
              <a href={result.link} target="_blank" rel="noreferrer" className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#1f8f4e] px-6 font-semibold text-white">
                <WhatsAppIcon className="size-5" /> Buka WhatsApp semula
              </a>
              <div className="mt-10 grid gap-3 text-left sm:grid-cols-3">
                {[
                  ['1', 'Tuan rumah sahkan tarikh', 'Biasanya dalam masa beberapa jam.'],
                  ['2', 'Isi borang & deposit', `Anda terima pautan borang pendaftaran dan deposit ${rm(settings.prices.deposit_standard)}.`],
                  ['3', 'Bayaran penuh', `Selewat-lewatnya ${settings.prices.full_payment_days_before} hari sebelum check in.`],
                ].map(([n, t, d]) => (
                  <div key={n} className="rounded-2xl bg-sand/60 p-4">
                    <span className="font-display text-3xl font-semibold text-gold-dark">{n}</span>
                    <p className="mt-1 font-semibold text-forest">{t}</p>
                    <p className="text-[13px] text-muted">{d}</p>
                  </div>
                ))}
              </div>
              <Link to="/" className="mt-8 inline-block text-sm text-muted underline">
                Kembali ke laman utama
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Summary({
  est,
  range,
  stayMsg,
  adults,
  children,
}: {
  est: ReturnType<typeof estimatePrice>
  range: RangeValue
  stayMsg?: string
  adults?: number
  children?: number
}) {
  const { settings } = useSettings()
  return (
    <div className="rounded-3xl bg-forest p-6 text-white">
      <p className="eyebrow text-gold">Ringkasan</p>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-white/65">Check in</dt>
          <dd>{range.checkIn ? `${fmtDate(range.checkIn)}, ${settings.site.checkin_time}` : '-'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-white/65">Check out</dt>
          <dd>{range.checkOut ? `${fmtDate(range.checkOut)}, ${settings.site.checkout_time}` : '-'}</dd>
        </div>
        {adults !== undefined && (
          <div className="flex justify-between">
            <dt className="text-white/65">Tetamu</dt>
            <dd>
              {adults} dewasa, {children} kanak-kanak
            </dd>
          </div>
        )}
        {est && (
          <div className="flex justify-between">
            <dt className="text-white/65">Pakej</dt>
            <dd>
              {est.label}, {est.category === 'weekend' ? 'hujung minggu' : 'hari bekerja'}
            </dd>
          </div>
        )}
      </dl>
      <div className="mt-4 border-t border-white/15 pt-4">
        <p className="text-sm text-white/65">Anggaran harga</p>
        <p className="font-display text-5xl font-semibold">{est ? rm(est.total) : '-'}</p>
        {est?.isEstimate && <p className="mt-1 text-xs text-gold">Harga akhir disahkan tuan rumah.</p>}
        <p className="mt-1 text-xs text-white/55">+ deposit keselamatan {rm(settings.prices.deposit_standard)} (dipulangkan)</p>
      </div>
      {stayMsg && <p className="mt-4 rounded-xl bg-rose/30 px-3 py-2 text-sm">{stayMsg}</p>}
    </div>
  )
}
