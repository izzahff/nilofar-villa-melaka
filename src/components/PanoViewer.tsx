import { Viewer } from '@photo-sphere-viewer/core'
import '@photo-sphere-viewer/core/index.css'
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin'
import { GyroscopePlugin } from '@photo-sphere-viewer/gyroscope-plugin'
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin'
import '@photo-sphere-viewer/markers-plugin/index.css'
import { useEffect, useRef } from 'react'
import type { TourScene } from '../lib/types'

interface Props {
  scene: TourScene
  /** All scenes, so the rooms a hotspot leads to load before the guest taps it */
  scenes?: TourScene[]
  onNavigate?: (sceneId: string) => void
  onPick?: (pos: { yaw: number; pitch: number }) => void
  /** Open with the "little planet" fly-in */
  intro?: boolean
  reduceMotion?: boolean
  className?: string
}

const esc = (s: string) => s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!)

const hotspotHtml = (label: string) =>
  `<div class="nv-hotspot"><span class="nv-hotspot-dot"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></span><span class="nv-hotspot-label">${esc(label)}</span></div>`

const ease = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * 360 viewer in the style of commercial virtual tours: little planet intro,
 * slow rotation when idle, walk-in zoom and cross fade between rooms,
 * gyroscope on phones. `onPick` lets the admin click to place a hotspot.
 */
export function PanoViewer({ scene, scenes, onNavigate, onPick, intro, reduceMotion, className }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const viewer = useRef<Viewer | null>(null)
  const ready = useRef(false)
  const busy = useRef(false)
  const cb = useRef({ onNavigate, onPick })
  useEffect(() => {
    cb.current = { onNavigate, onPick }
  }, [onNavigate, onPick])
  const editing = !!onPick
  const motionOk = !reduceMotion && !editing

  useEffect(() => {
    if (!el.current) return
    const yaw0 = Number(scene.initial_yaw) || 0
    const fly = !!intro && motionOk
    const v = new Viewer({
      container: el.current,
      panorama: scene.image_url,
      defaultYaw: fly ? yaw0 - 1.4 : yaw0,
      defaultPitch: fly ? -Math.PI / 2 : 0,
      defaultZoomLvl: fly ? 0 : 50,
      fisheye: fly ? 2 : false,
      navbar: editing ? ['zoom', 'move', 'fullscreen'] : ['autorotate', 'zoom', 'gyroscope', 'fullscreen'],
      loadingTxt: 'Memuatkan...',
      lang: {
        zoomIn: 'Zum masuk',
        zoomOut: 'Zum keluar',
        fullscreen: 'Skrin penuh',
        move: 'Gerak',
        autorotate: 'Putar automatik',
        gyroscope: 'Gerak telefon',
      } as never,
      touchmoveTwoFingers: false,
      mousewheelCtrlKey: true,
      moveInertia: 0.9,
      plugins: [
        MarkersPlugin,
        [AutorotatePlugin, { autostartDelay: motionOk ? 3500 : null, autostartOnIdle: motionOk, autorotateSpeed: '0.6rpm', autorotatePitch: '-2deg' }],
        GyroscopePlugin,
      ],
    })
    viewer.current = v
    const markers = v.getPlugin(MarkersPlugin) as MarkersPlugin
    const auto = v.getPlugin(AutorotatePlugin) as AutorotatePlugin

    markers.addEventListener('select-marker', (e) => {
      const target = (e.marker.config.data as { target?: string } | undefined)?.target
      if (!target || busy.current) return
      busy.current = true
      auto.stop()
      const pos = e.marker.config.position as { yaw: number; pitch: number }
      // Turn toward the doorway and step in, then the next room fades in
      if (motionOk) {
        v.animate({ yaw: pos.yaw, pitch: Math.max(-0.2, Math.min(0.2, pos.pitch)), zoom: 85, speed: 750 }).then(() => cb.current.onNavigate?.(target))
      } else cb.current.onNavigate?.(target)
    })
    v.addEventListener('click', (e) => {
      cb.current.onPick?.({ yaw: e.data.yaw, pitch: e.data.pitch })
    })

    let raf = 0
    v.addEventListener(
      'ready',
      () => {
        ready.current = true
        if (!fly) return
        auto.stop()
        const start = performance.now()
        const dur = 2600
        const step = (now: number) => {
          const k = ease(Math.min(1, (now - start) / dur))
          v.setOption('fisheye', 2 * (1 - k))
          v.rotate({ yaw: yaw0 - 1.4 * (1 - k), pitch: (-Math.PI / 2) * (1 - k) })
          v.zoom(50 * k)
          if (k < 1) raf = requestAnimationFrame(step)
          else auto.start()
        }
        raf = requestAnimationFrame(step)
      },
      { once: true },
    )

    return () => {
      cancelAnimationFrame(raf)
      v.destroy()
      viewer.current = null
      ready.current = false
    }
    // The viewer is created once; scene changes are handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const v = viewer.current
    if (!v) return
    const markers = v.getPlugin(MarkersPlugin) as MarkersPlugin
    let cancelled = false
    const apply = () => {
      busy.current = false
      if (cancelled) return
      markers.setMarkers(
        scene.hotspots.map((h, i) => ({
          id: `h${i}`,
          position: { yaw: h.yaw, pitch: h.pitch },
          html: hotspotHtml(h.label),
          anchor: 'center center',
          data: { target: h.target_id },
        })),
      )
    }
    if (v.config.panorama !== scene.image_url) {
      markers.clearMarkers()
      v.setPanorama(scene.image_url, {
        transition: motionOk ? { speed: 1100, rotation: false, effect: 'fade' } : false,
        position: { yaw: Number(scene.initial_yaw) || 0, pitch: 0 },
        zoom: 50,
      }).then(apply, apply)
    } else apply()

    // Warm the cache for the rooms this one leads to
    const next = scene.hotspots.map((h) => scenes?.find((s) => s.id === h.target_id)?.image_url).filter(Boolean) as string[]
    const imgs = next.map((u) => {
      const i = new Image()
      i.decoding = 'async'
      i.src = u
      return i
    })
    return () => {
      cancelled = true
      imgs.length = 0
    }
  }, [scene, scenes, motionOk])

  return <div ref={el} className={className} />
}
