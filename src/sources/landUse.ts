import { callNed } from './ned'
import type { AxisResult } from '../types'

/**
 * 토지이용규제 — 3단계 → ③칸 '규제로 막힘'.
 * VWorld NED getLandUseAttr. 한 필지에 규제가 여러 건 중첩되므로 전부 모은다.
 */

/** 거래·활용을 실제로 막는 규제 */
const BLOCKING = [
  '개발제한구역', '보전산지', '문화재보호구역', '군사기지', '군사시설',
  '상수원보호구역', '접도구역', '비오톱',
]

/** 활용 범위 확인이 필요한 규제 */
const CONDITIONAL = [
  '자연환경보전지역', '농림지역', '보전관리지역', '생산관리지역',
  '경관지구', '자연녹지지역', '가축사육제한구역',
]

export type LandUse = AxisResult & {
  /** 저촉·포함으로 잡힌 규제 이름들 */
  zones: string[]
}

export async function getLandUse(pnu: string): Promise<LandUse> {
  const checkedAt = new Date().toISOString().slice(0, 10)
  const rows = await callNed('getLandUseAttr', pnu)
  return evaluate(rows, checkedAt)
}

function evaluate(rows: Record<string, any>[], checkedAt: string): LandUse {
  const source = '토지이용규제'

  const zones = [
    ...new Set(
      rows
        .filter(r => String(r.cnflcAt ?? '') === '1')
        .map(r => String(r.prposAreaDstrcCodeNm ?? '').trim())
        .filter(Boolean),
    ),
  ]

  if (!zones.length) {
    return {
      verdict: 'unknown',
      reason: '토지이용규제 정보를 확인하지 못했습니다',
      source, checkedAt, zones,
    }
  }

  const blocked = zones.filter(z => BLOCKING.some(b => z.includes(b)))
  if (blocked.length) {
    return {
      verdict: 'blocked',
      reason: `${blocked.join(', ')}에 해당해 신축·증축이 제한됩니다`,
      source, checkedAt, zones,
    }
  }

  const cond = zones.filter(z => CONDITIONAL.some(c => z.includes(c)))
  if (cond.length) {
    return {
      verdict: 'suspect',
      reason: `${cond.join(', ')} — 활용 범위 확인이 필요합니다`,
      source, checkedAt, zones,
    }
  }

  return {
    verdict: 'clear',
    reason: `${zones.join(', ')} — 거래를 막는 규제가 확인되지 않았습니다`,
    source, checkedAt, zones,
  }
}
