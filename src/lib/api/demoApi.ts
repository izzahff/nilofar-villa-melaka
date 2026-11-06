import { addDays, format } from 'date-fns'
import { DEFAULT_SETTINGS } from '../defaults'
import { SEED_BOOKINGS, SEED_HOLIDAYS } from '../seedData'
import { busyNightSet, rangesOverlap, todayIso } from '../pricing'
import { ACTIVE_STATUSES } from '../format'
import { DEMO_MEDIA } from '../demoMedia'
import type {
  Agreement,
  AllSettings,
  AuditEntry,
  BlockedDate,
  Booking,
  BookingInput,
  DocumentRow,
  Holiday,
  MediaItem,
  Payment,
  TourScene,
} from '../types'
import type { Api, SessionUser } from './types'

/**
 * Demo driver. Stores everything in localStorage so the whole system can be
 * tried with no backend. Mirrors the database rules (overlap, status sync,
 * reference numbers) closely enough for evaluation.
 */

const KEY = 'nilofar-demo-v1'
export const DEMO_EMAIL = 'admin@nilofar.demo'
export const DEMO_PASSWORD = 'nilofar123'

interface Store {
  settings: AllSettings
  holidays: Holiday[]
  bookings: Booking[]
  payments: Payment[]
  blocks: BlockedDate[]
  agreements: Agreement[]
  documents: (DocumentRow & { dataUrl: string })[]
  media: MediaItem[]
  tour: TourScene[]
  audit: AuditEntry[]
  seq: { ref: number; receipt: number; audit: number }
  session: SessionUser | null
}

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now())
const now = () => new Date().toISOString()
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v))

function makeBooking(s: Store, input: Partial<BookingInput> & Pick<BookingInput, 'guest_name' | 'check_in' | 'check_out'>): Booking {
  s.seq.ref += 1
  const created = now()
  const nights = Math.round((Date.parse(input.check_out) - Date.parse(input.check_in)) / 86400000)
  return {
    id: uid(),
    ref: `NV-${format(new Date(), 'yyMM')}-${String(s.seq.ref).padStart(4, '0')}`,
    guest_name: input.guest_name,
    phone: input.phone ?? null,
    origin: input.origin ?? null,
    address: input.address ?? null,
    adults: input.adults ?? 1,
    children: input.children ?? 0,
    check_in: input.check_in,
    check_out: input.check_out,
    nights,
    booking_type: input.booking_type ?? 'standard',
    status: input.status ?? 'pending',
    source: input.source ?? null,
    remarks: input.remarks ?? null,
    notes: input.notes ?? null,
    total_price: Number(input.total_price ?? 0),
    deposit_amount: Number(input.deposit_amount ?? 300),
    organization: input.organization ?? null,
    external_ref: input.external_ref ?? null,
    form_token: uid(),
    registered_at: null,
    created_at: created,
    updated_at: created,
  }
}

function seed(): Store {
  const s: Store = {
    settings: clone(DEFAULT_SETTINGS),
    holidays: SEED_HOLIDAYS.map((h) => ({ ...h, id: uid() })),
    bookings: [],
    payments: [],
    blocks: [],
    agreements: [],
    documents: [],
    media: DEMO_MEDIA.map((m, i) => ({ ...m, id: uid(), r2_key: null, sort: i, visible: true, created_at: now() })),
    tour: [],
    audit: [],
    seq: { ref: 0, receipt: 0, audit: 0 },
    session: null,
  }
  for (const b of SEED_BOOKINGS) {
    s.bookings.push(makeBooking(s, { ...b, total_price: 0 }))
  }
  // A few sample records so every screen has something to show
  const d = (n: number) => format(addDays(new Date(), n), 'yyyy-MM-dd')
  const extra: Parameters<typeof makeBooking>[1][] = [
    { guest_name: 'Aminah binti Yusof', phone: '0137778899', origin: 'Seremban', check_in: d(2), check_out: d(3), adults: 8, children: 4, status: 'enquiry', source: 'Website', total_price: 800, remarks: 'Datang dengan 2 kereta' },
    { guest_name: 'Hafiz Rahman', phone: '0196661234', origin: 'Kuala Lumpur', check_in: d(5), check_out: d(7), adults: 10, children: 3, status: 'pending', source: 'TikTok', total_price: 1500 },
  ]
  for (const e of extra) {
    const free = !s.bookings.some((b) => ACTIVE_STATUSES.includes(b.status) && rangesOverlap(b.check_in, b.check_out, e.check_in, e.check_out))
    if (free || e.status === 'enquiry') s.bookings.push(makeBooking(s, e))
  }
  return s
}

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  const s = seed()
  save(s)
  return s
}

function save(s: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch (e) {
    console.warn('demo store save failed', e)
    throw new Error('Storan pelayar penuh. Padam beberapa gambar demo.')
  }
}

function audit(s: Store, table: string, action: string, id: string | null, oldData: unknown, newData: unknown) {
  s.seq.audit += 1
  s.audit.unshift({
    id: s.seq.audit,
    table_name: table,
    record_id: id,
    action,
    old_data: (oldData as Record<string, unknown>) ?? null,
    new_data: (newData as Record<string, unknown>) ?? null,
    at: now(),
  })
  s.audit = s.audit.slice(0, 300)
}

function assertNoOverlap(s: Store, b: { id?: string; check_in: string; check_out: string; status: Booking['status'] }) {
  if (b.check_out <= b.check_in) throw new Error('Tarikh keluar mesti selepas tarikh masuk.')
  if (!ACTIVE_STATUSES.includes(b.status)) return
  const clash = s.bookings.some(
    (o) => o.id !== b.id && ACTIVE_STATUSES.includes(o.status) && rangesOverlap(o.check_in, o.check_out, b.check_in, b.check_out),
  )
  const blocked = s.blocks.some((k) => rangesOverlap(k.start_date, k.end_date, b.check_in, b.check_out))
  if (clash || blocked) throw new Error('Tarikh bertindih dengan tempahan atau blok lain.')
}

function syncStatus(s: Store, bookingId: string) {
  const b = s.bookings.find((x) => x.id === bookingId)
  if (!b || ['checked_in', 'completed', 'cancelled'].includes(b.status)) return
  const ps = s.payments.filter((p) => p.booking_id === bookingId)
  const rent = ps.filter((p) => p.type === 'rental').reduce((a, p) => a + p.amount, 0)
  const dep = ps.filter((p) => p.type === 'deposit').reduce((a, p) => a + p.amount, 0)
  if (b.total_price > 0 && rent >= b.total_price) b.status = 'fully_paid'
  else if (dep > 0 && (b.status === 'enquiry' || b.status === 'pending')) b.status = 'deposit_paid'
}

const readFile = (f: File) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result))
    r.onerror = () => rej(r.error)
    r.readAsDataURL(f)
  })

/** Shrinks an image so the demo store stays under the localStorage quota. */
async function shrinkImage(f: File, max = 1600): Promise<string> {
  const url = await readFile(f)
  if (!f.type.startsWith('image/')) return url
  const img = new Image()
  await new Promise((res, rej) => {
    img.onload = res
    img.onerror = rej
    img.src = url
  })
  const scale = Math.min(1, max / Math.max(img.width, img.height))
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * scale)
  c.height = Math.round(img.height * scale)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.8)
}

export function createDemoApi(): Api {
  let listeners: ((u: SessionUser | null) => void)[] = []
  const tx = <T>(fn: (s: Store) => T): T => {
    const s = load()
    const out = fn(s)
    save(s)
    return clone(out)
  }
  const read = <T>(fn: (s: Store) => T): T => clone(fn(load()))
  const delay = <T>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120))

  const api: Api = {
    mode: 'demo',

    async getPublicSettings() {
      return delay(read((s) => ({ site: s.settings.site, prices: s.settings.prices, contacts: s.settings.contacts, content: s.settings.content, rules: s.settings.rules })))
    },
    async getHolidays() {
      return delay(read((s) => [...s.holidays].sort((a, b) => a.date.localeCompare(b.date))))
    },
    async getBusyRanges(from, to) {
      return delay(
        read((s) => [
          ...s.bookings
            .filter((b) => ACTIVE_STATUSES.includes(b.status) && b.check_out > from && b.check_in < to)
            .map((b) => ({ start_date: b.check_in, end_date: b.check_out })),
          ...s.blocks.filter((b) => b.end_date > from && b.start_date < to).map((b) => ({ start_date: b.start_date, end_date: b.end_date })),
        ]),
      )
    },
    async submitEnquiry(i) {
      if (i.check_in < todayIso()) throw new Error('Tarikh check in sudah lepas')
      return delay(
        tx((s) => {
          const b = makeBooking(s, { ...i, total_price: i.estimate, status: 'enquiry', source: 'Website' })
          s.bookings.push(b)
          audit(s, 'bookings', 'INSERT', b.id, null, b)
          return { ref: b.ref }
        }),
      )
    },
    async getBookingForm(token) {
      return delay(
        read((s) => {
          const b = s.bookings.find((x) => x.form_token === token && !['cancelled', 'completed'].includes(x.status))
          if (!b) return null
          const { ref, guest_name, phone, origin, address, adults, children, check_in, check_out, source, remarks, registered_at, deposit_amount, total_price } = b
          return { ref, guest_name, phone, origin, address, adults, children, check_in, check_out, source, remarks, registered_at, deposit_amount, total_price }
        }),
      )
    },
    async submitRegistration(token, i) {
      return delay(
        tx((s) => {
          const b = s.bookings.find((x) => x.form_token === token && !['cancelled', 'completed'].includes(x.status))
          if (!b) throw new Error('Pautan tidak sah')
          const old = clone(b)
          Object.assign(b, { ...i, registered_at: now(), updated_at: now() })
          audit(s, 'bookings', 'UPDATE', b.id, old, b)
          return b.ref
        }),
      )
    },
    async uploadSlip(token, file) {
      const dataUrl = await shrinkImage(file, 1200)
      tx((s) => {
        const b = s.bookings.find((x) => x.form_token === token)
        if (!b) throw new Error('Pautan tidak sah')
        s.documents.push({ id: uid(), booking_id: b.id, kind: 'deposit_slip', path: `slips/${token}/${file.name}`, file_name: file.name, uploaded_by: 'tetamu', created_at: now(), dataUrl })
      })
    },
    async listMedia(includeHidden = false) {
      return delay(read((s) => s.media.filter((m) => includeHidden || m.visible).sort((a, b) => a.sort - b.sort)))
    },
    async listTourScenes() {
      return delay(read((s) => [...s.tour].sort((a, b) => a.sort - b.sort)))
    },

    async getUser() {
      return read((s) => s.session)
    },
    async signIn(email, password) {
      if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) throw new Error('Invalid login credentials')
      const u = { id: 'demo-admin', email: DEMO_EMAIL }
      tx((s) => (s.session = u))
      listeners.forEach((l) => l(u))
      return u
    },
    async signOut() {
      tx((s) => (s.session = null))
      listeners.forEach((l) => l(null))
    },
    onAuthChange(cb) {
      listeners.push(cb)
      return () => (listeners = listeners.filter((l) => l !== cb))
    },
    async isAdmin() {
      return read((s) => !!s.session)
    },

    async getAllSettings() {
      return delay(read((s) => s.settings))
    },
    async saveSetting(key, value) {
      tx((s) => {
        audit(s, 'settings', 'UPDATE', key, s.settings[key], value)
        s.settings[key] = value
      })
    },
    async listBookings() {
      return delay(read((s) => [...s.bookings].sort((a, b) => b.check_in.localeCompare(a.check_in))))
    },
    async getBooking(id) {
      return delay(read((s) => s.bookings.find((b) => b.id === id) ?? null))
    },
    async createBooking(input) {
      return tx((s) => {
        assertNoOverlap(s, input)
        const b = makeBooking(s, input)
        s.bookings.push(b)
        audit(s, 'bookings', 'INSERT', b.id, null, b)
        return b
      })
    },
    async updateBooking(id, patch) {
      return tx((s) => {
        const b = s.bookings.find((x) => x.id === id)
        if (!b) throw new Error('Tempahan tidak dijumpai')
        const next = { ...b, ...patch }
        assertNoOverlap(s, next)
        const old = clone(b)
        Object.assign(b, patch, { updated_at: now() })
        b.nights = Math.round((Date.parse(b.check_out) - Date.parse(b.check_in)) / 86400000)
        audit(s, 'bookings', 'UPDATE', id, old, b)
        return b
      })
    },
    async deleteBooking(id) {
      tx((s) => {
        const b = s.bookings.find((x) => x.id === id)
        s.bookings = s.bookings.filter((x) => x.id !== id)
        s.payments = s.payments.filter((p) => p.booking_id !== id)
        s.documents = s.documents.filter((d) => d.booking_id !== id)
        s.agreements = s.agreements.filter((a) => a.booking_id !== id)
        audit(s, 'bookings', 'DELETE', id, b, null)
      })
    },
    async listPayments(bookingId) {
      return delay(read((s) => s.payments.filter((p) => !bookingId || p.booking_id === bookingId).sort((a, b) => a.paid_at.localeCompare(b.paid_at))))
    },
    async addPayment(input) {
      return tx((s) => {
        s.seq.receipt += 1
        const p: Payment = {
          ...input,
          amount: Number(input.amount),
          id: uid(),
          receipt_no: `R-${new Date().getFullYear()}-${String(s.seq.receipt).padStart(4, '0')}`,
          created_at: now(),
        }
        s.payments.push(p)
        syncStatus(s, input.booking_id)
        audit(s, 'payments', 'INSERT', p.id, null, p)
        return p
      })
    },
    async deletePayment(id) {
      tx((s) => {
        const p = s.payments.find((x) => x.id === id)
        s.payments = s.payments.filter((x) => x.id !== id)
        audit(s, 'payments', 'DELETE', id, p, null)
      })
    },
    async listBlocks() {
      return delay(read((s) => [...s.blocks].sort((a, b) => a.start_date.localeCompare(b.start_date))))
    },
    async addBlock(start_date, end_date, reason) {
      return tx((s) => {
        if (end_date <= start_date) throw new Error('Tarikh akhir mesti selepas tarikh mula.')
        const clash = s.bookings.some((b) => ACTIVE_STATUSES.includes(b.status) && rangesOverlap(b.check_in, b.check_out, start_date, end_date))
        const clash2 = s.blocks.some((b) => rangesOverlap(b.start_date, b.end_date, start_date, end_date))
        if (clash || clash2) throw new Error('Tarikh bertindih dengan tempahan atau blok lain.')
        const blk = { id: uid(), start_date, end_date, reason, created_at: now() }
        s.blocks.push(blk)
        audit(s, 'blocked_dates', 'INSERT', blk.id, null, blk)
        return blk
      })
    },
    async deleteBlock(id) {
      tx((s) => {
        audit(s, 'blocked_dates', 'DELETE', id, s.blocks.find((b) => b.id === id), null)
        s.blocks = s.blocks.filter((b) => b.id !== id)
      })
    },
    async saveHoliday(h) {
      return tx((s) => {
        const existing = h.id ? s.holidays.find((x) => x.id === h.id) : s.holidays.find((x) => x.date === h.date)
        if (existing) {
          Object.assign(existing, h)
          return existing
        }
        const n = { ...h, id: uid() } as Holiday
        s.holidays.push(n)
        return n
      })
    },
    async deleteHoliday(id) {
      tx((s) => (s.holidays = s.holidays.filter((h) => h.id !== id)))
    },
    async getAgreement(bookingId) {
      return delay(read((s) => s.agreements.find((a) => a.booking_id === bookingId) ?? null))
    },
    async saveAgreement(a) {
      tx((s) => {
        s.agreements = s.agreements.filter((x) => x.booking_id !== a.booking_id)
        s.agreements.push(a)
        audit(s, 'agreements', 'UPSERT', a.booking_id, null, a)
      })
    },
    async listDocuments(bookingId) {
      return delay(read((s) => s.documents.filter((d) => d.booking_id === bookingId).map(({ dataUrl: _d, ...rest }) => rest)))
    },
    async uploadDocument(bookingId, kind, file) {
      const dataUrl = await shrinkImage(file, 1400)
      return tx((s) => {
        const d = { id: uid(), booking_id: bookingId, kind, path: `bookings/${bookingId}/${file.name}`, file_name: file.name, uploaded_by: 'admin', created_at: now(), dataUrl }
        s.documents.push(d)
        const { dataUrl: _x, ...row } = d
        return row
      })
    },
    async getDocumentUrl(path) {
      return read((s) => s.documents.find((d) => d.path === path)?.dataUrl ?? '')
    },
    async deleteDocument(doc) {
      tx((s) => (s.documents = s.documents.filter((d) => d.id !== doc.id)))
    },
    async uploadImage(file) {
      return { url: await shrinkImage(file, 1600), key: null }
    },
    async deleteImage() {},
    async saveMedia(item) {
      return tx((s) => {
        const existing = item.id ? s.media.find((m) => m.id === item.id) : undefined
        if (existing) {
          Object.assign(existing, item)
          return existing
        }
        const m: MediaItem = { id: uid(), r2_key: null, caption: null, category: 'lain', sort: s.media.length, visible: true, created_at: now(), ...item }
        s.media.push(m)
        return m
      })
    },
    async deleteMedia(item) {
      tx((s) => (s.media = s.media.filter((m) => m.id !== item.id)))
    },
    async saveTourScene(scene) {
      return tx((s) => {
        const existing = scene.id ? s.tour.find((t) => t.id === scene.id) : undefined
        if (existing) {
          Object.assign(existing, scene)
          return existing
        }
        const t: TourScene = { id: uid(), r2_key: null, sort: s.tour.length, initial_yaw: 0, hotspots: [], ...scene }
        s.tour.push(t)
        return t
      })
    },
    async deleteTourScene(scene) {
      tx((s) => {
        s.tour = s.tour.filter((t) => t.id !== scene.id)
        for (const t of s.tour) t.hotspots = t.hotspots.filter((h) => h.target_id !== scene.id)
      })
    },
    async listAudit(limit = 100) {
      return delay(read((s) => s.audit.slice(0, limit)))
    },
  }
  return api
}

export function resetDemo() {
  localStorage.removeItem(KEY)
}

export { busyNightSet }
