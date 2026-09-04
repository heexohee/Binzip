import { callNed, latestBy, num } from './ned'
import type { AxisResult } from '../types'

/**
 * 토지특성 — VWorld NED getLandCharacteristics.
 *
 * 이 응답 하나가 세 가지를 해결한다.
 *   roadSideCodeNm  도로접면 → ②칸 맹지 판정 (연속지적도 공간연산 불필요)
 *   ladUseSittnNm   토지이용상황 → 단독주택 여부 (세움터 대량자료 없이 1단계 게이트)
 *   prposArea1Nm    용도지역 → ③칸 보조
 */

/** 도로접면 코드값 중 거래를 실제로 막는 것 */
const NO_ROAD = ['맹지']
/** 진입은 되지만 좁아 확인이 필요한 것 (세로/세각 = 좁은 길, (불) = 자동차 진입 불가) */
const NARROW = ['세로(불)', '세각(불)']

export type LandChar = {
  /** 도로접면 (예: 소로한면, 세로(가), 맹지) */
  roadSide: string | null
  /** 토지이용상황 (예: 단독, 주거나지, 전) */
  useSituation: string | null
  /** 용도지역 (예: 자연녹지지역) */
  zone1: string | null
  /** 지목 (예: 대) */
  category: string | null
  /** 지형 경사 (예: 완경사) */
  slope: string | null
  /** 면적 ㎡ */
  area: number | null
  /** 공시지가 원/㎡ */
  landPrice: number | null
  year: string | null
}

export async function getLandChar(pnu: string): Promise<LandChar> {
  const rows = await callNed('getLandCharacteristics', pnu)
  const row = latestBy(rows, 'stdrYear')
  if (!row) {
    return {
      roadSide: null, useSituation: null, zone1: null, category: null,
      slope: null, area: null, landPrice: null, year: null,
    }
  }
  const str = (v: unknown) => {
    const s = String(v ?? '').trim()
    return s && s !== '지정되지않음' ? s : null
  }
  return {
    roadSide: str(row.roadSideCodeNm),
    useSituation: str(row.ladUseSittnNm),
    zone1: str(row.prposArea1Nm),
    category: str(row.lndcgrCodeNm),
    slope: str(row.tpgrphHgCodeNm),
    area: num(row.lndpclAr),
    landPrice: num(row.pblntfPclnd),
    year: str(row.stdrYear),
  }
}

/** ②칸 물리적 장애 — 도로접면으로 판정한다 */
export function judgeRoadAccess(lc: LandChar): AxisResult {
  const checkedAt = new Date().toISOString().slice(0, 10)
  const source = '토지특성(도로접면)'

  if (!lc.roadSide) {
    return {
      verdict: 'unknown',
      reason: '도로접면 정보를 확인하지 못했습니다 — 현장 확인이 필요합니다',
      source, checkedAt,
    }
  }
  if (NO_ROAD.some(k => lc.roadSide!.includes(k))) {
    return {
      verdict: 'blocked',
      reason: '지적상 도로에 접하지 않는 맹지입니다 — 진입로 확보 전에는 거래가 어렵습니다',
      source, checkedAt,
    }
  }
  if (NARROW.some(k => lc.roadSide!.includes(k))) {
    return {
      verdict: 'suspect',
      reason: `도로접면이 ${lc.roadSide}로 자동차 진입이 어려울 수 있습니다 — 현장 확인이 필요합니다`,
      source, checkedAt,
    }
  }
  return {
    verdict: 'clear',
    reason: `도로접면 ${lc.roadSide} — 진입로가 확보되어 있습니다`,
    source, checkedAt,
  }
}

/** 1단계 게이트 보조 — 세움터 자료 없이 단독주택 여부를 본다 */
export function looksResidential(lc: LandChar): boolean | null {
  if (!lc.useSituation) return null
  return /단독|주거/.test(lc.useSituation)
}
