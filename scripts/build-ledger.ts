/**
 * 세움터 건축물대장 대량자료 → data/ledger.json (PNU 키 룩업 테이블)
 *
 *   node scripts/build-ledger.ts --inspect --in data/raw/표제부.csv
 *   node scripts/build-ledger.ts --in data/raw/표제부.csv --sigungu 47111,47113
 *
 * 실제 컬럼명은 배포본마다 다르므로 --inspect 로 먼저 확인하고,
 * 못 잡으면 HEADER_MAP 에 후보를 추가한다.
 */
import { createReadStream, existsSync } from 'node:fs'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import path from 'node:path'
import iconv from 'iconv-lite'
import ExcelJS from 'exceljs'
import { composePnu } from '../src/pnu'
import type { LedgerRecord, LedgerIndex } from '../src/types'

/* ── 컬럼 후보. 왼쪽이 우리 필드, 오른쪽이 파일에서 나올 법한 이름들 ── */
const HEADER_MAP: Record<string, string[]> = {
  sigunguCd:   ['시군구코드', 'sigunguCd'],
  bjdongCd:    ['법정동코드', 'bjdongCd'],
  platGbCd:    ['대지구분코드', 'platGbCd', '대지구분'],
  bun:         ['번', 'bun', '지번본번', '본번'],
  ji:          ['지', 'ji', '지번부번', '부번'],
  mainPurpose: ['주용도코드명', 'mainPurpsCdNm', '주용도명', '주용도'],
  approvalDate:['사용승인일', 'useAprDay', '사용승인일자'],
  totalArea:   ['연면적', 'totArea', '연면적㎡', '연면적m2'],
  violation:   ['위반건축물여부', 'violYn', '위반건축물'],
  buildingName:['건물명', 'bldNm', '건축물명'],
}

const args = process.argv.slice(2)
const flag = (n: string) => args.includes(`--${n}`)
const opt = (n: string) => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 ? args[i + 1] : undefined
}

const INSPECT = flag('inspect')
const IN = opt('in') ?? 'data/raw/ledger.csv'
const OUT = opt('out') ?? 'data/ledger.json'
/** 포항시 남구 47111(구룡포읍·호미곶면) / 북구 47113(청하면) — juso admCd 로 확인함 */
const SIGUNGU = (opt('sigungu') ?? '47111,47113').split(',').map(s => s.trim()).filter(Boolean)

/* ── 인코딩 감지: 국내 공공 CSV 는 대부분 CP949 ── */
async function detectEncoding(file: string): Promise<'utf8' | 'cp949'> {
  const buf = (await readFile(file)).subarray(0, 65_536)
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) return 'utf8'
  const decoded = new TextDecoder('utf-8', { fatal: false }).decode(buf)
  // U+FFFD 가 섞이면 UTF-8 이 아니다
  return decoded.includes('�') ? 'cp949' : 'utf8'
}

function splitDelimited(line: string, delim: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (quoted && line[i + 1] === '"') { cur += '"'; i++ } else quoted = !quoted
    } else if (c === delim && !quoted) { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur)
  return out.map(s => s.trim())
}

function guessDelimiter(line: string): string {
  const counts = [',', '|', '\t', ';'].map(d => [d, line.split(d).length] as const)
  counts.sort((a, b) => b[1] - a[1])
  return counts[0]![1] > 1 ? counts[0]![0] : ','
}

const norm = (s: string) => s.replace(/[\s()㎡]/g, '').replace(/m2/gi, '').toLowerCase()

function buildIndexMap(headers: string[]): Record<string, number> {
  const normalized = headers.map(norm)
  const map: Record<string, number> = {}
  for (const [field, candidates] of Object.entries(HEADER_MAP)) {
    for (const cand of candidates) {
      const i = normalized.indexOf(norm(cand))
      if (i >= 0) { map[field] = i; break }
    }
  }
  return map
}

function toRecord(cells: string[], idx: Record<string, number>): LedgerRecord | null {
  const get = (f: string) => {
    const i = idx[f]
    return i === undefined ? '' : (cells[i] ?? '').trim()
  }

  const sigungu = get('sigunguCd')
  let bjdong = get('bjdongCd')

  // 법정동코드가 10자리로 통째로 오는 배포본도 있다
  let bcode: string
  if (/^\d{10}$/.test(bjdong)) bcode = bjdong
  else if (/^\d{5}$/.test(sigungu) && /^\d{5}$/.test(bjdong)) bcode = sigungu + bjdong
  else return null

  if (SIGUNGU.length && !SIGUNGU.includes(bcode.slice(0, 5))) return null

  const bunRaw = get('bun'), jiRaw = get('ji')
  if (!/^\d+$/.test(bunRaw)) return null

  const isMountain = get('platGbCd') === '1'

  let pnu: string
  try { pnu = composePnu(bcode, bunRaw, jiRaw || '0', isMountain) }
  catch { return null }

  const area = Number(get('totalArea').replace(/,/g, ''))
  const viol = get('violation')

  return {
    pnu,
    buildingName: get('buildingName') || null,
    mainPurpose: get('mainPurpose') || null,
    approvalDate: /^\d{8}$/.test(get('approvalDate')) ? get('approvalDate') : null,
    totalArea: Number.isFinite(area) && area > 0 ? area : null,
    violation: viol === '' ? null : /^(1|y|yes|위반)/i.test(viol),
  }
}

/* ── CSV / TXT ── */
async function parseDelimited(file: string, index: LedgerIndex, stats: Stats) {
  const enc = await detectEncoding(file)
  console.log(`  인코딩 감지: ${enc}`)

  const stream = enc === 'cp949'
    ? createReadStream(file).pipe(iconv.decodeStream('cp949'))
    : createReadStream(file, { encoding: 'utf8' })

  const rl = createInterface({ input: stream as never, crlfDelay: Infinity })

  let headers: string[] | null = null
  let idx: Record<string, number> = {}
  let delim = ','

  for await (const line of rl) {
    if (!line.trim()) continue

    if (!headers) {
      delim = guessDelimiter(line)
      headers = splitDelimited(line, delim)
      idx = buildIndexMap(headers)
      if (INSPECT) { reportHeaders(headers, idx); rl.close(); return }
      assertRequired(idx, headers)
      continue
    }

    stats.read++
    const rec = toRecord(splitDelimited(line, delim), idx)
    if (!rec) { stats.skipped++; continue }
    if (index[rec.pnu]) stats.duplicated++
    index[rec.pnu] = rec
  }
}

/* ── XLSX (스트리밍) ── */
async function parseXlsx(file: string, index: LedgerIndex, stats: Stats) {
  const wb = new ExcelJS.stream.xlsx.WorkbookReader(file, {})
  let headers: string[] | null = null
  let idx: Record<string, number> = {}

  for await (const sheet of wb) {
    for await (const row of sheet) {
      const cells = (row.values as unknown[]).slice(1).map(v => String(v ?? '').trim())
      if (!headers) {
        headers = cells
        idx = buildIndexMap(headers)
        if (INSPECT) { reportHeaders(headers, idx); return }
        assertRequired(idx, headers)
        continue
      }
      stats.read++
      const rec = toRecord(cells, idx)
      if (!rec) { stats.skipped++; continue }
      if (index[rec.pnu]) stats.duplicated++
      index[rec.pnu] = rec
    }
    break // 첫 시트만
  }
}

type Stats = { read: number; skipped: number; duplicated: number }

function reportHeaders(headers: string[], idx: Record<string, number>) {
  console.log(`\n감지된 컬럼 ${headers.length}개:\n`)
  headers.forEach((h, i) => console.log(`  [${String(i).padStart(3)}] ${h}`))
  console.log('\n매핑 결과:')
  for (const field of Object.keys(HEADER_MAP)) {
    const i = idx[field]
    console.log(`  ${field.padEnd(13)} ${i === undefined ? '✗ 못 찾음' : `✓ [${i}] ${headers[i]}`}`)
  }
  const missing = Object.keys(HEADER_MAP).filter(f => idx[f] === undefined)
  if (missing.length) {
    console.log(`\n못 찾은 필드: ${missing.join(', ')}`)
    console.log('→ scripts/build-ledger.ts 의 HEADER_MAP 에 실제 컬럼명을 추가하세요.')
  }
}

function assertRequired(idx: Record<string, number>, headers: string[]) {
  const required = ['bjdongCd', 'bun']
  const missing = required.filter(f => idx[f] === undefined)
  if (missing.length) {
    reportHeaders(headers, idx)
    throw new Error(`필수 컬럼 누락: ${missing.join(', ')}`)
  }
}

async function main() {
  if (!existsSync(IN)) {
    console.error(`입력 파일이 없습니다: ${IN}`)
    console.error('세움터에서 포항 남구·북구 건축물대장(표제부) 대량자료를 받아 data/raw/ 에 두세요.')
    process.exit(1)
  }

  console.log(`입력: ${IN}`)
  console.log(`대상 시군구: ${SIGUNGU.join(', ') || '(전체)'}`)

  const index: LedgerIndex = {}
  const stats: Stats = { read: 0, skipped: 0, duplicated: 0 }

  if (path.extname(IN).toLowerCase() === '.xlsx') await parseXlsx(IN, index, stats)
  else await parseDelimited(IN, index, stats)

  if (INSPECT) return

  await mkdir(path.dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(index), 'utf8')

  const total = Object.keys(index).length
  console.log(`\n읽음 ${stats.read} / 건너뜀 ${stats.skipped} / 중복 ${stats.duplicated}`)
  console.log(`저장 ${total}건 → ${OUT}`)

  const detached = Object.values(index).filter(r => r.mainPurpose?.includes('단독주택')).length
  console.log(`그중 주용도 '단독주택': ${detached}건`)
}

main().catch(e => { console.error('\n실패:', e.message); process.exit(1) })
