import { callDataGoKr, toArray } from './client'
import type { ResolvedAddress } from '../types'

/**
 * 건축물대장 표제부 — 국토교통부_건축물대장정보 서비스 (data.go.kr).
 *
 * VWorld 로는 조달되지 않는 '위반건축물 등재 여부(violYn)' 때문에 존재한다.
 * 나머지 제원(주용도·사용승인일·구조·층수)은 VWorld 건축물정보와 겹치므로
 * 여기서는 위반 여부와 교차검증용 값만 취한다.
 *
 * DATA_GO_KR_KEY 가 없으면 null 을 돌려주고, 진단서는 '확인 안 함'으로 표시된다.
 */

/** 배포본에 따라 베이스 경로가 다르다. 순서대로 시도해 먼저 응답하는 쪽을 쓴다. */
const BASES = [
  process.env.BLD_RGST_BASE,
  'https://apis.data.go.kr/1613000/BldRgstHubService',
  'https://apis.data.go.kr/1613000/BldRgstService_v2',
].filter(Boolean) as string[]

let resolvedBase: string | null = null

export type BuildingLedger = {
  /** 위반건축물 등재 여부 */
  violation: boolean | null
  mainPurpose: string | null
  useApprovalDate: string | null
  structure: string | null
  totalArea: number | null
  groundFloors: number | null
  /** 어느 베이스 경로가 실제로 응답했는지 (진단·디버깅용) */
  base: string | null
}

const EMPTY: BuildingLedger = {
  violation: null, mainPurpose: null, useApprovalDate: null,
  structure: null, totalArea: null, groundFloors: null, base: null,
}

export function ledgerAvailable(): boolean {
  return !!process.env.DATA_GO_KR_KEY?.trim()
}

export async function getBuildingLedger(a: ResolvedAddress): Promise<BuildingLedger> {
  if (!ledgerAvailable()) return EMPTY

  const params = {
    sigunguCd: a.sigunguCd,
    bjdongCd: a.bjdongCd,
    platGbCd: a.platGbCd,
    bun: a.bun,
    ji: a.ji,
    numOfRows: '20',
    pageNo: '1',
    _type: 'json',
  }

  const bases = resolvedBase ? [resolvedBase] : BASES
  let lastErr: Error | null = null

  for (const base of bases) {
    try {
      const body = await callDataGoKr<any>(`${base}/getBrTitleInfo`, params)
      const items = toArray(body?.items?.item)
      resolvedBase = base
      if (!items.length) return { ...EMPTY, base }

      // 위반건축물이 한 동이라도 있으면 위반으로 본다
      const violated = items.some((it: any) => String(it?.violYn ?? '') === '1')
      const main = items[0]

      const n = (v: unknown) => {
        const x = Number(v)
        return Number.isFinite(x) && x > 0 ? x : null
      }
      const s = (v: unknown) => String(v ?? '').trim() || null
      const day = (v: unknown) => {
        const t = String(v ?? '').trim()
        return /^\d{8}$/.test(t) ? `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}` : null
      }

      return {
        violation: violated,
        mainPurpose: s(main?.mainPurpsCdNm),
        useApprovalDate: day(main?.useAprDay),
        structure: s(main?.strctCdNm),
        totalArea: n(main?.totArea),
        groundFloors: n(main?.grndFlrCnt),
        base,
      }
    } catch (e) {
      lastErr = e as Error
    }
  }

  throw lastErr ?? new Error('건축물대장 조회 실패')
}
