'use client'

import { useState } from 'react'
import styles from './satellite-map.module.css'

type Props = { address: string; x: number | null; y: number | null }

export function SatelliteMap(props: Props) {
  if (props.x === null || props.y === null) return <p className={styles.missing}>지도 위치를 찾지 못했어요. 주소가 맞는지 확인하면 다음 단계로 진행할 수 있어요.</p>
  return <MapImage key={`${props.x},${props.y}`} {...props} x={props.x} y={props.y} />
}

function MapImage({ address, x, y }: Props & { x: number; y: number }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  return <figure className={styles.figure}>
    <div className={styles.image} aria-busy={status === 'loading'}>
      <img key={attempt} src={`/api/map?x=${x}&y=${y}&zoom=18&attempt=${attempt}`} width={560} height={320}
        alt={`${address} 주변의 위성·항공사진`} className={status === 'ready' ? undefined : styles.hidden}
        onLoad={() => setStatus('ready')} onError={() => setStatus('error')} />
      {status === 'ready' ? <span className={styles.marker} aria-hidden="true" /> : <div className={styles.message} role="status">
        <span>{status === 'loading' ? '위성 지도를 불러오고 있어요.' : '위성 지도를 불러오지 못했어요.'}</span>
        {status === 'error' && <button type="button" className={styles.retry} onClick={() => { setStatus('loading'); setAttempt(value => value + 1) }}>지도 다시 불러오기</button>}
      </div>}
    </div>
    <figcaption>{status === 'error' ? '주소가 맞으면 지도 없이도 다음 단계로 진행할 수 있어요. ' : ''}위성·항공사진 제공: VWorld · 표시점은 주소 조회 좌표이며 대지 경계가 아니에요. 촬영 시점에 따라 현재 모습과 다를 수 있어요.</figcaption>
  </figure>
}
