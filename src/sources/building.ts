import { callNed, latestBy, num } from './ned'

/**
 * 건축물 정보 — VWorld NED getBuildingUse + getBuildingAge.
 *
 * 건축물대장 원본의 핵심(주용도·사용승인일·구조·층수·연면적)이 여기 들어 있다.
 * data.go.kr 키도 세움터 대량자료도 없이 조달된다.
 *
 * ⚠️ 다만 '위반건축물 여부(violYn)'는 여기 없다. 그건 건축물대장 원본에만 있고,
 *    ①칸(법적) 판정에 필요하므로 별도 조달이 필요하다. src/sources/client.ts 참고.
 */
export type Building = {
  /** 건축물대장에 건물이 있는지 */
  exists: boolean
  /** 주용도 (단독주택 / 제2종근린생활시설 …) */
  mainPurpose: string | null
  /** 용도 대분류 (주거용 / 상업용 …) */
  purposeClass: string | null
  /** 사용승인일 YYYY-MM-DD */
  useApprovalDate: string | null
  /** 구조 (벽돌구조 / 철근콘크리트구조 …) */
  structure: string | null
  /** 연면적 ㎡ */
  totalArea: number | null
  groundFloors: number | null
  undergroundFloors: number | null
  /** 건물 연령(년) */
  age: number | null
}

const EMPTY: Building = {
  exists: false, mainPurpose: null, purposeClass: null, useApprovalDate: null,
  structure: null, totalArea: null, groundFloors: null, undergroundFloors: null, age: null,
}

export async function getBuilding(pnu: string): Promise<Building> {
  const [useRows, ageRows] = await Promise.all([
    callNed('getBuildingUse', pnu),
    callNed('getBuildingAge', pnu).catch(() => []),
  ])

  const u = latestBy(useRows, 'useConfmDe')
  if (!u) return EMPTY

  const a = latestBy(ageRows, 'lastUpdtDt')
  const s = (v: unknown) => {
    const t = String(v ?? '').trim()
    return t || null
  }
  const int = (v: unknown) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

  return {
    exists: true,
    mainPurpose: s(u.detailPrposCodeNm) ?? s(u.mainPrposCodeNm),
    purposeClass: s(u.buldPrposClCodeNm),
    useApprovalDate: s(u.useConfmDe),
    structure: s(u.strctCodeNm),
    totalArea: num(u.buldTotar),
    groundFloors: int(u.groundFloorCo),
    undergroundFloors: int(u.undgrndFloorCo),
    age: a ? int(a.buldAge) : null,
  }
}
