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
const show: [string, unknown][] = [
  ['건축물 주용도', facts.mainPurpose],
  ['사용승인일', facts.useApprovalDate],
  ['건물연령', facts.buildingAge ? `${facts.buildingAge}년` : null],
  ['구조', facts.structure],
  ['연면적', facts.buildingArea ? `${facts.buildingArea}㎡ · 지상 ${facts.floors}층` : null],
  ['토지이용상황', facts.useSituation],
  ['도로접면', facts.roadSide],
  ['용도지역', facts.zone1],
  ['지목', facts.category],
  ['대지면적', facts.landArea ? `${facts.landArea}㎡` : null],
  ['건폐율·용적률', facts.buildingCoverage ? `${facts.buildingCoverage}% · ${facts.floorAreaRatio}%` : null],
  ['부속건축물', facts.attachedCount != null ? `${facts.attachedCount}동` : null],
  ['개별주택가격', facts.housePrice ? `${facts.housePriceEok}억 원 (${facts.housePriceYear})` : null],
  ['공유인 수', facts.coOwnerCount],
  ['소유자 거주지', facts.ownerResidence],
  ['소유권 변동', facts.ownershipCause ? `${facts.ownershipCause} (${facts.ownershipDate})` : null],
]
for (const [k, v] of show) {
  console.log(`    ${k.padEnd(14)} ${v ?? '[미확인]'}`)
}

if (r.sourceErrors.length) {
  console.log('\n  조달 실패')
  for (const e of r.sourceErrors) console.log(`    ⚠ ${e}`)
}

line('━')
console.log(`  판정기준 ${r.rulesVersion} · 현장 확인 ${d.fieldVerified ? '완료' : '미실시'}`)
console.log('  공개 자료 기반 정보 제공이며 중개대상물의 표시·광고나 거래 알선이 아닙니다.')
line('━')
console.log()
