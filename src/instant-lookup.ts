import type { ResolvedAddress } from './types'
import type { Building } from './sources/building'
import type { LandChar } from './sources/landChar'
import type { HousePrice } from './sources/housePrice'
import { parseInstantInput, supportsForConfirmedAddress, type InstantRecord, type InstantResult, type RecordStatus } from './instant-report'

export type InstantSources = {
  resolve: (query: string) => Promise<ResolvedAddress | null>
  building: (pnu: string) => Promise<Building>
  land: (pnu: string) => Promise<LandChar>
  price: (pnu: string) => Promise<HousePrice>
}

async function bounded<T>(work: () => Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      Promise.resolve().then(work),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('LOOKUP_TIMEOUT')), milliseconds) }),
    ])
  } finally { clearTimeout(timer) }
}

/** Read-only first report. Never runs the verdict/tax engine or reads application records. */
export async function runInstantLookup(raw: unknown, sources: InstantSources, timeoutMs = 12_000): Promise<InstantResult> {
  const input = parseInstantInput(raw)
  if (!input) return { kind: 'invalid', message: '주소를 3~300자 이내로 입력하고 고민하는 방향을 선택해 주세요.' }
  let address: ResolvedAddress | null
  try { address = await bounded(() => sources.resolve(input.address), timeoutMs) }
  catch { return { kind: 'unavailable', message: '지금 주소 자료를 불러오지 못했어요. 다시 조회하거나 공적 기록 없이 확인 순서를 먼저 볼 수 있어요.' } }
  if (!address) return { kind: 'not_found', message: '일치하는 주소를 찾지 못했어요. 시·군·구와 도로명·건물번호 또는 읍·면·리와 번지를 확인해 주세요.' }
  if (!/^\d{19}$/.test(address.pnu)) return { kind: 'unavailable', message: '필지 정보를 확인하지 못했어요. 주소를 다시 확인해 주세요.' }

  // Confirm every resolved parcel, and resolve again on confirmation. Never trust a submitted PNU.
  if (input.confirmedPnu !== address.pnu) {
    return { kind: 'confirm', address: address.jibunAddress, roadAddress: address.roadAddress, pnu: address.pnu, similar: address.matchQuality === 'fuzzy' }
  }
  const [buildingResult, landResult, priceResult] = await Promise.allSettled([
    bounded(() => sources.building(address.pnu), timeoutMs),
    bounded(() => sources.land(address.pnu), timeoutMs),
    bounded(() => sources.price(address.pnu), timeoutMs),
  ])
  const building = buildingResult.status === 'fulfilled' ? buildingResult.value : null
  const land = landResult.status === 'fulfilled' ? landResult.value : null
  const price = priceResult.status === 'fulfilled' ? priceResult.value : null
  const records: InstantRecord[] = []
  const add = (label: string, rawValue: string | number | null | undefined, source: string, failed: boolean, unit = '') => {
    const known = (typeof rawValue === 'string' && rawValue.trim().length > 0) || (typeof rawValue === 'number' && Number.isFinite(rawValue) && rawValue > 0)
    const status: RecordStatus = failed ? 'error' : known ? 'known' : 'empty'
    records.push({ label, source, status, value: status === 'known' ? `${rawValue}${unit}` : status === 'error' ? '조회 실패 · 미확인' : '조회 자료에서 확인되지 않음' })
  }
  const buildingSource = '브이월드 · 건축물 용도 자료 (필지 내 여러 건물은 대장 원본 대조 필요)'
  add('기록상 주용도', building?.mainPurpose, buildingSource, buildingResult.status === 'rejected')
  add('기록상 구조', building?.structure, buildingSource, buildingResult.status === 'rejected')
  add('사용승인일', building?.useApprovalDate, buildingSource, buildingResult.status === 'rejected')
  add('건물 연면적', building?.totalArea, buildingSource, buildingResult.status === 'rejected', '㎡')
  const landSource = `브이월드 · 토지특성${land?.year ? ` (${land.year}년 기준)` : ''}`
  add('토지면적', land?.area, landSource, landResult.status === 'rejected', '㎡')
  add('지목', land?.category, landSource, landResult.status === 'rejected')
  add('용도지역', land?.zone1, landSource, landResult.status === 'rejected')
  add('기록상 도로접면', land?.roadSide, landSource, landResult.status === 'rejected')
  add('개별주택 공시가격', price?.value ? price.value.toLocaleString('ko-KR') : null,
    `브이월드 · 개별주택가격${price?.year ? ` (${price.year}년 기준)` : ''} · 예상 매도가가 아니에요`, priceResult.status === 'rejected', '원')
  const attention: string[] = []
  if ([buildingResult, landResult, priceResult].some(result => result.status === 'rejected')) attention.push('일부 공적 자료를 불러오지 못했어요. 조회 실패는 문제가 없다는 뜻이 아니에요.')
  if (!records.some(record => record.status === 'known')) attention.push('확인된 건물·토지 값이 아직 없어요. 주소가 맞는지, 기록이 있는지 별도로 확인해야 해요.')
  if (building?.exists === false) attention.push('이번 조회에서 건축물 자료를 찾지 못했어요. 건물이 없거나 철거됐다고 판단할 수는 없어요.')
  if (building?.mainPurpose && !/단독주택/.test(building.mainPurpose)) attention.push(`기록상 주용도가 ‘${building.mainPurpose}’예요. 시골의 빈 단독주택과 조건이 다를 수 있어, 빈집 해당 여부와 절차를 별도로 확인해야 해요.`)
  if (land?.roadSide && /맹지|\(불\)/.test(land.roadSide)) attention.push(`도로접면이 ‘${land.roadSide}’로 기록돼 있어요. 실제 진입 여건과 공사 장비 접근을 먼저 확인해 주세요.`)
  if (!/^(47111|47113)/.test(address.pnu)) attention.push('포항 외 지역의 주소예요. 지원사업은 소재지 지자체에서 별도로 확인해 주세요.')
  return { kind: 'report', report: {
    address: address.jibunAddress, addressVerified: true, decision: input.decision,
    checkedAt: new Date().toISOString(), records, attention,
    supports: supportsForConfirmedAddress(address.jibunAddress, address.pnu, building?.exists ?? null),
  } }
}
