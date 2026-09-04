import { callDataGoKr, toArray } from './client'
import type { AxisResult } from '../types'

/**
 * 토지이용규제 (3단계 → ③칸 규제로 막힘).
 *
 * ⚠️ 엔드포인트·필드명은 키 발급 후 확정할 것.
 */
const ENDPOINT =
  process.env.LAND_USE_ENDPOINT ??
  'https://apis.data.go.kr/1611000/nsdi/LandUseService/attr/getLandUseAttr'

/** 거래·활용을 실제로 막는 규제. 이 목록은 rules.json 으로 옮길 후보다. */
const BLOCKING = ['개발제한구역', '보전산지', '문화재보호구역', '군사기지', '상수원보호구역']
const CONDITIONAL = ['자연환경보전지역', '농림지역', '보전관리지역', '경관지구']

export async function getLandUse(pnu: string): Promise<AxisResult & { zones: string[] }> {
  const checkedAt = new Date().toISOString()
  const body = await callDataGoKr<any>(ENDPOINT, {
    pnu,
    format: 'json',
    numOfRows: '100',
    pageNo: '1',
    _type: 'json',
  })

  const items = toArray(body?.items?.item ?? body?.field ?? body?.items)
  const zones = items
    .map((it: any) => String(it?.prposAreaDstrcCodeNm ?? it?.ldCodeNm ?? it?.cnflcAt ?? '').trim())
    .filter(Boolean)

  if (!zones.length) {
    return { verdict: 'unknown', reason: '토지이용규제 정보를 확인하지 못했습니다', source: '토지이용규제', checkedAt, zones }
  }

  const blocked = zones.filter(z => BLOCKING.some(b => z.includes(b)))
  if (blocked.length) {
    return { verdict: 'blocked', reason: `${blocked.join(', ')}에 해당해 신축·증축이 제한됩니다`, source: '토지이용규제', checkedAt, zones }
  }

  const cond = zones.filter(z => CONDITIONAL.some(c => z.includes(c)))
  if (cond.length) {
    return { verdict: 'suspect', reason: `${cond.join(', ')} — 활용 범위 확인이 필요합니다`, source: '토지이용규제', checkedAt, zones }
  }

  return { verdict: 'clear', reason: `용도지역 ${zones[0]} — 거래를 막는 규제가 확인되지 않았습니다`, source: '토지이용규제', checkedAt, zones }
}
