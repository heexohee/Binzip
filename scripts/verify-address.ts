/**
 * 0단계 주소 해석 확인.
 *
 *   npm run verify:address
 *   npm run verify:address -- "경상북도 포항시 북구 구룡포읍 병포리 123-4"
 *
 * strict 를 끄고 돌려서 응답이 어떤 품질인지(exact/road/fuzzy) 그대로 보여준다.
 * fuzzy = 검색엔진이 다른 필지를 돌려준 것. 운영에서는 버려진다.
 */
import { resolveAddress, currentProvider } from '../src/address'
import { extractJibun } from '../src/pnu'

const SAMPLES = process.argv.slice(2)

if (!SAMPLES.length) {
  console.log('실제 주소를 인자로 넣어 주세요. 예:')
  console.log('  npm run verify:address -- "경북 포항시 북구 구룡포읍 병포리 123-4"')
  console.log('\n또는 data/g1-addresses.txt 를 채우고 npm run verify:g1 을 쓰세요.')
  process.exit(1)
}

console.log(`창구: ${currentProvider()}\n`)

const LABEL = { exact: '✓ 정확', road: '· 도로명', fuzzy: '⚠ 불일치' } as const
let exact = 0

for (const q of SAMPLES) {
  const want = extractJibun(q)
  try {
    // strict:false — 버리지 않고 무엇이 왔는지 보여준다
    const r = await resolveAddress(q, { strict: false })
    if (!r) {
      console.log(`✗ ${q}\n    검색 결과 없음 (존재하지 않는 지번일 수 있습니다)\n`)
      continue
    }
    if (r.matchQuality === 'exact') exact++

    console.log(`${LABEL[r.matchQuality]}  ${q}`)
    if (r.matchQuality === 'fuzzy') {
      console.log(`    ⚠️ 입력 지번 ${want?.bun}-${want?.ji} 인데 응답은 ${Number(r.bun)}-${Number(r.ji)} 입니다.`)
      console.log(`       운영에서는 이 결과를 버립니다 (엉뚱한 필지로 진단서를 만들 수 없음).`)
    }
    console.log(`    지번    ${r.jibunAddress}`)
    console.log(`    도로명  ${r.roadAddress ?? '—'}`)
    console.log(`    PNU     ${r.pnu}   (법정동 ${r.bcode} / 산 ${r.isMountain ? 'Y' : 'N'})`)
    console.log(`    대장키  시군구 ${r.sigunguCd} · 법정동 ${r.bjdongCd} · 대지구분 ${r.platGbCd} · 번 ${r.bun} · 지 ${r.ji}`)
    console.log()
  } catch (e) {
    console.log(`✗ ${q}\n    ${(e as Error).message}\n`)
  }
}

console.log(`정확 일치 ${exact}/${SAMPLES.length}`)
process.exit(exact === SAMPLES.length ? 0 : 1)
