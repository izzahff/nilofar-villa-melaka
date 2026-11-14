import { Compass, Crosshair, ImagePlus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PanoViewer } from '../../components/PanoViewer'
import { Button, Empty, Field, Input, Modal, PageLoader, Select, cx, useToast } from '../../components/ui'
import { api, friendlyError } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import { compressImage } from '../../lib/image'
import type { Hotspot, TourScene } from '../../lib/types'
import { PageHeader } from './AdminApp'
import { HousePhotos } from './HousePhotos'
import { SplatScan } from './SplatScan'

export default function TourAdmin() {
  const toast = useToast()
  const { data, loading, reload } = useAsync(() => api.listTourScenes(), [])
  const scenes = data ?? []
  const [selected, setSelected] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [picking, setPicking] = useState(false)
  const [draft, setDraft] = useState<{ yaw: number; pitch: number } | null>(null)
  const [hs, setHs] = useState({ target_id: '', label: '' })

  useEffect(() => {
    if (!selected && scenes.length) setSelected(scenes[0].id)
  }, [scenes, selected])

  const scene = scenes.find((s) => s.id === selected) ?? null

  async function addScene() {
    if (!file || !name.trim()) return
    setBusy(true)
    try {
      const small = await compressImage(file, 6000, 0.85)
      const { url, key } = await api.uploadImage(small, 'tour')
      const s = await api.saveTourScene({ name: name.trim(), image_url: url, r2_key: key, sort: scenes.length, hotspots: [], initial_yaw: 0 })
      await reload()
      setSelected(s.id)
      setAdding(false)
      setName('')
      setFile(null)
      toast('Ruang ditambah')
    } catch (e) {
      toast(friendlyError(e), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function saveScene(s: TourScene, patch: Partial<TourScene>) {
    try {
      await api.saveTourScene({ ...s, ...patch })
      await reload()
    } catch (e) {
      toast(friendlyError(e), 'error')
    }
  }

  async function addHotspot() {
    if (!scene || !draft || !hs.target_id) return
    const target = scenes.find((s) => s.id === hs.target_id)
    const h: Hotspot = { ...draft, target_id: hs.target_id, label: hs.label || target?.name || 'Ruang' }
    await saveScene(scene, { hotspots: [...scene.hotspots, h] })
    setDraft(null)
    setPicking(false)
    setHs({ target_id: '', label: '' })
    toast('Hotspot ditambah')
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Tour maya"
        subtitle="Tetamu berjalan dalam model 3D rumah, atau imbasan sebenar jika ada. Untuk tab 360°, muat naik gambar 360 (equirectangular, nisbah 2:1) bagi setiap ruang, kemudian sambungkan dengan hotspot."
        actions={
          <Button icon={<ImagePlus className="size-4" />} onClick={() => setAdding(true)}>
            Tambah ruang
          </Button>
        }
      />

      <HousePhotos />
      <SplatScan />

      <h2 className="mb-3 font-display text-2xl font-semibold text-forest">Ruang 360°</h2>
      {scenes.length === 0 ? (
        <Empty
          icon={<Compass className="size-8" />}
          title="Belum ada ruang 360"
          text="Ambil gambar 360 dengan kamera 360 (contoh Insta360 atau Ricoh Theta), atau pinjam/sewa sehari. Eksport sebagai equirectangular 2:1 dan muat naik di sini. Sehingga itu, tetamu melihat pelan 3D rumah."
          action={<Button onClick={() => setAdding(true)}>Tambah ruang pertama</Button>}
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px] [&>*]:min-w-0">
          <div>
            {scene && (
              <div className="relative">
                <PanoViewer
                  key={scene.id}
                  scene={scene}
                  onNavigate={(id) => !picking && setSelected(id)}
                  onPick={picking ? (p) => setDraft(p) : undefined}
                  className={cx('h-[58vh] min-h-[340px] w-full overflow-hidden rounded-2xl', picking && 'ring-4 ring-gold')}
                />
                {picking && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1.5 text-sm font-medium text-forest-dark shadow-lg">
                    {draft ? 'Kedudukan dipilih. Lengkapkan di sebelah.' : 'Tekan pada gambar untuk letak hotspot'}
                  </div>
                )}
              </div>
            )}
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-2">
              {scenes.map((s) => (
                <button key={s.id} onClick={() => setSelected(s.id)} className={cx('shrink-0 overflow-hidden rounded-xl ring-2', s.id === selected ? 'ring-gold' : 'ring-transparent opacity-70')}>
                  <div className="h-16 w-28 bg-cover bg-center" style={{ backgroundImage: `url(${s.image_url})` }} />
                  <p className="bg-white px-2 py-1 text-xs">{s.name}</p>
                </button>
              ))}
            </div>
          </div>

          {scene && (
            <aside className="card space-y-4 p-5">
              <Field label="Nama ruang">
                <Input defaultValue={scene.name} key={scene.id + 'n'} onBlur={(e) => e.target.value !== scene.name && saveScene(scene, { name: e.target.value })} />
              </Field>
              <Field label="Arah mula (darjah)" hint="0 hingga 360, arah pandangan pertama">
                <Input
                  type="number"
                  key={scene.id + 'y'}
                  defaultValue={Math.round((Number(scene.initial_yaw) * 180) / Math.PI)}
                  onBlur={(e) => saveScene(scene, { initial_yaw: (Number(e.target.value) * Math.PI) / 180 })}
                />
              </Field>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="label !mb-0">Hotspot</p>
                  <Button
                    size="sm"
                    variant={picking ? 'gold' : 'soft'}
                    icon={<Crosshair className="size-4" />}
                    onClick={() => {
                      setPicking(!picking)
                      setDraft(null)
                    }}
                    disabled={scenes.length < 2}
                  >
                    {picking ? 'Batal' : 'Tambah'}
                  </Button>
                </div>
                {scenes.length < 2 && <p className="text-xs text-muted">Tambah sekurang-kurangnya 2 ruang untuk buat hotspot.</p>}
                {picking && draft && (
                  <div className="mb-3 space-y-2 rounded-xl bg-gold/15 p-3">
                    <Select value={hs.target_id} onChange={(e) => setHs({ ...hs, target_id: e.target.value })}>
                      <option value="">Pergi ke ruang...</option>
                      {scenes
                        .filter((s) => s.id !== scene.id)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </Select>
                    <Input placeholder="Label (pilihan)" value={hs.label} onChange={(e) => setHs({ ...hs, label: e.target.value })} />
                    <Button size="sm" className="w-full" disabled={!hs.target_id} onClick={addHotspot}>
                      Simpan hotspot
                    </Button>
                  </div>
                )}
                <ul className="divide-y divide-sand">
                  {scene.hotspots.map((h, i) => (
                    <li key={i} className="flex items-center gap-2 py-2 text-sm">
                      <span className="flex-1">
                        {h.label} <span className="text-xs text-muted">→ {scenes.find((s) => s.id === h.target_id)?.name ?? '?'}</span>
                      </span>
                      <button onClick={() => saveScene(scene, { hotspots: scene.hotspots.filter((_, j) => j !== i) })} className="grid size-8 place-items-center rounded-full text-rose-600 hover:bg-rose-50" aria-label="Buang">
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                variant="ghost"
                className="w-full text-rose-600"
                icon={<Trash2 className="size-4" />}
                onClick={async () => {
                  if (!window.confirm(`Padam ruang ${scene.name}?`)) return
                  await api.deleteTourScene(scene)
                  setSelected(null)
                  reload()
                }}
              >
                Padam ruang
              </Button>
            </aside>
          )}
        </div>
      )}

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Tambah ruang 360"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Batal
            </Button>
            <Button onClick={addScene} loading={busy} disabled={!file || !name.trim()}>
              Muat naik
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nama ruang">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Ruang tamu" />
          </Field>
          <Field label="Gambar 360" hint="Format equirectangular 2:1, JPG atau WebP">
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-white" />
          </Field>
        </div>
      </Modal>
    </div>
  )
}
