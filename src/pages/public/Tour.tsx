import { ArrowLeft, Compass, Hand, Images } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PanoViewer } from '../../components/PanoViewer'
import { PageLoader, cx } from '../../components/ui'
import { api } from '../../lib/api'
import { IMG } from '../../lib/demoMedia'
import { useAsync } from '../../lib/hooks'

export default function Tour() {
  const { data: scenes, loading } = useAsync(() => api.listTourScenes(), [])
  const [current, setCurrent] = useState<string | null>(null)
  const [hint, setHint] = useState(true)

  useEffect(() => {
    if (scenes?.length && !current) setCurrent(scenes[0].id)
  }, [scenes, current])

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 4000)
    return () => clearTimeout(t)
  }, [current])

  if (loading) return <PageLoader />

  if (!scenes?.length)
    return (
      <section className="relative overflow-hidden bg-forest-dark text-white">
        <img src={IMG.living} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover opacity-30 blur-sm" />
        <div className="container-x relative flex min-h-[78vh] flex-col items-center justify-center py-24 text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} className="bubble mb-6 grid size-24 place-items-center rounded-full">
            <Compass className="size-10 text-gold" />
          </motion.div>
          <p className="eyebrow text-gold">Tour maya 360°</p>
          <h1 className="mt-3 max-w-xl font-display text-5xl leading-[1.02] font-semibold sm:text-6xl">Akan datang tidak lama lagi</h1>
          <p className="mt-4 max-w-md text-white/70">Kami sedang menyediakan lawatan maya ke setiap ruang villa. Sementara itu, lihat gambar sebenar di galeri.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/#galeri" className="inline-flex h-12 items-center gap-2 rounded-full bg-gold px-6 font-semibold text-forest-dark">
              <Images className="size-4" /> Lihat galeri
            </Link>
            <Link to="/" className="inline-flex h-12 items-center gap-2 rounded-full px-6 ring-1 ring-white/30 hover:bg-white/10">
              <ArrowLeft className="size-4" /> Laman utama
            </Link>
          </div>
        </div>
      </section>
    )

  const scene = scenes.find((s) => s.id === current) ?? scenes[0]

  return (
    <section className="bg-forest-dark py-6 text-white sm:py-10">
      <div className="container-x">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow text-gold">Tour maya 360°</p>
            <h1 className="font-display text-4xl font-semibold sm:text-5xl">{scene.name}</h1>
          </div>
          <p className="flex items-center gap-2 text-sm text-white/60">
            <Hand className="size-4" /> Seret untuk melihat sekeliling. Tekan label untuk ke ruang lain.
          </p>
        </div>
        <div className="relative">
          <PanoViewer scene={scene} onNavigate={setCurrent} className="h-[68svh] min-h-[380px] w-full overflow-hidden rounded-2xl" />
          {hint && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 grid place-items-center">
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
      </div>
    </section>
  )
}
