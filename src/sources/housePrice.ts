import { callNed, latestBy, num } from './ned'

/**
 * 개별주택가격 — 2단계 게이트(공시가 1억 이하).
 * VWorld NED getIndvdHousingPriceAttr. 필드는 실제 응답으로 확인함.
 */
export type HousePrice = {
  /** 원 단위 개별주택가격 */
  value: number | null
  /** 기준연도 */
  year: string | null
  /** 대지면적 ㎡ */
  landArea: number | null
  /** 건물 연면적 ㎡ */
  buildingArea: number | null
}

export async function getHousePrice(pnu: string): Promise<HousePrice> {
  const rows = await callNed('getIndvdHousingPriceAttr', pnu)
  const row = latestBy(rows, 'stdrYear')
  if (!row) return { value: null, year: null, landArea: null, buildingArea: null }

  return {
    value: num(row.housePc),
    year: String(row.stdrYear ?? '') || null,
    landArea: num(row.ladRegstrAr),
    buildingArea: num(row.buldCalcTotAr),
  }
}
