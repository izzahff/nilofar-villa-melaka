import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Images, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Button, Empty, Input, PageLoader, Select, cx, useToast } from '../../components/ui'
import { api, friendlyError } from '../../lib/api'
import { DEMO_MEDIA } from '../../lib/demoMedia'
import { MEDIA_LABEL } from '../../lib/format'
import { useAsync } from '../../lib/hooks'
import { compressImage } from '../../lib/image'
import type { MediaCategory, MediaItem } from '../../lib/types'
import { PageHeader } from './AdminApp'

export default function MediaPage() {
  const toast = useToast()
  const { data, loading, reload, setData } = useAsync(() => api.listMedia(true), [])
  const [cat, setCat] = useState<MediaCategory>('luar')
  const [busy, setBusy] = useState<string | null>(null)
  const items = data ?? []

  async function upload(files: FileList) {
    let sort = items.length
    for (const [i, raw] of [...files].entries()) {
      setBusy(`Memuat naik ${i + 1}/${files.length}...`)
      try {
        if (raw.size > 15 * 1024 * 1024) throw new Error(`${raw.name} melebihi 15 MB`)
        const file = await compressImage(raw)
        const { url, key } = await api.uploadImage(file, 'gallery')
        await api.saveMedia({ url, r2_key: key, caption: raw.name.replace(/\.\w+$/, '').replace(/[-_]/g, ' '), category: cat, sort: sort++, visible: true })
      } catch (e) {
        toast(friendlyError(e), 'error')
      }
    }
    setBusy(null)
    reload()
  }

  async function importBundled() {
    setBusy('Mengimport gambar asal...')
    try {
      for (const [i, m] of DEMO_MEDIA.entries()) await api.saveMedia({ ...m, sort: items.length + i, visible: true })
      toast('Gambar asal diimport')
      reload()
    } catch (e) {
      toast(friendlyError(e), 'error')
    } finally {
      setBusy(null)
    }
  }

  async function patch(m: MediaItem, p: Partial<MediaItem>) {
    setData(items.map((x) => (x.id === m.id ? { ...x, ...p } : x)))
    try {
      await api.saveMedia({ ...m, ...p })
    } catch (e) {
      toast(friendlyError(e), 'error')
      reload()
    }
  }

  async function move(i: number, d: -1 | 1) {
    const j = i + d
    if (j < 0 || j >= items.length) return
    const a = items[i]
    const b = items[j]
    const next = [...items]
    next[i] = { ...b, sort: a.sort }
    next[j] = { ...a, sort: b.sort }
    if (a.sort === b.sort) {
      next[i].sort = i
      next[j].sort = j
    }
    setData(next)
    await Promise.all([api.saveMedia(next[i]), api.saveMedia(next[j])])
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Galeri"
        subtitle="Gambar di sini dipaparkan di laman web mengikut susunan. Gambar dimampatkan secara automatik."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={cat} onChange={(e) => setCat(e.target.value as MediaCategory)} className="h-11 w-auto">
              {Object.entries(MEDIA_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            <label className={cx('inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-forest px-5 text-sm font-medium text-white', busy && 'pointer-events-none opacity-60')}>
              <ImagePlus className="size-4" /> {busy ?? 'Muat naik'}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files?.length && upload(e.target.files)} />
            </label>
          </div>
        }
      />

      {items.length === 0 ? (
        <Empty
          icon={<Images className="size-8" />}
          title="Galeri masih kosong"
          text="Laman web sedang memaparkan 16 gambar asal. Import gambar asal untuk mula menyusun, atau muat naik gambar baru."
          action={
            <Button variant="outline" onClick={importBundled} loading={!!busy}>
              Import gambar asal
            </Button>
          }
        />
      ) : (
        <motion.div layout className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence>
            {items.map((m, i) => (
              <motion.div layout key={m.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={cx('card overflow-hidden', !m.visible && 'opacity-60')}>
                <div className="relative">
                  <img src={m.url} alt={m.caption ?? ''} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  <span className="absolute top-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white">#{i + 1}</span>
                  {!m.visible && <span className="absolute top-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white">Tersembunyi</span>}
                </div>
                <div className="space-y-2 p-2.5">
                  <Input value={m.caption ?? ''} onChange={(e) => setData(items.map((x) => (x.id === m.id ? { ...x, caption: e.target.value } : x)))} onBlur={(e) => patch(m, { caption: e.target.value })} className="h-9 py-1 text-[13px]" placeholder="Kapsyen" />
                  <Select value={m.category} onChange={(e) => patch(m, { category: e.target.value as MediaCategory })} className="h-9 py-1 text-[13px]">
                    {Object.entries(MEDIA_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                  <div className="flex justify-between">
                    <div className="flex">
                      <Icon onClick={() => move(i, -1)} disabled={i === 0} label="Naik">
                        <ArrowUp className="size-4" />
                      </Icon>
                      <Icon onClick={() => move(i, 1)} disabled={i === items.length - 1} label="Turun">
                        <ArrowDown className="size-4" />
                      </Icon>
                    </div>
                    <div className="flex">
                      <Icon onClick={() => patch(m, { visible: !m.visible })} label={m.visible ? 'Sembunyi' : 'Papar'}>
                        {m.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                      </Icon>
                      <Icon
                        label="Padam"
                        className="text-rose-600"
                        onClick={async () => {
                          if (!window.confirm('Padam gambar ini?')) return
                          try {
                            await api.deleteMedia(m)
                            reload()
                          } catch (e) {
                            toast(friendlyError(e), 'error')
                          }
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Icon>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}

function Icon({ children, label, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button title={label} aria-label={label} className={cx('grid size-8 place-items-center rounded-full text-forest hover:bg-sand disabled:opacity-30', className)} {...p}>
      {children}
    </button>
  )
}
