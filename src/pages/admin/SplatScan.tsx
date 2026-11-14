import { Bookmark, ScanLine, Trash2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { TourStage } from '../../components/tour/TourStage'
import type { TourViewerHandle } from '../../components/tour/TourViewer'
import { Button, Field, Input, useToast } from '../../components/ui'
import { api, friendlyError } from '../../lib/api'
import { useSettings } from '../../lib/settings'
import type { SavedView, SplatSettings } from '../../lib/types'

const EXT = ['spz', 'ply', 'splat', 'ksplat', 'sog']
const MAX_MB = 90
const EMPTY: SplatSettings = { url: '', flip: true, scale: 1, y: 0 }

/** Admin card: add a Gaussian splat scan of the villa and save named views inside it. */
export function SplatScan() {
  const toast = useToast()
  const { settings, reload } = useSettings()
  const tour = settings.house_tour
  const [splat, setSplat] = useState<SplatSettings>(tour?.splat ?? EMPTY)
  const [views, setViews] = useState<SavedView[]>(tour?.views ?? [])
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [name, setName] = useState('')
  const [preview, setPreview] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const stage = useRef<TourViewerHandle>(null)

  useEffect(() => {
    if (dirty) return
    setSplat(tour?.splat ?? EMPTY)
    setViews(tour?.views ?? [])
  }, [tour, dirty])

  const patch = (p: Partial<SplatSettings>) => {
    setSplat((s) => ({ ...s, ...p }))
    setDirty(true)
  }

  async function onFile(f: File | undefined) {
    if (!f) return
    const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
    if (!EXT.includes(ext)) return toast('Hanya fail .spz, .ply, .splat, .ksplat atau .sog', 'error')
    if (f.size > MAX_MB * 1024 * 1024) return toast(`Fail melebihi ${MAX_MB} MB. Eksport sebagai .spz atau tampal pautan.`, 'error')
    setUploading(true)
    try {
      const old = splat.key
      const up = await api.uploadSplat(f)
      patch({ url: up.url, key: up.key, type: ext === 'sog' ? undefined : ext, sizeMb: Math.max(1, Math.round(f.size / 1048576)) })
      setPreview(true)
      if (old) await api.deleteImage(old).catch(() => undefined)
      toast('Imbasan dimuat naik. Semak pratonton, kemudian Simpan.')
    } catch (e) {
      toast(friendlyError(e), 'error')
    } finally {
      setUploading(false)
      if (file.current) file.current.value = ''
    }
  }

  async function save(next?: { splat: SplatSettings | null; views: SavedView[] }) {
    setBusy(true)
    try {
      const s = next ? next.splat : splat.url.trim() ? { ...splat, url: splat.url.trim() } : null
      await api.saveSetting('house_tour', { ...tour, splat: s, views: next ? next.views : views })
      await reload()
      setDirty(false)
      toast(s ? 'Imbasan 3D disimpan' : 'Imbasan 3D dibuang. Tetamu melihat model rumah.')
    } catch (e) {
      toast(friendlyError(e), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!window.confirm('Buang imbasan 3D dan semua pandangan tersimpan?')) return
    if (splat.key) await api.deleteImage(splat.key).catch(() => undefined)
    setSplat(EMPTY)
    setViews([])
    setPreview(false)
    await save({ splat: null, views: [] })
  }

  function addView() {
    const v = stage.current?.getView()
    if (!v || !name.trim()) return
    setViews((l) => [...l, { name: name.trim(), ...v }])
    setName('')
    setDirty(true)
  }

  const has = !!splat.url.trim()

  return (
    <section className="card mb-8 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-forest">
            <ScanLine className="size-5 text-gold-dark" /> Imbasan 3D sebenar (Gaussian splat)
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            Pilihan. Imbas rumah dengan aplikasi percuma di telefon (contoh Scaniverse atau Luma), eksport sebagai .spz atau .ply, dan muat naik di sini. Tetamu akan berjalan dalam imbasan sebenar menggantikan model. Tanpa imbasan,
            model rumah dipaparkan.
          </p>
        </div>
        <div className="flex gap-2">
          {tour?.splat?.url && (
            <Button variant="ghost" onClick={remove} disabled={busy}>
              <Trash2 className="size-4" /> Buang
            </Button>
          )}
          <Button onClick={() => save()} loading={busy} disabled={!dirty}>
            Simpan
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <div className="space-y-3">
          <Field label="Pautan fail imbasan" hint="Tampal pautan terus ke fail, atau muat naik (maksimum 90 MB).">
            <Input value={splat.url.startsWith('blob:') ? '(fail dimuat naik dalam mod demo)' : splat.url} onChange={(e) => patch({ url: e.target.value, key: null, type: undefined })} placeholder="https://.../rumah.spz" />
          </Field>
          <input ref={file} type="file" accept=".spz,.ply,.splat,.ksplat,.sog" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => file.current?.click()} loading={uploading}>
              <Upload className="size-4" /> Muat naik imbasan
            </Button>
            {has && (
              <Button variant="ghost" onClick={() => setPreview((p) => !p)}>
                {preview ? 'Tutup pratonton' : 'Pratonton'}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Skala">
              <Input type="number" step="0.1" min="0.01" value={splat.scale} onChange={(e) => patch({ scale: Number(e.target.value) || 1 })} />
            </Field>
            <Field label="Tinggi (m)">
              <Input type="number" step="0.1" value={splat.y} onChange={(e) => patch({ y: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Saiz (MB)">
              <Input type="number" min="0" value={splat.sizeMb ?? ''} onChange={(e) => patch({ sizeMb: Number(e.target.value) || undefined })} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={splat.flip} onChange={(e) => patch({ flip: e.target.checked })} className="size-4 accent-forest" />
            Terbalikkan (tanda ini jika imbasan nampak songsang)
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-forest">Pandangan tersimpan</p>
          {views.length === 0 ? (
            <p className="rounded-xl bg-ivory p-3 text-sm text-muted ring-1 ring-sand-dark">Belum ada. Buka pratonton, bergerak ke tempat yang cantik, taip nama dan tekan Simpan pandangan.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {views.map((v, i) => (
                <li key={`${v.name}${i}`} className="flex items-center gap-1 rounded-full bg-ivory py-1 pr-1 pl-3 text-sm ring-1 ring-sand-dark">
                  {v.name}
                  <button onClick={() => { setViews((l) => l.filter((_, k) => k !== i)); setDirty(true) }} className="grid size-6 place-items-center rounded-full text-rose hover:bg-rose/10" aria-label={`Buang ${v.name}`}>
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {preview && has && (
            <div className="mt-3 flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama pandangan, contoh Ruang tamu" onKeyDown={(e) => e.key === 'Enter' && addView()} />
              <Button variant="outline" onClick={addView} disabled={!name.trim()}>
                <Bookmark className="size-4" /> Simpan pandangan
              </Button>
            </div>
          )}
        </div>
      </div>

      {preview && has && (
        <div className="mt-4">
          <TourStage ref={stage} photos={tour?.photos ?? {}} splat={splat} views={views} autoStart key={`${splat.url}|${splat.flip}|${splat.scale}|${splat.y}`} />
        </div>
      )}
    </section>
  )
}
