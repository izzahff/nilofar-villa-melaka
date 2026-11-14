import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  Car,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  MapPin,
  Navigation,
  ShieldCheck,
  Sparkles,
  Sofa,
  Users,
  Utensils,
  WashingMachine,
  Waves,
} from 'lucide-react'
import { AnimatePresence, animate, motion, useInView, useMotionValue, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DateRangeCalendar, type RangeValue } from '../../components/DateRangeCalendar'
import { Lightbox } from '../../components/Lightbox'
import { Reveal, SectionTitle, cx } from '../../components/ui'
import { api } from '../../lib/api'
import { DEMO_MEDIA, HERO_IMAGE, IMG } from '../../lib/demoMedia'
import { MEDIA_LABEL, fmtDate, rm } from '../../lib/format'
import { useAsync, useBusyNights, useMediaQuery } from '../../lib/hooks'
import { checkMinimumStay, estimatePrice } from '../../lib/pricing'
import { useSettings } from '../../lib/settings'
import type { MediaCategory, MediaItem } from '../../lib/types'

export default function Home() {
  return (
    <>
      <Hero />
      <Intro />
      <Rooms />
      <Facilities />
      <Gallery />
      <PoolBand />
      <Location />
      <Pricing />
      <Availability />
      <Rules />
      <Faq />
      <FinalCta />
    </>
  )
}

/* ------------------------------------------------------------------ */

function Hero() {
  const { settings } = useSettings()
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const yBg = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '18%'])
  const yText = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '30%'])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const ease = [0.22, 1, 0.36, 1] as const
  const [first, ...rest] = settings.site.name.split(' ')

  return (
    <section ref={ref} className="relative flex min-h-[100svh] flex-col overflow-hidden bg-forest-dark text-white">
      {/* Full bleed photo: portrait front view on phones, the lawn and gable on wide screens */}
      <motion.div style={{ y: yBg }} className="absolute inset-0">
        <picture>
          <source media="(min-width: 1024px)" srcSet={IMG.lawn} />
          <img src={HERO_IMAGE} alt="Nilofar Villa Melaka" className="size-full scale-105 object-cover [animation:kenburns_22s_ease-in-out_infinite_alternate]" fetchPriority="high" />
        </picture>
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-forest-dark/70 via-forest-dark/10 to-forest-dark/85" />

      {/* Top: promise and the main action, centred like a boutique hotel */}
      <motion.div style={{ opacity: fade }} className="container-x relative z-10 pt-28 text-center sm:pt-32">
        <motion.p className="eyebrow text-gold" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          Homestay banglo · Bemban, Jasin · Melaka
        </motion.p>
        <motion.p className="mx-auto mt-4 max-w-xl font-display text-xl leading-snug text-white/90 italic sm:text-2xl" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.9, ease }}>
          {settings.site.tagline}. Kolam peribadi berair terjun, 5 bilik, untuk {settings.site.capacity_ideal} hingga {settings.site.capacity_max} orang.
        </motion.p>
        <motion.div className="mt-7 flex flex-wrap justify-center gap-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Link to="/tempah" className="inline-flex h-12 items-center gap-2.5 rounded-full bg-gold px-7 text-[15px] font-semibold text-forest-dark shadow-lg shadow-black/20 transition hover:scale-[1.03] hover:bg-[#ecd98a]">
            <CalendarDays className="size-[18px]" /> Semak tarikh kosong
          </Link>
          <Link to="/tour" className="inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-medium text-white ring-1 ring-white/40 backdrop-blur-sm transition hover:bg-white/10">
            Tour maya <ArrowRight className="size-4" />
          </Link>
        </motion.div>
      </motion.div>

      {/* Bottom: the name set huge, with the address underneath */}
      <motion.div style={{ y: yText }} className="relative z-10 mt-auto px-4 pb-14 sm:px-8 sm:pb-16">
        <h1 className="relative mx-auto flex max-w-[1400px] flex-col-reverse text-center leading-[0.85] sm:block">
          <motion.span
            className="block pb-[0.08em] font-display text-[26vw] font-medium tracking-[-0.04em] text-gold italic sm:text-[22vw] lg:text-[17.5vw]"
            initial={{ opacity: 0, y: 60, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.2, duration: 1.2, ease }}
          >
            {first}
          </motion.span>
          <motion.span
            className="mb-2 font-sans text-[3.2vw] sm:absolute sm:top-[0.6em] sm:right-[4%] sm:mb-0 font-medium tracking-[0.3em] text-white uppercase sm:text-[2vw] lg:text-[1.35vw]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            {rest.join(' ')}
          </motion.span>
        </h1>
        <motion.ul className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] text-white/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.05 }}>
          <li className="flex items-center gap-1.5">
            <MapPin className="size-4 text-gold" /> Taman Anjung Gapam, Bemban, Jasin
          </li>
          <li className="flex items-center gap-1.5">
            <BedDouble className="size-4 text-gold" /> 5 bilik · 3 bilik air
          </li>
          <li className="flex items-center gap-1.5">
            <Waves className="size-4 text-gold" /> Kolam peribadi
          </li>
          <li className="flex items-center gap-1.5">
            <Car className="size-4 text-gold" /> 10 min ke Ayer Keroh
          </li>
        </motion.ul>
      </motion.div>

      <motion.a href="#villa" style={{ opacity: fade }} className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 text-white/60" aria-label="Skrol ke bawah">
        <motion.span className="block" animate={reduce ? undefined : { y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <ChevronDown className="size-5" />
        </motion.span>
      </motion.a>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const mv = useMotionValue(0)
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!inView) return
    const c = animate(mv, to, { duration: 1.6, ease: 'easeOut', onUpdate: (x) => setV(Math.round(x)) })
    return () => c.stop()
  }, [inView, to, mv])
  return (
    <span ref={ref} className="tabular-nums">
      {v}
      {suffix}
    </span>
  )
}

function Intro() {
  const { settings } = useSettings()
  const stats = [
    { n: 5, s: '', label: 'Bilik tidur' },
    { n: settings.site.capacity_max, s: '', label: 'Tetamu maksimum' },
    { n: 18, s: ' kaki', label: 'Kolam berair terjun' },
    { n: 10, s: ' min', label: 'Ke Ayer Keroh' },
  ]
  return (
    <section id="villa" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionTitle eyebrow="Selamat datang" title={<>Rumah kedua untuk <em className="text-gold-dark italic">seisi keluarga</em></>} text={settings.site.intro} />
          <Reveal delay={0.1}>
            <p className="-mt-4 mb-8 font-display text-2xl text-rose italic">“{settings.site.motto}”</p>
          </Reveal>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.08} className="card p-5">
                <p className="font-display text-4xl font-semibold text-forest">
                  <Counter to={s.n} suffix={s.s} />
                </p>
                <p className="mt-1 text-[13px] text-muted">{s.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="relative grid grid-cols-2 gap-4">
          <Reveal className="row-span-2 overflow-hidden rounded-3xl">
            <img src={IMG.night} alt="Villa waktu malam" loading="lazy" className="h-full min-h-[420px] w-full object-cover transition duration-700 hover:scale-105" />
          </Reveal>
          <Reveal delay={0.1} className="overflow-hidden rounded-3xl">
            <img src={IMG.chairs} alt="Sudut ruang tamu" loading="lazy" className="aspect-[4/5] w-full object-cover transition duration-700 hover:scale-105" />
          </Reveal>
          <Reveal delay={0.2} className="overflow-hidden rounded-3xl">
            <img src={IMG.kitchen} alt="Dapur" loading="lazy" className="aspect-[4/5] w-full object-cover transition duration-700 hover:scale-105" />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

const ROOM_IMAGES = [IMG.chandelier, IMG.master, IMG.queen, IMG.fan, IMG.master2]

function Rooms() {
  const { settings } = useSettings()
  const rooms = settings.content.rooms
  const scroller = useRef<HTMLDivElement>(null)
  const scrollBy = (d: number) => scroller.current?.scrollBy({ left: d * 320, behavior: 'smooth' })
  return (
    <section id="bilik" className="scroll-mt-20 bg-sand/60 py-20 sm:py-28">
      <div className="container-x">
        <div className="flex items-end justify-between gap-6">
          <SectionTitle eyebrow="5 bilik tidur" title="Tidur lena, bangun segar" text="Setiap bilik dilengkapi kipas dan aircond. Tiga bilik ada bilik air sendiri. 20 biji bantal dan 10 helai tuala disediakan." />
          <div className="mb-14 hidden gap-2 sm:flex">
            <button onClick={() => scrollBy(-1)} className="grid size-11 place-items-center rounded-full bg-white ring-1 ring-sand-dark transition hover:bg-forest hover:text-white" aria-label="Sebelum">
              <ChevronLeft className="size-5" />
            </button>
            <button onClick={() => scrollBy(1)} className="grid size-11 place-items-center rounded-full bg-white ring-1 ring-sand-dark transition hover:bg-forest hover:text-white" aria-label="Seterusnya">
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      </div>
      <div ref={scroller} className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 pb-4 sm:scroll-px-8 sm:px-8 xl:px-[max(2rem,calc((100vw-72rem)/2+2rem))]">
        {rooms.map((r, i) => (
          <Reveal key={r.name} delay={i * 0.06} as="article" className="group w-[78%] shrink-0 snap-start sm:w-[340px]">
            <div className="relative overflow-hidden rounded-3xl">
              <img src={ROOM_IMAGES[i % ROOM_IMAGES.length]} alt={r.name} loading="lazy" className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 p-5 text-white">
                <p className="font-display text-3xl font-semibold">{r.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
                  <BedDouble className="size-4 text-gold" /> {r.bed}
                </p>
              </div>
            </div>
            <p className="mt-3 px-1 text-[14px] leading-relaxed text-muted">{r.features}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

const FACILITY_ICONS = [Sofa, ChefHat, WashingMachine, Sparkles]

function Facilities() {
  const { settings } = useSettings()
  return (
    <section className="py-20 sm:py-28">
      <div className="container-x">
        <SectionTitle eyebrow="Kemudahan" title="Semua yang anda perlukan, sudah tersedia" center />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {settings.content.facilities.map((g, i) => {
            const Icon = FACILITY_ICONS[i % FACILITY_ICONS.length]
            return (
              <Reveal key={g.group} delay={i * 0.08} className="card group p-6 transition duration-500 hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-forest text-gold transition group-hover:rotate-6">
                  <Icon className="size-6" />
                </div>
                <h3 className="font-display text-2xl font-semibold text-forest">{g.group}</h3>
                <ul className="mt-3 space-y-2">
                  {g.items.map((it) => (
                    <li key={it} className="flex gap-2 text-[14px] leading-snug text-muted">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" />
                      {it}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function Gallery() {
  const { data } = useAsync(() => api.listMedia(), [])
  const items: Pick<MediaItem, 'url' | 'caption' | 'category'>[] = data && data.length ? data : DEMO_MEDIA
  const cats = useMemo(() => Array.from(new Set(items.map((i) => i.category))) as MediaCategory[], [items])
  const [cat, setCat] = useState<MediaCategory | 'semua'>('semua')
  const shown = cat === 'semua' ? items : items.filter((i) => i.category === cat)
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="galeri" className="scroll-mt-20 bg-forest-dark py-20 text-white sm:py-28">
      <div className="container-x">
        <SectionTitle eyebrow="Galeri" title="Lihat sendiri setiap sudut" light text="Gambar sebenar Nilofar Villa Melaka. Tekan gambar untuk paparan penuh." />
        <Reveal className="no-scrollbar -mx-5 mb-8 flex gap-2 overflow-x-auto px-5">
          {(['semua', ...cats] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cx('relative h-10 shrink-0 rounded-full px-4 text-[13.5px] font-medium transition', cat === c ? 'text-forest-dark' : 'text-white/75 ring-1 ring-white/15 hover:bg-white/10')}
            >
              {cat === c && <motion.span layoutId="gal-pill" className="absolute inset-0 rounded-full bg-gold" transition={{ type: 'spring', damping: 26, stiffness: 300 }} />}
              <span className="relative">{c === 'semua' ? 'Semua' : MEDIA_LABEL[c]}</span>
            </button>
          ))}
        </Reveal>
        <motion.div layout className="columns-2 gap-3 sm:gap-4 md:columns-3 lg:columns-4">
          <AnimatePresence mode="popLayout">
            {shown.map((m, i) => (
              <motion.button
                layout
                key={m.url}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                onClick={() => setOpen(i)}
                className="group relative mb-3 block w-full overflow-hidden rounded-2xl sm:mb-4"
              >
                <img src={m.url} alt={m.caption ?? ''} loading="lazy" className="w-full transition duration-700 group-hover:scale-105" />
                {m.caption && (
                  <span className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-[12.5px] text-white transition duration-500 group-hover:translate-y-0">{m.caption}</span>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
      <Lightbox items={shown} index={open} onChange={setOpen} />
    </section>
  )
}

/* ------------------------------------------------------------------ */

function PoolBand() {
  const { settings } = useSettings()
  const reduce = useReducedMotion()
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#2c3e52] to-[#1b2836] py-20 text-white sm:py-28">
      <svg className="absolute inset-x-0 top-0 h-24 w-[200%] text-forest-dark" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true">
        <motion.path
          fill="currentColor"
          d="M0,40 C240,90 480,0 720,40 C960,80 1200,10 1440,40 L1440,0 L0,0 Z"
          animate={reduce ? undefined : { x: [0, -720, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        />
      </svg>
      {!reduce &&
        Array.from({ length: 14 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute bottom-0 rounded-full border border-white/30 bg-white/5"
            style={{ left: `${(i * 37) % 100}%`, width: 8 + (i % 4) * 8, height: 8 + (i % 4) * 8 }}
            animate={{ y: [0, -600], opacity: [0, 0.8, 0] }}
            transition={{ duration: 8 + (i % 5) * 2, repeat: Infinity, delay: i * 0.9, ease: 'easeOut' }}
          />
        ))}
      <div className="container-x relative grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="eyebrow mb-3 text-sky">Kolam renang peribadi</p>
          <h2 className="font-display text-4xl leading-[1.05] font-semibold sm:text-6xl">
            Berenang sepuasnya, <em className="text-sky italic">tanpa orang luar</em>
          </h2>
          <p className="mt-5 max-w-lg text-white/75">{settings.site.pool}. Air terjun kecil menambah suasana resort di halaman rumah anda sendiri.</p>
        </div>
        <Reveal className="rounded-3xl bg-white/8 p-6 ring-1 ring-white/15 backdrop-blur-md">
          <p className="mb-4 flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-5 text-sky" /> Keselamatan kolam
          </p>
          <ul className="space-y-3 text-[14px] text-white/80">
            <li>Tiada lifeguard. Keselamatan adalah tanggungjawab tetamu.</li>
            <li>Kanak-kanak mesti diawasi orang dewasa dan memakai pelampung.</li>
            <li>Pakai pakaian renang atau t-shirt jersey. Kain, seluar dan t-shirt cotton tidak dibenarkan.</li>
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function TimeList({ items, icon: Icon }: { items: { time: string; name: string }[]; icon: typeof MapPin }) {
  return (
    <ul className="divide-y divide-sand">
      {items.map((a, i) => (
        <Reveal as="li" key={a.name} delay={Math.min(i * 0.03, 0.3)} y={12} className="flex items-center gap-3 py-2.5">
          <Icon className="size-4 shrink-0 text-gold-dark" />
          <span className="flex-1 text-[14.5px]">{a.name}</span>
          <span className="shrink-0 rounded-full bg-sand px-2.5 py-0.5 text-[12px] font-medium text-forest tabular-nums">{a.time}</span>
        </Reveal>
      ))}
    </ul>
  )
}

function Location() {
  const { settings } = useSettings()
  const c = settings.content
  return (
    <section id="lokasi" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-x">
        <SectionTitle eyebrow="Lokasi" title="Tenang di Jasin, dekat dengan semua" text={settings.site.location} />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Reveal className="card p-6 sm:p-8">
            <h3 className="mb-3 font-display text-2xl font-semibold text-forest">Tarikan utama</h3>
            <TimeList items={c.attractions} icon={MapPin} />
          </Reveal>
          <div className="space-y-6">
            <Reveal className="card p-6 sm:p-8">
              <h3 className="mb-3 font-display text-2xl font-semibold text-forest">Jalan-jalan cari makan</h3>
              <TimeList items={c.food} icon={Utensils} />
            </Reveal>
            <Reveal className="card p-6 sm:p-8">
              <h3 className="mb-3 font-display text-2xl font-semibold text-forest">Kampus berdekatan</h3>
              <TimeList items={c.campuses} icon={GraduationCap} />
            </Reveal>
          </div>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {c.beaches.map((b, i) => (
            <Reveal key={b.name} delay={i * 0.1} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#f6e7cf] to-[#e8d2ad] p-7">
              <Waves className="absolute -right-4 -bottom-4 size-32 text-white/40" />
              <p className="eyebrow">{c.beach_drive}</p>
              <h3 className="mt-2 font-display text-3xl font-semibold text-forest">{b.name}</h3>
              <p className="relative mt-2 max-w-sm text-[14.5px] text-ink/75">{b.description}</p>
            </Reveal>
          ))}
        </div>
        {settings.contacts.google_maps && (
          <Reveal className="mt-8 flex flex-col items-start gap-3 rounded-3xl bg-forest p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="font-display text-2xl font-semibold">{settings.site.address}</p>
              <p className="text-sm text-white/65">Tekan untuk navigasi terus dari Google Maps</p>
            </div>
            <a href={settings.contacts.google_maps} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-forest-dark transition hover:bg-white">
              <Navigation className="size-4" /> Buka peta
            </a>
          </Reveal>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function Pricing() {
  const { settings } = useSettings()
  const p = settings.prices
  const cards = [
    { key: 'weekday' as const, title: 'Hari bekerja', sub: 'Check in Ahad hingga Khamis' },
    { key: 'weekend' as const, title: 'Hujung minggu & cuti', sub: 'Check in Jumaat, Sabtu, cuti umum dan cuti sekolah' },
  ]
  return (
    <section id="harga" className="scroll-mt-20 bg-sand/60 py-20 sm:py-28">
      <div className="container-x">
        <SectionTitle eyebrow="Harga" title="Harga telus, tiada caj tersembunyi" center text="Harga untuk seluruh banglo, bukan per orang." />
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {cards.map((c, i) => (
            <Reveal key={c.key} delay={i * 0.1} className={cx('relative overflow-hidden rounded-3xl p-7 sm:p-9', i === 1 ? 'bg-forest text-white' : 'card')}>
              {i === 1 && <div className="absolute -top-16 -right-16 size-48 rounded-full bg-gold/20 blur-2xl" />}
              <p className={cx('eyebrow', i === 1 && 'text-gold')}>{c.sub}</p>
              <h3 className={cx('mt-2 font-display text-3xl font-semibold', i === 0 && 'text-forest')}>{c.title}</h3>
              <div className="mt-6 space-y-4">
                {[
                  { label: '2 hari 1 malam', v: p[c.key].one },
                  { label: '3 hari 2 malam', v: p[c.key].two },
                ].map((row) => (
                  <div key={row.label} className={cx('flex items-baseline justify-between border-b pb-4', i === 1 ? 'border-white/15' : 'border-sand')}>
                    <span className={cx('text-[15px]', i === 1 ? 'text-white/80' : 'text-muted')}>{row.label}</span>
                    <span className="font-display text-4xl font-semibold">{rm(row.v)}</span>
                  </div>
                ))}
                <p className={cx('text-[13px]', i === 1 ? 'text-white/60' : 'text-muted')}>Malam seterusnya {rm(p[c.key].extra)} semalam, disahkan oleh tuan rumah.</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mx-auto mt-8 grid max-w-4xl gap-3 text-[14px] text-muted sm:grid-cols-3">
          <div className="rounded-2xl bg-white/70 p-4">
            <b className="block text-forest">Deposit keselamatan {rm(p.deposit_standard)}</b>
            {rm(p.deposit_event)} untuk majlis. Dipulangkan dalam 24 jam selepas check out.
          </div>
          <div className="rounded-2xl bg-white/70 p-4">
            <b className="block text-forest">Bayaran penuh</b>
            Selewat-lewatnya {p.full_payment_days_before} hari sebelum check in.
          </div>
          <div className="rounded-2xl bg-white/70 p-4">
            <b className="block text-forest">Lewat check out</b>
            {rm(p.late_checkout_per_hour)} sejam sehingga {p.late_checkout_until}, ikut kekosongan.
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function Availability() {
  const { settings, holidaySet } = useSettings()
  const { busy } = useBusyNights()
  const [range, setRange] = useState<RangeValue>({ checkIn: null, checkOut: null })
  const navigate = useNavigate()
  const wide = useMediaQuery('(min-width: 768px)')
  const est = range.checkIn && range.checkOut ? estimatePrice(range.checkIn, range.checkOut, settings.prices, holidaySet) : null
  const check = range.checkIn && range.checkOut ? checkMinimumStay(range.checkIn, range.checkOut, settings.prices, holidaySet) : null

  return (
    <section id="kalendar" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-x">
        <SectionTitle eyebrow="Kalendar kekosongan" title="Pilih tarikh, lihat harga serta-merta" text="Tekan tarikh check in, kemudian tarikh check out. Tarikh bergaris sudah ditempah." />
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Reveal className="card p-5 sm:p-7">
            <DateRangeCalendar busy={busy} holidays={holidaySet} value={range} onChange={setRange} months={wide ? 2 : 1} />
          </Reveal>
          <Reveal delay={0.1} className="flex flex-col rounded-3xl bg-forest p-6 text-white sm:p-8">
            <p className="eyebrow text-gold">Anggaran anda</p>
            {!range.checkIn && <p className="mt-4 text-white/70">Pilih tarikh check in pada kalendar.</p>}
            {range.checkIn && !range.checkOut && (
              <p className="mt-4 text-white/80">
                Check in <b>{fmtDate(range.checkIn)}</b>. Sekarang pilih tarikh check out.
              </p>
            )}
            {est && (
              <motion.div key={range.checkIn! + range.checkOut} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
                <div className="flex justify-between text-sm text-white/75">
                  <span>{fmtDate(range.checkIn)}</span>
                  <ArrowRight className="size-4" />
                  <span>{fmtDate(range.checkOut)}</span>
                </div>
                <p className="text-sm text-white/70">
                  {est.label} · {est.category === 'weekend' ? 'Harga hujung minggu / cuti' : 'Harga hari bekerja'}
                </p>
                <p className="font-display text-6xl font-semibold">{rm(est.total)}</p>
                {est.isEstimate && <p className="text-xs text-gold">Anggaran. Harga akhir disahkan oleh tuan rumah.</p>}
                {check && !check.ok && <p className="rounded-xl bg-rose/25 px-3 py-2 text-sm">{check.reason}</p>}
              </motion.div>
            )}
            <div className="mt-auto pt-8">
              <button
                disabled={!est || !check?.ok}
                onClick={() => navigate(`/tempah?in=${range.checkIn}&out=${range.checkOut}`)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold font-semibold text-forest-dark transition hover:bg-white disabled:opacity-40"
              >
                Teruskan tempahan <ArrowRight className="size-4" />
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-white/55">
                <Users className="size-3.5" /> Ideal {settings.site.capacity_ideal} orang, maksimum {settings.site.capacity_max}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function Rules() {
  const { settings } = useSettings()
  return (
    <section className="bg-sand/60 py-20 sm:py-28">
      <div className="container-x grid gap-8 lg:grid-cols-2">
        <div>
          <SectionTitle eyebrow="Peraturan" title="Peraturan Nilofar Villa Melaka" />
          <ol className="space-y-3">
            {settings.rules.house.map((r, i) => (
              <Reveal as="li" key={r} delay={i * 0.06} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-forest font-display text-lg font-semibold text-gold">{i + 1}</span>
                <span className="pt-1 text-[14.5px]">{r}</span>
              </Reveal>
            ))}
          </ol>
        </div>
        <div>
          <SectionTitle eyebrow="Polisi" title="Perlu tahu sebelum menginap" />
          <ul className="space-y-3">
            {settings.rules.policies.map((r, i) => (
              <Reveal as="li" key={r} delay={i * 0.06} className="flex gap-3 rounded-2xl border border-sand-dark bg-ivory p-4">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-gold-dark" />
                <span className="text-[14.5px] text-ink/85">{r}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function Faq() {
  const { settings } = useSettings()
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="py-20 sm:py-28">
      <div className="container-x max-w-3xl">
        <SectionTitle eyebrow="Soalan lazim" title="Ada soalan?" center />
        <div className="space-y-3">
          {settings.content.faq.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.04} className="card overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left" aria-expanded={open === i}>
                <span className="font-medium text-forest">{f.q}</span>
                <motion.span animate={{ rotate: open === i ? 180 : 0 }}>
                  <ChevronDown className="size-5 text-gold-dark" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                    <p className="px-5 pb-5 text-[14.5px] leading-relaxed text-muted">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      <img src={IMG.garden} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-forest-dark/75" />
      <div className="container-x relative py-24 text-center text-white sm:py-32">
        <Reveal>
          <p className="eyebrow text-gold">Jom bercuti</p>
          <h2 className="mx-auto mt-3 max-w-2xl font-display text-5xl leading-[1.02] font-semibold sm:text-6xl">Percutian keluarga yang anda tunggu-tunggu</h2>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/tempah" className="bubble inline-flex h-13 items-center gap-2 rounded-full px-7 font-semibold">
              <CalendarDays className="size-5" /> Semak tarikh kosong
            </Link>
            <Link to="/tour" className="inline-flex h-13 items-center gap-2 rounded-full px-6 ring-1 ring-white/30 hover:bg-white/10">
              Tour maya 3D <ArrowRight className="size-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
