import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FLOOR_HEIGHT, PICKABLE, ROOMS, UPPER, VIEWPOINTS, photoUrl, roomAt } from '../../lib/house'
import type { SavedView, SplatSettings } from '../../lib/types'
import { EYE, FH, buildColliders, levelOf, stepWalk, type WalkState } from '../../lib/walk'
import { LABELLED, buildHouse, centre } from './buildHouse'

export type TourMode = 'walk' | 'fly' | 'orbit'
export type FloorMode = 'all' | 'ground' | 'upper'
export type InputKey = 'fwd' | 'back' | 'left' | 'right' | 'run' | 'jump' | 'up' | 'down'

export interface TourView {
  id: string
  title: string
  pos: [number, number, number]
  target: [number, number, number]
}

/** Views of the procedural model, from the view points in house.ts */
export const MODEL_VIEWS: TourView[] = VIEWPOINTS.map((v) => {
  const y = (v.floor === 1 ? FH : 0) + EYE
  return { id: v.id, title: v.title, pos: [v.pos[0] / 1000, y, v.pos[1] / 1000], target: [v.look[0] / 1000, y - 0.25, v.look[1] / 1000] }
})

export const savedToViews = (views: SavedView[]): TourView[] => views.map((v, i) => ({ id: `s${i}`, title: v.name, pos: v.pos, target: v.target }))

export interface TourViewerHandle {
  goTo: (v: TourView) => void
  reset: () => void
  setInput: (k: InputKey, on: boolean) => void
  /** Current camera position and a point 2 m ahead */
  getView: () => { pos: [number, number, number]; target: [number, number, number] }
}

interface Props {
  mode: TourMode
  floor: FloorMode
  selected: string | null
  photos: Record<string, string[]>
  splat?: SplatSettings | null
  reduceMotion?: boolean
  className?: string
  onSelect: (id: string | null) => void
  /** Where the guest is standing, e.g. "Ruang tamu" and "Tingkat bawah" */
  onWhere?: (place: string, level: string) => void
  /** Splat loading: 0 to 1, then 'ready' or 'error' */
  onSplat?: (state: number | 'ready' | 'error') => void
}

const M = (mm: number) => mm / 1000
const GOLD = new THREE.Color(0xe5cf72)
const SKY = new THREE.Color(0xcfe3ee)
const WALK_SPEED = 2.3
const RUN_SPEED = 4.8
const FLY_SPEED = 4.2

export const TourViewer = forwardRef<TourViewerHandle, Props>(function TourViewer(
  { mode, floor, selected, photos, splat, reduceMotion, className, onSelect, onWhere, onSplat },
  ref,
) {
  const host = useRef<HTMLDivElement>(null)
  const labelsRef = useRef<HTMLDivElement>(null)
  const engine = useRef<{
    setMode: (m: TourMode) => void
    setFloor: (f: FloorMode) => void
    select: (id: string | null) => void
    goTo: (v: TourView) => void
    reset: () => void
    setInput: (k: InputKey, on: boolean) => void
    getView: () => { pos: [number, number, number]; target: [number, number, number] }
  } | null>(null)
  const cb = useRef({ onSelect, onWhere, onSplat })
  useEffect(() => {
    cb.current = { onSelect, onWhere, onSplat }
  }, [onSelect, onWhere, onSplat])
  const initial = useRef({ mode, floor })

  useImperativeHandle(
    ref,
    () => ({
      goTo: (v) => engine.current?.goTo(v),
      reset: () => engine.current?.reset(),
      setInput: (k, on) => engine.current?.setInput(k, on),
      getView: () => engine.current?.getView() ?? { pos: [0, EYE, 0], target: [0, EYE, -2] },
    }),
    [],
  )

  const splatKey = splat ? `${splat.url}|${splat.flip}|${splat.scale}|${splat.y}` : ''
  const photoKey = JSON.stringify(photos)

  useEffect(() => {
    const el = host.current
    const labelHost = labelsRef.current
    if (!el || !labelHost) return
    const small = el.clientWidth < 768
    let disposed = false

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !splat, alpha: true })
    } catch {
      el.innerHTML = '<p style="padding:2rem;text-align:center;color:#6e625a">Pelayar ini tidak menyokong paparan 3D.</p>'
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, splat ? 1.5 : 2))
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.shadowMap.enabled = !small && !splat
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    if (!splat) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 0.95
    }
    el.appendChild(renderer.domElement)
    renderer.domElement.style.touchAction = 'none'
    renderer.domElement.style.display = 'block'

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, el.clientWidth / el.clientHeight, 0.05, 300)
    camera.rotation.order = 'YXZ'
    const portrait = () => el.clientWidth / el.clientHeight < 1
    const HOME_TARGET = splat ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(6.8, 0.6, 9.6)
    const homePos = () =>
      splat ? new THREE.Vector3(5, 5, 7) : HOME_TARGET.clone().add(new THREE.Vector3(-19.6, 20.4, 21.6).multiplyScalar(portrait() ? 1.45 : 0.9))
    camera.position.copy(homePos())

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.copy(HOME_TARGET)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.maxPolarAngle = splat ? Math.PI : 1.32
    controls.minDistance = splat ? 0.5 : 5
    controls.maxDistance = 60
    controls.autoRotate = !reduceMotion
    controls.autoRotateSpeed = 0.55

    scene.add(new THREE.HemisphereLight(0xfff6e8, 0x8d9a82, 1.25))
    const sun = new THREE.DirectionalLight(0xfff3e0, 1.9)
    sun.position.set(-12, 24, 8)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 70 })
    sun.target.position.set(6.8, 0, 9.6)
    scene.add(sun, sun.target)
    // Soft lamp that follows the guest indoors
    const lamp = new THREE.PointLight(0xfff0d8, 0, 9, 1.6)
    scene.add(lamp)

    const house = buildHouse(photos, photoUrl)
    scene.add(house.root)
    const colliders = buildColliders()
    let splatReady = false

    // ----- room labels (orbit) -----
    const anchors = new Map<string, THREE.Vector3>()
    const labelEls = new Map<string, HTMLButtonElement>()
    labelHost.innerHTML = ''
    if (!splat)
      for (const r of PICKABLE.filter((x) => LABELLED.has(x.kind) || x.id === 'family')) {
        const a = centre(r)
        a.y += r.floor === 1 ? 1.4 : r.open ? 1.0 : 1.5
        anchors.set(r.id, a)
        const b = document.createElement('button')
        b.type = 'button'
        b.textContent = r.title
        b.className = 'absolute left-0 top-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold shadow-md ring-1 transition-[background-color,color,opacity] duration-200 will-change-transform'
        b.addEventListener('click', (e) => {
          e.stopPropagation()
          cb.current.onSelect(r.id)
        })
        labelHost.appendChild(b)
        labelEls.set(r.id, b)
      }

    // ----- state -----
    let curMode: TourMode = 'orbit'
    let floorMode: FloorMode = initial.current.floor
    let selectedId: string | null = null
    let yaw = 0
    let pitch = 0
    let walk: WalkState = { x: 5, z: 14.1, y: 0, vy: 0, grounded: true }
    const input: Record<InputKey, boolean> = { fwd: false, back: false, left: false, right: false, run: false, jump: false, up: false, down: false }
    type Tween =
      | { kind: 'orbit'; fromPos: THREE.Vector3; toPos: THREE.Vector3; fromT: THREE.Vector3; toT: THREE.Vector3; t: number }
      | { kind: 'fp'; fromPos: THREE.Vector3; toPos: THREE.Vector3; fromYaw: number; toYaw: number; fromPitch: number; toPitch: number; t: number; dur: number }
    let tween: Tween | null = null

    controls.addEventListener('start', () => {
      controls.autoRotate = false
      if (tween?.kind === 'orbit') tween = null
    })

    function setGroupOpacity(g: THREE.Object3D, o: number) {
      g.traverse((obj) => {
        const m = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
        if (!m || m.userData.fixed) return
        if (m.userData.baseOpacity === undefined) m.userData.baseOpacity = m.opacity
        const base = m.userData.baseOpacity as number
        m.transparent = o < 1 || base < 1
        m.opacity = base * o
        m.depthWrite = o >= 1 && base >= 1
      })
    }

    function applyVisibility() {
      const orbit = curMode === 'orbit'
      house.root.visible = !splatReady
      house.full.visible = !orbit
      house.cutaway.visible = orbit
      house.upper.visible = !orbit || floorMode !== 'ground'
      for (const c of house.cutaway.children) c.visible = c.userData.floor === 0 || floorMode !== 'ground'
      const fade = orbit && floorMode === 'upper' ? 0.22 : 1
      setGroupOpacity(house.ground, fade)
      for (const c of house.cutaway.children) if (c.userData.floor === 0) setGroupOpacity(c, fade)
      labelHost!.style.display = orbit ? '' : 'none'
      scene.background = orbit && !splat ? null : splat ? new THREE.Color(0x111614) : SKY
      scene.fog = orbit || splat ? null : new THREE.Fog(SKY, 30, 90)
      lamp.intensity = orbit || splat ? 0 : 5
      controls.enabled = orbit
    }

    function highlight() {
      for (const [id, m] of house.floorMeshes) {
        const mat = m.material as THREE.MeshStandardMaterial
        mat.emissive = id === selectedId && curMode === 'orbit' ? GOLD.clone().multiplyScalar(0.45) : new THREE.Color(0)
      }
    }

    const angleTo = (from: number, to: number) => from + ((((to - from) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI

    function lookAngles(pos: THREE.Vector3, target: THREE.Vector3) {
      const d = target.clone().sub(pos)
      return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.atan2(d.y, Math.hypot(d.x, d.z)) }
    }

    function fpTo(pos: THREE.Vector3, target: THREE.Vector3) {
      const a = lookAngles(pos, target)
      if (reduceMotion) {
        camera.position.copy(pos)
        yaw = a.yaw
        pitch = a.pitch
        landAt(pos)
        return
      }
      const dist = camera.position.distanceTo(pos)
      tween = { kind: 'fp', fromPos: camera.position.clone(), toPos: pos, fromYaw: yaw, toYaw: angleTo(yaw, a.yaw), fromPitch: pitch, toPitch: a.pitch, t: 0, dur: Math.min(2.4, 0.9 + dist / 14) }
    }

    function landAt(pos: THREE.Vector3) {
      const feet = pos.y - EYE
      walk = { x: pos.x, z: pos.z, y: splat ? 0 : feet, vy: 0, grounded: false }
    }

    function orbitTo(pos: THREE.Vector3, target: THREE.Vector3) {
      if (reduceMotion) {
        camera.position.copy(pos)
        controls.target.copy(target)
        return
      }
      tween = { kind: 'orbit', fromPos: camera.position.clone(), toPos: pos, fromT: controls.target.clone(), toT: target, t: 0 }
    }

    function syncAnglesFromCamera() {
      const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ')
      yaw = e.y
      pitch = e.x
    }

    const defaultView = (): TourView => (splat ? { id: 'home', title: '', pos: [0, EYE, 3], target: [0, EYE - 0.2, 0] } : MODEL_VIEWS[0])
    let lastView: TourView | null = null

    function setMode(m: TourMode) {
      if (m === curMode) return
      const prev = curMode
      curMode = m
      tween = null
      camera.fov = m === 'orbit' ? 38 : small ? 78 : 68
      camera.updateProjectionMatrix()
      applyVisibility()
      highlight()
      if (m === 'orbit') {
        camera.up.set(0, 1, 0)
        controls.target.copy(prev === 'orbit' ? HOME_TARGET : new THREE.Vector3(camera.position.x, 0.6, camera.position.z))
        orbitTo(homePos(), HOME_TARGET.clone())
        return
      }
      if (prev === 'orbit') {
        syncAnglesFromCamera()
        const v = lastView ?? defaultView()
        fpTo(new THREE.Vector3(...v.pos), new THREE.Vector3(...v.target))
      } else if (m === 'walk') {
        landAt(camera.position)
        pitch = Math.max(-1.2, Math.min(1.2, pitch))
      }
    }

    engine.current = {
      setMode,
      setFloor(f) {
        floorMode = f
        applyVisibility()
        if (curMode === 'orbit' && f === 'upper' && !selectedId && !splat) {
          const tgt = new THREE.Vector3(M(UPPER.x + UPPER.w / 2), M(FLOOR_HEIGHT), M(UPPER.z + UPPER.d / 2))
          orbitTo(tgt.clone().add(new THREE.Vector3(-6, 11, 9)), tgt)
        }
      },
      select(id) {
        selectedId = id
        highlight()
        if (curMode !== 'orbit' || !id) return
        controls.autoRotate = false
        const r = ROOMS.find((x) => x.id === id)
        if (!r) return
        const tgt = centre(r)
        tgt.y += 0.4
        const span = Math.max(M(r.w), M(r.d))
        const dir = camera.position.clone().sub(controls.target).setY(0)
        if (dir.lengthSq() < 0.01) dir.set(-1, 0, 1)
        dir.normalize()
        const dist = (span * 1.6 + 7) * (portrait() ? 1.15 : 1)
        orbitTo(tgt.clone().add(dir.multiplyScalar(dist * 0.5)).setY(tgt.y + dist * 0.88), tgt)
      },
      goTo(v) {
        lastView = v
        const pos = new THREE.Vector3(...v.pos)
        const target = new THREE.Vector3(...v.target)
        if (curMode === 'orbit') {
          controls.autoRotate = false
          const back = pos.clone().sub(target).setY(0).normalize().multiplyScalar(6)
          orbitTo(pos.clone().add(back).setY(pos.y + 6), target)
        } else fpTo(pos, target)
      },
      reset() {
        selectedId = null
        highlight()
        if (curMode === 'orbit') orbitTo(homePos(), HOME_TARGET.clone())
        else {
          const v = defaultView()
          lastView = v
          fpTo(new THREE.Vector3(...v.pos), new THREE.Vector3(...v.target))
        }
      },
      setInput(k, on) {
        input[k] = on
      },
      getView() {
        const dir = new THREE.Vector3()
        camera.getWorldDirection(dir)
        const p = camera.position
        const t = p.clone().add(dir.multiplyScalar(2))
        const r = (n: number) => Math.round(n * 100) / 100
        return { pos: [r(p.x), r(p.y), r(p.z)], target: [r(t.x), r(t.y), r(t.z)] }
      },
    }

    // ----- splat scan -----
    if (splat) {
      cb.current.onSplat?.(0)
      import('@sparkjsdev/spark')
        .then(async ({ SparkRenderer, SplatMesh }) => {
          if (disposed) return
          const spark = new SparkRenderer({ renderer })
          scene.add(spark)
          const mesh = new SplatMesh({
            url: splat.url,
            // blob links carry no extension, so the type comes from the settings
            ...(splat.type ? { fileType: splat.type as never } : {}),
            onProgress: (e: ProgressEvent) => {
              if (e.lengthComputable && e.total) cb.current.onSplat?.(Math.min(0.99, e.loaded / e.total))
            },
          })
          if (splat.flip) mesh.quaternion.set(1, 0, 0, 0)
          mesh.scale.setScalar(splat.scale || 1)
          mesh.position.y = splat.y || 0
          scene.add(mesh)
          await mesh.initialized
          if (disposed) return
          splatReady = true
          applyVisibility()
          cb.current.onSplat?.('ready')
        })
        .catch((e) => {
          console.warn('splat load failed', e)
          if (!disposed) cb.current.onSplat?.('error')
        })
    }

    // ----- pointer: look, tap -----
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const drag = { on: false, id: -1, x: 0, y: 0, sx: 0, sy: 0 }
    let active = false
    const dom = renderer.domElement
    const onDown = (e: PointerEvent) => {
      active = true
      drag.on = true
      drag.id = e.pointerId
      drag.x = drag.sx = e.clientX
      drag.y = drag.sy = e.clientY
      if (curMode !== 'orbit') dom.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (!drag.on || e.pointerId !== drag.id || curMode === 'orbit') return
      const k = 0.0042
      yaw -= (e.clientX - drag.x) * k
      pitch = Math.max(-1.35, Math.min(1.35, pitch - (e.clientY - drag.y) * k))
      drag.x = e.clientX
      drag.y = e.clientY
      if (tween?.kind === 'fp') tween = null
    }
    const onUp = (e: PointerEvent) => {
      if (!drag.on || e.pointerId !== drag.id) return
      drag.on = false
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6 || splat) return
      const rect = dom.getBoundingClientRect()
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      if (curMode === 'orbit') {
        const visible = house.pickables.filter((m) => (ROOMS.find((r) => r.id === m.userData.roomId)?.floor === 1 ? floorMode !== 'ground' : floorMode !== 'upper'))
        const hit = ray.intersectObjects(visible, false)[0]
        cb.current.onSelect(hit ? (hit.object.userData.roomId as string) : null)
      } else {
        // a photo frame counts only when nothing solid is in front of it
        const hit = ray.intersectObjects([house.full, house.ground, house.upper], true)[0]
        if (hit && house.frames.includes(hit.object as THREE.Mesh) && hit.distance < 9) cb.current.onSelect(hit.object.userData.roomId as string)
      }
    }
    const onOutside = (e: PointerEvent) => {
      if (!el.parentElement?.contains(e.target as Node)) active = false
    }
    dom.addEventListener('pointerdown', onDown)
    dom.addEventListener('pointermove', onMove)
    dom.addEventListener('pointerup', onUp)
    dom.addEventListener('pointercancel', onUp)
    window.addEventListener('pointerdown', onOutside)

    // ----- keyboard -----
    const KEYS: Record<string, InputKey> = {
      KeyW: 'fwd', ArrowUp: 'fwd', KeyS: 'back', ArrowDown: 'back', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
      ShiftLeft: 'run', ShiftRight: 'run', Space: 'jump', KeyE: 'up', KeyQ: 'down',
    }
    const onKey = (e: KeyboardEvent) => {
      const k = KEYS[e.code]
      if (!k) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      const down = e.type === 'keydown'
      if (down && (!active || curMode === 'orbit')) return
      input[k] = down
      if (down && (e.code.startsWith('Arrow') || e.code === 'Space')) e.preventDefault()
    }
    const onBlur = () => {
      for (const k of Object.keys(input) as InputKey[]) input[k] = false
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    window.addEventListener('blur', onBlur)

    const ro = new ResizeObserver(() => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    })
    ro.observe(el)

    // ----- loop -----
    const v = new THREE.Vector3()
    const clock = new THREE.Clock()
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
    let whereKey = ''
    let whereTimer = 0
    let bob = 0

    function reportWhere(dt: number) {
      whereTimer += dt
      if (whereTimer < 0.25) return
      whereTimer = 0
      let place = ''
      let level = ''
      if (!splat && curMode !== 'orbit') {
        const p = camera.position
        const feet = curMode === 'walk' ? walk.y : p.y - EYE
        const onStairs = curMode === 'walk' && feet > 0.3 && feet < FH - 0.3
        const lvl = levelOf(feet)
        const r = roomAt(lvl, p.x * 1000, p.z * 1000)
        place = onStairs ? 'Tangga' : (r?.title ?? (lvl === 1 ? 'Tingkat atas' : 'Luar rumah'))
        level = onStairs ? 'Antara tingkat' : lvl === 1 ? 'Tingkat atas' : r && !r.open ? 'Tingkat bawah' : 'Luar'
      }
      const key = `${place}|${level}`
      if (key !== whereKey) {
        whereKey = key
        cb.current.onWhere?.(place, level)
      }
    }

    function frame() {
      const dt = Math.min(0.05, clock.getDelta())
      if (curMode === 'orbit') {
        if (tween?.kind === 'orbit') {
          tween.t = Math.min(1, tween.t + dt / 1.2)
          const k = ease(tween.t)
          camera.position.lerpVectors(tween.fromPos, tween.toPos, k)
          controls.target.lerpVectors(tween.fromT, tween.toT, k)
          if (tween.t >= 1) tween = null
        }
        controls.update()
      } else {
        if (tween?.kind === 'fp') {
          tween.t = Math.min(1, tween.t + dt / tween.dur)
          const k = ease(tween.t)
          camera.position.lerpVectors(tween.fromPos, tween.toPos, k)
          yaw = tween.fromYaw + (tween.toYaw - tween.fromYaw) * k
          pitch = tween.fromPitch + (tween.toPitch - tween.fromPitch) * k
          if (tween.t >= 1) {
            landAt(tween.toPos)
            walk.y = splat ? 0 : Math.max(0, walk.y)
            walk.grounded = true
            tween = null
          }
        } else {
          const f = (input.fwd ? 1 : 0) - (input.back ? 1 : 0)
          const s = (input.right ? 1 : 0) - (input.left ? 1 : 0)
          const sin = Math.sin(yaw)
          const cos = Math.cos(yaw)
          if (curMode === 'walk') {
            const sp = (input.run ? RUN_SPEED : WALK_SPEED) * dt
            let dx = (-sin * f + cos * s) * sp
            let dz = (-cos * f - sin * s) * sp
            if (f && s) {
              dx *= 0.7071
              dz *= 0.7071
            }
            if (splat) {
              walk.x += dx
              walk.z += dz
              if (input.jump && walk.grounded) {
                walk.vy = 4.6
                walk.grounded = false
              }
              if (!walk.grounded) {
                walk.vy -= 15 * dt
                walk.y += walk.vy * dt
                if (walk.y <= 0) {
                  walk.y = 0
                  walk.vy = 0
                  walk.grounded = true
                }
              }
            } else walk = stepWalk(walk, dx, dz, dt, colliders, input.jump)
            const moving = (f || s) && walk.grounded
            bob = moving && !reduceMotion ? bob + dt * (input.run ? 13 : 9) : 0
            camera.position.set(walk.x, walk.y + EYE + (moving && !reduceMotion ? Math.sin(bob) * 0.022 : 0), walk.z)
          } else {
            const sp = FLY_SPEED * (input.run ? 2.2 : 1) * dt
            const cp = Math.cos(pitch)
            camera.position.x += (-sin * cp * f + cos * s) * sp
            camera.position.z += (-cos * cp * f - sin * s) * sp
            camera.position.y += (Math.sin(pitch) * f + (input.up || input.jump ? 1 : 0) - (input.down ? 1 : 0)) * sp
            if (!splat) camera.position.y = Math.max(0.3, Math.min(40, camera.position.y))
          }
        }
        camera.rotation.set(pitch, yaw, 0)
        lamp.position.copy(camera.position)
      }

      if (house.water && !reduceMotion) house.water.color.setHSL(0.53, 0.5, 0.52 + Math.sin(clock.elapsedTime * 1.4) * 0.03)
      renderer.render(scene, camera)
      reportWhere(dt)

      if (curMode !== 'orbit') return
      const w = el!.clientWidth
      const h = el!.clientHeight
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
        b.style.transform = `translate(-50%, -50%) translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px)`
        b.style.opacity = '1'
        b.style.pointerEvents = 'auto'
        const sel = id === selectedId
        b.style.zIndex = sel ? '3' : r.floor === 1 ? '2' : '1'
        b.style.backgroundColor = sel ? '#e5cf72' : 'rgba(255,255,255,0.92)'
        b.style.color = sel ? '#2b1a11' : '#4b2e1e'
        b.style.setProperty('--tw-ring-color', sel ? '#9c7f24' : 'rgba(0,0,0,0.08)')
      }
    }

    applyVisibility()
    if (initial.current.mode !== 'orbit') setMode(initial.current.mode)
    renderer.setAnimationLoop(frame)

    return () => {
      disposed = true
      renderer.setAnimationLoop(null)
      ro.disconnect()
      controls.dispose()
      dom.removeEventListener('pointerdown', onDown)
      dom.removeEventListener('pointermove', onMove)
      dom.removeEventListener('pointerup', onUp)
      dom.removeEventListener('pointercancel', onUp)
      window.removeEventListener('pointerdown', onOutside)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.removeEventListener('blur', onBlur)
      house.dispose()
      scene.traverse((o) => {
        const d = o as unknown as { dispose?: () => void }
        if (o !== scene && typeof d.dispose === 'function' && !(o as THREE.Mesh).isMesh) d.dispose()
      })
      renderer.dispose()
      dom.remove()
      labelHost.innerHTML = ''
      engine.current = null
    }
    // photoKey and splatKey stand in for the photos and splat objects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, photoKey, splatKey])

  useEffect(() => {
    initial.current.mode = mode
    engine.current?.setMode(mode)
  }, [mode])

  useEffect(() => {
    initial.current.floor = floor
    engine.current?.setFloor(floor)
  }, [floor])

  useEffect(() => {
    engine.current?.select(selected)
  }, [selected])

  return (
    <div className={className} style={{ position: 'relative', overflow: 'hidden' }}>
      <div ref={host} className="absolute inset-0" />
      <div ref={labelsRef} className="pointer-events-none absolute inset-0 [&>button]:pointer-events-auto" />
    </div>
  )
})
