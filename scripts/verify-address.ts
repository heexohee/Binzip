/**
 * 0단계 주소 해석 확인 — 다른 키 없이 돌아간다.
 *
 *   npm run verify:address
 *   npm run verify:address -- "경상북도 포항시 북구 구룡포읍 병포리 123-4"
 *
 * ADDRESS_PROVIDER 로 창구를 고른다 (juso 기본 | kakao).
 */
import { resolveAddress, currentProvider } from '../src/address'

/** 지번·도로명을 섞어 둔다 — 시골 소유주는 대개 지번으로 입력한다 */
const SAMPLES = [
  '경상북도 포항시 북구 구룡포읍 구룡포리 1',
  '경상북도 포항시 북구 호미곶면 대보리 1',
  '경상북도 포항시 남구 오천읍 문덕리 1',
]

const targets = process.argv.slice(2).length ? process.argv.slice(2) : SAMPLES
const provider = currentProvider()

console.log(`창구: ${provider}\n`)

let ok = 0
for (const q of targets) {
  try {
    const r = await resolveAddress(q)
    if (!r) {
      console.log(`✗ ${q}\n    매칭 결과 없음`)
      continue
    }
    ok++
    console.log(`✓ ${q}`)
    console.log(`    지번    ${r.jibunAddress}`)
    console.log(`    도로명  ${r.roadAddress ?? '—'}`)
    console.log(`    PNU     ${r.pnu}   (법정동 ${r.bcode} / 산 ${r.isMountain ? 'Y' : 'N'})`)
    console.log(`    대장키  시군구 ${r.sigunguCd} · 법정동 ${r.bjdongCd} · 대지구분 ${r.platGbCd} · 번 ${r.bun} · 지 ${r.ji}`)
    console.log(`    좌표    ${r.x != null ? `${r.x}, ${r.y}` : '— (이 창구는 좌표 미제공. 5단계에서 VWorld 지오코더 사용)'}`)
  } catch (e) {
    console.log(`✗ ${q}\n    ${(e as Error).message}`)
  }
}

console.log(`\n${ok}/${targets.length} 해석 성공`)
process.exit(ok === targets.length ? 0 : 1)
