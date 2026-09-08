import taxJson from './rules/tax.json' with { type: 'json' }

/**
 * 재산세 추정.
 *
 * 소유주는 "재산세가 계속 나간다"를 막연한 공포로 갖고 있는데
 * 시골집은 실제로 연 몇 만원이다. 그 숫자를 보여주는 것이
 * 이 서비스가 소유주에게 줄 수 있는 가장 구체적인 정보다.
 *
 * 세액 계산은 세무사법 §2 의 세무대리에 해당할 수 있다.
 * 그래서 화면에는 반드시 '추정'을 명시하고, 양도세는 계산하지 않는다.
 */

type Bracket = { upto: number | null; base: number; rate: number }

type TaxTable = {
  version: string
  singleHomeCeiling: number
  fairMarketRatio: { single: number; general: number }
  rates: { single: Bracket[]; general: Bracket[] }
  localEduTaxRate: number
  urbanAreaRate: number
  urbanZones: string[]
  assessmentDate: string
  paymentPeriod: string
}

const T = taxJson as TaxTable

export type PropertyTax = {
  /** 1세대1주택 특례 적용값 (시가표준액 9억 이하) */
  single: number
  /** 표준세율 적용값 */
  general: number
  /** 도시지역분이 포함됐는지 */
  urbanIncluded: boolean
  /** 어느 해 기준표를 썼는지 */
  year: string
  assessmentDate: string
  paymentPeriod: string
}

/** 누진 구간. base 는 구간 시작점까지의 누적 세액, rate 는 초과분 요율 */
function bracketTax(taxBase: number, brackets: Bracket[]): number {
  let floorOfBracket = 0
  for (const b of brackets) {
    if (b.upto === null || taxBase <= b.upto) {
      return Math.floor(b.base + (taxBase - floorOfBracket) * b.rate)
    }
    floorOfBracket = b.upto
  }
  return 0
}

/**
 * 소유주의 주택 수를 우리는 모른다 (폼에서 묻지 않는다).
 * 그래서 하나의 값이 아니라 1세대1주택과 표준세율 두 값을 돌려주고,
 * 진단서가 "1주택이시면 X, 다른 집이 있으시면 Y" 로 서술한다.
 */
export function propertyTax(
  housePrice: number | null | undefined,
  zone1: string | null | undefined,
): PropertyTax | null {
  const price = Number(housePrice)
  if (!Number.isFinite(price) || price <= 0) return null

  // 도시지역분은 국토계획법상 도시지역에만 붙는다.
  // 관리·농림·자연환경보전지역인 시골 필지에는 부과되지 않는다.
  // ⚠️ 법문은 '도시지역 중 지방의회 의결로 고시한 지역' 이라 용도지역만으로
  //    단정할 수 없다. 조례 확인 전까지 이 값은 상한 추정이다.
  const zone = String(zone1 ?? '')
  const urbanIncluded = T.urbanZones.some((z) => zone.includes(z))

  const eligibleForSingle = price <= T.singleHomeCeiling

  const compute = (kind: 'single' | 'general'): number => {
    const taxBase = Math.floor(price * T.fairMarketRatio[kind])
    const main = bracketTax(taxBase, T.rates[kind])
    // 지방세법 §151①6호 — 지방교육세 과세표준에서 도시지역분은 제외된다
    const localEdu = Math.floor(main * T.localEduTaxRate)
    const urban = urbanIncluded ? Math.floor(taxBase * T.urbanAreaRate) : 0
    return main + localEdu + urban
  }

  const general = compute('general')

  return {
    single: eligibleForSingle ? compute('single') : general,
    general,
    urbanIncluded,
    year: T.version,
    assessmentDate: T.assessmentDate,
    paymentPeriod: T.paymentPeriod,
  }
}

const man = (n: number): string => (n / 10_000).toFixed(1) + '만'

/** "연 약 1.6만 ~ 4.4만원" */
export function formatTaxRange(t: PropertyTax): string {
  return t.single === t.general
    ? `연 약 ${man(t.single)}원`
    : `연 약 ${man(t.single)} ~ ${man(t.general)}원`
}

/** 10년 보유 시 총액. "보유해도 싸다" 를 말할 때 쓴다 */
export function tenYearTotal(t: PropertyTax): { single: number; general: number } {
  return { single: t.single * 10, general: t.general * 10 }
}
