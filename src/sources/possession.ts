import { callNed, latestBy } from './ned'

/**
 * 토지소유정보 — VWorld NED getPossessionAttr.
 *
 * 등기부에는 공개 API 가 없지만, 여기서 ①칸(법적)의 실마리를 얻는다.
 * 이름 같은 식별정보는 오지 않고 구분값만 온다.
 */
export type Possession = {
  /** 공유인 수. 2 이상이면 공동소유 */
  coOwnerCount: number | null
  /** 소유자 거주지 구분 (시도내 / 시도외 등) */
  ownerResidence: string | null
  /** 소유권 변동 원인 (매매 / 상속 / 소유권이전 …) */
  ownershipCause: string | null
  ownershipDate: string | null
  /** 소유 구분 (개인 / 법인 …) */
  ownerType: string | null
}

export async function getPossession(pnu: string): Promise<Possession> {
  const rows = await callNed('getPossessionAttr', pnu)
  const row = latestBy(rows, 'stdrYm')
  if (!row) {
    return { coOwnerCount: null, ownerResidence: null, ownershipCause: null, ownershipDate: null, ownerType: null }
  }
  const s = (v: unknown) => {
    const t = String(v ?? '').trim()
    return t && t !== '구분없음' ? t : null
  }
  const n = Number(row.cnrsPsnCo)
  return {
    coOwnerCount: Number.isFinite(n) && n > 0 ? n : null,
    ownerResidence: s(row.resdncSeCodeNm),
    ownershipCause: s(row.ownshipChgCauseCodeNm),
    ownershipDate: s(row.ownshipChgDe),
    ownerType: s(row.posesnSeCodeNm),
  }
}
