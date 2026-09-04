/**
 * G1 검증용 실제 주소 수집.
 *
 * juso 에 지번 없이 읍·면 이름으로 물어보면 그 지역에 실재하는 주소가 돌아온다.
 * 실거래가 API(data.go.kr 키)가 없어도 되고, 지어낸 지번을 쓸 일도 없다.
 *
 *   npm run collect:addresses
 *   npm run collect:addresses -- --count 10 --out data/g1-addresses.txt
 */
import { writeFile } from 'node:fs/promises'

const JUSO_URL = 'https://business.juso.go.kr/addrlink/addrLinkApi.do'

/** 1호 거점. 읍·면 단위로 넓게 훑는다 */
const AREAS = [
  // ⚠️ 구룡포읍·호미곶면은 남구(47111), 청하면은 북구(47113)다
  '경상북도 포항시 남구 구룡포읍',
  '경상북도 포항시 남구 호미곶면',
  '경상북도 포항시 북구 청하면',
]

/** 단독주택이 아닌 게 뻔한 건물명은 거른다 */
const EXCLUDE = /아파트|빌라|맨션|타워|오피스텔|상가|시장|학교|교회|성당|사찰|공장|창고|센터|회관|주민센터|파출소|우체국|보건|어린이집|요양|모텔|펜션|호텔|리조트|아파트먼트|하이츠|캐슬|palace|APT/i

const args = process.argv.slice(2)
const opt = (n: string, d: string) => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 ? (args[i + 1] ?? d) : d
}
const COUNT = Number(opt('count', '10'))
const OUT = opt('out', 'data/g1-addresses.txt')

type JusoItem = {
  roadAddr: string
  jibunAddr: string
  admCd: string
  lnbrMnnm: string
  lnbrSlno: string
  mtYn: '0' | '1'
  bdNm?: string
  emdNm?: string
  liNm?: string
}

async function search(keyword: string): Promise<JusoItem[]> {
  const key = process.env.JUSO_CONFM_KEY
  if (!key) throw new Error('JUSO_CONFM_KEY 가 없습니다 (.env 확인)')

  const url = new URL(JUSO_URL)
  url.searchParams.set('confmKey', key)
  url.searchParams.set('keyword', keyword)
  url.searchParams.set('currentPage', '1')
  url.searchParams.set('countPerPage', '100')
  url.searchParams.set('resultType', 'json')

  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  const json: any = JSON.parse(await res.text())

  const common = json?.results?.common
  const code = String(common?.errorCode ?? '')
  if (code && code !== '0') throw new Error(`[${code}] ${common?.errorMessage ?? ''}`)

  return json?.results?.juso ?? []
}

/** 지번주소에서 건물명 등 꼬리를 떼고 "…리 123-4" 형태만 남긴다 */
function cleanJibun(jibunAddr: string): string | null {
  const m = /^(.*?(?:리|동|가)\s+(?:산\s*)?\d+(?:-\d+)?)/.exec(jibunAddr.trim())
  return m ? m[1]!.trim() : null
}

type Row = { addr: string; area: string; li: string; bdNm: string }

/** 지역 → 리 → 후보들. 한 리에서 연번만 뽑히지 않게 층을 나눠 담는다 */
const byArea = new Map<string, Map<string, Row[]>>()
const seen = new Set<string>()

for (const area of AREAS) {
  process.stdout.write(`${area} … `)
  const byLi = new Map<string, Row[]>()
  byArea.set(area, byLi)
  try {
    const items = await search(area)
    let added = 0
    for (const it of items) {
      if (it.mtYn === '1') continue                       // 산 필지는 제외
      if (it.bdNm && EXCLUDE.test(it.bdNm)) continue      // 공동주택·비주거 제외
      const addr = cleanJibun(it.jibunAddr)
      if (!addr) continue
      const pnuKey = `${it.admCd}${it.mtYn}${it.lnbrMnnm}-${it.lnbrSlno}`
      if (seen.has(pnuKey)) continue
      seen.add(pnuKey)
      const li = it.liNm || it.emdNm || '(리 미상)'
      if (!byLi.has(li)) byLi.set(li, [])
      byLi.get(li)!.push({ addr, area, li, bdNm: it.bdNm ?? '' })
      added++
    }
    console.log(`${items.length}건 조회 → ${added}건 채택 (${byLi.size}개 리)`)
  } catch (e) {
    console.log(`실패: ${(e as Error).message}`)
  }
}

/** 지역 → 리 순으로 라운드로빈해서 고르게 뽑는다 */
const picked: Row[] = []
const cursors = new Map<string, number>()
outer: for (let round = 0; round < 50; round++) {
  let progressed = false
  for (const [area, byLi] of byArea) {
    const lis = [...byLi.keys()]
    if (!lis.length) continue
    const li = lis[round % lis.length]!
    const pool = byLi.get(li)!
    const i = cursors.get(`${area}/${li}`) ?? 0
    if (i >= pool.length) continue
    cursors.set(`${area}/${li}`, i + 1)
    picked.push(pool[i]!)
    progressed = true
    if (picked.length >= COUNT) break outer
  }
  if (!progressed) break
}

if (!picked.length) {
  console.error('\n수집된 주소가 없습니다.')
  process.exit(1)
}

const body = [
  '# G1 게이트 검증용 실제 주소',
  `# scripts/collect-addresses.ts 로 juso 에서 수집 (${new Date().toISOString().slice(0, 10)})`,
  '# 실재하는 주소이지만 빈집인지는 확인되지 않았습니다 — 파이프라인 연결 확인용입니다.',
  '',
  ...picked.map(p => p.addr),
  '',
].join('\n')

await writeFile(OUT, body, 'utf8')

console.log(`\n${picked.length}건 저장 → ${OUT}\n`)
for (const p of picked) console.log(`  ${p.addr}${p.bdNm ? `   (${p.bdNm})` : ''}`)
