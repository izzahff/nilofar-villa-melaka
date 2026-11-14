/**
 * Nilofar Villa Melaka layout, measured from the developer's Brittany floor
 * plan (Taman Anjung Gapam, 50 x 80 ft, 1.5 storey). Sizes are approximate.
 *
 * Units are millimetres. Origin is the back left inside corner of the ground
 * floor. x runs to the right, z runs from the back of the house to the front.
 */

export type RoomKind = 'bedroom' | 'bath' | 'living' | 'kitchen' | 'dining' | 'stairs' | 'hall' | 'porch' | 'terrace' | 'garden' | 'pool'

export interface RoomDef {
  id: string
  /** Label on the developer floor plan */
  plan: string
  /** Name shown to guests */
  title: string
  floor: 0 | 1
  x: number
  z: number
  w: number
  d: number
  kind: RoomKind
  /** Index into settings.content.rooms for bedrooms */
  roomIndex?: number
  bed?: 'king' | 'queen'
  /** Short Malay description for rooms that are not bedrooms */
  info?: string
  /** No walls (outdoor areas) */
  open?: boolean
  /** Hidden from labels (small connecting spaces) */
  quiet?: boolean
}

export const GROUND = { w: 8530, d: 14780 }
export const UPPER = { w: 3960, d: 9900, x: 1410, z: 4500 }
export const FLOOR_HEIGHT = 3200
export const WALL_HEIGHT = 1050

const U = (r: Omit<RoomDef, 'floor' | 'x' | 'z'> & { x: number; z: number }): RoomDef => ({ ...r, floor: 1, x: r.x + UPPER.x, z: r.z + UPPER.z })

export const ROOMS: RoomDef[] = [
  // Ground floor
  { id: 'kitchen', plan: 'Kitchen', title: 'Dapur', floor: 0, x: 0, z: 1064, w: 3555, d: 1957, kind: 'kitchen', info: 'Dapur gaya English dengan dapur berdiri dan oven, peti ais 2 pintu, penapis air Coway, periuk nasi dan peralatan memasak lengkap.' },
  { id: 'bath2', plan: 'Bath 2', title: 'Bilik air 2', floor: 0, x: 3555, z: 1064, w: 1815, d: 1957, kind: 'bath', info: 'Bilik air di belakang, berdekatan dapur dan Bilik 5.' },
  { id: 'dining2', plan: 'Dining 2', title: 'Ruang makan 2', floor: 0, x: 0, z: 3021, w: 5370, d: 2527, kind: 'dining', info: 'Ruang makan kedua bersebelahan dapur, sesuai untuk hidangan keluarga besar.' },
  { id: 'bed2', plan: 'Bedroom 2', title: 'Bilik 5', floor: 0, x: 5370, z: 1064, w: 3160, d: 2964, kind: 'bedroom', roomIndex: 4, bed: 'queen' },
  { id: 'bed3', plan: 'Bedroom 3', title: 'Bilik 3', floor: 0, x: 5370, z: 4028, w: 3160, d: 2926, kind: 'bedroom', roomIndex: 2, bed: 'queen' },
  { id: 'bed4', plan: 'Bedroom 4', title: 'Bilik 4', floor: 0, x: 0, z: 5548, w: 2690, d: 3116, kind: 'bedroom', roomIndex: 3, bed: 'queen' },
  { id: 'stairs', plan: 'Stairs', title: 'Tangga', floor: 0, x: 2690, z: 5548, w: 2680, d: 1406, kind: 'stairs', info: 'Tangga ke ruang keluarga dan Bilik 1 di tingkat atas.', quiet: true },
  { id: 'bath1', plan: 'Bath 1', title: 'Bilik air 1', floor: 0, x: 0, z: 8664, w: 1810, d: 1957, kind: 'bath', info: 'Bilik air bersebelahan bilik master.' },
  { id: 'hall', plan: 'Hall', title: 'Laluan', floor: 0, x: 1810, z: 8664, w: 2160, d: 1957, kind: 'hall', quiet: true },
  { id: 'master', plan: 'Master Bedroom', title: 'Bilik 2 (master)', floor: 0, x: 0, z: 10621, w: 3970, d: 4159, kind: 'bedroom', roomIndex: 1, bed: 'king' },
  { id: 'living', plan: 'Living / Dining 1', title: 'Ruang tamu & makan', floor: 0, x: 3970, z: 6954, w: 4560, d: 7826, kind: 'living', info: 'Ruang tamu utama dengan 2 aircond, Smart TV 55 inci, karaoke, sofa dan kerusi wingback, bersambung terus ke ruang makan.' },
  { id: 'terrace', plan: 'Terrace', title: 'Teres', floor: 0, x: 8530, z: 6688, w: 1910, d: 3553, kind: 'terrace', open: true, info: 'Teres tepi rumah dari ruang makan, menghala ke laman.' },
  { id: 'porch', plan: 'Car Porch', title: 'Garaj & pintu masuk', floor: 0, x: 2690, z: 14780, w: 5840, d: 4866, kind: 'porch', open: true, info: 'Garaj berbumbung untuk 2 kereta, pagar automatik. 8 hingga 10 minit dari Plaza Tol Ayer Keroh.' },
  { id: 'garden', plan: 'Garden', title: 'Laman & patio', floor: 0, x: 10700, z: 10600, w: 3800, d: 9000, kind: 'garden', open: true, info: 'Laman berumput dengan bangku, payung patio dan set BBQ (arang tidak disediakan).' },
  { id: 'pool', plan: 'Pool', title: 'Kolam renang', floor: 0, x: 9200, z: 600, w: 5490, d: 2130, kind: 'pool', open: true, info: 'Kolam peribadi 18 x 7 kaki dengan air terjun, dalam 4 kaki. Tiada lifeguard, kanak-kanak mesti diawasi.' },

  // Upper floor
  U({ id: 'family', plan: 'Family', title: 'Ruang keluarga atas', x: 0, z: 0, w: 3960, d: 4260, kind: 'living', info: 'Ruang tamu tingkat atas untuk berehat dan bermain.' }),
  U({ id: 'bath3', plan: 'Bath 3', title: 'Bilik air 3', x: 0, z: 4260, w: 1780, d: 2490, kind: 'bath', info: 'Bilik air tingkat atas, berdekatan Bilik 1.' }),
  U({ id: 'landing', plan: 'Landing', title: 'Laluan atas', x: 1780, z: 4260, w: 2180, d: 2490, kind: 'hall', quiet: true }),
  U({ id: 'bed5', plan: 'Bedroom 5', title: 'Bilik 1 (atas)', x: 0, z: 6750, w: 3960, d: 3150, kind: 'bedroom', roomIndex: 0, bed: 'king' }),
]

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r])) as Record<string, RoomDef>

/** Rooms guests can pick (labels shown). */
export const PICKABLE = ROOMS.filter((r) => !r.quiet)


/** Default photo for each room, from the photos bundled with the site. */

/** Resolves a stored photo path for the current base URL (GitHub Pages builds use a sub path). */
export function photoUrl(u: string) {
  if (/^(https?:|data:|blob:)/.test(u)) return u
  const base = import.meta.env.BASE_URL
  if (base !== '/' && u.startsWith(base)) return u
  return import.meta.env.BASE_URL.replace(/\/$/, '') + (u.startsWith('/') ? u : '/' + u)
}
