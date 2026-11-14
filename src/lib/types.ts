export type BookingStatus =
  | 'enquiry'
  | 'pending'
  | 'deposit_paid'
  | 'fully_paid'
  | 'checked_in'
  | 'completed'
  | 'cancelled'

export type BookingType = 'standard' | 'event' | 'special'

export type PaymentType = 'deposit' | 'rental' | 'late_checkout' | 'deposit_refund' | 'deposit_deduction'

export type DocKind = 'deposit_slip' | 'payment_slip' | 'signed_agreement' | 'local_order' | 'other'

export type MediaCategory = 'luar' | 'ruang-tamu' | 'dapur' | 'bilik' | 'kolam' | 'lain'

export interface Booking {
  id: string
  ref: string
  guest_name: string
  phone: string | null
  origin: string | null
  address: string | null
  adults: number
  children: number
  check_in: string // yyyy-MM-dd
  check_out: string
  nights: number
  booking_type: BookingType
  status: BookingStatus
  source: string | null
  remarks: string | null
  notes: string | null
  total_price: number
  deposit_amount: number
  organization: string | null
  external_ref: string | null
  form_token: string
  registered_at: string | null
  created_at: string
  updated_at: string
}

export type BookingInput = Omit<
  Booking,
  'id' | 'ref' | 'nights' | 'form_token' | 'registered_at' | 'created_at' | 'updated_at'
>

export interface Payment {
  id: string
  booking_id: string
  type: PaymentType
  amount: number
  method: string
  paid_at: string
  reference: string | null
  notes: string | null
  receipt_no: string
  created_at: string
}

export type PaymentInput = Pick<Payment, 'booking_id' | 'type' | 'amount' | 'method' | 'paid_at' | 'reference' | 'notes'>

export interface ScheduleItem {
  label: string
  due_date: string
  amount: number
}

export interface Agreement {
  booking_id: string
  party_name: string
  representative: string | null
  position: string | null
  contact: string | null
  external_ref: string | null
  agreed_total: number
  schedule: ScheduleItem[]
  terms: string | null
}

export interface DocumentRow {
  id: string
  booking_id: string
  kind: DocKind
  path: string
  file_name: string
  uploaded_by: string
  created_at: string
}

export interface BlockedDate {
  id: string
  start_date: string
  end_date: string
  reason: string
  created_at: string
}

export interface Holiday {
  id: string
  date: string
  name: string
  kind: 'public' | 'school' | 'other'
}

export interface MediaItem {
  id: string
  url: string
  r2_key: string | null
  caption: string | null
  category: MediaCategory
  sort: number
  visible: boolean
  created_at: string
}

export interface Hotspot {
  target_id: string
  yaw: number
  pitch: number
  label: string
}

export interface TourScene {
  id: string
  name: string
  image_url: string
  r2_key: string | null
  sort: number
  initial_yaw: number
  hotspots: Hotspot[]
}

export interface AuditEntry {
  id: number
  table_name: string
  record_id: string | null
  action: string
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  at: string
}

export interface BusyRange {
  start_date: string
  end_date: string
}

/* ---------- Settings ---------- */

export interface RateSet {
  one: number // 2H1M
  two: number // 3H2M
  extra: number // each night after the second
}

export interface PriceSettings {
  weekday: RateSet
  weekend: RateSet
  deposit_standard: number
  deposit_event: number
  late_checkout_per_hour: number
  late_checkout_until: string
  full_payment_days_before: number
  cancel_days_before: number
  last_minute_days: number
}

export interface SiteSettings {
  name: string
  tagline: string
  address: string
  motto: string
  location: string
  intro: string
  checkin_time: string
  checkout_time: string
  capacity_ideal: number
  capacity_max: number
  pool: string
  updated_note: string
}

export interface Contact {
  name: string
  phone: string // international digits only, e.g. 60192656756
}

export interface ContactSettings {
  whatsapp: Contact[]
  facebook: string
  instagram: string
  tiktok: string
  google_maps: string
}

export interface Room {
  name: string
  bed: string
  features: string
}

export interface TimedPlace {
  time: string
  name: string
}

export interface Beach {
  name: string
  description: string
}

export interface ContentSettings {
  rooms: Room[]
  facilities: { group: string; items: string[] }[]
  attractions: TimedPlace[]
  campuses: TimedPlace[]
  food: TimedPlace[]
  beaches: Beach[]
  beach_drive: string
  faq: { q: string; a: string }[]
}

export interface RuleSettings {
  house: string[]
  policies: string[]
}

export interface BankSettings {
  bank: string
  holder: string
  account: string
}

export interface TemplateSettings {
  confirm: string
  registration: string
  reminder: string
  checkin: string
  thanks: string
  availability_reply: string
}

export interface HouseTourSettings {
  /** Photo URLs per room id from src/lib/house.ts */
  photos: Record<string, string[]>
}

export interface AllSettings {
  site: SiteSettings
  prices: PriceSettings
  contacts: ContactSettings
  content: ContentSettings
  rules: RuleSettings
  bank: BankSettings
  templates: TemplateSettings
  house_tour: HouseTourSettings
}

export type SettingKey = keyof AllSettings

export const PUBLIC_SETTING_KEYS: SettingKey[] = ['site', 'prices', 'contacts', 'content', 'rules', 'house_tour']
