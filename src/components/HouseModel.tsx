import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FLOOR_HEIGHT, GROUND, PICKABLE, ROOMS, UPPER, WALL_HEIGHT, type RoomDef, type RoomKind } from '../lib/house'

export type FloorMode = 'all' | 'ground' | 'upper'

export interface HouseModelHandle {
  resetView: () => void
}

interface Props {
  selected: string | null
  onSelect: (id: string | null) => void
  floor: FloorMode
  reduceMotion?: boolean
  className?: string
}

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
const LABELLED = new Set<RoomKind>(['bedroom', 'living', 'kitchen', 'porch', 'garden', 'pool'])

const WALL = 0xefe7d8
const GOLD = new THREE.Color(0xc9a66b)

/** Centre of a room in world units (metres). */
function centre(r: RoomDef) {
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
    case 'stairs': {
      const steps = 9
      for (let i = 0; i < steps; i++) out.push(place(box(w / steps, 0.17 * (i + 1), d * 0.7, 0xb39b7a), x0 + (w / steps) * (i + 0.5), y + 0.085 * (i + 1), c.z))
      break
    }
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
      out.push(place(box(w + 0.6, 0.12, d + 0.6, 0xd9d3c7), c.x, y + 0.04, c.z))
      out.push(place(box(0.5, 1.1, d, 0x8d8a83, { rough: 1 }), x0 + w + 0.05, y + 0.55, c.z))
      out.push(place(box(0.06, 0.9, d * 0.6, 0xe9f7fb, { emissive: 0x335566 }), x0 + w - 0.22, y + 0.5, c.z))
      break
    }
    case 'terrace':
      out.push(place(box(0.25, 2.6, 0.25, 0xffffff), x0 + w - 0.2, y + 1.3, z0 + 0.2), place(box(0.25, 2.6, 0.25, 0xffffff), x0 + w - 0.2, y + 1.3, z0 + d - 0.2))
      break
  }
  return out
}

function walls(r: RoomDef, y: number) {
  const g = new THREE.Group()
  const h = M(WALL_HEIGHT)
  const t = 0.1
  const x0 = M(r.x)
  const z0 = M(r.z)
  const w = M(r.w)
  const d = M(r.d)
  g.add(place(box(w + t, h, t, WALL), x0 + w / 2, y + h / 2, z0))
  g.add(place(box(w + t, h, t, WALL), x0 + w / 2, y + h / 2, z0 + d))
  g.add(place(box(t, h, d + t, WALL), x0, y + h / 2, z0 + d / 2))
  g.add(place(box(t, h, d + t, WALL), x0 + w, y + h / 2, z0 + d / 2))
  return g
}

export const HouseModel = forwardRef<HouseModelHandle, Props>(function HouseModel({ selected, onSelect, floor, reduceMotion, className }, ref) {
  const host = useRef<HTMLDivElement>(null)
  const labelsRef = useRef<HTMLDivElement>(null)
  const api = useRef<{
    select: (id: string | null) => void
    setFloor: (f: FloorMode) => void
    reset: () => void
  } | null>(null)
  const onSelectRef = useRef(onSelect)
  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useImperativeHandle(ref, () => ({ resetView: () => api.current?.reset() }), [])

  useEffect(() => {
    const el = host.current
    const labelHost = labelsRef.current
    if (!el || !labelHost) return
    const small = el.clientWidth < 768

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      el.innerHTML = '<p style="padding:2rem;text-align:center;color:#5f6b67">Pelayar ini tidak menyokong paparan 3D.</p>'
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.shadowMap.enabled = !small
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.92
    el.appendChild(renderer.domElement)
    renderer.domElement.style.touchAction = 'none'

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, el.clientWidth / el.clientHeight, 0.1, 200)
    const HOME_TARGET = new THREE.Vector3(6.8, 0.6, 10.2)
    const portrait = el.clientWidth / el.clientHeight < 1
    const HOME_POS = HOME_TARGET.clone().add(new THREE.Vector3(-19.6, 20.4, 21.6).multiplyScalar(portrait ? 1.45 : 0.9))
    camera.position.copy(HOME_POS)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.copy(HOME_TARGET)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.maxPolarAngle = 1.32
    controls.minDistance = 5
    controls.maxDistance = 60
    controls.autoRotate = !reduceMotion
    controls.autoRotateSpeed = 0.55
    controls.addEventListener('start', () => {
      controls.autoRotate = false
      fly = null
    })

    // Lights
    scene.add(new THREE.HemisphereLight(0xfff6e8, 0x7d8f6c, 1.15))
    const sun = new THREE.DirectionalLight(0xfff3e0, 1.9)
    sun.position.set(-12, 24, 8)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 70 })
    sun.target.position.copy(HOME_TARGET)
    scene.add(sun, sun.target)

    // Lot, road and fence
    const lot = box(16.2, 0.1, 24.4, 0xa3c283, { rough: 1 })
    place(lot, 6.85, -0.06, 9.6)
    scene.add(lot)
    scene.add(place(box(30, 0.04, 7, 0x8f8f8f, { rough: 1 }), 6.85, -0.08, 25.3))
    const fenceMat = 0xfafafa
    scene.add(place(box(16.2, 0.9, 0.06, fenceMat), 6.85, 0.45, -2.6))
    for (const fx of [-1.25, 14.95]) scene.add(place(box(0.06, 0.9, 24.4, fenceMat), fx, 0.45, 9.6))
    scene.add(place(box(3.6, 0.9, 0.06, fenceMat), 0.55, 0.45, 21.8), place(box(5.4, 0.9, 0.06, fenceMat), 12.2, 0.45, 21.8))
    scene.add(tree(-0.4, -1.8, 1.2), tree(14.2, 21.0, 1.0))

    // Slabs
    const ground = new THREE.Group()
    const upper = new THREE.Group()
    ground.add(place(box(M(GROUND.w) + 0.3, 0.12, M(GROUND.d) + 0.3, 0xe9e2d6), M(GROUND.w) / 2, -0.03, M(GROUND.d) / 2))
    upper.add(place(box(M(UPPER.w) + 0.3, 0.14, M(UPPER.d) + 0.3, 0xe9e2d6), M(UPPER.x + UPPER.w / 2), M(FLOOR_HEIGHT) - 0.08, M(UPPER.z + UPPER.d / 2)))
    // stair void hint and columns holding the upper floor
    for (const [cx, cz] of [
      [UPPER.x, UPPER.z],
      [UPPER.x + UPPER.w, UPPER.z],
      [UPPER.x, UPPER.z + UPPER.d],
      [UPPER.x + UPPER.w, UPPER.z + UPPER.d],
    ])
      upper.add(place(box(0.14, M(FLOOR_HEIGHT), 0.14, WALL), M(cx), M(FLOOR_HEIGHT) / 2, M(cz)))

    const pickables: THREE.Mesh[] = []
    const floorMeshes = new Map<string, THREE.Mesh>()
    for (const r of ROOMS) {
      const group = r.floor === 1 ? upper : ground
      const y = r.floor === 1 ? M(FLOOR_HEIGHT) : r.open ? 0 : 0.04
      const isWater = r.kind === 'pool'
      const fm = new THREE.Mesh(
        new THREE.BoxGeometry(M(r.w) - 0.02, isWater ? 0.1 : 0.04, M(r.d) - 0.02),
        new THREE.MeshStandardMaterial({ color: FLOOR_COLOR[r.kind], roughness: isWater ? 0.15 : 0.8, metalness: isWater ? 0.1 : 0, emissive: 0x000000 }),
      )
      fm.position.set(M(r.x + r.w / 2), y + (isWater ? 0.06 : 0.02), M(r.z + r.d / 2))
      fm.receiveShadow = true
      fm.userData.roomId = r.id
      group.add(fm)
      floorMeshes.set(r.id, fm)
      if (!r.quiet) pickables.push(fm)
      if (!r.open) group.add(walls(r, y))
      for (const f of furniture(r, y + 0.04)) group.add(f)
    }
    scene.add(ground, upper)

    // Labels
    const anchors = new Map<string, THREE.Vector3>()
    const labelEls = new Map<string, HTMLButtonElement>()
    labelHost.innerHTML = ''
    for (const r of PICKABLE.filter((x) => LABELLED.has(x.kind) || x.id === 'family')) {
      const a = centre(r)
      a.y += r.floor === 1 ? 1.4 : r.open ? 1.0 : 1.5
      anchors.set(r.id, a)
      const b = document.createElement('button')
      b.type = 'button'
      b.textContent = r.title
      b.dataset.room = r.id
      b.className =
        'nv-label absolute left-0 top-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold shadow-md ring-1 transition-[background-color,color,opacity] duration-200 will-change-transform'
      b.addEventListener('click', (e) => {
        e.stopPropagation()
        onSelectRef.current(r.id)
      })
      labelHost.appendChild(b)
      labelEls.set(r.id, b)
    }

    // State
    let floorMode: FloorMode = 'all'
    let selectedId: string | null = null
    let fly: { fromPos: THREE.Vector3; toPos: THREE.Vector3; fromT: THREE.Vector3; toT: THREE.Vector3; t: number } | null = null

    function setGroupOpacity(g: THREE.Group, o: number) {
      g.traverse((obj) => {
        const m = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
        if (!m) return
        m.transparent = o < 1
        m.opacity = o
        m.depthWrite = o >= 1
      })
    }

    function applyFloor() {
      upper.visible = floorMode !== 'ground'
      ground.visible = true
      setGroupOpacity(ground, floorMode === 'upper' ? 0.22 : 1)
    }

    function flyTo(pos: THREE.Vector3, target: THREE.Vector3) {
      if (reduceMotion) {
        camera.position.copy(pos)
        controls.target.copy(target)
        return
      }
      fly = { fromPos: camera.position.clone(), toPos: pos, fromT: controls.target.clone(), toT: target, t: 0 }
    }

    function highlight() {
      for (const [id, m] of floorMeshes) {
        const mat = m.material as THREE.MeshStandardMaterial
        mat.emissive = id === selectedId ? GOLD.clone().multiplyScalar(0.45) : new THREE.Color(0)
      }
    }

    api.current = {
      select(id) {
        selectedId = id
        highlight()
        controls.autoRotate = false
        if (!id) return
        const r = ROOMS.find((x) => x.id === id)
        if (!r) return
        if (r.floor === 0 && floorMode === 'upper') {
          floorMode = 'all'
          applyFloor()
        }
        const tgt = centre(r)
        tgt.y += 0.4
        const span = Math.max(M(r.w), M(r.d))
        const dir = camera.position.clone().sub(controls.target).setY(0)
        if (dir.lengthSq() < 0.01) dir.set(-1, 0, 1)
        dir.normalize()
        const narrow = el.clientWidth / el.clientHeight < 1
        const dist = (span * 1.6 + 7) * (narrow ? 1.15 : 1)
        const pos = tgt.clone().add(dir.multiplyScalar(dist * 0.5)).setY(tgt.y + dist * 0.88)
        flyTo(pos, tgt)
      },
      setFloor(f) {
        floorMode = f
        applyFloor()
        if (f === 'upper' && !selectedId) {
          const tgt = new THREE.Vector3(M(UPPER.x + UPPER.w / 2), M(FLOOR_HEIGHT), M(UPPER.z + UPPER.d / 2))
          flyTo(tgt.clone().add(new THREE.Vector3(-6, 11, 9)), tgt)
        }
      },
      reset() {
        selectedId = null
        highlight()
        flyTo(HOME_POS.clone(), HOME_TARGET.clone())
      },
    }

    // Picking by tap on a floor (ignore drags)
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const down = { x: 0, y: 0, on: false }
    const onDown = (e: PointerEvent) => {
      down.x = e.clientX
      down.y = e.clientY
      down.on = true
    }
    const onUp = (e: PointerEvent) => {
      if (!down.on || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return
      down.on = false
      const rect = renderer.domElement.getBoundingClientRect()
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      const visible = pickables.filter((m) => (m.parent === upper ? upper.visible : floorMode !== 'upper'))
      const hit = ray.intersectObjects(visible, false)[0]
      onSelectRef.current(hit ? (hit.object.userData.roomId as string) : null)
    }
    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointerup', onUp)

    const ro = new ResizeObserver(() => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    })
    ro.observe(el)

    const v = new THREE.Vector3()
    const water = floorMeshes.get('pool')?.material as THREE.MeshStandardMaterial | undefined
    const clock = new THREE.Clock()
    let raf = 0
    const ease = (t: number) => 1 - Math.pow(1 - t, 3)

    const loop = () => {
      raf = requestAnimationFrame(loop)
      const dt = clock.getDelta()
      if (fly) {
        fly.t = Math.min(1, fly.t + dt / 1.1)
        const k = ease(fly.t)
        camera.position.lerpVectors(fly.fromPos, fly.toPos, k)
        controls.target.lerpVectors(fly.fromT, fly.toT, k)
        if (fly.t >= 1) fly = null
      }
      controls.update()
      if (water && !reduceMotion) water.color.setHSL(0.53, 0.5, 0.52 + Math.sin(clock.elapsedTime * 1.4) * 0.03)
      renderer.render(scene, camera)

      const w = el.clientWidth
      const h = el.clientHeight
      for (const [id, b] of labelEls) {
        const r = ROOMS.find((x) => x.id === id)!
        const hidden = (r.floor === 1 && floorMode === 'ground') || (r.floor === 0 && floorMode === 'upper')
        v.copy(anchors.get(id)!).project(camera)
        const off = v.z > 1 || v.x < -1.1 || v.x > 1.1 || v.y < -1.1 || v.y > 1.1
        if (hidden || off) {
          b.style.opacity = '0'
          b.style.pointerEvents = 'none'
          continue
        }
        const sx = (v.x * 0.5 + 0.5) * w
        const sy = (-v.y * 0.5 + 0.5) * h
        b.style.transform = `translate(-50%, -50%) translate(${sx}px, ${sy}px)`
        b.style.opacity = '1'
        b.style.pointerEvents = 'auto'
        const sel = id === selectedId
        b.style.zIndex = sel ? '3' : r.floor === 1 ? '2' : '1'
        b.style.backgroundColor = sel ? '#c9a66b' : 'rgba(255,255,255,0.92)'
        b.style.color = sel ? '#142823' : '#1f3b35'
        b.style.setProperty('--tw-ring-color', sel ? '#a8854b' : 'rgba(0,0,0,0.08)')
      }
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointerup', onUp)
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else mat?.dispose()
      })
      renderer.dispose()
      renderer.domElement.remove()
      labelHost.innerHTML = ''
      api.current = null
    }
  }, [reduceMotion])

  useEffect(() => {
    api.current?.select(selected)
  }, [selected])

  useEffect(() => {
    api.current?.setFloor(floor)
  }, [floor])

  return (
    <div className={className} style={{ position: 'relative', overflow: 'hidden' }}>
      <div ref={host} className="absolute inset-0" />
      <div ref={labelsRef} className="pointer-events-none absolute inset-0 [&>button]:pointer-events-auto" />
    </div>
  )
})
