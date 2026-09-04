/**
 * G1 게이트 검증 — 마감 9/9.
 *
 * 구룡포·호미곶 실주소 10개를 넣어 각 소스가 몇 개나 정상 응답하는지 센다.
 * 7개 이상이면 통과, 미달이면 라이브 조회를 포기하고 전량 사전구축 DB로 전환한다.
 * 이 판단은 9/9에 내린다. W2로 끌고 가지 않는다.
 *
 *   node --env-file=.env scripts/verify-g1.ts
 *   node --env-file=.env scripts/verify-g1.ts --addresses data/g1-addresses.txt
 */
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolveAddress, currentProvider } from '../src/address'
import { lookupLedger, isDetachedHouse } from '../src/sources/ledger'
import { getHousePrice } from '../src/sources/housePrice'
import { getLandUse } from '../src/sources/landUse'

const PASS_THRESHOLD = 7

const args = process.argv.slice(2)
const listPath = args[args.indexOf('--addresses') + 1] ?? 'data/g1-addresses.txt'

type Row = {
  address: string
  pnu: string | null
  kakao: boolean
  ledger: boolean | null
  price: boolean
  landUse: boolean
  note: string
}

async function loadAddresses(): Promise<string[]> {
  if (existsSync(listPath)) {
    return (await readFile(listPath, 'utf8'))
      .split('\n').map(s => s.trim())
      .filter(s => s && !s.startsWith('#'))
  }
  console.log(`⚠️  ${listPath} 가 없습니다.`)
  console.log('   구룡포읍·호미곶면 실제 주소 10개를 한 줄에 하나씩 적어 두세요.\n')
  return []
}

async function tryStep<T>(fn: () => Promise<T>): Promise<[T | null, string]> {
  try { return [await fn(), ''] } catch (e) { return [null, (e as Error).message] }
}

async function main() {
  const addresses = await loadAddresses()
  if (!addresses.length) process.exit(1)

  const hasLedger = existsSync(process.env.LEDGER_PATH ?? 'data/ledger.json')
  if (!hasLedger) console.log('⚠️  data/ledger.json 없음 — 건축물대장 항목은 건너뜁니다.\n')

  const rows: Row[] = []

  for (const address of addresses) {
    const notes: string[] = []
    const [resolved, kakaoErr] = await tryStep(() => resolveAddress(address))
    if (kakaoErr) notes.push(`카카오: ${kakaoErr}`)

    const row: Row = {
      address, pnu: resolved?.pnu ?? null,
      kakao: !!resolved, ledger: null, price: false, landUse: false, note: '',
    }

    if (resolved) {
      if (hasLedger) {
        const [rec, e] = await tryStep(() => lookupLedger(resolved.pnu))
        if (e) notes.push(`대장: ${e}`)
        row.ledger = !!rec
        if (rec && !isDetachedHouse(rec.mainPurpose)) notes.push(`주용도 ${rec.mainPurpose} (대상 외)`)
      }

      const [price, pe] = await tryStep(() => getHousePrice(resolved.pnu))
      if (pe) notes.push(`공시가: ${pe}`)
      row.price = price?.value != null

      const [lu, le] = await tryStep(() => getLandUse(resolved.pnu))
      if (le) notes.push(`규제: ${le}`)
      row.landUse = !!lu && lu.verdict !== 'unknown'
    }

    row.note = notes.join(' / ')
    rows.push(row)
    process.stdout.write(row.kakao ? '.' : 'x')
  }

  console.log('\n')
  console.log('주소'.padEnd(34), '카카오 대장 공시가 규제  PNU')
  console.log('─'.repeat(96))
  for (const r of rows) {
    const m = (b: boolean | null) => (b === null ? ' -  ' : b ? ' ✓  ' : ' ✗  ')
    console.log(
      r.address.slice(0, 32).padEnd(34),
      m(r.kakao), m(r.ledger), m(r.price), m(r.landUse),
      r.pnu ?? '—',
    )
    if (r.note) console.log(' '.repeat(36) + '↳ ' + r.note)
  }

  const tally = {
    카카오: rows.filter(r => r.kakao).length,
    건축물대장: rows.filter(r => r.ledger).length,
    공시가: rows.filter(r => r.price).length,
    토지이용규제: rows.filter(r => r.landUse).length,
  }

  console.log('\n소스별 성공 건수 (전체 ' + rows.length + '건)')
  for (const [k, v] of Object.entries(tally)) {
    const ok = v >= PASS_THRESHOLD
    console.log(`  ${ok ? '✓' : '✗'} ${k.padEnd(12)} ${v}/${rows.length}`)
  }

  // 게이트 판정: 주소해석 + 규제 + 공시가가 모두 임계치를 넘어야 라이브 조회를 유지한다
  const critical = [tally.카카오, tally.공시가, tally.토지이용규제]
  const passed = critical.every(v => v >= PASS_THRESHOLD)

  console.log('\n' + '━'.repeat(60))
  if (passed) {
    console.log(`G1 통과 — 라이브 조회를 유지하고 W2(화면)로 넘어갑니다.`)
  } else {
    console.log(`G1 미달 (임계치 ${PASS_THRESHOLD}/${rows.length})`)
    console.log('→ 폴백 발동: 라이브 조회를 포기하고 전량 사전구축 DB로 전환합니다.')
    console.log('  화면·판정엔진·발표 3케이스는 그대로 유지되고 데이터 출처만 바뀝니다.')
  }
  console.log('━'.repeat(60))
  process.exit(passed ? 0 : 1)
}

main().catch(e => { console.error('실패:', e.message); process.exit(1) })
