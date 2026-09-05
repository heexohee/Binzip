import { NextResponse } from 'next/server'

/**
 * 항공영상 프록시 (VWorld basemap=PHOTO).
 *
 * 프록시를 두는 이유는 하나 — 키를 서버에만 두기 위해서다 (next.config.ts 원칙).
 * 좌표를 그대로 받으므로 오픈 프록시로 쓰이지 않게 한국 범위로 제한하고 크기를 고정한다.
 */
const ENDPOINT = 'https://api.vworld.kr/req/image'
const SIZE = '560,320'

/** 대한민국 경위도 대략 범위. 이 밖은 우리 서비스 대상이 아니다. */
const BOUNDS = { xMin: 124, xMax: 132, yMin: 33, yMax: 39 }

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams
  const x = Number(q.get('x'))
  const y = Number(q.get('y'))
  const zoom = Math.min(19, Math.max(15, Number(q.get('zoom')) || 18))

  const inKorea =
    Number.isFinite(x) && Number.isFinite(y) &&
    x >= BOUNDS.xMin && x <= BOUNDS.xMax &&
    y >= BOUNDS.yMin && y <= BOUNDS.yMax
  if (!inKorea) {
    return NextResponse.json({ error: 'OUT_OF_BOUNDS' }, { status: 400 })
  }

  const key = process.env.VWORLD_KEY
  if (!key) return NextResponse.json({ error: 'NO_KEY' }, { status: 503 })

  const params = new URLSearchParams({
    service: 'image',
    request: 'getmap',
    // 항공사진은 사진 데이터다. jpeg 가 png 의 1/12 (379KB → 31KB) —
    // 시골 모바일 환경이 주 사용처라 용량이 곧 로딩 실패다.
    format: 'jpeg',
    basemap: 'PHOTO',
    crs: 'EPSG:4326',
    center: x + ',' + y,
    zoom: String(zoom),
    size: SIZE,
    key,
  })
  const domain = process.env.VWORLD_DOMAIN
  if (domain) params.set('domain', domain)

  try {
    const upstream = await fetch(ENDPOINT + '?' + params.toString())
    const type = upstream.headers.get('content-type') ?? ''
    if (!upstream.ok || !type.startsWith('image/')) {
      // VWorld 응답 본문에는 키가 들어 있지 않다 (키는 요청 URL 에만 있다).
      const detail = (await upstream.text().catch(() => '')).slice(0, 200)
      console.error('[api/map] 상단 거부', upstream.status, type, detail)
      return NextResponse.json(
        { error: 'UPSTREAM_FAILED', status: upstream.status, detail },
        { status: 502 },
      )
    }
    return new NextResponse(upstream.body, {
      headers: {
        'Content-Type': type,
        // 같은 필지의 항공영상은 바뀌지 않는다
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    })
  } catch (e) {
    console.error('[api/map] 항공영상 조회 실패', e)
    return NextResponse.json({ error: 'UPSTREAM_FAILED' }, { status: 502 })
  }
}
