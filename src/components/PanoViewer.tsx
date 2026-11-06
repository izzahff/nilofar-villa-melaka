import { Viewer } from '@photo-sphere-viewer/core'
import '@photo-sphere-viewer/core/index.css'
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin'
import '@photo-sphere-viewer/markers-plugin/index.css'
import { useEffect, useRef } from 'react'
import type { TourScene } from '../lib/types'

interface Props {
  scene: TourScene
  onNavigate?: (sceneId: string) => void
  onPick?: (pos: { yaw: number; pitch: number }) => void
  className?: string
}

const hotspotHtml = (label: string) =>
  `<div style="display:flex;align-items:center;gap:6px;padding:6px 12px 6px 6px;border-radius:999px;background:rgba(20,40,35,.78);backdrop-filter:blur(8px);color:#fff;font:600 13px Inter,system-ui;box-shadow:0 8px 24px -8px rgba(0,0,0,.5);border:1px solid rgba(201,166,107,.7);cursor:pointer;white-space:nowrap">
     <span style="display:grid;place-items:center;width:22px;height:22px;border-radius:999px;background:#C9A66B;color:#142823">➜</span>${label.replace(/</g, '&lt;')}</div>`

/** 360 viewer with hotspots. `onPick` lets the admin click to place a hotspot. */
export function PanoViewer({ scene, onNavigate, onPick, className }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const viewer = useRef<Viewer | null>(null)
  const navRef = useRef(onNavigate)
  const pickRef = useRef(onPick)
  navRef.current = onNavigate
  pickRef.current = onPick

  useEffect(() => {
    if (!el.current) return
    const v = new Viewer({
      container: el.current,
      panorama: scene.image_url,
      defaultYaw: Number(scene.initial_yaw) || 0,
      navbar: ['zoom', 'move', 'fullscreen'],
      loadingTxt: 'Memuatkan...',
      lang: { zoomIn: 'Zum masuk', zoomOut: 'Zum keluar', fullscreen: 'Skrin penuh', move: 'Gerak' } as never,
      touchmoveTwoFingers: false,
      mousewheelCtrlKey: true,
      plugins: [MarkersPlugin],
    })
    viewer.current = v
    const markers = v.getPlugin(MarkersPlugin) as MarkersPlugin
    markers.addEventListener('select-marker', (e) => {
      const target = (e.marker.config.data as { target?: string } | undefined)?.target
      if (target) navRef.current?.(target)
    })
    v.addEventListener('click', (e) => {
      if (pickRef.current) pickRef.current({ yaw: e.data.yaw, pitch: e.data.pitch })
    })
    return () => {
      v.destroy()
      viewer.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const v = viewer.current
    if (!v) return
    const markers = v.getPlugin(MarkersPlugin) as MarkersPlugin
    let cancelled = false
    const apply = () => {
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
      v.setPanorama(scene.image_url, { transition: { speed: 900 }, position: { yaw: Number(scene.initial_yaw) || 0, pitch: 0 } }).then(apply)
    } else apply()
    return () => {
      cancelled = true
    }
  }, [scene])

  return <div ref={el} className={className} />
}
