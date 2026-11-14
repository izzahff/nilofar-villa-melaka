import { Box, Compass, Hand, Info, Pause, Play, PlayCircle } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { PanoViewer } from '../../components/PanoViewer'
import { TourStage } from '../../components/tour/TourStage'
import { PageLoader, cx } from '../../components/ui'
import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import { useSettings } from '../../lib/settings'
import type { TourScene } from '../../lib/types'

type Tab = '3d' | '360'
const VIDEO = `${import.meta.env.BASE_URL}video/lawatan-rumah.mp4`
const POSTER = `${import.meta.env.BASE_URL}video/lawatan-rumah.jpg`

export default function Tour() {
  const { data: scenes, loading } = useAsync(() => api.listTourScenes(), [])
  const { settings } = useSettings()
  const [tab, setTab] = useState<Tab>('3d')

  if (loading) return <PageLoader />
  const has360 = !!scenes?.length
  const tour = settings.house_tour

  return (
    <section className="bg-forest-dark py-6 text-white sm:py-10">
      <div className="mx-auto w-full max-w-[1500px] px-3 sm:px-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-2 sm:px-0">
          <div className="min-w-0">
            <p className="eyebrow text-gold">Tour maya</p>
            <h1 className="font-display text-4xl font-semibold sm:text-5xl">{tab === '3d' ? 'Rumah terbuka' : 'Lawatan 360°'}</h1>
          </div>
          {has360 && (
            <div className="flex rounded-full bg-white/10 p-1 text-sm" role="tablist">
              {(
                [
                  ['3d', 'Jelajah 3D', Box],
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

        {tab === '3d' || !has360 ? (
          <>
            <TourStage photos={tour?.photos ?? {}} splat={tour?.splat} views={tour?.views} />
            {!tour?.splat?.url && (
              <p className="mt-3 flex items-start gap-2 px-2 text-xs text-white/50 sm:px-0">
                <Info className="mt-0.5 size-3.5 shrink-0" /> Ilustrasi berdasarkan pelan lantai rumah jenis Brittany oleh pemaju. Ukuran, perabot dan kedudukan kolam serta laman adalah anggaran. Tekan bingkai gambar untuk gambar
                sebenar.
              </p>
            )}
          </>
        ) : (
          <PanoTour scenes={scenes!} />
        )}

        <div className="mt-10 grid items-center gap-6 px-2 sm:px-0 md:grid-cols-[minmax(0,300px)_1fr] [&>*]:min-w-0">
          <video src={VIDEO} poster={POSTER} controls playsInline preload="none" className="mx-auto aspect-[9/16] w-full max-w-[300px] rounded-2xl bg-black object-cover shadow-2xl ring-1 ring-white/10" />
          <div>
            <p className="eyebrow flex items-center gap-2 text-gold">
              <PlayCircle className="size-4" /> Video
            </p>
            <h2 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Lawatan rumah sebenar</h2>
            <p className="mt-3 max-w-xl text-white/70">
              Tengok sendiri dalam 40 saat. Dari pintu masuk ke ruang tamu, ruang makan, dapur yang lengkap, naik tangga kayu ke bilik atas, bilik air dan akhirnya kolam renang peribadi.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function PanoTour({ scenes }: { scenes: TourScene[] }) {
  const reduce = useReducedMotion() ?? false
  const [current, setCurrent] = useState<string>(scenes[0].id)
  const [autoplay, setAutoplay] = useState(false)
  const idx = Math.max(0, scenes.findIndex((s) => s.id === current))
  const scene = scenes[idx]

  // Guided tour: move to the next room every 14 seconds
  useEffect(() => {
    if (!autoplay) return
    const t = setTimeout(() => setCurrent(scenes[(idx + 1) % scenes.length].id), 14000)
    return () => clearTimeout(t)
  }, [autoplay, idx, scenes])

  return (
    <>
      <div className="relative">
        <PanoViewer scene={scene} scenes={scenes} intro reduceMotion={reduce} onNavigate={setCurrent} className="h-[74svh] min-h-[420px] w-full overflow-hidden rounded-2xl lg:h-[78svh]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
          <AnimatePresence mode="wait">
            <motion.div key={scene.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="min-w-0 drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
              <p className="eyebrow text-gold">
                {idx + 1} / {scenes.length}
              </p>
              <p className="font-display text-3xl text-white italic sm:text-4xl">{scene.name}</p>
            </motion.div>
          </AnimatePresence>
          <button
            onClick={() => setAutoplay((a) => !a)}
            aria-pressed={autoplay}
            className={cx('pointer-events-auto flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold shadow-lg backdrop-blur transition', autoplay ? 'bg-gold text-forest-dark' : 'bg-forest-dark/60 text-white ring-1 ring-white/25')}
          >
            {autoplay ? <Pause className="size-4" /> : <Play className="size-4" />} Tour automatik
          </button>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-2 px-2 text-sm text-white/60 sm:px-0">
        <Hand className="size-4 shrink-0" /> Seret untuk melihat sekeliling. Tekan anak panah emas untuk masuk ke ruang lain. Di telefon, tekan ikon telefon untuk melihat dengan menggerakkan telefon.
      </p>
      <div className="no-scrollbar -mx-3 mt-4 flex gap-3 overflow-x-auto px-3 pb-2 sm:mx-0 sm:px-0">
        {scenes.map((s, i) => (
          <button key={s.id} onClick={() => setCurrent(s.id)} className={cx('group w-36 shrink-0 text-left transition', s.id === scene.id ? '' : 'opacity-65 hover:opacity-100')}>
            <div className={cx('aspect-[16/10] overflow-hidden rounded-xl bg-cover bg-center ring-2 transition', s.id === scene.id ? 'ring-gold' : 'ring-transparent')} style={{ backgroundImage: `url(${s.image_url})` }} />
            <p className="mt-1.5 truncate text-xs">
              <span className="text-gold">{String(i + 1).padStart(2, '0')}</span> {s.name}
            </p>
          </button>
        ))}
      </div>
    </>
  )
}
