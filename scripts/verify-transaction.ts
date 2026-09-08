/**
 * 실거래가 어댑터 확인.
 *
 *   npm run verify:transaction
 *   npm run verify:transaction -- 47130 산대리 12
 *   npm run verify:transaction -- 47113 구룡포리 24
 *
 * 명세에 없어 실호출로만 알 수 있는 것들을 여기서 확인한다.
 *   · umdNm 이 '산대리' 인가 '안강읍 산대리' 인가
 *   · numOfRows·pageNo 가 먹히는가
 *   · cdealType 이 'O' 만 오는가 'N/O' 둘 다 오는가
 *   · 활용신청이 승인됐는가 (미승인이면 코드 20)
 */
import {
  getDeals,
  dealYmds,
  isCancelled,
  wonFromManwon,
  type Deal,
} from '../src/sources/transaction'

const [sigungu = '47130', ri = '산대리', monthsArg = '12'] = process.argv.slice(2)
const months = Number(monthsArg) || 12

const man = (n: number | null) => (n == null ? '—' : (n / 10_000).toLocaleString('ko-KR') + '만원')
const sqm = (n: number | null) => (n == null ? '—' : n.toLocaleString('ko-KR') + '㎡')

console.log('─'.repeat(70))
console.log(`  실거래가 조회   시군구 ${sigungu} · '${ri || '전체'}' · 최근 ${months}개월`)
console.log(`  조회 대상 월    ${dealYmds(months).at(-1)} ~ ${dealYmds(months)[0]}`)
console.log('─'.repeat(70))

// 순수 함수부터 — 네트워크 없이 틀린 것을 먼저 걸러낸다
const checks: [string, boolean][] = [
  ['만원→원 변환', wonFromManwon('  12,000') === 120_000_000],
  ['빈 금액은 null', wonFromManwon('') === null],
  ["해제 'O'", isCancelled('O') === true],
  ["정상 'N'", isCancelled('N') === false],
  ['정상 빈값', isCancelled('') === false],
  ['개월 수', dealYmds(3).length === 3],
]
for (const [name, ok] of checks) console.log(`  ${ok ? '✓' : '✗'} ${name}`)
if (checks.some(([, ok]) => !ok)) {
  console.log('\n순수 함수가 틀렸습니다. 네트워크 호출 전에 고치세요.')
  process.exit(1)
}
console.log()

try {
  const r = await getDeals({ sigunguCd: sigungu, umdName: ri || null, months })

  if (r.failures.length) {
    console.log(`  ⚠️ 조회 실패 ${r.failures.length}건`)
    for (const f of r.failures.slice(0, 3)) console.log(`     ${f}`)
    if (r.failures.length > 3) console.log(`     … 외 ${r.failures.length - 3}건`)
    console.log()
  }

  console.log(`  ${ri || '시군구 전체'} 거래   ${r.nearby.length}건`)
  console.log(`  비교 가능           ${r.comparable.length}건`)
  console.log(
    `  중앙 단가           ${
      r.medianUnitPrice == null ? '—' : r.medianUnitPrice.toLocaleString('ko-KR') + '원/㎡'
    }`,
  )
  console.log()

  if (r.nearby.length === 0) {
    console.log('  거래가 없습니다. 시골에서는 정상일 수 있습니다.')
    console.log('  실패 0건이면 「자료 없음」, 실패가 있으면 「조회 실패」입니다 — 위를 보세요.')
    console.log('\n  리 이름 없이 시군구 전체로 돌려 umdNm 실제 표기를 확인해 보세요:')
    console.log(`    npm run verify:transaction -- ${sigungu} "" ${months}`)
  }

  const show = (d: Deal) =>
    [
      (d.dealDate ?? '—').padEnd(11),
      (d.kind === 'land' ? '토지' : '주택').padEnd(3),
      (d.umdNm ?? '—').padEnd(9),
      (d.jibun ?? '—').padEnd(7),
      (d.jimok ?? d.buildYear ?? '—').padEnd(5),
      (d.landUse ?? '—').padEnd(11),
      sqm(d.area).padStart(11),
      man(d.amount).padStart(12),
    ].join(' ')

  for (const d of r.nearby.slice(0, 15)) console.log('  ' + show(d))
  if (r.nearby.length > 15) console.log(`  … 외 ${r.nearby.length - 15}건`)

  // 명세에 없어 실호출로만 알 수 있는 것
  const umds = [...new Set(r.nearby.map((d) => d.umdNm).filter(Boolean))]
  if (umds.length) console.log(`\n  umdNm 실제 표기   ${umds.slice(0, 8).join(' · ')}`)
} catch (e) {
  const msg = (e as Error).message
  console.log(`  ✗ 조회 실패\n     ${msg}\n`)
  if (msg.includes('[20]') || msg.includes('[30]')) {
    console.log('  활용신청이 아직 승인되지 않았을 수 있습니다.')
    console.log('    토지         https://www.data.go.kr/data/15126466/openapi.do')
    console.log('    단독/다가구   https://www.data.go.kr/data/15126465/openapi.do')
  }
  process.exit(1)
}
