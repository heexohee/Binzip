/* ────────────────────────────────────────────────────────────
 * 순수 함수 — 네트워크 없이 단위 테스트가 된다
 * ──────────────────────────────────────────────────────────── */

/**
 * PNU(19자리) 조립.
 *   법정동코드(10) + 산여부(1) + 본번(4) + 부번(4)
 *   산여부: 1=일반, 2=산
 *
 * ⚠️ 건축물대장 platGbCd 는 0=대지 / 1=산 으로 체계가 다르다.
 *    같은 변수로 돌려쓰면 산지 필지에서 조용히 틀린다.
 */
export function composePnu(
  bcode: string,
  bun: number | string,
  ji: number | string,
  isMountain: boolean,
): string {
  if (!/^\d{10}$/.test(bcode)) {
    throw new Error(`법정동코드는 10자리 숫자여야 합니다: ${bcode}`)
  }
  const pnu = `${bcode}${isMountain ? '2' : '1'}${pad4(bun)}${pad4(ji)}`
  if (pnu.length !== 19) throw new Error(`PNU 길이 오류(${pnu.length}): ${pnu}`)
  return pnu
}

export function pad4(v: number | string | null | undefined): string {
  const n = Number(v ?? 0)
  if (!Number.isFinite(n) || n < 0 || n > 9999) {
    throw new Error(`본번/부번 범위 오류: ${v}`)
  }
  return String(Math.trunc(n)).padStart(4, '0')
}

/** PNU 를 건축물대장 조회 파라미터로 분해한다. */
export function decomposePnu(pnu: string) {
  if (!/^\d{19}$/.test(pnu)) throw new Error(`PNU는 19자리 숫자여야 합니다: ${pnu}`)
  const bcode = pnu.slice(0, 10)
  const mountainFlag = pnu.slice(10, 11)
  return {
    bcode,
    sigunguCd: bcode.slice(0, 5),
    bjdongCd: bcode.slice(5, 10),
    isMountain: mountainFlag === '2',
    platGbCd: (mountainFlag === '2' ? '1' : '0') as '0' | '1',
    bun: pnu.slice(11, 15),
    ji: pnu.slice(15, 19),
  }
}

/** "123-4", "산 12", "123" 형태의 지번 문자열을 본번/부번/산여부로 쪼갠다. */
export function parseJibun(raw: string): { bun: number; ji: number; isMountain: boolean } {
  const s = raw.trim()
  const isMountain = /^산\s*/.test(s)
  const nums = s.replace(/^산\s*/, '').match(/\d+/g) ?? []
  return {
    bun: Number(nums[0] ?? 0),
    ji: Number(nums[1] ?? 0),
    isMountain,
  }
}
