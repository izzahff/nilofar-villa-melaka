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
  { id: 'corridor', plan: '(unlabelled)', title: 'Koridor', floor: 0, x: 2690, z: 6954, w: 1280, d: 1710, kind: 'hall', quiet: true },
  { id: 'bath1', plan: 'Bath 1', title: 'Bilik air 1', floor: 0, x: 0, z: 8664, w: 1810, d: 1957, kind: 'bath', info: 'Bilik air bersebelahan bilik master.' },
  { id: 'hall', plan: 'Hall', title: 'Laluan', floor: 0, x: 1810, z: 8664, w: 2160, d: 1957, kind: 'hall', quiet: true },
  { id: 'master', plan: 'Master Bedroom', title: 'Bilik 2 (master)', floor: 0, x: 0, z: 10621, w: 3970, d: 4159, kind: 'bedroom', roomIndex: 1, bed: 'king' },
  { id: 'living', plan: 'Living / Dining 1', title: 'Ruang tamu & makan', floor: 0, x: 3970, z: 6954, w: 4560, d: 7826, kind: 'living', info: 'Ruang tamu utama dengan 2 aircond, Smart TV 55 inci, karaoke, sofa dan kerusi wingback, bersambung terus ke ruang makan.' },
  { id: 'terrace', plan: 'Terrace', title: 'Teres', floor: 0, x: 8530, z: 6688, w: 1910, d: 3553, kind: 'terrace', open: true, info: 'Teres tepi rumah dari ruang makan, menghala ke laman.' },
  { id: 'porch', plan: 'Car Porch', title: 'Garaj & pintu masuk', floor: 0, x: 2690, z: 14780, w: 5840, d: 4866, kind: 'porch', open: true, info: 'Garaj berbumbung untuk 2 kereta, pagar automatik. 8 hingga 10 minit dari Plaza Tol Ayer Keroh.' },
  { id: 'garden', plan: 'Garden', title: 'Laman & patio', floor: 0, x: 10600, z: 3000, w: 4000, d: 9600, kind: 'garden', open: true, info: 'Laman berumput di sisi rumah dengan patio berjubin, payung, bangku dan set BBQ (arang tidak disediakan). Berpagar penuh.' },
  { id: 'pool', plan: 'Pool', title: 'Kolam renang', floor: 0, x: 1200, z: -2000, w: 5490, d: 2130, kind: 'pool', open: true, info: 'Kolam peribadi 18 x 7 kaki dengan air terjun, dalam 4 kaki, di antara rumah dan tembok tinggi untuk privasi. Lantai batu kelikir. Tiada lifeguard, kanak-kanak mesti diawasi.' },

  // Upper floor
  U({ id: 'family', plan: 'Family', title: 'Ruang keluarga atas', x: 0, z: 0, w: 3960, d: 4260, kind: 'living', info: 'Ruang tamu tingkat atas untuk berehat dan bermain.' }),
  U({ id: 'bath3', plan: 'Bath 3', title: 'Bilik air 3', x: 0, z: 4260, w: 1780, d: 2490, kind: 'bath', info: 'Bilik air tingkat atas, berdekatan Bilik 1.' }),
  U({ id: 'landing', plan: 'Landing', title: 'Laluan atas', x: 1780, z: 4260, w: 2180, d: 2490, kind: 'hall', quiet: true }),
  U({ id: 'bed5', plan: 'Bedroom 5', title: 'Bilik 1 (atas)', x: 0, z: 6750, w: 3960, d: 3150, kind: 'bedroom', roomIndex: 0, bed: 'king' }),
]

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r])) as Record<string, RoomDef>

/** Rooms guests can pick (labels shown). */
export const PICKABLE = ROOMS.filter((r) => !r.quiet)


/** Opening in a wall. `axis` is the direction the wall runs: 'x' walls sit at a fixed z. */
export interface DoorDef {
  floor: 0 | 1
  axis: 'x' | 'z'
  at: number
  from: number
  to: number
}

const D = (floor: 0 | 1, axis: 'x' | 'z', at: number, from: number, to: number): DoorDef => ({ floor, axis, at, from, to })

export const DOORS: DoorDef[] = [
  D(0, 'x', 14780, 5200, 6400), // front door, porch to living
  D(0, 'z', 3970, 8900, 10400), // living to hall, open arch
  D(0, 'z', 3970, 7100, 8500), // living to corridor
  D(0, 'z', 1810, 9300, 10100), // hall to bath 1
  D(0, 'x', 10621, 2500, 3400), // hall to master
  D(0, 'x', 8664, 2700, 3900), // corridor to hall
  D(0, 'z', 2690, 7300, 8100), // corridor to bedroom 4
  D(0, 'x', 6954, 4300, 5370), // living to foot of stairs
  D(0, 'x', 6954, 2750, 3600), // corridor to the way under the stairs
  D(0, 'x', 5548, 2750, 3600), // under the stairs to dining 2
  D(0, 'x', 3021, 500, 2800), // dining 2 to kitchen, open
  D(0, 'x', 3021, 4000, 4800), // dining 2 to bath 2
  D(0, 'z', 5370, 3100, 3900), // dining 2 to bedroom 5
  D(0, 'x', 6954, 7400, 8300), // living to bedroom 3
  D(0, 'z', 8530, 7200, 9800), // living to terrace, sliding door
  D(0, 'x', 1064, 2600, 3400), // kitchen back door
  D(1, 'x', 8760, 3400, 4600), // family room to landing
  D(1, 'z', 3190, 9400, 10200), // landing to bath 3
  D(1, 'x', 11250, 3600, 4500), // landing to bedroom 1
]

/** The stair void (mm). Steps rise from the living room side (east, x max) to the upper family room (west). */
export const STAIRS = { x0: 2690, x1: 5370, z0: 5548, z1: 6954 }

export interface ViewPoint {
  id: string
  title: string
  /** Room the view belongs to, for photo frames */
  room?: string
  floor: 0 | 1
  /** Eye position and look target in mm */
  pos: [number, number]
  look: [number, number]
}

export const VIEWPOINTS: ViewPoint[] = [
  { id: 'v-living', title: 'Ruang tamu', room: 'living', floor: 0, pos: [5000, 14100], look: [6600, 9000] },
  { id: 'v-dining', title: 'Ruang makan', floor: 0, pos: [8000, 11800], look: [5200, 7800] },
  { id: 'v-kitchen', title: 'Dapur', room: 'kitchen', floor: 0, pos: [3000, 5000], look: [1400, 1700] },
  { id: 'v-dining2', title: 'Ruang makan 2', room: 'dining2', floor: 0, pos: [5000, 5250], look: [700, 3700] },
  { id: 'v-master', title: 'Bilik 2 (master)', room: 'master', floor: 0, pos: [3500, 11000], look: [1200, 13800] },
  { id: 'v-bed3', title: 'Bilik 3', room: 'bed3', floor: 0, pos: [8100, 6600], look: [6000, 4500] },
  { id: 'v-bed4', title: 'Bilik 4', room: 'bed4', floor: 0, pos: [2400, 8300], look: [700, 5900] },
  { id: 'v-bed2', title: 'Bilik 5', room: 'bed2', floor: 0, pos: [5700, 3800], look: [7800, 1500] },
  { id: 'v-stairs', title: 'Tangga', floor: 0, pos: [5900, 8600], look: [3600, 6100] },
  { id: 'v-family', title: 'Ruang keluarga atas', room: 'family', floor: 1, pos: [2000, 7900], look: [4600, 5000] },
  { id: 'v-bed5', title: 'Bilik 1 (atas)', room: 'bed5', floor: 1, pos: [4900, 11600], look: [2200, 13900] },
  { id: 'v-terrace', title: 'Teres', room: 'terrace', floor: 0, pos: [9900, 10000], look: [9100, 6900] },
  { id: 'v-garden', title: 'Laman', room: 'garden', floor: 0, pos: [12900, 13800], look: [11800, 4200] },
  { id: 'v-pool', title: 'Kolam renang', room: 'pool', floor: 0, pos: [8400, -900], look: [1500, -900] },
  { id: 'v-porch', title: 'Garaj', room: 'porch', floor: 0, pos: [5600, 20400], look: [5600, 14600] },
]

/** Wall segment in metres. */
export interface WallSeg {
  floor: 0 | 1
  x1: number
  z1: number
  x2: number
  z2: number
  /** True when one side of the wall is outside the house */
  exterior: boolean
}

/** True when a point (mm) is inside a closed room on that floor. */
export const insideRoom = (floor: 0 | 1, x: number, z: number) =>
  ROOMS.some((r) => r.floor === floor && !r.open && x > r.x && x < r.x + r.w && z > r.z && z < r.z + r.d)

/** Builds wall segments from room outlines: shared edges merged, door openings cut out. */
export function wallSegments(): WallSeg[] {
  type Line = { floor: 0 | 1; axis: 'x' | 'z'; at: number; spans: [number, number][] }
  const lines = new Map<string, Line>()
  const add = (floor: 0 | 1, axis: 'x' | 'z', at: number, a: number, b: number) => {
    const k = `${floor}|${axis}|${Math.round(at)}`
    const l = lines.get(k) ?? { floor, axis, at, spans: [] }
    l.spans.push([Math.min(a, b), Math.max(a, b)])
    lines.set(k, l)
  }
  for (const r of ROOMS) {
    if (r.open) continue
    add(r.floor, 'x', r.z, r.x, r.x + r.w)
    add(r.floor, 'x', r.z + r.d, r.x, r.x + r.w)
    add(r.floor, 'z', r.x, r.z, r.z + r.d)
    add(r.floor, 'z', r.x + r.w, r.z, r.z + r.d)
  }
  const out: WallSeg[] = []
  for (const l of lines.values()) {
    // union
    const s = l.spans.sort((a, b) => a[0] - b[0])
    const merged: [number, number][] = []
    for (const [a, b] of s) {
      const last = merged[merged.length - 1]
      if (last && a <= last[1] + 1) last[1] = Math.max(last[1], b)
      else merged.push([a, b])
    }
    // cut doors
    let pieces = merged
    for (const d of DOORS) {
      if (d.floor !== l.floor || d.axis !== l.axis || Math.abs(d.at - l.at) > 1) continue
      pieces = pieces.flatMap(([a, b]) => {
        if (d.to <= a || d.from >= b) return [[a, b] as [number, number]]
        const res: [number, number][] = []
        if (d.from > a) res.push([a, d.from])
        if (d.to < b) res.push([d.to, b])
        return res
      })
    }
    for (const [a, b] of pieces) {
      if (b - a < 20) continue
      const mid = (a + b) / 2
      const [mx, mz] = l.axis === 'x' ? [mid, l.at] : [l.at, mid]
      const off = 150
      const sideA = l.axis === 'x' ? insideRoom(l.floor, mx, mz - off) : insideRoom(l.floor, mx - off, mz)
      const sideB = l.axis === 'x' ? insideRoom(l.floor, mx, mz + off) : insideRoom(l.floor, mx + off, mz)
      const [x1, z1, x2, z2] = l.axis === 'x' ? [a, l.at, b, l.at] : [l.at, a, l.at, b]
      out.push({ floor: l.floor, x1: x1 / 1000, z1: z1 / 1000, x2: x2 / 1000, z2: z2 / 1000, exterior: !(sideA && sideB) })
    }
  }
  return out
}

/** Room at a point (mm) on a floor, closed rooms first. */
export function roomAt(floor: 0 | 1, x: number, z: number): RoomDef | undefined {
  const hit = ROOMS.filter((r) => r.floor === floor && x >= r.x && x <= r.x + r.w && z >= r.z && z <= r.z + r.d)
  return hit.find((r) => !r.open) ?? hit[0]
}

/** Resolves a stored photo path for the current base URL (GitHub Pages builds use a sub path). */
export function photoUrl(u: string) {
  if (/^(https?:|data:|blob:)/.test(u)) return u
  const base = import.meta.env.BASE_URL
  if (base !== '/' && u.startsWith(base)) return u
  return import.meta.env.BASE_URL.replace(/\/$/, '') + (u.startsWith('/') ? u : '/' + u)
}
