import { Box, Check, ImagePlus, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button, Modal, cx, useToast } from '../../components/ui'
import { api, friendlyError } from '../../lib/api'
import { DEMO_MEDIA } from '../../lib/demoMedia'
import { useAsync } from '../../lib/hooks'
import { PICKABLE, photoUrl } from '../../lib/house'
import { useSettings } from '../../lib/settings'

/** Admin card: choose which photos show for each room in the 3D house model. */
export function HousePhotos() {
  const toast = useToast()
  const { settings, reload } = useSettings()
  const { data: media } = useAsync(() => api.listMedia(true), [])
  const [photos, setPhotos] = useState<Record<string, string[]>>(settings.house_tour?.photos ?? {})
  const [picking, setPicking] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!dirty) setPhotos(settings.house_tour?.photos ?? {})
  }, [settings.house_tour, dirty])

  const library = useMemo(() => {
    const seen = new Set<string>()
    const out: { url: string; caption: string | null }[] = []
    for (const m of [...(media ?? []), ...DEMO_MEDIA]) {
      const u = photoUrl(m.url)
      if (seen.has(u)) continue
      seen.add(u)
      out.push({ url: m.url, caption: m.caption })
    }
    return out
  }, [media])

  const update = (id: string, list: string[]) => {
    setPhotos((p) => ({ ...p, [id]: list }))
    setDirty(true)
  }

  async function save() {
    setBusy(true)
    try {
      await api.saveSetting('house_tour', { ...settings.house_tour, photos })
      await reload()
      setDirty(false)
      toast('Gambar bilik disimpan')
    } catch (e) {
      toast(friendlyError(e), 'error')
    } finally {
      setBusy(false)
    }
  }

  const room = PICKABLE.find((r) => r.id === picking)
  const chosen = picking ? (photos[picking] ?? []) : []

  return (
    <section className="card mb-8 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-forest">
            <Box className="size-5 text-gold-dark" /> Pelan 3D: gambar setiap ruang
          </h2>
          <p className="mt-1 text-sm text-muted">Gambar ini muncul apabila tetamu menekan ruang pada model 3D rumah. Pilih dari galeri media.</p>
        </div>
        <Button onClick={save} loading={busy} disabled={!dirty}>
          Simpan
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {PICKABLE.map((r) => {
          const list = photos[r.id] ?? []
          return (
            <div key={r.id} className="rounded-xl bg-ivory p-3 ring-1 ring-sand-dark">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-forest">{r.title}</p>
                <span className="shrink-0 text-xs text-muted">{list.length} gambar</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {list.map((u) => (
                  <div key={u} className="group relative">
                    <img src={photoUrl(u)} alt="" className="size-16 rounded-lg object-cover" />
                    <button
                      onClick={() => update(r.id, list.filter((x) => x !== u))}
                      className="absolute -top-1.5 -right-1.5 grid size-6 place-items-center rounded-full bg-rose text-white shadow"
                      aria-label="Buang gambar"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
                <button onClick={() => setPicking(r.id)} className="grid size-16 place-items-center rounded-lg border-2 border-dashed border-sand-dark text-muted hover:border-gold hover:text-gold-dark" aria-label={`Tambah gambar ${r.title}`}>
                  <ImagePlus className="size-5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={!!room} onClose={() => setPicking(null)} title={room ? `Gambar: ${room.title}` : ''} footer={<Button onClick={() => setPicking(null)}>Siap</Button>}>
        <p className="mb-3 text-sm text-muted">Tekan gambar untuk pilih atau nyahpilih. Muat naik gambar baru di halaman Media.</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {library.map((m) => {
            const on = chosen.some((c) => photoUrl(c) === photoUrl(m.url))
            return (
              <button
                key={m.url}
                onClick={() => picking && update(picking, on ? chosen.filter((c) => photoUrl(c) !== photoUrl(m.url)) : [...chosen, m.url])}
                className={cx('relative overflow-hidden rounded-lg ring-2 transition', on ? 'ring-gold' : 'ring-transparent hover:ring-sand-dark')}
                title={m.caption ?? ''}
              >
                <img src={photoUrl(m.url)} alt={m.caption ?? ''} loading="lazy" className="aspect-square w-full object-cover" />
                {on && (
                  <span className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-gold text-forest-dark">
                    <Check className="size-4" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </Modal>
    </section>
  )
}
