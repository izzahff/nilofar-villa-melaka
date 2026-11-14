/**
 * First person walking rules for the house model, in metres.
 * Plain TypeScript (no Three.js) so it can run in Node tests.
 */
import { FLOOR_HEIGHT, STAIRS, UPPER, wallSegments } from './house'

export const EYE = 1.6
export const RADIUS = 0.26
/** Highest ledge the guest steps onto without jumping */
export const STEP = 0.45
/** Anything between STEP and HEAD above the feet blocks the way */
export const HEAD = 1.9
export const FH = FLOOR_HEIGHT / 1000
const GRAVITY = 15
const JUMP = 4.6

export interface Collider {
  x1: number
  z1: number
  x2: number
  z2: number
  /** Active while the feet are at or above yMin and below yMax */
  yMin: number
  yMax: number
}

const seg = (x1: number, z1: number, x2: number, z2: number, yMin = -50, yMax = 50): Collider => ({ x1, z1, x2, z2, yMin, yMax })

/** Stair void and upper floor outline in metres */
export const VOID = { x0: STAIRS.x0 / 1000, x1: STAIRS.x1 / 1000, z0: STAIRS.z0 / 1000, z1: STAIRS.z1 / 1000 }
export const UPPER_M = { x0: UPPER.x / 1000, x1: (UPPER.x + UPPER.w) / 1000, z0: UPPER.z / 1000, z1: (UPPER.z + UPPER.d) / 1000 }
export const POOL = { x0: 1.2, x1: 6.69, z0: -2.0, z1: 0.13 }
export const LOT = { x0: -1.25, x1: 14.95, z0: -2.6, z1: 21.8, gate0: 2.4, gate1: 9.2 }

export function buildColliders(): Collider[] {
  const split = FH - 0.25
  const out: Collider[] = wallSegments().map((w) => seg(w.x1, w.z1, w.x2, w.z2, w.floor === 1 ? split : -50, w.floor === 1 ? 50 : split))
  // Railing round the stair void upstairs, open on the west where the stairs arrive
  out.push(seg(VOID.x0, VOID.z0, VOID.x1, VOID.z0, split), seg(VOID.x0, VOID.z1, VOID.x1, VOID.z1, split))
  // Pool rim
  const p = POOL
  out.push(seg(p.x0, p.z0, p.x1, p.z0), seg(p.x1, p.z0, p.x1, p.z1), seg(p.x1, p.z1, p.x0, p.z1), seg(p.x0, p.z1, p.x0, p.z0))
  // Lot fence with the gate, and the road in front
  const l = LOT
  out.push(seg(l.x0, l.z0, l.x1, l.z0), seg(l.x0, l.z0, l.x0, l.z1), seg(l.x1, l.z0, l.x1, l.z1))
  out.push(seg(l.x0, l.z1, l.gate0, l.z1), seg(l.gate1, l.z1, l.x1, l.z1))
  out.push(seg(-4, l.z1, -4, 28), seg(18, l.z1, 18, 28), seg(-4, 28, 18, 28), seg(-4, l.z1, l.x0, l.z1), seg(l.x1, l.z1, 18, l.z1))
  return out
}

const inRect = (x: number, z: number, r: { x0: number; x1: number; z0: number; z1: number }) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1

/** Height of the stair ramp at x: 0 at the living room end (east), a full floor at the family room end (west). */
export function rampHeight(x: number) {
  const t = (VOID.x1 - x) / (VOID.x1 - VOID.x0)
  return Math.min(1, Math.max(0, t)) * FH
}

/** Walkable surfaces under a point */
export function surfaces(x: number, z: number): number[] {
  const s = [0]
  const onStairs = inRect(x, z, VOID)
  if (onStairs) s.push(rampHeight(x))
  if (!onStairs && inRect(x, z, UPPER_M)) s.push(FH)
  return s
}

export function floorAt(x: number, z: number, feet: number) {
  let best = -Infinity
  for (const h of surfaces(x, z)) if (h <= feet + STEP && h > best) best = h
  return best === -Infinity ? 0 : best
}

export function blockedAt(x: number, z: number, feet: number) {
  return surfaces(x, z).some((h) => h > feet + STEP && h < feet + HEAD)
}

export interface WalkState {
  x: number
  z: number
  /** Feet height */
  y: number
  vy: number
  grounded: boolean
}

function pushOut(st: { x: number; z: number }, c: Collider) {
  const dx = c.x2 - c.x1
  const dz = c.z2 - c.z1
  const len2 = dx * dx + dz * dz || 1e-9
  const t = Math.max(0, Math.min(1, ((st.x - c.x1) * dx + (st.z - c.z1) * dz) / len2))
  const px = c.x1 + dx * t
  const pz = c.z1 + dz * t
  const ox = st.x - px
  const oz = st.z - pz
  const d = Math.hypot(ox, oz)
  if (d >= RADIUS) return false
  if (d < 1e-6) {
    // exactly on the line: push along the normal
    const n = Math.hypot(dx, dz) || 1
    st.x += (-dz / n) * RADIUS
    st.z += (dx / n) * RADIUS
  } else {
    st.x = px + (ox / d) * RADIUS
    st.z = pz + (oz / d) * RADIUS
  }
  return true
}

/** Moves the walker by (dx, dz) metres with walls, ledges and gravity. */
export function stepWalk(st: WalkState, dx: number, dz: number, dt: number, colliders: Collider[], jump = false): WalkState {
  const next = { ...st }
  const active = colliders.filter((c) => st.y >= c.yMin && st.y < c.yMax)
  // Sub steps keep fast runs from tunnelling through thin walls
  const n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (RADIUS * 0.5)))
  for (let i = 0; i < n; i++) {
    const cand = { x: next.x + dx / n, z: next.z + dz / n }
    for (let k = 0; k < 3; k++) for (const c of active) pushOut(cand, c)
    if (!blockedAt(cand.x, cand.z, next.y)) {
      next.x = cand.x
      next.z = cand.z
    } else if (!blockedAt(cand.x, next.z, next.y)) {
      next.x = cand.x
    } else if (!blockedAt(next.x, cand.z, next.y)) {
      next.z = cand.z
    }
  }

  const floor = floorAt(next.x, next.z, next.y)
  if (jump && st.grounded) {
    next.vy = JUMP
    next.grounded = false
  }
  if (next.grounded && floor >= next.y - 0.35 && next.vy <= 0) {
    // stay glued to floors and ramps, step up small ledges
    next.y = floor
    next.vy = 0
  } else {
    next.vy -= GRAVITY * dt
    next.y += next.vy * dt
    if (next.y <= floor) {
      next.y = floor
      next.vy = 0
      next.grounded = true
    } else next.grounded = false
  }
  return next
}

/** Which floor the feet are on, for labels and room lookup */
export const levelOf = (feet: number): 0 | 1 => (feet > FH - 0.6 ? 1 : 0)
