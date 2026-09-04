import { callDataGoKr, toArray } from './client'
import type { ResolvedAddress } from '../types'

/**
 * 건축물대장 표제부 — 국토교통부 건축HUB (data.go.kr).
 *
 * ⚠️ 2026-09-04 확인: 건축HUB 공개 API 에는 '위반건축물 등재 여부'가 없다.
 *    표제부 78개 필드와 나머지 7개 오퍼레이션을 전부 확인했으나 부재.
 *    위반건축물은 등기부와 마찬가지로 사람이 대장을 열람해 확인해야 한다
 *    (6·7단계). violation 은 항상 null 이며, 세움터 대량자료를 넣으면 살아난다.
 *
 * 그래도 유지하는 이유 — VWorld 에 없는 값들을 준다.
 *    platArea    대지면적 (VWorld 값과 교차검증)
 *    bcRat/vlRat 건폐율·용적률
 *    atchBldCnt  부속건축물 수 (무허가 증축 실마리)
 *    hhldCnt     가구수 (다가구 판별)
 *    pmsDay      허가일
 */

/** 배포본에 따라 베이스 경로가 다르다. 순서대로 시도해 먼저 응답하는 쪽을 쓴다. */
const BASES = [
  process.env.BLD_RGST_BASE,
  'https://apis.data.go.kr/1613000/BldRgstHubService',
].filter(Boolean) as string[]  // BldRgstService_v2 는 폐기됨(코드 12)

let resolvedBase: string | null = null

export type BuildingLedger = {
  /** 위반건축물 등재 여부. 건축HUB 는 제공하지 않아 항상 null 이다 */
  violation: boolean | null
  /** 대지면적 ㎡ */
  platArea: number | null
  /** 건폐율 % */
  buildingCoverage: number | null
  /** 용적률 % */
  floorAreaRatio: number | null
  /** 부속건축물 수 */
  attachedCount: number | null
  /** 가구수 */
  householdCount: number | null
  mainPurpose: string | null
  useApprovalDate: string | null
  structure: string | null
  totalArea: number | null
  groundFloors: number | null
  /** 어느 베이스 경로가 실제로 응답했는지 (진단·디버깅용) */
  base: string | null
}

const EMPTY: BuildingLedger = {
  violation: null, platArea: null, buildingCoverage: null, floorAreaRatio: null,
  attachedCount: null, householdCount: null,
  mainPurpose: null, useApprovalDate: null,
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
        // 건축HUB 미제공. 세움터 대량자료를 붙이면 여기를 채운다.
        violation: null,
        platArea: n(main?.platArea),
        buildingCoverage: n(main?.bcRat),
        floorAreaRatio: n(main?.vlRat),
        attachedCount: Number.isFinite(Number(main?.atchBldCnt)) ? Number(main?.atchBldCnt) : null,
        householdCount: Number.isFinite(Number(main?.hhldCnt)) ? Number(main?.hhldCnt) : null,
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
