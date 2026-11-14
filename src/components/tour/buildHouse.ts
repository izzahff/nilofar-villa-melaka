/**
 * Builds the procedural Nilofar Villa model: floors, two wall sets (cutaway
 * for the dollhouse view, full height for walking), ceilings, stairs,
 * furniture, the lot and photo frames.
 */
import * as THREE from 'three'
import { DOORS, FLOOR_HEIGHT, GROUND, ROOMS, UPPER, VIEWPOINTS, WALL_HEIGHT, insideRoom, wallSegments, type RoomDef, type RoomKind } from '../../lib/house'
import { LOT, POOL, VOID } from '../../lib/walk'

const M = (mm: number) => mm / 1000

const FLOOR_COLOR: Record<RoomKind, number> = {
  bedroom: 0xc6a378,
  bath: 0xcfe0e3,
  kitchen: 0xd5d1c8,
  dining: 0xd9c4a0,
  living: 0xd3b88e,
  stairs: 0xcdb99a,
  hall: 0xd9cdb8,
  porch: 0xa7a39b,
  terrace: 0xc9b08a,
  garden: 0x8db267,
  pool: 0x4fb3c8,
}

/** Room kinds that get a floating label; the rest are picked by tap or the room list. */
export const LABELLED = new Set<RoomKind>(['bedroom', 'living', 'kitchen', 'porch', 'garden', 'pool'])

export const WALL = 0xefe7d8

/** Centre of a room in world units (metres). */
export function centre(r: RoomDef) {
  return new THREE.Vector3(M(r.x + r.w / 2), r.floor === 1 ? M(FLOOR_HEIGHT) : 0, M(r.z + r.d / 2))
}

function box(w: number, h: number, d: number, color: number, opts: { rough?: number; metal?: number; emissive?: number } = {}) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: opts.rough ?? 0.85, metalness: opts.metal ?? 0, emissive: opts.emissive ?? 0 })
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function place(m: THREE.Object3D, x: number, y: number, z: number) {
  m.position.set(x, y, z)
  return m
}

/** Bed with headboard against the back (smaller z) wall of the room. */
function bed(r: RoomDef, y: number) {
  const g = new THREE.Group()
  const w = r.bed === 'king' ? 1.93 : 1.53
  const d = 2.03
  const c = centre(r)
  const backZ = M(r.z) + 0.12
  g.add(place(box(w, 0.32, d, 0xb8ab98), 0, 0.16, 0))
  g.add(place(box(w - 0.06, 0.16, d - 0.1, 0xfbfaf7, { rough: 0.95 }), 0, 0.4, 0.04))
  g.add(place(box(w + 0.1, 1.0, 0.12, 0xcfc2ad), 0, 0.5, -d / 2 - 0.05))
  for (const s of [-1, 1]) g.add(place(box(w * 0.36, 0.12, 0.38, 0xffffff), (s * w) / 4.4, 0.54, -d / 2 + 0.32))
  g.add(place(box(0.45, 0.45, 0.4, 0xa48b6d), -w / 2 - 0.35, 0.22, -d / 2 + 0.25))
  g.position.set(c.x, y, backZ + d / 2 + 0.06)
  return g
}

function tree(x: number, z: number, s = 1) {
  const g = new THREE.Group()
  g.add(place(box(0.18 * s, 1.2 * s, 0.18 * s, 0x7a5a3c), 0, 0.6 * s, 0))
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85 * s, 0), new THREE.MeshStandardMaterial({ color: 0x5f8a4c, roughness: 0.9, flatShading: true }))
  crown.position.y = 1.7 * s
  crown.castShadow = true
  g.add(crown)
  g.position.set(x, 0, z)
  return g
}

function furniture(r: RoomDef, y: number): THREE.Object3D[] {
  const out: THREE.Object3D[] = []
  const c = centre(r)
  const x0 = M(r.x)
  const z0 = M(r.z)
  const w = M(r.w)
  const d = M(r.d)
  switch (r.kind) {
    case 'bedroom':
      out.push(bed(r, y))
      out.push(place(box(Math.min(1.6, w * 0.4), 0.95, 0.55, 0xe2d6c2), x0 + w - Math.min(1.6, w * 0.4) / 2 - 0.12, y + 0.48, z0 + d - 0.4))
      break
    case 'kitchen':
      out.push(place(box(w - 0.3, 0.88, 0.6, 0x8fa596), x0 + w / 2, y + 0.44, z0 + 0.42))
      out.push(place(box(w - 0.3, 0.04, 0.62, 0xfafafa, { rough: 0.3 }), x0 + w / 2, y + 0.9, z0 + 0.42))
      out.push(place(box(0.75, 0.95, 0.7, 0xd9dcdd, { metal: 0.4, rough: 0.4 }), x0 + 0.5, y + 0.48, z0 + d - 0.5))
      break
    case 'dining': {
      out.push(place(box(2.2, 0.06, 1.0, 0x8a6a4a), c.x, y + 0.75, c.z))
      for (const sx of [-0.7, 0, 0.7]) for (const sz of [-0.75, 0.75]) out.push(place(box(0.42, 0.45, 0.42, 0xcbb89c), c.x + sx, y + 0.23, c.z + sz))
      break
    }
    case 'living': {
      if (r.floor === 0) {
        // Dining 1 near the back, lounge at the front
        out.push(place(box(2.4, 0.06, 1.0, 0x8a6a4a), c.x, y + 0.75, z0 + 1.6))
        for (const sx of [-0.8, 0, 0.8]) for (const sz of [-0.75, 0.75]) out.push(place(box(0.42, 0.45, 0.42, 0xcbb89c), c.x + sx, y + 0.23, z0 + 1.6 + sz))
        out.push(place(box(2.6, 0.45, 0.9, 0x8b5a3c), c.x - 0.3, y + 0.23, z0 + d - 2.1))
        out.push(place(box(0.9, 0.45, 2.0, 0x8b5a3c), c.x - 1.6, y + 0.23, z0 + d - 3.1))
        out.push(place(box(1.1, 0.38, 0.6, 0xd8d2c8, { rough: 0.3 }), c.x - 0.2, y + 0.19, z0 + d - 3.3))
        for (const sx of [0.9, 1.7]) out.push(place(box(0.7, 0.9, 0.7, 0x5f7a73), c.x + sx, y + 0.45, z0 + d - 4.6))
        out.push(place(box(1.8, 0.5, 0.4, 0x3d3a36), c.x - 0.3, y + 0.25, z0 + d - 4.9))
        out.push(place(box(1.4, 0.8, 0.06, 0x111111, { rough: 0.2 }), c.x - 0.3, y + 0.95, z0 + d - 4.95))
      } else {
        out.push(place(box(2.0, 0.42, 0.85, 0x6f7f7a), c.x, y + 0.21, c.z + 0.6))
        out.push(place(box(0.9, 0.35, 0.55, 0xd8d2c8), c.x, y + 0.18, c.z - 0.4))
      }
      break
    }
    case 'bath':
      out.push(place(box(0.4, 0.42, 0.6, 0xffffff, { rough: 0.3 }), x0 + 0.35, y + 0.21, z0 + d - 0.45))
      out.push(place(box(0.55, 0.85, 0.4, 0xf1f1ef, { rough: 0.3 }), x0 + w - 0.45, y + 0.42, z0 + 0.3))
      break
    case 'stairs':
      break
    case 'porch': {
      const car = new THREE.Group()
      car.add(place(box(1.8, 0.55, 4.5, 0xb9bec4, { metal: 0.6, rough: 0.35 }), 0, 0.45, 0))
      car.add(place(box(1.6, 0.45, 2.4, 0x5d6a74, { metal: 0.4, rough: 0.2 }), 0, 0.95, -0.2))
      car.position.set(c.x + 1.2, y, c.z - 0.2)
      out.push(car)
      for (const px of [x0 + 0.15, x0 + w - 0.15]) out.push(place(box(0.3, 2.6, 0.3, 0xffffff), px, y + 1.3, z0 + d - 0.2))
      break
    }
    case 'garden': {
      out.push(tree(x0 + 0.8, z0 + 1.2, 1.1), tree(x0 + w - 0.7, z0 + d - 1.2, 0.9), tree(x0 + w - 0.8, z0 + 2.6, 0.8))
      // patio umbrella and table
      const pole = place(box(0.05, 2.2, 0.05, 0x777777), c.x, y + 1.1, c.z)
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.9 }))
      canopy.position.set(c.x, y + 2.25, c.z)
      canopy.castShadow = true
      out.push(pole, canopy, place(box(0.9, 0.05, 0.9, 0xf5f5f5), c.x, y + 0.72, c.z))
      out.push(place(box(1.4, 0.45, 0.45, 0xffffff), x0 + w / 2, y + 0.23, z0 + d - 0.6))
      break
    }
    case 'pool': {
      // pebble wash deck, waterfall wall at the far (west) end
      out.push(place(box(w + 1.6, 0.12, d + 1.3, 0x9c958b, { rough: 1 }), c.x + 0.3, y + 0.03, c.z))
      out.push(place(box(0.5, 1.1, d, 0x6f6b66, { rough: 1 }), x0 - 0.05, y + 0.55, c.z))
      out.push(place(box(0.06, 0.9, d * 0.6, 0xe9f7fb, { emissive: 0x335566 }), x0 + 0.22, y + 0.5, c.z))
      break
    }
    case 'terrace':
      out.push(place(box(0.25, 2.6, 0.25, 0xffffff), x0 + w - 0.2, y + 1.3, z0 + 0.2), place(box(0.25, 2.6, 0.25, 0xffffff), x0 + w - 0.2, y + 1.3, z0 + d - 0.2))
      break
  }
  return out
}

// ---------- textures ----------

type TexKind = 'wood' | 'tile' | 'bathTile' | 'grass' | 'deck' | 'paver'
const texCache = new Map<TexKind, THREE.CanvasTexture>()

function rand(seed: number) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

function makeTexture(kind: TexKind): THREE.CanvasTexture {
  const hit = texCache.get(kind)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')!
  const r = rand(kind.length * 977)
  if (kind === 'wood' || kind === 'deck') {
    const rows = kind === 'wood' ? 8 : 6
    const h = 512 / rows
    for (let i = 0; i < rows; i++) {
      const base = kind === 'wood' ? [176, 130, 86] : [128, 92, 62]
      const v = (r() - 0.5) * 30
      g.fillStyle = `rgb(${base[0] + v},${base[1] + v * 0.8},${base[2] + v * 0.6})`
      const off = r() * 512
      g.fillRect(0, i * h, 512, h)
      g.strokeStyle = 'rgba(60,35,15,0.35)'
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(0, i * h)
      g.lineTo(512, i * h)
      g.moveTo(off, i * h)
      g.lineTo(off, i * h + h)
      g.stroke()
      for (let k = 0; k < 14; k++) {
        g.strokeStyle = `rgba(70,40,20,${0.05 + r() * 0.08})`
        g.lineWidth = 1
        const y = i * h + r() * h
        g.beginPath()
        g.moveTo(0, y)
        g.bezierCurveTo(170, y + (r() - 0.5) * 6, 340, y + (r() - 0.5) * 6, 512, y)
        g.stroke()
      }
    }
  } else if (kind === 'grass') {
    g.fillStyle = '#7fa65a'
    g.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 9000; i++) {
      const v = r()
      g.fillStyle = `rgba(${60 + v * 70},${110 + v * 70},${40 + v * 30},0.55)`
      g.fillRect(r() * 512, r() * 512, 2, 3 + r() * 4)
    }
  } else {
    const n = kind === 'tile' ? 4 : kind === 'bathTile' ? 8 : 3
    const base = kind === 'tile' ? '#dcdad5' : kind === 'bathTile' ? '#dbe6e8' : '#b9b4ab'
    g.fillStyle = base
    g.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 2500; i++) {
      g.fillStyle = `rgba(0,0,0,${r() * 0.035})`
      g.fillRect(r() * 512, r() * 512, 3, 3)
    }
    g.strokeStyle = kind === 'paver' ? 'rgba(70,65,58,0.45)' : 'rgba(150,140,125,0.6)'
    g.lineWidth = 3
    for (let i = 0; i <= n; i++) {
      const p = (i * 512) / n
      g.beginPath()
      g.moveTo(p, 0)
      g.lineTo(p, 512)
      g.moveTo(0, p)
      g.lineTo(512, p)
      g.stroke()
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  texCache.set(kind, t)
  return t
}

const TEX_FOR: Partial<Record<RoomKind, TexKind>> = {
  bedroom: 'wood',
  living: 'wood',
  hall: 'wood',
  stairs: 'wood',
  dining: 'tile',
  kitchen: 'tile',
  bath: 'bathTile',
  porch: 'paver',
  terrace: 'tile',
  garden: 'grass',
}

/** Texture repeated so one tile of the canvas covers `size` metres. */
function floorMaterial(kind: RoomKind, wM: number, dM: number, size = 2, uvInMetres = false, level: 0 | 1 = 1) {
  // Ground floor rooms are tiled, upstairs is timber (seen in the owner's house tour video)
  const tk = level === 0 && (kind === 'bedroom' || kind === 'living' || kind === 'hall') ? 'tile' : TEX_FOR[kind]
  if (!tk) return new THREE.MeshStandardMaterial({ color: FLOOR_COLOR[kind], roughness: 0.8 })
  const map = makeTexture(tk).clone()
  map.needsUpdate = true
  if (uvInMetres) map.repeat.set(1 / size, 1 / size)
  else map.repeat.set(wM / size, dM / size)
  return new THREE.MeshStandardMaterial({ map, roughness: tk === 'tile' || tk === 'bathTile' ? 0.45 : 0.75 })
}

// ---------- slabs with holes ----------

interface Rect {
  x0: number
  x1: number
  z0: number
  z1: number
}

const overlaps = (a: Rect, b: Rect) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1

/** Horizontal slab (metres) with an optional rectangular hole. Top face at `top`. */
function slab(r: Rect, hole: Rect | null, thick: number, top: number, mat: THREE.Material) {
  const shape = new THREE.Shape()
  shape.moveTo(r.x0, -r.z0)
  shape.lineTo(r.x1, -r.z0)
  shape.lineTo(r.x1, -r.z1)
  shape.lineTo(r.x0, -r.z1)
  shape.closePath()
  if (hole && overlaps(r, hole)) {
    const h = { x0: Math.max(r.x0, hole.x0), x1: Math.min(r.x1, hole.x1), z0: Math.max(r.z0, hole.z0), z1: Math.min(r.z1, hole.z1) }
    const p = new THREE.Path()
    p.moveTo(h.x0, -h.z0)
    p.lineTo(h.x0, -h.z1)
    p.lineTo(h.x1, -h.z1)
    p.lineTo(h.x1, -h.z0)
    p.closePath()
    shape.holes.push(p)
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false })
  const m = new THREE.Mesh(geo, mat)
  m.rotation.x = -Math.PI / 2
  m.position.y = top - thick
  m.receiveShadow = true
  return m
}

// ---------- walls ----------

const WALL_T = 0.12
const GROUND_WALL_H = 2.95
const UPPER_WALL_H = 2.6
const WINDOW = { sill: 0.95, head: 2.15 }

function wallBox(x1: number, z1: number, x2: number, z2: number, y0: number, y1: number, mat: THREE.Material) {
  const len = Math.hypot(x2 - x1, z2 - z1)
  const m = new THREE.Mesh(new THREE.BoxGeometry(len + WALL_T, y1 - y0, WALL_T), mat)
  m.position.set((x1 + x2) / 2, (y0 + y1) / 2, (z1 + z2) / 2)
  m.rotation.y = -Math.atan2(z2 - z1, x2 - x1)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

export interface HouseBuild {
  root: THREE.Group
  ground: THREE.Group
  upper: THREE.Group
  /** Low walls for the dollhouse view */
  cutaway: THREE.Group
  /** Full walls, ceilings and lamps for walking */
  full: THREE.Group
  pickables: THREE.Mesh[]
  floorMeshes: Map<string, THREE.Mesh>
  frames: THREE.Mesh[]
  water?: THREE.MeshStandardMaterial
  dispose: () => void
}

export function buildHouse(photos: Record<string, string[]>, resolve: (u: string) => string): HouseBuild {
  const root = new THREE.Group()
  const ground = new THREE.Group()
  const upper = new THREE.Group()
  const cutaway = new THREE.Group()
  const full = new THREE.Group()
  const fh = M(FLOOR_HEIGHT)
  const voidRect: Rect = VOID

  // Lot, road, fence, trees
  const lotMat = new THREE.MeshStandardMaterial({ map: (() => { const t = makeTexture('grass').clone(); t.needsUpdate = true; t.repeat.set(8, 12); return t })(), roughness: 1 })
  root.add(place(new THREE.Mesh(new THREE.BoxGeometry(LOT.x1 - LOT.x0, 0.1, LOT.z1 - LOT.z0), lotMat), (LOT.x0 + LOT.x1) / 2, -0.06, (LOT.z0 + LOT.z1) / 2))
  root.add(place(box(30, 0.04, 7, 0x8f8f8f, { rough: 1 }), 6.85, -0.08, 25.3))
  const fence = 0xfafafa
  // Tall concrete boundary wall at the back and the pool side, picket fence elsewhere
  const concrete = 0xc9c7c1
  root.add(place(box(LOT.x1 - LOT.x0, 2.4, 0.15, concrete, { rough: 1 }), (LOT.x0 + LOT.x1) / 2, 1.2, LOT.z0))
  root.add(place(box(0.15, 2.4, 6, concrete, { rough: 1 }), LOT.x1, 1.2, LOT.z0 + 3))
  root.add(place(box(0.06, 0.9, LOT.z1 - LOT.z0 - 6, fence), LOT.x1, 0.45, (LOT.z0 + 6 + LOT.z1) / 2))
  root.add(place(box(0.15, 2.4, 4, concrete, { rough: 1 }), LOT.x0, 1.2, LOT.z0 + 2))
  root.add(place(box(0.06, 0.9, LOT.z1 - LOT.z0 - 4, fence), LOT.x0, 0.45, (LOT.z0 + 4 + LOT.z1) / 2))
  root.add(place(box(LOT.gate0 - LOT.x0, 1.1, 0.06, fence), (LOT.x0 + LOT.gate0) / 2, 0.55, LOT.z1))
  root.add(place(box(LOT.x1 - LOT.gate1, 1.1, 0.06, fence), (LOT.gate1 + LOT.x1) / 2, 0.55, LOT.z1))
  root.add(tree(14.2, 21.0, 1.0), tree(-0.5, 20.6, 0.9), tree(14.3, 13.5, 0.8))

  // Ground slab and upper slab with the stair void
  const slabMat = new THREE.MeshStandardMaterial({ color: 0xe9e2d6, roughness: 0.9 })
  ground.add(place(box(M(GROUND.w) + 0.3, 0.12, M(GROUND.d) + 0.3, 0xe9e2d6), M(GROUND.w) / 2, -0.03, M(GROUND.d) / 2))
  const upperRect: Rect = { x0: M(UPPER.x), x1: M(UPPER.x + UPPER.w), z0: M(UPPER.z), z1: M(UPPER.z + UPPER.d) }
  upper.add(slab({ x0: upperRect.x0 - 0.15, x1: upperRect.x1 + 0.15, z0: upperRect.z0 - 0.15, z1: upperRect.z1 + 0.15 }, voidRect, 0.2, fh - 0.03, slabMat))

  // Room floors and furniture
  const pickables: THREE.Mesh[] = []
  const floorMeshes = new Map<string, THREE.Mesh>()
  let water: THREE.MeshStandardMaterial | undefined
  for (const r of ROOMS) {
    const group = r.floor === 1 ? upper : ground
    const y = r.floor === 1 ? fh : r.open ? 0 : 0.04
    const rect: Rect = { x0: M(r.x), x1: M(r.x + r.w), z0: M(r.z), z1: M(r.z + r.d) }
    let fm: THREE.Mesh
    if (r.kind === 'pool') {
      water = new THREE.MeshStandardMaterial({ color: FLOOR_COLOR.pool, roughness: 0.12, metalness: 0.1 })
      fm = new THREE.Mesh(new THREE.BoxGeometry(M(r.w) - 0.02, 0.1, M(r.d) - 0.02), water)
      fm.position.set(M(r.x + r.w / 2), 0.06, M(r.z + r.d / 2))
    } else if (r.floor === 1 && overlaps(rect, voidRect)) {
      fm = slab(rect, voidRect, 0.04, y + 0.04, floorMaterial(r.kind, M(r.w), M(r.d), 2, true))
    } else {
      fm = new THREE.Mesh(new THREE.BoxGeometry(M(r.w) - 0.02, 0.04, M(r.d) - 0.02), floorMaterial(r.kind, M(r.w), M(r.d), 2, false, r.floor))
      fm.position.set(M(r.x + r.w / 2), y + 0.02, M(r.z + r.d / 2))
    }
    fm.receiveShadow = true
    fm.userData.roomId = r.id
    group.add(fm)
    floorMeshes.set(r.id, fm)
    if (!r.quiet) pickables.push(fm)
    for (const f of furniture(r, y + 0.04)) group.add(f)
  }

  // Open tread stairs rising west from the living room to the family room
  const steps = 17
  const run = (voidRect.x1 - voidRect.x0) / steps
  const depth = voidRect.z1 - voidRect.z0 - 0.06
  const treadMat = new THREE.MeshStandardMaterial({ map: (() => { const t = makeTexture('wood').clone(); t.needsUpdate = true; t.repeat.set(0.3, 0.6); return t })(), roughness: 0.7 })
  const fillMat = new THREE.MeshStandardMaterial({ color: WALL, roughness: 0.9 })
  for (let i = 0; i < steps; i++) {
    const h = (fh * (i + 1)) / steps
    const cx = voidRect.x1 - (i + 0.5) * run
    const tread = new THREE.Mesh(new THREE.BoxGeometry(run + 0.03, 0.05, depth), treadMat)
    tread.position.set(cx, h - 0.025, (voidRect.z0 + voidRect.z1) / 2)
    tread.castShadow = tread.receiveShadow = true
    ground.add(tread)
    // Solid under the low steps, open under the high ones so guests walk beneath
    if (h < 2.05) ground.add(place(new THREE.Mesh(new THREE.BoxGeometry(run + 0.03, h - 0.05, depth), fillMat), cx, (h - 0.05) / 2, (voidRect.z0 + voidRect.z1) / 2))
  }
  // Stringer and handrail along the open side
  const stringerLen = Math.hypot(voidRect.x1 - voidRect.x0, fh)
  const ang = Math.atan2(fh, voidRect.x1 - voidRect.x0)
  for (const z of [voidRect.z0 + 0.03, voidRect.z1 - 0.03]) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(stringerLen, 0.25, 0.05), new THREE.MeshStandardMaterial({ color: 0x8a6a4a }))
    s.position.set((voidRect.x0 + voidRect.x1) / 2, fh / 2 - 0.1, z)
    s.rotation.z = -ang
    ground.add(s)
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(stringerLen, 0.05, 0.05), new THREE.MeshStandardMaterial({ color: 0x3d3a36, metalness: 0.5, roughness: 0.4 }))
  rail.position.set((voidRect.x0 + voidRect.x1) / 2, fh / 2 + 0.9, voidRect.z1 - 0.05)
  rail.rotation.z = -ang
  ground.add(rail)

  // Walls
  const segs = wallSegments()
  const wallMat = new THREE.MeshStandardMaterial({ color: WALL, roughness: 0.92 })
  const extMat = new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.95 })
  const glass = new THREE.MeshStandardMaterial({ color: 0xbfdbe6, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.28, depthWrite: false })
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2f3b38, roughness: 0.5 })
  for (const w of segs) {
    const y0 = w.floor === 1 ? fh : 0
    const len = Math.hypot(w.x2 - w.x1, w.z2 - w.z1)
    // dollhouse
    const cut = wallBox(w.x1, w.z1, w.x2, w.z2, y0, y0 + M(WALL_HEIGHT), w.exterior ? extMat : wallMat)
    cut.userData.floor = w.floor
    cutaway.add(cut)
    // full height, with a window in long outside walls
    const top = y0 + (w.floor === 1 ? UPPER_WALL_H : GROUND_WALL_H)
    const mat = w.exterior ? extMat : wallMat
    const target = full
    if (w.exterior && len >= 1.8) {
      const ww = Math.min(1.6, len - 0.6)
      const t0 = (len - ww) / 2 / len
      const t1 = 1 - t0
      const lerp = (t: number) => [w.x1 + (w.x2 - w.x1) * t, w.z1 + (w.z2 - w.z1) * t] as const
      const [ax, az] = lerp(t0)
      const [bx, bz] = lerp(t1)
      target.add(wallBox(w.x1, w.z1, ax, az, y0, top, mat), wallBox(bx, bz, w.x2, w.z2, y0, top, mat))
      target.add(wallBox(ax, az, bx, bz, y0, y0 + WINDOW.sill, mat), wallBox(ax, az, bx, bz, y0 + WINDOW.head, top, mat))
      const pane = wallBox(ax, az, bx, bz, y0 + WINDOW.sill, y0 + WINDOW.head, glass)
      pane.scale.z = 0.2
      pane.castShadow = false
      target.add(pane)
      const sill = wallBox(ax, az, bx, bz, y0 + WINDOW.sill - 0.04, y0 + WINDOW.sill, frameMat)
      sill.scale.z = 1.6
      target.add(sill)
    } else {
      target.add(wallBox(w.x1, w.z1, w.x2, w.z2, y0, top, mat))
    }
    // skirting
    const sk = wallBox(w.x1, w.z1, w.x2, w.z2, y0, y0 + 0.1, new THREE.MeshStandardMaterial({ color: 0x8a6a4a }))
    sk.scale.z = 1.25
    full.add(sk)
  }
  // Door heads
  for (const d of DOORS) {
    const y0 = d.floor === 1 ? fh : 0
    const top = y0 + (d.floor === 1 ? UPPER_WALL_H : GROUND_WALL_H)
    const head = y0 + 2.2
    const [x1, z1, x2, z2] = d.axis === 'x' ? [M(d.from), M(d.at), M(d.to), M(d.at)] : [M(d.at), M(d.from), M(d.at), M(d.to)]
    full.add(wallBox(x1, z1, x2, z2, head, top, wallMat))
  }
  // Upper railing round the stair void
  const railMat = new THREE.MeshStandardMaterial({ color: 0x3d3a36, metalness: 0.5, roughness: 0.4 })
  for (const z of [voidRect.z0, voidRect.z1]) {
    upper.add(place(new THREE.Mesh(new THREE.BoxGeometry(voidRect.x1 - voidRect.x0, 0.05, 0.05), railMat), (voidRect.x0 + voidRect.x1) / 2, fh + 1.0, z))
    for (let x = voidRect.x0 + 0.1; x < voidRect.x1; x += 0.35) upper.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.025, 1.0, 0.025), railMat), x, fh + 0.5, z))
  }

  // Ceilings and lamps (face down, so they vanish when seen from above)
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0xfbf8f2, roughness: 1, side: THREE.BackSide })
  const groundRect: Rect = { x0: 0, x1: M(GROUND.w), z0: 1.064, z1: M(GROUND.d) }
  const gc = slab(groundRect, voidRect, 0.02, GROUND_WALL_H, ceilMat)
  full.add(gc)
  full.add(slab(upperRect, null, 0.02, fh + UPPER_WALL_H, ceilMat))
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xfff4dc, emissive: 0xffe2a8, emissiveIntensity: 1.2 })
  for (const r of ROOMS) {
    if (r.open || r.kind === 'stairs') continue
    const c = centre(r)
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 20), lampMat)
    lamp.position.set(c.x, (r.floor === 1 ? fh + UPPER_WALL_H : GROUND_WALL_H) - 0.03, c.z)
    full.add(lamp)
  }

  // Outside finish: grey dado band and trim, roofs over the ground floor, terrace and car porch, gable roof upstairs
  const dado = new THREE.MeshStandardMaterial({ color: 0x8e979b, roughness: 0.9 })
  const trim = new THREE.MeshStandardMaterial({ color: 0x353d40, roughness: 0.7 })
  for (const w of segs) {
    if (!w.exterior) continue
    const len = Math.hypot(w.x2 - w.x1, w.z2 - w.z1)
    const ux = (w.x2 - w.x1) / len
    const uz = (w.z2 - w.z1) / len
    const mx = (w.x1 + w.x2) / 2
    const mz = (w.z1 + w.z2) / 2
    let nx = uz
    let nz = -ux
    if (insideRoom(w.floor, (mx + nx * 0.2) * 1000, (mz + nz * 0.2) * 1000)) {
      nx = -nx
      nz = -nz
    }
    const o = WALL_T / 2 + 0.012
    const y0 = w.floor === 1 ? fh : 0
    const band = wallBox(w.x1 + nx * o, w.z1 + nz * o, w.x2 + nx * o, w.z2 + nz * o, y0, y0 + 0.9, w.floor === 1 ? trim : dado)
    band.scale.z = 0.2
    const line = wallBox(w.x1 + nx * o, w.z1 + nz * o, w.x2 + nx * o, w.z2 + nz * o, y0 + (w.floor === 1 ? 0.9 : 0.9), y0 + 0.97, trim)
    line.scale.z = 0.35
    full.add(band, line)
  }
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x474e51, roughness: 0.75, side: THREE.DoubleSide })
  const quad = (pts: number[][]) => {
    const g = new THREE.BufferGeometry()
    const [a, b, c, d] = pts
    g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3))
    g.computeVertexNormals()
    const m = new THREE.Mesh(g, roofMat)
    m.castShadow = true
    return m
  }
  {
    // sloped band round the ground floor
    const ov = 0.45
    const inset = 1.3
    const ye = GROUND_WALL_H
    const yt = ye + 0.75
    const r = groundRect
    const O = { x0: r.x0 - ov, x1: r.x1 + ov, z0: r.z0 - ov, z1: r.z1 + ov }
    const I = { x0: r.x0 + inset - ov, x1: r.x1 - inset + ov, z0: r.z0 + inset - ov, z1: r.z1 - inset + ov }
    full.add(
      quad([[O.x0, ye, O.z0], [O.x1, ye, O.z0], [I.x1, yt, I.z0], [I.x0, yt, I.z0]]),
      quad([[O.x1, ye, O.z0], [O.x1, ye, O.z1], [I.x1, yt, I.z1], [I.x1, yt, I.z0]]),
      quad([[O.x1, ye, O.z1], [O.x0, ye, O.z1], [I.x0, yt, I.z1], [I.x1, yt, I.z1]]),
      quad([[O.x0, ye, O.z1], [O.x0, ye, O.z0], [I.x0, yt, I.z0], [I.x0, yt, I.z1]]),
    )
    full.add(slab(I, upperRect, 0.05, yt, roofMat))
    // terrace and car porch roofs
    const terr = ROOMS.find((x) => x.id === 'terrace')!
    full.add(place(box(M(terr.w) + 0.3, 0.08, M(terr.d) + 0.3, 0x474e51), M(terr.x + terr.w / 2) + 0.15, 2.75, M(terr.z + terr.d / 2)))
    const por = ROOMS.find((x) => x.id === 'porch')!
    full.add(place(box(M(por.w) + 0.2, 0.1, M(por.d) - 0.2, 0x474e51), M(por.x + por.w / 2), 2.75, M(por.z + por.d / 2) - 0.1))
    // gable roof over the upper floor, ridge along the length of the house
    const u = upperRect
    const ov2 = 0.35
    const ye2 = fh + UPPER_WALL_H
    const ridge = ye2 + 1.9
    const cx = (u.x0 + u.x1) / 2
    full.add(
      quad([[u.x0 - ov2, ye2 - 0.2, u.z0 - ov2], [cx, ridge, u.z0 - ov2], [cx, ridge, u.z1 + ov2], [u.x0 - ov2, ye2 - 0.2, u.z1 + ov2]]),
      quad([[u.x1 + ov2, ye2 - 0.2, u.z0 - ov2], [u.x1 + ov2, ye2 - 0.2, u.z1 + ov2], [cx, ridge, u.z1 + ov2], [cx, ridge, u.z0 - ov2]]),
    )
    // white gables with dark timber, English Tudor style
    const gableMat = new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.95, side: THREE.DoubleSide })
    for (const z of [u.z0, u.z1]) {
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute([u.x0, ye2, z, u.x1, ye2, z, cx, ridge - 0.05, z], 3))
      g.computeVertexNormals()
      full.add(new THREE.Mesh(g, gableMat))
      const side = z === u.z0 ? -1 : 1
      const timber = (x1: number, y1: number, x2: number, y2: number) => {
        const len = Math.hypot(x2 - x1, y2 - y1)
        const b = new THREE.Mesh(new THREE.BoxGeometry(len, 0.12, 0.06), trim)
        b.position.set((x1 + x2) / 2, (y1 + y2) / 2, z + side * 0.05)
        b.rotation.z = Math.atan2(y2 - y1, x2 - x1)
        full.add(b)
      }
      timber(cx, ye2, cx, ridge - 0.1)
      timber(u.x0 + 0.6, ye2, cx, ye2 + 1.2)
      timber(u.x1 - 0.6, ye2, cx, ye2 + 1.2)
      timber(u.x0, ye2, u.x1, ye2)
    }
  }

  // Photo frames: first photo of a room on the wall the view point faces
  const frames: THREE.Mesh[] = []
  const loader = new THREE.TextureLoader()
  for (const v of VIEWPOINTS) {
    const room = v.room ? ROOMS.find((r) => r.id === v.room) : undefined
    const url = room ? photos[room.id]?.[0] : undefined
    if (!room || room.open || !url) continue
    const px = M(v.pos[0])
    const pz = M(v.pos[1])
    let dx = M(v.look[0]) - px
    let dz = M(v.look[1]) - pz
    const n = Math.hypot(dx, dz)
    dx /= n
    dz /= n
    const rx0 = M(room.x)
    const rx1 = M(room.x + room.w)
    const rz0 = M(room.z)
    const rz1 = M(room.z + room.d)
    const tx = dx > 0 ? (rx1 - px) / dx : dx < 0 ? (rx0 - px) / dx : Infinity
    const tz = dz > 0 ? (rz1 - pz) / dz : dz < 0 ? (rz0 - pz) / dz : Infinity
    const hitX = tx < tz
    const t = Math.min(tx, tz)
    let hx = px + dx * t
    let hz = pz + dz * t
    // keep the frame on the wall, away from corners
    if (hitX) hz = Math.min(rz1 - 0.8, Math.max(rz0 + 0.8, hz))
    else hx = Math.min(rx1 - 0.8, Math.max(rx0 + 0.8, hx))
    const nx = hitX ? -Math.sign(dx) : 0
    const nz = hitX ? 0 : -Math.sign(dz)
    const y = (room.floor === 1 ? fh : 0) + 1.65
    const g = new THREE.Group()
    const border = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.92, 0.04), new THREE.MeshStandardMaterial({ color: 0xb08d57, metalness: 0.4, roughness: 0.4 }))
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }))
    pic.position.z = 0.025
    pic.userData.roomId = room.id
    border.userData.roomId = room.id
    g.add(border, pic)
    g.position.set(hx + nx * 0.08, y, hz + nz * 0.08)
    g.rotation.y = Math.atan2(nx, nz)
    loader.load(resolve(url), (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      const img = tex.image as { width: number; height: number }
      const aspect = img.width / img.height || 1.4
      const w = aspect >= 1 ? 1.12 : 0.8 * aspect
      const h = aspect >= 1 ? 1.12 / aspect : 0.8
      pic.geometry.dispose()
      pic.geometry = new THREE.PlaneGeometry(w, h)
      border.scale.set((w + 0.12) / 1.24, (h + 0.12) / 0.92, 1)
      ;(pic.material as THREE.MeshStandardMaterial).map = tex
      ;(pic.material as THREE.MeshStandardMaterial).needsUpdate = true
    })
    full.add(g)
    frames.push(pic, border)
  }

  full.visible = false
  root.add(ground, upper, cutaway, full)

  return {
    root,
    ground,
    upper,
    cutaway,
    full,
    pickables,
    floorMeshes,
    frames,
    water,
    dispose() {
      root.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose()
        const mat = m.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[] | undefined
        for (const x of Array.isArray(mat) ? mat : mat ? [mat] : []) {
          if (x.map && !Array.from(texCache.values()).includes(x.map as THREE.CanvasTexture)) x.map.dispose()
          x.dispose()
        }
      })
    },
  }
}

export { POOL }
