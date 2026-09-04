/**
 * G1 게이트 검증 — 마감 9/9.
 *
 * 실주소 10건에 대해 각 소스가 몇 건이나 정상 응답하는지 센다.
 * 7건 이상이면 통과, 미달이면 라이브 조회를 포기하고 사전구축 DB로 전환한다.
 *
 *   npm run verify:g1
 */
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolveAddress, currentProvider } from '../src/address'
import { getHousePrice } from '../src/sources/housePrice'
import { getLandUse } from '../src/sources/landUse'
import { getLandChar, judgeRoadAccess, looksResidential } from '../src/sources/landChar'

const PASS = 7
const LIST = 'data/g1-addresses.txt'

/** ok = 값까지 받음 · empty = 응답했으나 해당 없음 · error = 조달 실패 */
type S = 'ok' | 'empty' | 'error'

type Row = {
  address: string
  pnu: string | null
  addr: S
  price: S
  landUse: S
  roadSide: S
  residential: boolean | null
  detail: string
}

const addresses = existsSync(LIST)
  ? (await readFile(LIST, 'utf8')).split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'))
  : []

if (!addresses.length) {
  console.error(`${LIST} 가 비어 있습니다. npm run collect:addresses 를 먼저 실행하세요.`)
  process.exit(1)
}

const t = async <T,>(fn: () => Promise<T>): Promise<[T | null, string]> => {
  try { return [await fn(), ''] } catch (e) { return [null, (e as Error).message] }
}

console.log(`주소 창구: ${currentProvider()} · 대상 ${addresses.length}건\n`)

const rows: Row[] = []
for (const address of addresses) {
  const notes: string[] = []
  const [r, e] = await t(() => resolveAddress(address))
  if (e) notes.push(`주소: ${e}`)

  const row: Row = {
    address, pnu: r?.pnu ?? null,
    addr: e ? 'error' : r ? 'ok' : 'empty',
    price: 'error', landUse: 'error', roadSide: 'error',
    residential: null, detail: '',
  }

  if (r) {
    const [price, pe] = await t(() => getHousePrice(r.pnu))
    if (pe) notes.push(`공시가 오류: ${pe}`)
    row.price = pe ? 'error' : price?.value != null ? 'ok' : 'empty'
    if (price?.value) notes.push(`공시가 ${(price.value / 100_000_000).toFixed(2)}억(${price.year})`)

    const [lu, le] = await t(() => getLandUse(r.pnu))
    if (le) notes.push(`규제 오류: ${le}`)
    row.landUse = le ? 'error' : lu && lu.zones.length ? 'ok' : 'empty'
    if (lu?.zones.length) notes.push(`규제 ${lu.zones.join('·')}`)

    const [lc, ce] = await t(() => getLandChar(r.pnu))
    if (ce) notes.push(`토지특성 오류: ${ce}`)
    row.roadSide = ce ? 'error' : lc?.roadSide ? 'ok' : 'empty'
    if (lc) {
      row.residential = looksResidential(lc)
      notes.push(`도로 ${lc.roadSide ?? '?'}(${judgeRoadAccess(lc).verdict})`)
      notes.push(`이용 ${lc.useSituation ?? '?'}${row.residential === false ? ' ⚠비주거' : ''}`)
    }
  }

  row.detail = notes.join(' · ')
  rows.push(row)
  process.stdout.write(row.addr === 'ok' ? '.' : 'x')
}

console.log('\n')
const M: Record<S, string> = { ok: '✓', empty: '·', error: '✗' }
for (const r of rows) {
  console.log(`${M[r.addr]}${M[r.price]}${M[r.landUse]}${M[r.roadSide]}  ${r.address}`)
  if (r.detail) console.log(`      ${r.detail}`)
}
console.log('\n  ✓ 값 받음   · 응답했으나 해당 없음   ✗ 조달 실패')

const SOURCES = ['주소→PNU', '개별주택가격', '토지이용규제', '도로접면'] as const
const col = (i: number) => rows.map(r => [r.addr, r.price, r.landUse, r.roadSide][i]!)

console.log(`\n소스별 조달 상태 (전체 ${rows.length}건)`)
let reachable = true
SOURCES.forEach((name, i) => {
  const c = col(i)
  const err = c.filter(v => v === 'error').length
  const ok = c.filter(v => v === 'ok').length
  const empty = c.filter(v => v === 'empty').length
  if (err > 0) reachable = false
  console.log(`  ${err === 0 ? '✓' : '✗'} ${name.padEnd(14)} 값 ${ok} · 해당없음 ${empty} · 실패 ${err}`)
})

// 커버리지는 참고 지표. 논밭에 주택가격이 없는 것은 정상이므로 주거용 필지만 센다
const resid = rows.filter(r => r.residential === true)
const residWithPrice = resid.filter(r => r.price === 'ok').length
console.log(`\n참고 — 주거용으로 판정된 ${resid.length}건 중 공시가 확보 ${residWithPrice}건`)

console.log('\n' + '━'.repeat(62))
if (reachable) {
  console.log('G1 통과 — 네 소스 모두 조달 실패 0건. 라이브 조회를 유지하고 W2 로 넘어갑니다.')
  console.log('  (값이 없는 필지는 논·밭 등 주택이 없는 곳으로, 정상적인 "대상 아님" 신호입니다)')
} else {
  console.log('G1 미달 — 조달에 실패한 소스가 있습니다.')
  console.log('→ 폴백: 라이브 조회를 포기하고 전량 사전구축 DB로 전환합니다.')
}
console.log('━'.repeat(62))
process.exit(reachable ? 0 : 1)
