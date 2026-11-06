import { Plus, Save, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { Button, Field, Input, Select, Textarea, cx, useToast } from '../../components/ui'
import { api, friendlyError } from '../../lib/api'
import { fmtDate } from '../../lib/format'
import { useSettings } from '../../lib/settings'
import type { AllSettings, ContentSettings, Holiday, SettingKey } from '../../lib/types'
import { PageHeader } from './AdminApp'

const TABS = [
  ['harga', 'Harga & polisi'],
  ['cuti', 'Cuti'],
  ['kandungan', 'Kandungan'],
  ['peraturan', 'Peraturan'],
  ['hubungan', 'Hubungan & bank'],
  ['templat', 'Templat WhatsApp'],
] as const
type Tab = (typeof TABS)[number][0]

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('harga')
  return (
    <div>
      <PageHeader title="Tetapan" subtitle="Perubahan terus dipaparkan di laman web selepas disimpan." />
      <div className="no-scrollbar -mx-4 mb-6 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cx('relative h-10 shrink-0 rounded-full px-4 text-sm font-medium', tab === k ? 'text-white' : 'text-muted hover:text-forest')}>
            {tab === k && <motion.span layoutId="set-tab" className="absolute inset-0 rounded-full bg-forest" />}
            <span className="relative">{l}</span>
          </button>
        ))}
      </div>
      {tab === 'harga' && <PricesTab />}
      {tab === 'cuti' && <HolidaysTab />}
      {tab === 'kandungan' && <ContentTab />}
      {tab === 'peraturan' && <RulesTab />}
      {tab === 'hubungan' && <ContactsTab />}
      {tab === 'templat' && <TemplatesTab />}
    </div>
  )
}

/** Local editable copy of one settings key with a save button. */
function useSetting<K extends SettingKey>(key: K) {
  const { settings, reload } = useSettings()
  const toast = useToast()
  const [value, setValue] = useState<AllSettings[K]>(settings[key])
  const [saving, setSaving] = useState(false)
  useEffect(() => setValue(settings[key]), [settings, key])
  const save = async (v: AllSettings[K] = value) => {
    setSaving(true)
    try {
      await api.saveSetting(key, v)
      await reload()
      toast('Tetapan disimpan')
    } catch (e) {
      toast(friendlyError(e), 'error')
    } finally {
      setSaving(false)
    }
  }
  return { value, setValue, save, saving }
}

function Card({ title, children, onSave, saving, desc }: { title: string; children: ReactNode; onSave?: () => void; saving?: boolean; desc?: string }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-forest">{title}</h2>
          {desc && <p className="mt-0.5 text-sm text-muted">{desc}</p>}
        </div>
        {onSave && (
          <Button onClick={onSave} loading={saving} icon={<Save className="size-4" />}>
            Simpan
          </Button>
        )}
      </div>
      {children}
    </section>
  )
}

const num = (v: string) => Number(v) || 0

function PricesTab() {
  const { value: p, setValue, save, saving } = useSetting('prices')
  const set = (patch: Partial<typeof p>) => setValue({ ...p, ...patch })
  return (
    <Card title="Harga & polisi" onSave={() => save()} saving={saving} desc="Hujung minggu bermaksud check in Jumaat atau Sabtu, atau mana-mana malam yang jatuh pada tarikh cuti.">
      <div className="grid gap-6 lg:grid-cols-2">
        {(['weekday', 'weekend'] as const).map((k) => (
          <div key={k} className="rounded-2xl bg-sand/40 p-4">
            <p className="mb-3 font-semibold text-forest">{k === 'weekday' ? 'Hari bekerja' : 'Hujung minggu / cuti'}</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="2H1M">
                <Input type="number" value={p[k].one} onChange={(e) => set({ [k]: { ...p[k], one: num(e.target.value) } })} />
              </Field>
              <Field label="3H2M">
                <Input type="number" value={p[k].two} onChange={(e) => set({ [k]: { ...p[k], two: num(e.target.value) } })} />
              </Field>
              <Field label="Malam tambahan">
                <Input type="number" value={p[k].extra} onChange={(e) => set({ [k]: { ...p[k], extra: num(e.target.value) } })} />
              </Field>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Deposit biasa (RM)">
          <Input type="number" value={p.deposit_standard} onChange={(e) => set({ deposit_standard: num(e.target.value) })} />
        </Field>
        <Field label="Deposit majlis (RM)">
          <Input type="number" value={p.deposit_event} onChange={(e) => set({ deposit_event: num(e.target.value) })} />
        </Field>
        <Field label="Lewat check out (RM/jam)">
          <Input type="number" value={p.late_checkout_per_hour} onChange={(e) => set({ late_checkout_per_hour: num(e.target.value) })} />
        </Field>
        <Field label="Lewat check out sehingga">
          <Input value={p.late_checkout_until} onChange={(e) => set({ late_checkout_until: e.target.value })} />
        </Field>
        <Field label="Bayaran penuh (hari sebelum)">
          <Input type="number" value={p.full_payment_days_before} onChange={(e) => set({ full_payment_days_before: num(e.target.value) })} />
        </Field>
        <Field label="Notis pembatalan (hari)">
          <Input type="number" value={p.cancel_days_before} onChange={(e) => set({ cancel_days_before: num(e.target.value) })} />
        </Field>
        <Field label="Tempahan saat akhir (hari)" hint="Dalam tempoh ini 1 malam hujung minggu dibenarkan">
          <Input type="number" value={p.last_minute_days} onChange={(e) => set({ last_minute_days: num(e.target.value) })} />
        </Field>
      </div>
    </Card>
  )
}

function HolidaysTab() {
  const { holidays, reload } = useSettings()
  const toast = useToast()
  const [h, setH] = useState<Omit<Holiday, 'id'>>({ date: '', name: '', kind: 'public' })
  const add = async () => {
    try {
      await api.saveHoliday(h)
      await reload()
      setH({ date: '', name: '', kind: 'public' })
      toast('Cuti ditambah')
    } catch (e) {
      toast(friendlyError(e), 'error')
    }
  }
  const upcoming = holidays.filter((x) => x.date >= new Date().toISOString().slice(0, 10))
  return (
    <Card title="Cuti umum & cuti sekolah" desc="Malam yang jatuh pada tarikh ini dikira harga hujung minggu. Tambah Hari Raya, Tahun Baru Cina, Deepavali dan cuti sekolah setiap tahun.">
      <div className="mb-5 grid gap-3 rounded-2xl bg-sand/40 p-4 sm:grid-cols-[1fr_1.5fr_1fr_auto]">
        <Input type="date" value={h.date} onChange={(e) => setH({ ...h, date: e.target.value })} />
        <Input placeholder="Nama cuti" value={h.name} onChange={(e) => setH({ ...h, name: e.target.value })} />
        <Select value={h.kind} onChange={(e) => setH({ ...h, kind: e.target.value as Holiday['kind'] })}>
          <option value="public">Cuti umum</option>
          <option value="school">Cuti sekolah</option>
          <option value="other">Lain-lain</option>
        </Select>
        <Button onClick={add} disabled={!h.date || !h.name} icon={<Plus className="size-4" />}>
          Tambah
        </Button>
      </div>
      <ul className="divide-y divide-sand">
        {upcoming.map((x) => (
          <li key={x.id} className="flex items-center gap-3 py-2.5 text-sm">
            <span className="w-32 font-medium tabular-nums">{fmtDate(x.date, 'EEE, d MMM yy')}</span>
            <span className="flex-1">{x.name}</span>
            <span className="text-xs text-muted">{x.kind === 'school' ? 'Sekolah' : x.kind === 'public' ? 'Umum' : 'Lain'}</span>
            <button
              onClick={async () => {
                await api.deleteHoliday(x.id)
                reload()
              }}
              className="grid size-8 place-items-center rounded-full text-rose-600 hover:bg-rose-50"
              aria-label="Buang"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
        {upcoming.length === 0 && <li className="py-6 text-center text-sm text-muted">Tiada cuti akan datang.</li>}
      </ul>
    </Card>
  )
}

/* line based editors */
const toLines = (rows: string[][]) => rows.map((r) => r.join(' | ')).join('\n')
const fromLines = (s: string, n: number) =>
  s
    .split('\n')
    .map((l) => l.split('|').map((x) => x.trim()))
    .filter((r) => r[0])
    .map((r) => Array.from({ length: n }, (_, i) => r[i] ?? ''))

function ContentTab() {
  const site = useSetting('site')
  const content = useSetting('content')
  const s = site.value
  const c = content.value
  const [text, setText] = useState(() => contentToText(c))
  useEffect(() => setText(contentToText(c)), [c])

  const saveContent = () => content.save(textToContent(text, c))

  return (
    <div className="space-y-6">
      <Card title="Maklumat utama" onSave={() => site.save()} saving={site.saving}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama">
            <Input value={s.name} onChange={(e) => site.setValue({ ...s, name: e.target.value })} />
          </Field>
          <Field label="Moto">
            <Input value={s.motto} onChange={(e) => site.setValue({ ...s, motto: e.target.value })} />
          </Field>
          <Field label="Tagline" className="sm:col-span-2">
            <Input value={s.tagline} onChange={(e) => site.setValue({ ...s, tagline: e.target.value })} />
          </Field>
          <Field label="Alamat" className="sm:col-span-2">
            <Input value={s.address} onChange={(e) => site.setValue({ ...s, address: e.target.value })} />
          </Field>
          <Field label="Lokasi (ayat ringkas)" className="sm:col-span-2">
            <Input value={s.location} onChange={(e) => site.setValue({ ...s, location: e.target.value })} />
          </Field>
          <Field label="Pengenalan" className="sm:col-span-2">
            <Textarea value={s.intro} onChange={(e) => site.setValue({ ...s, intro: e.target.value })} />
          </Field>
          <Field label="Kolam">
            <Input value={s.pool} onChange={(e) => site.setValue({ ...s, pool: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Check in">
              <Input value={s.checkin_time} onChange={(e) => site.setValue({ ...s, checkin_time: e.target.value })} />
            </Field>
            <Field label="Check out">
              <Input value={s.checkout_time} onChange={(e) => site.setValue({ ...s, checkout_time: e.target.value })} />
            </Field>
          </div>
          <Field label="Kapasiti ideal">
            <Input type="number" value={s.capacity_ideal} onChange={(e) => site.setValue({ ...s, capacity_ideal: num(e.target.value) })} />
          </Field>
          <Field label="Kapasiti maksimum">
            <Input type="number" value={s.capacity_max} onChange={(e) => site.setValue({ ...s, capacity_max: num(e.target.value) })} />
          </Field>
        </div>
      </Card>

      <Card title="Senarai kandungan" onSave={saveContent} saving={content.saving} desc="Satu baris satu item. Guna | untuk memisahkan lajur.">
        <div className="grid gap-4 lg:grid-cols-2">
          {CONTENT_FIELDS.map((f) => (
            <Field key={f.key} label={f.label} hint={f.hint}>
              <Textarea value={text[f.key]} onChange={(e) => setText({ ...text, [f.key]: e.target.value })} className="min-h-40 font-mono text-[13px]" />
            </Field>
          ))}
          <Field label="Jarak ke pantai">
            <Input value={text.beach_drive} onChange={(e) => setText({ ...text, beach_drive: e.target.value })} />
          </Field>
        </div>
      </Card>
    </div>
  )
}

const CONTENT_FIELDS = [
  { key: 'rooms', label: 'Bilik', hint: 'Nama | Katil | Ciri' },
  { key: 'facilities', label: 'Kemudahan', hint: 'Baris "# Kumpulan" diikuti item' },
  { key: 'attractions', label: 'Tarikan', hint: 'Masa | Nama' },
  { key: 'food', label: 'Makan', hint: 'Masa | Nama' },
  { key: 'campuses', label: 'Kampus', hint: 'Masa | Nama' },
  { key: 'beaches', label: 'Pantai', hint: 'Nama | Penerangan' },
  { key: 'faq', label: 'Soalan lazim', hint: 'Soalan | Jawapan' },
] as const

type ContentText = Record<(typeof CONTENT_FIELDS)[number]['key'] | 'beach_drive', string>

function contentToText(c: ContentSettings): ContentText {
  return {
    rooms: toLines(c.rooms.map((r) => [r.name, r.bed, r.features])),
    facilities: c.facilities.map((g) => `# ${g.group}\n${g.items.join('\n')}`).join('\n'),
    attractions: toLines(c.attractions.map((a) => [a.time, a.name])),
    food: toLines(c.food.map((a) => [a.time, a.name])),
    campuses: toLines(c.campuses.map((a) => [a.time, a.name])),
    beaches: toLines(c.beaches.map((b) => [b.name, b.description])),
    faq: toLines(c.faq.map((f) => [f.q, f.a])),
    beach_drive: c.beach_drive,
  }
}

function textToContent(t: ContentText, prev: ContentSettings): ContentSettings {
  const facilities: ContentSettings['facilities'] = []
  for (const line of t.facilities.split('\n').map((l) => l.trim()).filter(Boolean)) {
    if (line.startsWith('#')) facilities.push({ group: line.replace(/^#+\s*/, ''), items: [] })
    else if (facilities.length) facilities[facilities.length - 1].items.push(line)
    else facilities.push({ group: 'Kemudahan', items: [line] })
  }
  const timed = (s: string) => fromLines(s, 2).map(([time, name]) => ({ time, name }))
  return {
    ...prev,
    rooms: fromLines(t.rooms, 3).map(([name, bed, features]) => ({ name, bed, features })),
    facilities,
    attractions: timed(t.attractions),
    food: timed(t.food),
    campuses: timed(t.campuses),
    beaches: fromLines(t.beaches, 2).map(([name, description]) => ({ name, description })),
    faq: fromLines(t.faq, 2).map(([q, a]) => ({ q, a })),
    beach_drive: t.beach_drive,
  }
}

function RulesTab() {
  const { value, setValue, save, saving } = useSetting('rules')
  return (
    <Card title="Peraturan & polisi" onSave={() => save()} saving={saving} desc="Dipaparkan di laman web, borang tempahan, resit dan perjanjian. Satu baris satu peraturan.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Peraturan rumah">
          <Textarea value={value.house.join('\n')} onChange={(e) => setValue({ ...value, house: e.target.value.split('\n') })} onBlur={() => setValue({ ...value, house: value.house.filter((x) => x.trim()) })} className="min-h-56" />
        </Field>
        <Field label="Polisi">
          <Textarea value={value.policies.join('\n')} onChange={(e) => setValue({ ...value, policies: e.target.value.split('\n') })} onBlur={() => setValue({ ...value, policies: value.policies.filter((x) => x.trim()) })} className="min-h-56" />
        </Field>
      </div>
    </Card>
  )
}

function ContactsTab() {
  const contacts = useSetting('contacts')
  const bank = useSetting('bank')
  const c = contacts.value
  const [wa, setWa] = useState(() => toLines(c.whatsapp.map((w) => [w.name, w.phone])))
  useEffect(() => setWa(toLines(c.whatsapp.map((w) => [w.name, w.phone]))), [c.whatsapp])
  return (
    <div className="space-y-6">
      <Card
        title="Hubungan & media sosial"
        onSave={() => contacts.save({ ...c, whatsapp: fromLines(wa, 2).map(([name, phone]) => ({ name, phone: phone.replace(/\D/g, '') })) })}
        saving={contacts.saving}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="WhatsApp" hint="Nama | 60123456789 (satu baris seorang)" className="sm:col-span-2">
            <Textarea value={wa} onChange={(e) => setWa(e.target.value)} className="min-h-20 font-mono text-[13px]" />
          </Field>
          <Field label="Facebook">
            <Input value={c.facebook} onChange={(e) => contacts.setValue({ ...c, facebook: e.target.value })} />
          </Field>
          <Field label="Instagram">
            <Input value={c.instagram} onChange={(e) => contacts.setValue({ ...c, instagram: e.target.value })} />
          </Field>
          <Field label="TikTok">
            <Input value={c.tiktok} onChange={(e) => contacts.setValue({ ...c, tiktok: e.target.value })} />
          </Field>
          <Field label="Google Maps">
            <Input value={c.google_maps} onChange={(e) => contacts.setValue({ ...c, google_maps: e.target.value })} />
          </Field>
        </div>
      </Card>
      <Card title="Akaun bank" onSave={() => bank.save()} saving={bank.saving} desc="Hanya dipaparkan dalam mesej WhatsApp, resit dan perjanjian. Tidak dipaparkan di laman web.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Bank">
            <Input value={bank.value.bank} onChange={(e) => bank.setValue({ ...bank.value, bank: e.target.value })} />
          </Field>
          <Field label="No. akaun">
            <Input value={bank.value.account} onChange={(e) => bank.setValue({ ...bank.value, account: e.target.value })} />
          </Field>
          <Field label="Nama pemegang">
            <Input value={bank.value.holder} onChange={(e) => bank.setValue({ ...bank.value, holder: e.target.value })} />
          </Field>
        </div>
      </Card>
    </div>
  )
}

const TPL_LABEL = {
  availability_reply: 'Balasan semakan',
  confirm: 'Sahkan tarikh & deposit',
  registration: 'Pautan borang pendaftaran',
  reminder: 'Peringatan bayaran',
  checkin: 'Info check in',
  thanks: 'Terima kasih',
} as const

function TemplatesTab() {
  const { value, setValue, save, saving } = useSetting('templates')
  return (
    <Card title="Templat WhatsApp" onSave={() => save()} saving={saving} desc="Kod dalam kurungan diganti secara automatik.">
      <p className="mb-4 rounded-xl bg-sand/50 p-3 font-mono text-[12px] leading-relaxed text-muted">
        {'{nama} {ref} {checkin} {checkout} {malam} {jumlah} {deposit} {baki} {tarikh_akhir} {bank} {akaun} {pemegang} {pautan} {masa_checkin} {masa_checkout} {peta}'}
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {(Object.keys(TPL_LABEL) as (keyof typeof TPL_LABEL)[]).map((k) => (
          <Field key={k} label={TPL_LABEL[k]}>
            <Textarea value={value[k]} onChange={(e) => setValue({ ...value, [k]: e.target.value })} className="min-h-40 text-[13.5px]" />
          </Field>
        ))}
      </div>
    </Card>
  )
}
