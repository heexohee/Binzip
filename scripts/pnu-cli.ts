/**
 * PNU 변환 확인용 CLI. 네트워크 없이 순수 로직만 검증한다.
 *
 *   node scripts/pnu-cli.ts 4711325300 123 4
 *   node scripts/pnu-cli.ts --decompose 4711325300101230004
 *   node scripts/pnu-cli.ts --selftest
 */
import { composePnu, decomposePnu, parseJibun } from '../src/pnu'

const args = process.argv.slice(2)

if (args[0] === '--selftest') {
  let pass = 0
  let fail = 0

  const check = (name: string, actual: unknown, expected: unknown) => {
    const ok = JSON.stringify(actual) === JSON.stringify(expected)
    if (ok) {
      pass++
      console.log(`  ✓ ${name}`)
    } else {
      fail++
      console.log(`  ✗ ${name}`)
      console.log(`      기대 ${JSON.stringify(expected)}`)
      console.log(`      실제 ${JSON.stringify(actual)}`)
    }
  }

  // 합성 법정동코드: 47113 = 포항시 북구(구룡포읍 소재 구), 25300 = 임의 읍면동
  const BCODE = '4711325300'

  console.log('PNU 순수 로직 자가검증\n')

  // 10 + 1 + 4 + 4 = 19
  check('일반 필지 19자리', composePnu(BCODE, 123, 4, false), '4711325300101230004')
  check('산 필지는 산여부 2', composePnu(BCODE, 12, 0, true), '4711325300200120000')
  check('부번 없으면 0000', composePnu(BCODE, 7, 0, false), '4711325300100070000')
  check('길이는 항상 19', composePnu(BCODE, 9999, 9999, false).length, 19)

  const d = decomposePnu('4711325300101230004')
  check('분해 — 시군구/법정동', [d.sigunguCd, d.bjdongCd], ['47113', '25300'])
  check('분해 — 본번/부번', [d.bun, d.ji], ['0123', '0004'])
  check('분해 — 일반 필지 platGbCd 는 0', d.platGbCd, '0')
  check('분해 — 산 필지 platGbCd 는 1', decomposePnu('4711325300200120000').platGbCd, '1')
  check('분해 — 산 필지 isMountain', decomposePnu('4711325300200120000').isMountain, true)

  check('왕복 변환', composePnu(d.bcode, Number(d.bun), Number(d.ji), d.isMountain), '4711325300101230004')

  check('지번 파싱 123-4', parseJibun('123-4'), { bun: 123, ji: 4, isMountain: false })
  check('지번 파싱 산 12', parseJibun('산 12'), { bun: 12, ji: 0, isMountain: true })
  check('지번 파싱 7', parseJibun('7'), { bun: 7, ji: 0, isMountain: false })

  const throws = (fn: () => unknown) => {
    try { fn(); return false } catch { return true }
  }
  check('법정동코드 10자리 아니면 예외', throws(() => composePnu('47113', 1, 1, false)), true)
  check('본번 범위 초과면 예외', throws(() => composePnu(BCODE, 10000, 0, false)), true)
  check('PNU 19자리 아니면 예외', throws(() => decomposePnu('123')), true)

  console.log(`\n통과 ${pass} / 실패 ${fail}`)
  process.exit(fail ? 1 : 0)
}

if (args[0] === '--decompose') {
  console.log(JSON.stringify(decomposePnu(args[1] ?? ''), null, 2))
  process.exit(0)
}

const [bcode, bun, ji] = args
if (!bcode) {
  console.log('사용법:')
  console.log('  node scripts/pnu-cli.ts <법정동코드10> <본번> [부번]')
  console.log('  node scripts/pnu-cli.ts --decompose <PNU19>')
  console.log('  node scripts/pnu-cli.ts --selftest')
  process.exit(1)
}
const pnu = composePnu(bcode, bun ?? 0, ji ?? 0, false)
console.log(pnu)
console.log(JSON.stringify(decomposePnu(pnu), null, 2))
