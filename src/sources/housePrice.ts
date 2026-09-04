import { callDataGoKr, toArray as toArrayDG } from './client'
import { callVWorld, toArray as toArrayVW } from './vworld'

/**
 * 개별주택가격 — 2단계 게이트(공시가 1억 이하).
 *
 * 같은 국가공간정보 데이터를 두 창구가 제공하며 인증키가 다르다.
 *   vworld   → VWORLD_KEY      (연속지적도·정사영상과 키 공유. 기본값)
 *   datagokr → DATA_GO_KR_KEY  (토지이용규제·실거래가와 키 공유)
 *
 * ⚠️ 엔드포인트와 응답 필드명은 '개별주택가격속성조회' 활용가이드로 확정할 것.
 *    아래 값은 자리표시자이며 .env 로 덮어쓸 수 있다.
 */
const PROVIDER = (process.env.HOUSE_PRICE_PROVIDER ?? 'vworld') as 'vworld' | 'datagokr'

const VWORLD_ENDPOINT =
  process.env.HOUSE_PRICE_ENDPOINT ??
  'https://api.vworld.kr/ned/data/getIndvdHousingPriceAttr'

const DATAGOKR_ENDPOINT =
  process.env.HOUSE_PRICE_ENDPOINT ??
  'https://apis.data.go.kr/1611000/nsdi/IndvdHousingPriceService/attr/getIndvdHousingPrice'

export type HousePrice = {
  /** 원 단위 공시가격 */
  value: number | null
  /** 기준연도 */
  year: string | null
  provider: 'vworld' | 'datagokr'
  /** 필드명 확정 전 디버깅용 원본 */
  raw: unknown
}

/** 응답 어디에 배열이 들어있든 찾아낸다. 배포본마다 래핑이 달라서 방어적으로 판다. */
function pickItems(body: any): any[] {
  const candidates = [
    body?.indvdHousingPrices?.field,
    body?.response?.result?.featureCollection?.features,
    body?.response?.result,
    body?.items?.item,
    body?.field,
    body?.items,
  ]
  for (const c of candidates) {
    const arr = Array.isArray(c) ? c : c ? [c] : []
    if (arr.length) return arr
  }
  return []
}

const NUM = (v: unknown) => {
  const n = Number(String(v ?? '').replace(/[,\s]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

export async function getHousePrice(pnu: string): Promise<HousePrice> {
  const params = { pnu, format: 'json', numOfRows: '10', pageNo: '1', _type: 'json' }

  const body =
    PROVIDER === 'vworld'
      ? await callVWorld<any>(VWORLD_ENDPOINT, params)
      : await callDataGoKr<any>(DATAGOKR_ENDPOINT, params)

  const items = pickItems(body)
  if (!items.length) return { value: null, year: null, provider: PROVIDER, raw: body }

  const yearOf = (it: any) => String(it?.stdrYear ?? it?.baseYear ?? it?.properties?.stdrYear ?? '')
  const priceOf = (it: any) =>
    NUM(it?.housingPrice ?? it?.pblntfPc ?? it?.price ?? it?.properties?.housingPrice)

  // 최신 연도 우선
  const sorted = [...items].sort((a, b) => yearOf(b).localeCompare(yearOf(a)))
  const it = sorted[0]

  return {
    value: priceOf(it),
    year: yearOf(it) || null,
    provider: PROVIDER,
    raw: it,
  }
}
