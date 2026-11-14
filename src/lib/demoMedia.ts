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
  { url: img('kolam-renang'), caption: 'Kolam renang peribadi di tepi rumah', category: 'luar' },
  { url: img('laman-belakang'), caption: 'Laman berumput dengan payung patio', category: 'luar' },
  { url: img('patio-jubin'), caption: 'Patio berjubin di tepi laman', category: 'luar' },
  { url: img('laman-depan'), caption: 'Laman depan berpagar', category: 'luar' },
  { url: img('laman-sisi'), caption: 'Laman sisi sepanjang rumah', category: 'luar' },
  { url: img('laman-tepi'), caption: 'Laman tepi dan longkang', category: 'luar' },
  { url: img('laman-garaj'), caption: 'Laman bersebelahan garaj', category: 'luar' },
  { url: img('laman-sudut'), caption: 'Sudut taman berbunga', category: 'luar' },
  { url: img('pintu-sisi'), caption: 'Pintu pagar sisi', category: 'luar' },
  { url: img('ruang-makan'), caption: 'Meja makan kayu', category: 'ruang-tamu' },
  { url: img('dapur-memasak'), caption: 'Dapur gas dan oven', category: 'dapur' },
  { url: img('tangga'), caption: 'Tangga kayu ke tingkat atas', category: 'ruang-tamu' },
  { url: img('bilik-air'), caption: 'Bilik air dengan pemanas air', category: 'bilik' },
  { url: img('ruang-atas'), caption: 'Ruang keluarga tingkat atas', category: 'ruang-tamu' },
]

export const HERO_IMAGE = img('luar-depan')
export const IMG = {
  exterior: img('luar-depan'),
  night: img('luar-malam'),
  gate: img('luar-pagar'),
  garden: img('taman'),
  patio: img('patio'),
  pool: img('kolam-renang'),
  lawn: img('laman-belakang'),
  living: img('ruang-tamu'),
  chairs: img('ruang-tamu-kerusi'),
  kitchen: img('dapur'),
  master: img('bilik-king'),
  master2: img('bilik-king-2'),
  chandelier: img('bilik-chandelier'),
  queen: img('bilik-queen'),
  fan: img('bilik-kipas'),
}
