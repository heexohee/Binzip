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

// ─────────────────────────────────────────────────────────────
// 토지분 재산세 — 「세제의 역설」을 계산하기 위해 필요하다
//
// 집을 헐면 주택분에서 토지분으로 넘어간다.
// 과세표준 비율이 60% → 70% 로 오르고 세율도 높아져
// 철거했는데 세금이 오히려 느는 일이 생긴다.
// 인천·전주에서 2~3배 증가 사례가 실제로 확인됐다.
//
// 소유주가 "내 돈 들여 철거했는데 세금이 왜 올라" 하는 지점이고,
// 이걸 미리 계산해 주는 것이 이 진단서가 할 수 있는 가장 구체적인 일이다.
// ─────────────────────────────────────────────────────────────

type LandKind = '종합합산' | '별도합산' | '분리과세_농지임야' | '분리과세_기타'

type LandTable = {
  note: string
  fairMarketRatio: number
  rates: Record<LandKind, Bracket[]>
  철거후: {
    종합합산전환_유예개월: number
    별도합산_인정기간_년: number
    주택수준_과세기간_년: number
    재산세감면율: number
    재산세감면기간_년: number
  }
}

const L = (taxJson as unknown as { land: LandTable }).land

export type LandTax = {
  /** 원 단위 연 세액 */
  amount: number
  kind: LandKind
  /** 도시지역분 포함 여부 */
  urbanIncluded: boolean
}

/**
 * 토지분 재산세.
 *
 * 나대지는 종합합산이 원칙이다. 다만 빈집 철거 직후에는
 * 유예·별도합산 인정 기간이 있어 kind 를 호출자가 정한다.
 */
export function landTax(
  landPrice: number | null | undefined,
  zone1: string | null | undefined,
  kind: LandKind = '종합합산',
): LandTax | null {
  const price = Number(landPrice)
  if (!Number.isFinite(price) || price <= 0) return null

  const zone = String(zone1 ?? '')
  const urbanIncluded = T.urbanZones.some((z) => zone.includes(z))

  const taxBase = Math.floor(price * L.fairMarketRatio)
  const main = bracketTax(taxBase, L.rates[kind])
  const localEdu = Math.floor(main * T.localEduTaxRate)
  const urban = urbanIncluded ? Math.floor(taxBase * T.urbanAreaRate) : 0

  return { amount: main + localEdu + urban, kind, urbanIncluded }
}

export type Scenario = {
  key: 'keep' | 'demolish' | 'renovate'
  title: string
  /**
   * 연 보유세 (원) — 1세대1주택 기준.
   * ⚠️ 주택에만 특례세율(0.05%)이 있고 토지에는 없다.
   *    그래서 1주택자는 철거 시 배율이 훨씬 크게 뛴다.
   */
  annualTaxSingle: number | null
  /** 연 보유세 (원) — 표준세율 기준 */
  annualTaxGeneral: number | null
  /** 감면이 끝난 뒤의 연 보유세. 감면과 다를 때만 채운다 */
  annualTaxAfterRelief: number | null
  /** 일회성 비용 (원). 모르면 null — 추정하지 않는다 */
  upfrontCost: number | null
  /** 받을 수 있는 지원 (원) */
  support: number | null
  /** 소유주가 알아야 할 제약 */
  caveats: string[]
}

export type ScenarioInput = {
  /** 개별주택가격 (원) */
  housePrice: number | null | undefined
  /** 개별공시지가 × 면적 (원). 없으면 주택가격으로 대신한다 */
  landPrice: number | null | undefined
  zone1: string | null | undefined
  /** 슬레이트 지붕인가. 지원 금액이 달라진다 */
  slate?: boolean
  /** 주택인가 비주택(축사·창고)인가 */
  isHouse?: boolean
}

/**
 * 세 갈래를 같은 잣대로 비교한다.
 *
 * ⚠️ 철거비와 리모델링비는 계산하지 않는다.
 *    견적은 현장을 봐야 나오고, 추정치를 적으면 그게 근거로 읽힌다.
 *    비용 칸은 비워 두고 '견적 필요'로 남긴다.
 */
export function compareScenarios(input: ScenarioInput): Scenario[] {
  const keepTax = propertyTax(input.housePrice, input.zone1)
  const base = input.landPrice ?? input.housePrice
  const afterRelief = landTax(base, input.zone1, '종합합산')
  // 철거 후 일정 기간은 감면이 붙는다
  const relieved =
    afterRelief != null
      ? Math.floor(afterRelief.amount * (1 - L.철거후.재산세감면율))
      : null

  // 슬레이트 처리 지원 — 주택과 비주택 상한이 다르다
  const slateSupport = input.slate ? (input.isHouse === false ? 5_400_000 : 7_000_000) : null

  return [
    {
      key: 'keep',
      title: '그대로 둔다',
      annualTaxSingle: keepTax?.single ?? null,
      annualTaxGeneral: keepTax?.general ?? null,
      annualTaxAfterRelief: null,
      upfrontCost: 0,
      support: null,
      caveats: [
        '주택으로 과세되어 보유세 자체는 가장 낮습니다.',
        '다만 특정빈집으로 판정되어 조치명령을 받고 이행하지 않으면 이행강제금이 부과됩니다.',
      ],
    },
    {
      key: 'demolish',
      title: '철거한다',
      // 토지에는 1세대1주택 특례세율이 없다. 두 값이 같은 이유다.
      annualTaxSingle: relieved,
      annualTaxGeneral: relieved,
      annualTaxAfterRelief: afterRelief?.amount ?? null,
      upfrontCost: null,
      support: slateSupport,
      caveats: [
        '⚠️ 철거하면 주택분에서 토지분으로 넘어가 보유세가 오히려 오를 수 있습니다. 과세표준 비율이 60%에서 70%로 오르고 세율도 높아집니다.',
        '⚠️ 1세대1주택이시면 부담이 더 큽니다. 특례세율(0.05%)은 주택에만 있고 토지에는 없어, 철거하는 순간 그 혜택을 잃습니다.',
        `철거 후 ${L.철거후.재산세감면기간_년}년간 ${L.철거후.재산세감면율 * 100}% 감면이 있고, 별도합산으로 보는 기간이 ${L.철거후.별도합산_인정기간_년}년입니다. 그 뒤에는 종합합산으로 넘어갑니다.`,
        '철거비 지원의 대상·한도와 철거 후 부지 활용·처분 조건은 해당 사업의 최신 공고와 약정을 확인해야 합니다.',
        '철거비는 현장 견적이 필요합니다. 이 진단서에서 계산하지 않습니다.',
      ],
    },
    {
      key: 'renovate',
      title: '고쳐서 쓴다',
      annualTaxSingle: keepTax?.single ?? null,
      annualTaxGeneral: keepTax?.general ?? null,
      annualTaxAfterRelief: null,
      upfrontCost: null,
      support: slateSupport,
      caveats: [
        '연면적 200㎡ 미만이고 3층 미만이면 대수선은 허가가 아니라 신고로 됩니다.',
        '공사비는 현장 견적이 필요합니다. 이 진단서에서 계산하지 않습니다.',
      ],
    },
  ]
}
