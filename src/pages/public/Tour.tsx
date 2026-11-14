import { BedDouble, Box, Compass, Hand, ImageOff, Info, Layers, RotateCcw, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { HouseModel, type FloorMode, type HouseModelHandle } from '../../components/HouseModel'
import { Lightbox } from '../../components/Lightbox'
import { PanoViewer } from '../../components/PanoViewer'
import { PageLoader, cx } from '../../components/ui'
import { api } from '../../lib/api'
import { DEMO_MEDIA } from '../../lib/demoMedia'
import { useAsync } from '../../lib/hooks'
import { PICKABLE, ROOM_BY_ID, photoUrl } from '../../lib/house'
import { useSettings } from '../../lib/settings'
import type { TourScene } from '../../lib/types'

type Tab = '3d' | '360'

const FLOORS: { id: FloorMode; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'ground', label: 'Bawah' },
  { id: 'upper', label: 'Atas' },
]

export default function Tour() {
  const { data: scenes, loading } = useAsync(() => api.listTourScenes(), [])
  const [tab, setTab] = useState<Tab>('3d')

  if (loading) return <PageLoader />
  const has360 = !!scenes?.length

  return (
    <section className="bg-forest-dark py-6 text-white sm:py-10">
      <div className="container-x">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow text-gold">Tour maya</p>
            <h1 className="font-display text-4xl font-semibold sm:text-5xl">{tab === '3d' ? 'Jelajah pelan rumah' : 'Lawatan 360°'}</h1>
          </div>
          {has360 && (
            <div className="flex rounded-full bg-white/10 p-1 text-sm" role="tablist">
              {(
                [
                  ['3d', 'Pelan 3D', Box],
                  ['360', '360°', Compass],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={cx('flex h-10 items-center gap-2 rounded-full px-4 font-medium transition', tab === id ? 'bg-gold text-forest-dark' : 'text-white/75 hover:text-white')}
                >
                  <Icon className="size-4" /> {label}
                </button>
              ))}
            </div>
          )}
        </div>
        {tab === '3d' || !has360 ? <HouseTour /> : <PanoTour scenes={scenes!} />}
      </div>
    </section>
  )
}

function HouseTour() {
  const { settings } = useSettings()
  const reduce = useReducedMotion() ?? false
  const model = useRef<HouseModelHandle>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [floor, setFloor] = useState<FloorMode>('all')
  const [shot, setShot] = useState<number | null>(null)
  const [hint, setHint] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 4500)
    return () => clearTimeout(t)
  }, [])

  const captions = useMemo(() => new Map(DEMO_MEDIA.map((m) => [m.url, m.caption])), [])
  const room = selected ? ROOM_BY_ID[selected] : null
  const detail = room?.roomIndex !== undefined ? settings.content.rooms[room.roomIndex] : undefined
  const photos = useMemo(
    () => (room ? (settings.house_tour?.photos?.[room.id] ?? []).map((u) => ({ url: photoUrl(u), caption: captions.get(photoUrl(u)) ?? room.title })) : []),
    [room, settings.house_tour, captions],
  )

  const below = useRef<HTMLDivElement>(null)
  const pick = (id: string | null) => {
    const r = id ? ROOM_BY_ID[id] : null
    // Show only the floor the room is on so the upper floor does not hide ground rooms
    if (r) setFloor(r.floor === 1 ? 'upper' : 'ground')
    setSelected(id)
    setHint(false)
    setShot(null)
  }

  useEffect(() => {
    if (!selected || !below.current || window.innerWidth >= 1024) return
    const t = setTimeout(() => {
      const r = below.current?.getBoundingClientRect()
      if (r && r.top > window.innerHeight - 120) window.scrollBy({ top: Math.min(r.top - window.innerHeight + 260, r.top - 100), behavior: reduce ? 'auto' : 'smooth' })
    }, 350)
    return () => clearTimeout(t)
  }, [selected, reduce])

  const panel = room && (
    <motion.aside
      key={room.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: reduce ? 0 : 0.3 }}
      className="rounded-2xl bg-white p-5 text-forest-dark shadow-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-gold-dark">{room.floor === 1 ? 'Tingkat atas' : 'Tingkat bawah'}</p>
          <h2 className="font-display text-2xl leading-tight font-semibold">{room.title}</h2>
        </div>
        <button onClick={() => pick(null)} className="grid size-9 shrink-0 place-items-center rounded-full bg-forest-dark/5 hover:bg-forest-dark/10" aria-label="Tutup">
          <X className="size-4" />
        </button>
      </div>
      {detail ? (
        <div className="mt-3 space-y-1.5 text-sm text-ink/75">
          <p className="flex items-center gap-2 font-medium text-forest-dark">
            <BedDouble className="size-4 text-gold-dark" /> {detail.bed}
          </p>
          <p>{detail.features}</p>
        </div>
      ) : (
        room.info && <p className="mt-3 text-sm text-ink/75">{room.info}</p>
      )}
      {photos.length ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {photos.map((p, i) => (
            <button key={p.url} onClick={() => setShot(i)} className={cx('overflow-hidden rounded-xl', photos.length === 1 && 'col-span-2')}>
              <img src={p.url} alt={p.caption ?? ''} loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-500 hover:scale-105" />
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-sand px-3 py-4 text-sm text-ink/60">
          <ImageOff className="size-4 shrink-0" /> Gambar akan datang
        </p>
      )}
    </motion.aside>
  )

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px] [&>*]:min-w-0">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#dfe9e1] to-[#f4efe5]">
          <HouseModel ref={model} selected={selected} onSelect={pick} floor={floor} reduceMotion={reduce} className="h-[62svh] min-h-[380px] w-full sm:h-[70svh]" />
          <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2">
            <div className="pointer-events-auto flex rounded-full bg-white/90 p-1 text-sm text-forest-dark shadow-md">
              <Layers className="mx-2 size-4 self-center text-gold-dark" aria-hidden="true" />
              {FLOORS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFloor(f.id)}
                  aria-pressed={floor === f.id}
                  className={cx('h-8 rounded-full px-3 font-medium transition', floor === f.id ? 'bg-forest-dark text-white' : 'hover:bg-forest-dark/5')}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                pick(null)
                setFloor('all')
                model.current?.resetView()
              }}
              className="pointer-events-auto grid size-10 place-items-center rounded-full bg-white/90 text-forest-dark shadow-md"
              aria-label="Pandangan asal"
              title="Pandangan asal"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
          <AnimatePresence>
            {hint && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
                <p className="flex items-center gap-2 rounded-full bg-forest-dark/85 px-4 py-2 text-sm">
                  <Hand className="size-4 text-gold" /> Seret untuk pusing. Tekan label bilik.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Phone and tablet: details sit under the model so the room stays in view */}
        <div ref={below} className="scroll-mt-24 lg:hidden">
          <AnimatePresence mode="wait">{panel}</AnimatePresence>
        </div>

        <div className="hidden lg:block">
          <AnimatePresence mode="wait">
            {panel || (
              <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                <p className="font-display text-2xl font-semibold">Pilih ruang</p>
                <p className="mt-2 text-sm text-white/65">Tekan mana-mana label pada model atau senarai di bawah untuk melihat butiran dan gambar sebenar.</p>
                <RoomList onPick={pick} selected={selected} className="mt-4 flex flex-col gap-1.5" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <RoomList onPick={pick} selected={selected} className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-2 lg:hidden" />

      <p className="mt-4 flex items-start gap-2 text-xs text-white/50">
        <Info className="mt-0.5 size-3.5 shrink-0" /> Ilustrasi berdasarkan pelan lantai rumah jenis Brittany oleh pemaju. Ukuran dan kedudukan kolam serta laman adalah anggaran.
      </p>

      <Lightbox items={photos} index={shot} onChange={setShot} />
    </>
  )
}

function RoomList({ onPick, selected, className }: { onPick: (id: string) => void; selected: string | null; className?: string }) {
  return (
    <div className={className}>
      {PICKABLE.map((r) => (
        <button
          key={r.id}
          onClick={() => onPick(r.id)}
          className={cx(
            'flex shrink-0 items-center justify-between gap-3 rounded-full px-4 py-2 text-left text-sm transition lg:rounded-xl',
            r.id === selected ? 'bg-gold font-semibold text-forest-dark' : 'bg-white/10 text-white/85 hover:bg-white/15',
          )}
        >
          <span className="whitespace-nowrap">{r.title}</span>
          <span className="hidden text-xs opacity-60 lg:inline">{r.floor === 1 ? 'Atas' : 'Bawah'}</span>
        </button>
      ))}
    </div>
  )
}

function PanoTour({ scenes }: { scenes: TourScene[] }) {
  const [current, setCurrent] = useState<string>(scenes[0].id)
  const [hint, setHint] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 4000)
    return () => clearTimeout(t)
  }, [current])

  const scene = scenes.find((s) => s.id === current) ?? scenes[0]

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-2xl">{scene.name}</p>
        <p className="flex items-center gap-2 text-sm text-white/60">
          <Hand className="size-4" /> Seret untuk melihat sekeliling. Tekan label untuk ke ruang lain.
        </p>
      </div>
      <div className="relative">
        <PanoViewer scene={scene} onNavigate={setCurrent} className="h-[68svh] min-h-[380px] w-full overflow-hidden rounded-2xl" />
        {hint && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pointer-events-none absolute inset-0 grid place-items-center">
            <motion.div animate={{ x: [-30, 30, -30] }} transition={{ duration: 2.2, repeat: Infinity }} className="bubble grid size-16 place-items-center rounded-full">
              <Hand className="size-7" />
            </motion.div>
          </motion.div>
        )}
      </div>
      <div className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-2">
        {scenes.map((s) => (
          <button key={s.id} onClick={() => setCurrent(s.id)} className={cx('group shrink-0 overflow-hidden rounded-xl ring-2 transition', s.id === scene.id ? 'ring-gold' : 'ring-transparent opacity-70 hover:opacity-100')}>
            <div className="h-16 w-28 bg-cover bg-center" style={{ backgroundImage: `url(${s.image_url})` }} />
            <p className="bg-white/5 px-2 py-1 text-xs">{s.name}</p>
          </button>
        ))}
      </div>
    </>
  )
}
