'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './satellite-map.module.css'

type Point = object
type Maps = {
  load: (callback: () => void) => void
  LatLng: new (lat: number, lng: number) => Point
  Map: new (element: HTMLElement, options: { center: Point; level: number; mapTypeId: number }) => { relayout: () => void; setCenter: (point: Point) => void }
  MapTypeId: { HYBRID: number }
  Marker: new (options: { position: Point; map: object }) => object
  Roadview: new (element: HTMLElement) => { setPanoId: (id: number, point: Point) => void }
  RoadviewClient: new () => { getNearestPanoId: (point: Point, radius: number, callback: (id: number | null) => void) => void }
}
declare global { interface Window { kakao?: { maps: Maps } } }
let sdk: Promise<Maps> | undefined
function loadMaps(key: string) {
  if (sdk) return sdk
  sdk = new Promise<Maps>((resolve, reject) => {
    const script = document.createElement('script')
    const timer = window.setTimeout(() => { script.remove(); reject(new Error('timeout')) }, 15000)
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`
    script.async = true
    script.onload = () => {
      if (!window.kakao?.maps) { clearTimeout(timer); reject(new Error('SDK unavailable')); return }
      window.kakao.maps.load(() => { clearTimeout(timer); resolve(window.kakao!.maps) })
    }
    script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('SDK failed')) }
    document.head.appendChild(script)
  }).catch(error => { sdk = undefined; throw error })
  return sdk
}

export function KakaoMap({ x, y, apiKey }: { x: number; y: number; apiKey: string }) {
  const [mode, setMode] = useState<'map' | 'roadview'>('map')
  const [status, setStatus] = useState('지도를 불러오고 있어요.')
  const [attempt, setAttempt] = useState(0)
  const container = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let active = true
    let observer: ResizeObserver | undefined
    const node = container.current!
    node.replaceChildren()
    setStatus(mode === 'map' ? '지도를 불러오고 있어요.' : '주변 로드뷰를 찾고 있어요.')
    const timeout = window.setTimeout(() => { if (active) setStatus('지도를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.') }, 20000)
    loadMaps(apiKey).then(maps => {
      if (!active) return
      const point = new maps.LatLng(y, x)
      if (mode === 'map') {
        const map = new maps.Map(node, { center: point, level: 2, mapTypeId: maps.MapTypeId.HYBRID })
        new maps.Marker({ position: point, map })
        observer = new ResizeObserver(() => { map.relayout(); map.setCenter(point) })
        observer.observe(node)
        clearTimeout(timeout)
        setStatus('')
      } else {
        new maps.RoadviewClient().getNearestPanoId(point, 100, id => {
          if (!active) return
          clearTimeout(timeout)
          if (!id) { setStatus('이 위치 주변에는 제공되는 로드뷰가 없어요. 위성지도로 확인해 주세요.'); return }
          new maps.Roadview(node).setPanoId(id, point)
          setStatus('')
        })
      }
    }).catch(() => { if (active) { clearTimeout(timeout); setStatus('지도를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.') } })
    return () => { active = false; clearTimeout(timeout); observer?.disconnect(); node.replaceChildren() }
  }, [apiKey, x, y, mode, attempt])
  return <>
    <div className={styles.controls} aria-label="지도 보기 방식">
      <button type="button" aria-pressed={mode === 'map'} onClick={() => setMode('map')}>위성지도</button>
      <button type="button" aria-pressed={mode === 'roadview'} onClick={() => setMode('roadview')}>로드뷰</button>
    </div>
    <div className={styles.image}>
      <div ref={container} className={styles.canvas} aria-label={mode === 'map' ? '카카오 위성지도' : '카카오 로드뷰'} />
      {status && <div className={styles.message} role="status"><span>{status}</span>{status.includes('못했어요') && <button type="button" className={styles.retry} onClick={() => setAttempt(n => n + 1)}>다시 불러오기</button>}</div>}
    </div>
  </>
}
