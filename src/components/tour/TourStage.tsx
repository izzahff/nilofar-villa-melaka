import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BedDouble, ChevronsDown, ChevronsUp, Footprints, HelpCircle, ImageOff, Layers, Maximize, Minimize, Orbit, Play,
  RotateCcw, Send, Wifi, X,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react'
import { DEMO_MEDIA } from '../../lib/demoMedia'
import { ROOM_BY_ID, photoUrl } from '../../lib/house'
import { useSettings } from '../../lib/settings'
import type { SavedView, SplatSettings } from '../../lib/types'
import { Lightbox } from '../Lightbox'
import { cx } from '../ui'
import { MODEL_VIEWS, TourViewer, savedToViews, type FloorMode, type InputKey, type TourMode, type TourViewerHandle } from './TourViewer'

const MODES: { id: TourMode; label: string; icon: typeof Footprints }[] = [
  { id: 'walk', label: 'Jalan', icon: Footprints },
  { id: 'fly', label: 'Terbang', icon: Send },
  { id: 'orbit', label: 'Orbit', icon: Orbit },
]
const FLOORS: { id: FloorMode; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'ground', label: 'Bawah' },
  { id: 'upper', label: 'Atas' },
]
const HINT: Record<TourMode, string> = {
  walk: 'W A S D · Shift lari · Space lompat',
  fly: 'W A S D · E naik · Q turun',
  orbit: 'Seret pusing · Skrol zum',
}

function Pad({ k, label, children, wide, hold }: { k: InputKey; label: string; children: ReactNode; wide?: boolean; hold: (k: InputKey) => object }) {
  return (
    <button
      type="button"
      aria-label={label}
      {...hold(k)}
      className={cx('grid h-11 touch-none place-items-center rounded-lg bg-white/92 text-[11px] font-semibold text-forest-dark shadow-md select-none active:bg-gold', wide ? 'w-13' : 'w-11')}
    >
      {children}
    </button>
  )
}

interface Props {
  photos: Record<string, string[]>
  splat?: SplatSettings | null
  views?: SavedView[]
  /** Skip the start screen (admin preview) */
  autoStart?: boolean
  className?: string
}

export const TourStage = forwardRef<TourViewerHandle, Props>(function TourStage({ photos, splat, views, autoStart, className }, ref) {
  const { settings } = useSettings()
  const reduce = useReducedMotion() ?? false
  const viewer = useRef<TourViewerHandle>(null)
  const stage = useRef<HTMLDivElement>(null)
  useImperativeHandle(ref, () => viewer.current!, [])

  const [started, setStarted] = useState(!!autoStart)
  const [mode, setMode] = useState<TourMode>(autoStart && splat ? 'fly' : 'orbit')
  const [floor, setFloor] = useState<FloorMode>('all')
  const [selected, setSelected] = useState<string | null>(null)
  const [where, setWhere] = useState({ place: '', level: '' })
  const [splatState, setSplatState] = useState<number | 'ready' | 'error' | null>(null)
  const [help, setHelp] = useState(false)
  const [full, setFull] = useState(false)
  const [run, setRun] = useState(false)
  const [shot, setShot] = useState<number | null>(null)
  const [activeView, setActiveView] = useState<string | null>(null)

  // The scan only starts downloading after the guest presses start
  const liveSplat = started && splat?.url && splatState !== 'error' ? splat : null
  const tourViews = useMemo(() => (liveSplat ? savedToViews(views ?? []) : MODEL_VIEWS), [liveSplat, views])

  useEffect(() => {
    const f = () => setFull(document.fullscreenElement === stage.current)
    document.addEventListener('fullscreenchange', f)
    return () => document.removeEventListener('fullscreenchange', f)
  }, [])

  const captions = useMemo(() => new Map(DEMO_MEDIA.map((m) => [m.url, m.caption])), [])
  const room = selected ? ROOM_BY_ID[selected] : null
  const detail = room?.roomIndex !== undefined ? settings.content.rooms[room.roomIndex] : undefined
  const roomPhotos = useMemo(
    () => (room ? (photos[room.id] ?? []).map((u) => ({ url: photoUrl(u), caption: captions.get(photoUrl(u)) ?? room.title })) : []),
    [room, photos, captions],
  )

  const pick = (id: string | null) => {
    const r = id ? ROOM_BY_ID[id] : null
    if (r && mode === 'orbit') setFloor(r.floor === 1 ? 'upper' : 'ground')
    setSelected(id)
    setShot(null)
  }

  const changeMode = (m: TourMode) => {
    setMode(m)
    setSelected(null)
    setRun(false)
    viewer.current?.setInput('run', false)
    if (m !== 'orbit') setFloor('all')
  }

  const start = () => {
    setStarted(true)
    changeMode(splat?.url ? 'fly' : 'walk')
    if (splat?.url) setSplatState(0)
  }

  const hold = (k: InputKey) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault()
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      viewer.current?.setInput(k, true)
    },
    onPointerUp: () => viewer.current?.setInput(k, false),
    onPointerCancel: () => viewer.current?.setInput(k, false),
    onLostPointerCapture: () => viewer.current?.setInput(k, false),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  })

  const loading = typeof splatState === 'number' && started && !!splat?.url
  const modeLabel = mode === 'walk' ? 'Jalan dalam rumah' : mode === 'fly' ? 'Terbang bebas' : 'Pandangan orbit'

  return (
    <div ref={stage} className={cx('relative overflow-hidden bg-gradient-to-b from-[#ece3d2] to-[#f8f4ec] text-forest-dark', full ? 'h-screen w-screen' : 'rounded-2xl', className)}>
      <TourViewer
        ref={viewer}
        mode={mode}
        floor={floor}
        selected={selected}
        photos={photos}
        splat={liveSplat}
        reduceMotion={reduce}
        onSelect={pick}
        onWhere={(place, level) => setWhere({ place, level })}
        onSplat={setSplatState}
        className={cx('w-full', full ? 'h-screen' : 'h-[74svh] min-h-[460px] lg:h-[78svh]')}
      />

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-2 top-2 z-10 flex items-start justify-between gap-2 sm:inset-x-3 sm:top-3">
        <div className="flex min-w-0 flex-col items-start gap-2">
          {started && (
            <p className="flex max-w-full items-center gap-2 rounded-lg bg-forest-dark/90 px-3 py-1.5 text-xs font-medium text-white shadow-md">
              <span className="size-1.5 shrink-0 rounded-full bg-gold" />
              <span className="truncate">{mode !== 'orbit' && where.place ? where.place : modeLabel}</span>
              {mode !== 'orbit' && where.level && <span className="shrink-0 border-l border-white/25 pl-2 text-white/70">{where.level}</span>}
            </p>
          )}
          {mode === 'orbit' && !liveSplat && (
            <div className="pointer-events-auto flex rounded-full bg-white/92 p-1 text-sm shadow-md">
              <Layers className="mx-2 size-4 self-center text-gold-dark" aria-hidden="true" />
              {FLOORS.map((f) => (
                <button key={f.id} onClick={() => setFloor(f.id)} aria-pressed={floor === f.id} className={cx('h-8 rounded-full px-3 font-medium transition', floor === f.id ? 'bg-forest-dark text-white' : 'hover:bg-forest-dark/5')}>
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="pointer-events-auto flex shrink-0 gap-1.5">
          <button onClick={() => setHelp(true)} className="flex h-9 items-center gap-1.5 rounded-lg bg-white/92 px-3 text-xs font-semibold shadow-md">
            <HelpCircle className="size-4" /> <span className="hidden sm:inline">Cara guna</span>
          </button>
          {typeof document !== 'undefined' && document.fullscreenEnabled && (
            <button
              onClick={() => (document.fullscreenElement ? document.exitFullscreen() : stage.current?.requestFullscreen())}
              className="grid size-9 place-items-center rounded-lg bg-white/92 shadow-md"
              aria-label={full ? 'Keluar skrin penuh' : 'Skrin penuh'}
            >
              {full ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Start screen */}
      <AnimatePresence>
        {!started && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 grid place-items-end bg-gradient-to-t from-forest-dark/80 via-forest-dark/10 to-transparent p-5 sm:place-items-center sm:bg-forest-dark/35">
            <div className="w-full max-w-md rounded-2xl bg-white/95 p-6 text-center shadow-2xl backdrop-blur">
              <p className="eyebrow text-gold-dark">Rumah terbuka</p>
              <h2 className="mt-1 font-display text-3xl leading-tight font-semibold sm:text-4xl">Pintu terbuka. Jom masuk.</h2>
              <p className="mt-2 text-sm text-ink/70">
                {splat?.url ? 'Jelajah imbasan 3D sebenar Nilofar Villa dari bilik ke bilik.' : 'Berjalan dari ruang tamu ke dapur, naik tangga ke bilik atas, dan keluar ke laman serta kolam.'}
              </p>
              <button onClick={start} className="bubble mt-5 inline-flex h-12 items-center gap-2 rounded-full px-7 font-semibold">
                <Play className="size-4" /> Mula lawatan
              </button>
              {splat?.url && (
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink/60">
                  <Wifi className="size-3.5" /> Memuat turun {splat.sizeMb ? `kira-kira ${splat.sizeMb} MB` : 'data 3D yang besar'}. Wi-Fi disyorkan.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan loading */}
      {loading && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-forest-dark/85 p-6 text-white">
          <div className="w-full max-w-xs text-center">
            <p className="font-display text-2xl">Memuatkan imbasan 3D</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-gold transition-[width]" style={{ width: `${Math.round((splatState as number) * 100)}%` }} />
            </div>
            <p className="mt-2 text-sm text-white/70">{Math.round((splatState as number) * 100)}%</p>
            <button onClick={() => { setSplatState('error'); changeMode('walk') }} className="mt-4 text-sm underline underline-offset-4">
              Batal dan lihat model
            </button>
          </div>
        </div>
      )}
      {started && splat?.url && splatState === 'error' && (
        <p className="absolute top-14 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-white/95 px-3 py-1.5 text-xs shadow-md">Imbasan 3D tidak dapat dimuatkan. Model rumah dipaparkan.</p>
      )}

      {/* Touch pad */}
      {started && mode !== 'orbit' && !loading && (
        <div className="absolute right-2 bottom-[7.6rem] z-10 grid grid-cols-[auto_auto_auto] gap-1.5 sm:right-3 lg:bottom-4">
          {mode === 'walk' ? <Pad hold={hold} k="jump" label="Lompat" wide>Lompat</Pad> : <Pad hold={hold} k="up" label="Naik" wide><ChevronsUp className="size-5" /></Pad>}
          <Pad hold={hold} k="fwd" label="Ke depan"><ArrowUp className="size-5" /></Pad>
          {mode === 'walk' ? (
            <button
              type="button"
              aria-pressed={run}
              onClick={() => { viewer.current?.setInput('run', !run); setRun(!run) }}
              className={cx('grid h-11 w-13 place-items-center rounded-lg text-[11px] font-semibold shadow-md select-none', run ? 'bg-gold text-forest-dark' : 'bg-white/92 text-forest-dark')}
            >
              Lari
            </button>
          ) : (
            <Pad hold={hold} k="down" label="Turun" wide><ChevronsDown className="size-5" /></Pad>
          )}
          <div className="flex justify-end"><Pad hold={hold} k="left" label="Ke kiri"><ArrowLeft className="size-5" /></Pad></div>
          <Pad hold={hold} k="back" label="Ke belakang"><ArrowDown className="size-5" /></Pad>
          <div className="flex"><Pad hold={hold} k="right" label="Ke kanan"><ArrowRight className="size-5" /></Pad></div>
        </div>
      )}

      {/* Views and modes */}
      {started && !loading && (
        <div className="absolute inset-x-2 bottom-2 z-10 mx-auto max-w-3xl rounded-xl bg-white/94 shadow-xl backdrop-blur sm:bottom-3 lg:right-44 lg:left-3 lg:mx-0 xl:mx-auto xl:right-3">
          {tourViews.length > 0 && (
            <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-forest-dark/10 px-2 py-1.5">
              {tourViews.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setActiveView(v.id); setSelected(null); viewer.current?.goTo(v) }}
                  className={cx('h-8 shrink-0 rounded-md px-2.5 text-xs whitespace-nowrap transition', activeView === v.id ? 'bg-forest-dark/8 font-semibold' : 'text-ink/75 hover:bg-forest-dark/5')}
                >
                  {v.title}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1 p-1.5">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => changeMode(m.id)}
                aria-pressed={mode === m.id}
                className={cx('flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition', mode === m.id ? 'bg-forest-dark text-white' : 'hover:bg-forest-dark/5')}
              >
                <m.icon className="size-4" /> {m.label}
              </button>
            ))}
            <span className="ml-2 hidden border-l border-forest-dark/10 pl-3 text-[11px] tracking-wide text-ink/55 md:inline">{HINT[mode]}</span>
            <button onClick={() => { setSelected(null); setActiveView(null); if (mode === 'orbit') setFloor('all'); viewer.current?.reset() }} className="ml-auto grid size-9 place-items-center rounded-md hover:bg-forest-dark/5" aria-label="Pandangan asal" title="Pandangan asal">
              <RotateCcw className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Room panel */}
      <AnimatePresence>
        {room && (
          <motion.aside
            key={room.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: reduce ? 0 : 0.25 }}
            className="absolute inset-x-2 bottom-2 z-30 max-h-[72%] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:inset-x-auto sm:top-14 sm:right-3 sm:bottom-auto sm:w-[340px]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow text-gold-dark">{room.open ? 'Luar rumah' : room.floor === 1 ? 'Tingkat atas' : 'Tingkat bawah'}</p>
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
            {roomPhotos.length ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {roomPhotos.map((p, i) => (
                  <button key={p.url} onClick={() => setShot(i)} className={cx('overflow-hidden rounded-xl', roomPhotos.length === 1 && 'col-span-2')}>
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
        )}
      </AnimatePresence>

      {/* Help */}
      <AnimatePresence>
        {help && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 grid place-items-center bg-forest-dark/60 p-4" onClick={() => setHelp(false)}>
            <div className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <p className="eyebrow text-gold-dark">Cara guna</p>
              <h2 className="font-display text-3xl font-semibold">Buat macam rumah sendiri</h2>
              <dl className="mt-4 space-y-3 text-sm">
                {[
                  ['Lihat sekeliling', 'Seret pada skrin dengan tetikus atau jari.'],
                  ['Jalan', 'Guna W A S D atau kekunci anak panah. Shift untuk lari, Space untuk lompat. Di telefon, guna butang anak panah. Dinding dan tangga mengikut pelan rumah.'],
                  ['Terbang', 'Bergerak bebas menembusi dinding. E untuk naik, Q untuk turun, atau guna butang Naik dan Turun.'],
                  ['Orbit', 'Lihat keseluruhan rumah dari luar. Seret untuk pusing, skrol atau cubit untuk zum, dan tekan label bilik.'],
                  ['Pandangan tersimpan', 'Tekan nama ruang di bar bawah untuk terus ke sana.'],
                  ['Gambar sebenar', 'Tekan bingkai gambar pada dinding untuk melihat gambar sebenar ruang itu.'],
                ].map(([t, d]) => (
                  <div key={t}>
                    <dt className="font-semibold">{t}</dt>
                    <dd className="text-ink/70">{d}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-ink/55">
                {liveSplat ? 'Pergerakan dalam imbasan adalah anggaran dan mungkin tidak mengikut permukaan sebenar.' : 'Model ini ilustrasi berdasarkan pelan lantai pemaju. Perabot dan ukuran adalah anggaran.'}
              </p>
              <button onClick={() => setHelp(false)} className="bubble mt-5 h-11 w-full rounded-full font-semibold">
                Faham
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Lightbox items={roomPhotos} index={shot} onChange={setShot} />
    </div>
  )
})
