/**
 * 진단서 발급 — 주소 한 줄로 파이프라인을 끝까지 돌린다.
 *
 *   npm run diagnose -- "경상북도 포항시 남구 구룡포읍 구룡포리 198-2"
 *   npm run diagnose -- --json "…"
 */
import { diagnose } from '../src/pipeline'
import { AXIS_LABEL } from '../src/verdict'

const args = process.argv.slice(2)
const JSON_OUT = args.includes('--json')
const query = args.filter(a => !a.startsWith('--')).join(' ').trim()

if (!query) {
  console.log('사용법: npm run diagnose -- "포항시 남구 구룡포읍 구룡포리 198-2"')
  process.exit(1)
}

const r = await diagnose(query)

if (JSON_OUT) {
  console.log(JSON.stringify(r, null, 2))
  process.exit(0)
}

const line = (c = '─') => console.log(c.repeat(64))
const MARK = { clear: '●●●', suspect: '●●○', unknown: '●○○', blocked: '○○○' } as const
const WORD = { clear: '확인됨', suspect: '조건 있음', unknown: '미확인', blocked: '막힘' } as const

const FOOTER = '  공개 자료 기반 정보 제공이며 중개대상물의 표시·광고나 거래 알선이 아닙니다.'

function factsTable(f: Record<string, unknown>) {
  const rows: [string, unknown][] = [
    ['건축물 주용도', f.mainPurpose],
    ['사용승인일', f.useApprovalDate],
    ['건물연령', f.buildingAge ? `${f.buildingAge}년` : null],
    ['구조', f.structure],
    ['연면적', f.buildingArea ? `${f.buildingArea}㎡ · 지상 ${f.floors}층` : null],
    ['토지이용상황', f.useSituation],
    ['지목', f.category],
    ['도로접면', f.roadSide],
    ['용도지역', f.zone1],
    ['대지면적', f.landArea ? `${f.landArea}㎡` : null],
    ['건폐율·용적률', f.buildingCoverage ? `${f.buildingCoverage}% · ${f.floorAreaRatio}%` : null],
    ['부속건축물', f.attachedCount != null ? `${f.attachedCount}동` : null],
    ['개별주택가격', f.housePrice ? `${f.housePriceEok}억 원 (${f.housePriceYear})` : null],
    ['공유인 수', f.coOwnerCount],
    ['소유자 거주지', f.ownerResidence],
    ['소유권 변동', f.ownershipCause ? `${f.ownershipCause} (${f.ownershipDate})` : null],
  ]
  for (const [k, v] of rows) console.log(`    ${k.padEnd(14)} ${v ?? '[미확인]'}`)
}

function errorsBlock(errs: string[]) {
  if (!errs.length) return
  console.log('\n  조달 실패')
  for (const e of errs) console.log(`    ⚠ ${e}`)
}

if (r.status === 'address_not_found') {
  console.log(`\n주소를 찾지 못했습니다: ${r.query}`)
  console.log('지번을 정확히 넣어 보세요. 예) 경상북도 포항시 남구 구룡포읍 구룡포리 198-2\n')
  process.exit(1)
}

console.log()
line('━')
console.log('  빈집이력서 진단서')
line('━')
console.log(`  ${r.address.jibunAddress}`)
if (r.address.roadAddress) console.log(`  ${r.address.roadAddress}`)
console.log(`  PNU ${r.address.pnu}`)

if (r.status === 'out_of_scope') {
  line()
  console.log('  판정   대상 아님')
  console.log(`  사유   ${r.reason}`)

  if (r.observations.length) {
    line()
    console.log('  다만 조회 중 아래를 확인했습니다')
    for (const o of r.observations) console.log(`    · ${o}`)
  }

  line()
  console.log('  참고 정보')
  factsTable(r.facts as Record<string, unknown>)
  errorsBlock(r.sourceErrors)

  line('━')
  console.log(`  확인일 ${r.checkedAt}`)
  console.log(FOOTER)
  line('━')
  console.log()
  process.exit(0)
}

const { diagnosis: d, facts, checkedAt } = r

line()
console.log(`  판정   ${d.grade}`)
console.log(`  ${d.headline}`)
line()

for (const a of d.axes) {
  console.log(`  ${MARK[a.verdict]}  ${AXIS_LABEL[a.axis]}   ${WORD[a.verdict]}`)
  for (const f of a.findings) {
    console.log(`        · ${f.reason}`)
    if (f.nextStep) console.log(`          → ${f.nextStep}`)
    console.log(`          ${f.source === '—' ? '자동 확인 불가' : `${f.source} ${checkedAt} 확인`}`)
  }
  console.log()
}

line()
console.log('  참고 정보')
factsTable(facts as Record<string, unknown>)
errorsBlock(r.sourceErrors)

line('━')
console.log(`  판정기준 ${r.rulesVersion} · 현장 확인 ${d.fieldVerified ? '완료' : '미실시'}`)
console.log(FOOTER)
line('━')
console.log()
