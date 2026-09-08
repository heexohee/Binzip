import { resolveAddress } from './address'
import { getLandChar } from './sources/landChar'
import { getHousePrice } from './sources/housePrice'
import { getLandUse } from './sources/landUse'
import { getPossession } from './sources/possession'
import { getBuilding } from './sources/building'
import { getBuildingLedger, ledgerAvailable } from './sources/buildingLedger'
import { getDeals, riFromJibunAddress, type DealResult } from './sources/transaction'
import { propertyTax } from './tax'
import { checkGates, evaluate, rulesVersion, type Context } from './rules/engine'
import { combine, type Diagnosis } from './verdict'
import type { ResolvedAddress } from './types'

export type PipelineResult =
  | { status: 'address_not_found'; query: string }
  | {
      status: 'out_of_scope'
      query: string
      address: ResolvedAddress
      reason: string
      gateId: string
      /** 대상은 아니지만 조회 중 확인된 사실 — 빈손으로 돌려보내지 않는다 */
      facts: Context
      observations: string[]
      checkedAt: string
      sourceErrors: string[]
      /** 같은 리 실거래. facts 에는 개수·중앙단가만 싣고 목록은 여기에 둔다 */
      deals: DealResult | null
    }
  | {
      status: 'ok'
      query: string
      address: ResolvedAddress
      diagnosis: Diagnosis
      facts: Context
      checkedAt: string
      rulesVersion: string
      /** 조달에 실패한 소스가 있으면 여기 남는다 */
      sourceErrors: string[]
      /** 같은 리 실거래. facts 에는 개수·중앙단가만 싣고 목록은 여기에 둔다 */
      deals: DealResult | null
    }

const settle = async <T,>(
  name: string,
  fn: () => Promise<T>,
  errors: string[],
): Promise<T | null> => {
  try {
    return await fn()
  } catch (e) {
    errors.push(`${name}: ${(e as Error).message}`)
    return null
  }
}

/**
 * 주소 한 줄 → 진단.
 *
 * 한 소스가 실패해도 전체를 죽이지 않는다. 실패한 축은 unknown 으로 흘러가
 * 진단서에서 점선 + [미확인] 으로 표시된다. 오류 처리가 곧 디자인 언어다.
 */
export async function diagnose(query: string): Promise<PipelineResult> {
  const errors: string[] = []
  const checkedAt = new Date().toISOString().slice(0, 10)

  const address = await resolveAddress(query)
  if (!address) return { status: 'address_not_found', query }

  const [landChar, housePrice, landUse, possession, building] = await Promise.all([
    settle('토지특성', () => getLandChar(address.pnu), errors),
    settle('개별주택가격', () => getHousePrice(address.pnu), errors),
    settle('토지이용규제', () => getLandUse(address.pnu), errors),
    settle('토지소유정보', () => getPossession(address.pnu), errors),
    settle('건축물', () => getBuilding(address.pnu), errors),
  ])

  // 위반건축물은 VWorld 에 없어 data.go.kr 건축물대장으로만 조달된다.
  // 키가 없으면 조용히 건너뛰고 진단서에 '확인 안 함'으로 표시한다.
  const ledger = ledgerAvailable()
    ? await settle('건축물대장', () => getBuildingLedger(address), errors)
    : null

  // 실거래는 앞 단계 결과(지목·용도지역·사용승인)를 비교 조건으로 쓰므로 뒤에 온다.
  // 게이트 앞에 두는 이유 — 대상이 아니어도 소유주에게 보여줄 값이기 때문이다.
  //
  // API 가 시군구+계약월 단위라 12개월이면 24회 호출이지만,
  // callDataGoKr 가 24시간 캐싱하므로 같은 시군구를 다시 볼 때는 재호출하지 않는다.
  const approvalYear = Number(String(building?.useApprovalDate ?? '').slice(0, 4))
  // 주택이면 주택 거래와, 아니면(축사·창고·나대지) 토지 거래와 비교한다.
  // 축사 소유주에게 단독주택 거래를 보여주면 가격 성격이 달라 오도한다.
  const isHouse = /주택|아파트|연립|다세대/.test(String(building?.mainPurpose ?? ''))
  const deals = await settle(
    '실거래가',
    () =>
      getDeals({
        sigunguCd: address.sigunguCd,
        umdName: riFromJibunAddress(address.jibunAddress),
        months: 12,
        kind: isHouse ? 'house' : 'land',
        jimok: landChar?.category ?? null,
        landUse: landChar?.zone1 ?? null,
        buildYear: Number.isFinite(approvalYear) && approvalYear > 1900 ? approvalYear : null,
      }),
    errors,
  )

  // 재산세는 공시가격과 용도지역만 있으면 계산된다. 외부 호출이 없다.
  const tax = propertyTax(housePrice?.value, landChar?.zone1)

  const facts: Context = {
    pnu: address.pnu,
    sigunguCd: address.sigunguCd,
    jibunAddress: address.jibunAddress,
    roadAddress: address.roadAddress,

    useSituation: landChar?.useSituation ?? null,
    roadSide: landChar?.roadSide ?? null,
    zone1: landChar?.zone1 ?? null,
    category: landChar?.category ?? null,
    slope: landChar?.slope ?? null,
    landArea: landChar?.area ?? null,

    housePrice: housePrice?.value ?? null,
    housePriceEok: housePrice?.value ? (housePrice.value / 100_000_000).toFixed(2) : null,
    housePriceYear: housePrice?.year ?? null,

    zones: landUse?.zones ?? [],

    violation: ledger?.violation ?? null,
    ledgerChecked: ledger != null,
    platArea: ledger?.platArea ?? null,
    buildingCoverage: ledger?.buildingCoverage ?? null,
    floorAreaRatio: ledger?.floorAreaRatio ?? null,
    attachedCount: ledger?.attachedCount ?? null,
    householdCount: ledger?.householdCount ?? null,

    hasBuilding: building?.exists ?? null,
    mainPurpose: building?.mainPurpose ?? null,
    purposeClass: building?.purposeClass ?? null,
    useApprovalDate: building?.useApprovalDate ?? null,
    structure: building?.structure ?? null,
    buildingArea: building?.totalArea ?? null,
    floors: building?.groundFloors ?? null,
    buildingAge: building?.age ?? null,

    coOwnerCount: possession?.coOwnerCount ?? null,
    ownerResidence: possession?.ownerResidence ?? null,
    ownershipCause: possession?.ownershipCause ?? null,
    ownershipDate: possession?.ownershipDate ?? null,

    // 실거래 — 룰이 쓸 스칼라만 싣는다. 목록은 결과의 deals 에 있다.
    // 0건과 조회실패(null)는 다르다. 0건을 '거래 없음'으로 단정하려면
    // dealFailures 가 0인지 함께 봐야 한다.
    dealCount: deals?.nearby.length ?? null,
    comparableCount: deals?.comparable.length ?? null,
    medianUnitPrice: deals?.medianUnitPrice ?? null,
    // 중앙값만 쓰면 단가 편차를 감춘다. 시골 토지는 수십 배 벌어진다.
    unitPriceMin: deals?.unitPriceRange?.min ?? null,
    unitPriceMax: deals?.unitPriceRange?.max ?? null,
    dealMonths: deals?.months ?? null,
    dealFailures: deals?.failures.length ?? null,

    // 재산세 — 소유주가 제일 모르면서 제일 무서워하는 숫자.
    // 주택 수를 모르므로 1주택/표준 두 값을 함께 싣는다.
    taxSingle: tax?.single ?? null,
    taxGeneral: tax?.general ?? null,
    taxYear: tax?.year ?? null,
    taxAssessmentDate: tax?.assessmentDate ?? null,
    taxUrban: tax?.urbanIncluded ?? null,
  }

  const gate = checkGates(facts)
  if (gate) {
    return {
      status: 'out_of_scope',
      query, address,
      reason: gate.reason,
      gateId: gate.id,
      facts,
      observations: observe(facts),
      checkedAt,
      sourceErrors: errors,
      deals,
    }
  }

  return {
    status: 'ok',
    query,
    address,
    diagnosis: combine(evaluate(facts)),
    facts,
    checkedAt,
    rulesVersion,
    sourceErrors: errors,
    deals,
  }
}


/**
 * 대상이 아니어도 조회 중 알게 된 것은 알려준다.
 * "대상 아님" 한 줄로 끝내면 소유주는 빈손으로 돌아가고,
 * 우리는 이미 확인한 사실을 버리는 셈이 된다.
 */
function observe(f: Context): string[] {
  const out: string[] = []

  if (f.roadSide && String(f.roadSide).includes('맹지')) {
    out.push('지적상 도로에 접하지 않는 맹지입니다.')
  }
  if (f.hasBuilding === false) {
    out.push('건축물대장에 등재된 건물이 없습니다. 나대지이거나 미등재 건물일 수 있습니다.')
  }
  if (Array.isArray(f.zones) && f.zones.length) {
    out.push(`토지이용규제 — ${f.zones.join(', ')}`)
  }
  if (f.category && f.useSituation && f.category !== f.useSituation) {
    out.push(`지목은 '${f.category}', 실제 이용상황은 '${f.useSituation}'입니다.`)
  }
  if (typeof f.coOwnerCount === 'number' && f.coOwnerCount >= 2) {
    out.push(`공유인이 ${f.coOwnerCount}명입니다.`)
  }
  // 재산세를 먼저 말한다. 소유주가 제일 무서워하는데 실제로는 제일 작은 숫자다.
  if (typeof f.taxSingle === 'number' && typeof f.taxGeneral === 'number') {
    const man = (n: number) => (n / 10_000).toFixed(1)
    const range =
      f.taxSingle === f.taxGeneral
        ? `연 약 ${man(f.taxSingle)}만원`
        : `1주택이시면 연 약 ${man(f.taxSingle)}만원, 다른 집이 있으시면 약 ${man(f.taxGeneral)}만원`
    out.push(
      `재산세는 ${range} 수준입니다 (추정). 과세기준일은 ${f.taxAssessmentDate} 이라 그 전에 넘기시면 그해 분은 매수인이 냅니다.`,
    )
  }
  // 지목·용도지역까지 맞은 거래만 말한다. '근처에 뭐가 팔렸다'는 정보가 안 된다.
  if (typeof f.comparableCount === 'number' && f.comparableCount > 0) {
    const won = (n: number) => Math.round(n).toLocaleString('ko-KR')
    // 중앙값과 범위를 함께 낸다. 범위를 감추면 소유주가 중앙값을 자기 땅 값으로 읽는다.
    const price =
      typeof f.medianUnitPrice === 'number' &&
      typeof f.unitPriceMin === 'number' &&
      typeof f.unitPriceMax === 'number'
        ? ` 단가는 ${won(f.unitPriceMin)}~${won(f.unitPriceMax)}원/㎡ 로 폭이 넓고 중앙값은 ${won(f.medianUnitPrice)}원/㎡ 입니다. 도로 접면·형상에 따라 크게 갈리므로 개별 확인이 필요합니다.`
        : ''
    out.push(
      `최근 ${f.dealMonths}개월간 같은 리에서 조건이 비슷한 거래가 ${f.comparableCount}건 있습니다.${price}`,
    )
  }
  return out
}
