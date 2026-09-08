import { callDataGoKr, toArray } from './client'

/**
 * 국토교통부 실거래가 — 토지 매매 / 단독·다가구 매매.
 *
 * 이 어댑터가 필요한 이유는 하나다.
 * 소유주가 자기 땅에 대해 제일 모르는 것이 "얼마인가"이고,
 * 우리가 가진 다른 공부(지목·면적·도로·규제)는 대부분 이미 알고 있다.
 * 즉 '몰랐던 정보'의 최대 기여 항목이다.
 *
 * ⚠️ API 는 시군구 + 계약월 단위로만 준다. 필지 단위 조회가 아니다.
 *    게다가 지번은 개인정보 보호로 일부만 제공된다.
 *    그래서 '주변 500m' 는 만들 수 없고, 같은 법정동(리) 단위가 최선이다.
 *    시골에서는 같은 리면 충분히 가깝다.
 */

const ENDPOINT = {
  land: 'https://apis.data.go.kr/1613000/RTMSDataSvcLandTrade/getRTMSDataSvcLandTrade',
  house: 'https://apis.data.go.kr/1613000/RTMSDataSvcSHTrade/getRTMSDataSvcSHTrade',
} as const

export type DealKind = keyof typeof ENDPOINT

export type Deal = {
  kind: DealKind
  /** 법정동명. 응답이 '산대리' 인지 '안강읍 산대리' 인지는 실호출로 확인한다 */
  umdNm: string | null
  /** 지번. 국토부가 일부만 제공한다 — 필지 특정에 쓰면 안 된다 */
  jibun: string | null
  /** YYYY-MM-DD */
  dealDate: string | null
  /** 원 단위. 응답은 만원이라 10,000 을 곱해 둔다 */
  amount: number | null
  /** ㎡. 토지는 거래면적, 주택은 대지면적 */
  area: number | null
  /** 원/㎡ */
  unitPrice: number | null
  /** 토지만 */
  jimok: string | null
  /** 토지만 */
  landUse: string | null
  /** 주택만 */
  buildYear: string | null
  /** 주택만. 연면적 ㎡ */
  floorArea: number | null
  /** 중개 / 직거래 */
  dealingGbn: string | null
}

const str = (v: unknown): string | null => {
  const t = String(v ?? '').trim()
  return t === '' ? null : t
}

const num = (v: unknown): number | null => {
  const t = String(v ?? '').replace(/[,\s]/g, '')
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

/** "  12,000" → 120000000 (만원 → 원). 콤마와 공백이 섞여 온다 */
export function wonFromManwon(v: unknown): number | null {
  const n = num(v)
  return n != null && n > 0 ? n * 10_000 : null
}

/**
 * 해제된 거래인가.
 *
 * cdealType 의 값 규약이 명세에 없다. 'O'(해제) 만 오는 관행과
 * 'N'/'O' 둘 다 오는 관행이 모두 있어 양쪽을 흡수한다.
 * 해제된 거래를 시세로 쓰면 안 된다 — 실제로 성립하지 않은 가격이다.
 */
export function isCancelled(cdealType: unknown): boolean {
  const t = String(cdealType ?? '').trim().toUpperCase()
  return t !== '' && t !== 'N'
}

/** 오늘로부터 거슬러 최근 months 개월의 YYYYMM. 최신이 앞에 온다 */
export function dealYmds(months: number, from = new Date()): string[] {
  const out: string[] = []
  const d = new Date(from.getFullYear(), from.getMonth(), 1)
  for (let i = 0; i < months; i++) {
    out.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`)
    d.setMonth(d.getMonth() - 1)
  }
  return out
}

const dateOf = (y: unknown, m: unknown, d: unknown): string | null => {
  const yy = str(y)
  const mm = str(m)
  const dd = str(d)
  if (!yy || !mm || !dd) return null
  return `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

export function toDeal(row: Record<string, unknown>, kind: DealKind): Deal {
  const amount = wonFromManwon(row.dealAmount)
  const area = kind === 'land' ? num(row.dealArea) : num(row.plottageAr)
  return {
    kind,
    umdNm: str(row.umdNm),
    jibun: str(row.jibun),
    dealDate: dateOf(row.dealYear, row.dealMonth, row.dealDay),
    amount,
    area,
    unitPrice: amount != null && area != null && area > 0 ? Math.round(amount / area) : null,
    jimok: kind === 'land' ? str(row.jimok) : null,
    landUse: kind === 'land' ? str(row.landUse) : null,
    buildYear: kind === 'house' ? str(row.buildYear) : null,
    floorArea: kind === 'house' ? num(row.totalFloorAr) : null,
    dealingGbn: str(row.dealingGbn),
  }
}

type Body = { items?: { item?: unknown } | null; totalCount?: number }

/**
 * 한 달치 조회. 자료가 없는 달은 빈 배열이며 오류가 아니다.
 *
 * numOfRows·pageNo 는 Swagger 파라미터 목록에 없지만 공공API 공통 규약이라
 * 넣어 둔다. 무시되더라도 해가 없고, 먹히면 페이지 누락을 막는다.
 * 실호출로 확인할 것 — scripts/verify-transaction.ts 가 totalCount 를 찍는다.
 */
async function fetchMonth(kind: DealKind, sigunguCd: string, ymd: string): Promise<Deal[]> {
  const body = await callDataGoKr<Body>(ENDPOINT[kind], {
    LAWD_CD: sigunguCd,
    DEAL_YMD: ymd,
    numOfRows: '1000',
    pageNo: '1',
  })
  const rows = toArray(body?.items?.item) as Record<string, unknown>[]
  // 해제 판정은 원본 행에서 한다. Deal 로 바꾼 뒤에는 cdealType 이 없다.
  return rows.filter((r) => !isCancelled(r.cdealType)).map((r) => toDeal(r, kind))
}

export type ComparableCriteria = {
  /** 대상 필지의 지목 */
  jimok?: string | null
  /** 대상 필지의 용도지역 */
  landUse?: string | null
  /** 대상 건물의 사용승인 연도. ±10년 안을 비교 가능으로 본다 */
  buildYear?: number | null
}

export type DealQuery = ComparableCriteria & {
  /** 시군구 5자리. address.sigunguCd 를 그대로 넣는다 */
  sigunguCd: string
  /** 법정동명. '산대리' 처럼 리 이름. 부분일치로 거른다 */
  umdName?: string | null
  /** 몇 개월치를 볼 것인가. 시골은 거래가 드물어 기본 12개월 */
  months?: number
  kinds?: DealKind[]
}

export type DealResult = {
  /** 같은 리로 좁힌 거래 */
  nearby: Deal[]
  /** 같은 리 + 지목·용도지역(토지) 또는 건축년도대(주택)까지 맞춘 거래 */
  comparable: Deal[]
  /** 비교 가능 거래의 원/㎡ 중앙값 */
  medianUnitPrice: number | null
  months: number
  /** 조회에 실패한 (종류/계약월). '자료 없음' 과 '조회 실패' 를 구분하기 위해 남긴다 */
  failures: string[]
}

/**
 * "근처에 뭐가 팔렸다" 보다 "당신 것과 같은 조건이 이만큼에 팔렸다" 가 훨씬 세다.
 * 지목·용도지역이 다르면 같은 리라도 가격 성격이 달라 비교 대상에서 뺀다.
 * 대상 값이 없으면(null) 거르지 않는다 — 모르는 것을 이유로 버리지 않는다.
 */
export function pickComparable(deals: Deal[], c: ComparableCriteria): Deal[] {
  return deals.filter((d) => {
    if (d.kind === 'land') {
      if (c.jimok && d.jimok && d.jimok !== c.jimok) return false
      if (c.landUse && d.landUse && !d.landUse.includes(c.landUse) && !c.landUse.includes(d.landUse)) {
        return false
      }
      return true
    }
    if (c.buildYear && d.buildYear) {
      const y = Number(d.buildYear)
      if (Number.isFinite(y) && Math.abs(y - c.buildYear) > 10) return false
    }
    return true
  })
}

/** 원/㎡ 중앙값. 평균은 한 건에 끌려가므로 쓰지 않는다 */
export function medianUnitPrice(deals: Deal[]): number | null {
  const xs = deals
    .map((d) => d.unitPrice)
    .filter((n): n is number => n != null && n > 0)
    .sort((a, b) => a - b)
  if (xs.length === 0) return null
  const mid = Math.floor(xs.length / 2)
  if (xs.length % 2) return xs[mid] ?? null
  const lo = xs[mid - 1]
  const hi = xs[mid]
  return lo != null && hi != null ? Math.round((lo + hi) / 2) : null
}

/**
 * 같은 리의 최근 실거래를 모은다.
 *
 * 한 달이 실패해도 나머지는 살리고, 실패한 달을 failures 에 남긴다.
 * 전부 실패했는데 '거래 없음' 으로 보이면 소유주에게 거짓말이 된다.
 */
export async function getDeals(q: DealQuery): Promise<DealResult> {
  const months = q.months ?? 12
  const kinds = q.kinds ?? (['land', 'house'] as DealKind[])
  const ymds = dealYmds(months)
  const failures: string[] = []

  const chunks = await Promise.all(
    kinds.flatMap((kind) =>
      ymds.map(async (ymd) => {
        try {
          return await fetchMonth(kind, q.sigunguCd, ymd)
        } catch (e) {
          failures.push(`${kind}/${ymd}: ${(e as Error).message}`)
          return [] as Deal[]
        }
      }),
    ),
  )

  const all = chunks.flat()
  const nearby = q.umdName
    ? all.filter((d) => d.umdNm != null && d.umdNm.includes(q.umdName!))
    : all
  nearby.sort((a, b) => (b.dealDate ?? '').localeCompare(a.dealDate ?? ''))

  const comparable = pickComparable(nearby, q)

  return { nearby, comparable, medianUnitPrice: medianUnitPrice(comparable), months, failures }
}

/** '경상북도 경주시 안강읍 산대리 27-5' → '산대리' */
export function riFromJibunAddress(jibunAddress: string | null | undefined): string | null {
  const m = String(jibunAddress ?? '').match(/(\S+[리동])(?=\s|$)/g)
  return m?.[m.length - 1] ?? null
}
