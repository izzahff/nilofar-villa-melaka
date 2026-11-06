import type { MediaItem } from './types'

/**
 * Photos bundled with the site in public/images. They show in the gallery
 * until the admin uploads photos to the media library, and seed demo mode.
 */
type Bundled = Pick<MediaItem, 'url' | 'caption' | 'category'>

const img = (name: string) => `${import.meta.env.BASE_URL}images/${name}.webp`

export const DEMO_MEDIA: Bundled[] = [
  { url: img('luar-depan'), caption: 'Banglo gaya English Tudor', category: 'luar' },
  { url: img('ruang-tamu'), caption: 'Ruang tamu yang luas', category: 'ruang-tamu' },
  { url: img('bilik-king'), caption: 'Bilik utama katil King', category: 'bilik' },
  { url: img('dapur'), caption: 'Dapur gaya English lengkap dengan oven', category: 'dapur' },
  { url: img('luar-malam'), caption: 'Suasana waktu malam', category: 'luar' },
  { url: img('bilik-chandelier'), caption: 'Bilik dengan chandelier', category: 'bilik' },
  { url: img('ruang-tamu-kerusi'), caption: 'Sudut santai wingback', category: 'ruang-tamu' },
  { url: img('taman'), caption: 'Laman depan berumput', category: 'luar' },
  { url: img('bilik-king-2'), caption: 'Bilik katil King', category: 'bilik' },
  { url: img('dapur-pinggan'), caption: 'Pinggan mangkuk disediakan', category: 'dapur' },
  { url: img('patio'), caption: 'Meja santai di laman', category: 'luar' },
  { url: img('bilik-kipas'), caption: 'Bilik Queen dengan kipas dan aircond', category: 'bilik' },
  { url: img('dapur-periuk'), caption: 'Periuk, kuali dan pengukus', category: 'dapur' },
  { url: img('bilik-queen'), caption: 'Bilik katil Queen', category: 'bilik' },
  { url: img('luar-pagar'), caption: 'Pintu masuk dan pagar', category: 'luar' },
  { url: img('dapur-cawan'), caption: 'Cawan, periuk nasi dan cerek', category: 'dapur' },
]

export const HERO_IMAGE = img('luar-depan')
export const IMG = {
  exterior: img('luar-depan'),
  night: img('luar-malam'),
  gate: img('luar-pagar'),
  garden: img('taman'),
  patio: img('patio'),
  living: img('ruang-tamu'),
  chairs: img('ruang-tamu-kerusi'),
  kitchen: img('dapur'),
  master: img('bilik-king'),
  master2: img('bilik-king-2'),
  chandelier: img('bilik-chandelier'),
  queen: img('bilik-queen'),
  fan: img('bilik-kipas'),
}
