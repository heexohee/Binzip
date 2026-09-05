/**
 * 주소 → 좌표 (경위도).
 *
 * juso 창구는 좌표를 주지 않으므로(src/address.ts) 좌표는 여기서 따로 얻는다.
 * 카카오 로컬은 시골 지번 주소를 못 찾는 경우가 있어(호미곶면 대보리 1-12 → 0건)
 * 이미 인증된 VWorld 지오코더를 쓴다. 키가 하나로 정리되는 이점도 있다.
 */
const ENDPOINT = 'https://api.vworld.kr/req/address'

export type Coords = { x: number; y: number }

export async function geocodeParcel(address: string): Promise<Coords | null> {
  const key = process.env.VWORLD_KEY
  const domain = process.env.VWORLD_DOMAIN
  if (!key) return null

  const params = new URLSearchParams({
    service: 'address',
    request: 'getcoord',
    version: '2.0',
    crs: 'epsg:4326',
    type: 'PARCEL',
    format: 'json',
    simple: 'true',
    address,
    key,
  })
  if (domain) params.set('domain', domain)

  const res = await fetch(ENDPOINT + '?' + params.toString(), { cache: 'no-store' })
  if (!res.ok) return null

  const body = (await res.json()) as {
    response?: { status?: string; result?: { point?: { x?: string; y?: string } } }
  }
  if (body.response?.status !== 'OK') return null

  const p = body.response.result?.point
  const x = Number(p?.x)
  const y = Number(p?.y)
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null
}
