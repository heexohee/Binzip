import { callVWorld } from './vworld'

/**
 * VWorld 국가공간정보(NED) 속성조회 공통 호출.
 *
 * 응답이 전부 같은 모양이다:
 *   { "<복수형래퍼>": { "field": [ {...}, ... ] } }
 * 래퍼 이름이 오퍼레이션마다 달라(indvdHousingPrices, landUses, …)
 * 첫 키를 그대로 집어 배열을 꺼낸다.
 */
const BASE = 'https://api.vworld.kr/ned/data'

export async function callNed<T = Record<string, string>>(
  operation: string,
  pnu: string,
  numOfRows = 50,
): Promise<T[]> {
  const body = await callVWorld<Record<string, any>>(`${BASE}/${operation}`, {
    pnu,
    format: 'json',
    numOfRows: String(numOfRows),
    pageNo: '1',
  })

  if (!body || typeof body !== 'object') return []

  // { resultCode: 'URL_TYPE' } 같은 오퍼레이션 오타 응답을 잡는다
  if (body.response?.resultCode) {
    throw new Error(`NED ${operation}: ${body.response.resultMsg ?? body.response.resultCode}`)
  }

  const wrapper = Object.keys(body)[0]
  if (!wrapper) return []
  const field = body[wrapper]?.field
  return Array.isArray(field) ? field : field ? [field] : []
}

/** 기준연도가 여러 개 오는 응답에서 최신 것을 고른다 */
export function latestBy<T extends Record<string, any>>(rows: T[], yearKey: string): T | null {
  if (!rows.length) return null
  return [...rows].sort((a, b) =>
    String(b[yearKey] ?? '').localeCompare(String(a[yearKey] ?? '')),
  )[0]!
}

export const num = (v: unknown): number | null => {
  const n = Number(String(v ?? '').replace(/[,\s]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}
