import { Box, Compass, Hand, Info, PlayCircle } from 'lucide-react'
import { motion } from 'motion/react'
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
