/**
 * Aggregate demand evidence for the business plan.
 * Inputs carry no contact fields; outputs are counts and price quantiles only, so a CSV export holds no personal data.
 */

export type InterestMetricRow = {
  region: string
  residence: string
  intent: string
  budget: string
  services: string[] | null
  source: string
  phone_explanation: boolean
  created_at: string
  interview_ok?: boolean
  answers?: Record<string, string | number | null> | null
}

export type ApplicationMetricRow = { address: string; resolved_address: string | null; pnu: string | null; created_at: string }

export type Count = { key: string; count: number }
export type Share = { key: string; count: number; percent: number }
export type PriceStat = { key: string; label: string; n: number; p25: number | null; median: number | null; p75: number | null }

export type DemandSummary = {
  interests: {
    total: number
    interviewOk: number
    phoneExplanation: number
    hasExtendedAnswers: boolean
    bySource: Count[]
    byProvince: Count[]
    byRegion: Count[]
    byResidence: Count[]
    byOwnerProvince: Count[]
    byIntent: Count[]
    byBudget: Count[]
    willingness: { base: number; rows: Share[] }
    byService: Count[]
    byInheritance: Count[]
    byLastVisit: Count[]
    byCurrentSpend: Count[]
    prices: PriceStat[]
    byWeek: Count[]
  }
  applications: { total: number; byProvince: Count[]; byWeek: Count[] }
}

const UNKNOWN = '미확인'

/** First two PNU digits are the 시·도 code (legacy and new codes for 강원·전북 both listed). */
const PROVINCE_BY_CODE: Record<string, string> = {
  '11': '서울', '26': '부산', '27': '대구', '28': '인천', '29': '광주', '30': '대전', '31': '울산', '36': '세종',
  '41': '경기', '42': '강원', '51': '강원', '43': '충북', '44': '충남', '45': '전북', '52': '전북', '46': '전남',
  '47': '경북', '48': '경남', '50': '제주',
}

/** Free-text region → 시·도. Longer names first so "경상북도" is not read as "경상". */
const PROVINCE_PATTERNS: [RegExp, string][] = [
  [/^서울/, '서울'], [/^부산/, '부산'], [/^대구/, '대구'], [/^인천/, '인천'], [/^광주/, '광주'], [/^대전/, '대전'],
  [/^울산/, '울산'], [/^세종/, '세종'], [/^경기/, '경기'], [/^강원/, '강원'],
  [/^(충청북도|충북)/, '충북'], [/^(충청남도|충남)/, '충남'], [/^(전라북도|전북)/, '전북'], [/^(전라남도|전남)/, '전남'],
  [/^(경상북도|경북)/, '경북'], [/^(경상남도|경남)/, '경남'], [/^제주/, '제주'],
  // Common city names typed without the province.
  [/^(포항|경주|안동|구미|영천|상주|문경|김천|영주|경산)/, '경북'], [/^(창원|진주|통영|김해|거제|밀양|사천|양산)/, '경남'],
  [/^(여수|순천|목포|나주|광양)/, '전남'], [/^(전주|군산|익산|정읍|남원|김제)/, '전북'],
  [/^(청주|충주|제천)/, '충북'], [/^(천안|공주|보령|아산|서산|논산|당진)/, '충남'], [/^(춘천|원주|강릉|동해|속초|삼척|태백)/, '강원'],
]

export function provinceFromText(text: string): string {
  const t = text.trim().replace(/\s+/g, '')
  return PROVINCE_PATTERNS.find(([re]) => re.test(t))?.[1] ?? UNKNOWN
}

export function provinceFromApplication(row: ApplicationMetricRow): string {
  const code = row.pnu?.slice(0, 2)
  if (code && PROVINCE_BY_CODE[code]) return PROVINCE_BY_CODE[code]
  return provinceFromText(row.resolved_address ?? row.address)
}

/** ISO week label (YYYY-Www) so weekly growth reads the same in the CSV and on screen. */
export function isoWeek(iso: string): string {
  const d = new Date(iso)
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - day + 3)
  const year = target.getUTCFullYear()
  const week = 1 + Math.floor((target.getTime() - Date.UTC(year, 0, 1)) / 604_800_000)
  return `${year}-W${String(week).padStart(2, '0')}`
}

function tally(values: (string | null | undefined)[], order: 'count' | 'key' = 'count'): Count[] {
  const counts = new Map<string, number>()
  for (const v of values) {
    const key = v || UNKNOWN
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const rows = [...counts].map(([key, count]) => ({ key, count }))
  return order === 'key' ? rows.sort((a, b) => a.key.localeCompare(b.key)) : rows.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
}

function quantile(sorted: number[], q: number): number | null {
  if (!sorted.length) return null
  const pos = (sorted.length - 1) * q
  const lo = sorted[Math.floor(pos)] ?? 0, hi = sorted[Math.ceil(pos)] ?? lo
  return Math.round((lo + (hi - lo) * (pos - Math.floor(pos))) * 10) / 10
}

/** Top of each max-budget bucket in 만 원; "아직 모르겠어요" is left out of the base. */
const BUDGET_CEILING: Record<string, number> = { '월 3만 원 이하': 3, '월 5만 원 이하': 5, '월 10만 원 이하': 10, '월 10만 원 초과도 검토': Infinity, '유료 이용 의사 없음': 0 }
const WILLINGNESS_PRICES = [{ key: '월 3만 원', manwon: 3 }, { key: '월 5만 원', manwon: 5 }, { key: '월 10만 원', manwon: 10 }, { key: '월 10만 원 넘게', manwon: Infinity }]

/** Share of answers whose max budget reaches each price: a cumulative read of the single max-budget question. */
export function willingnessByPrice(budgets: string[]): { base: number; rows: Share[] } {
  const ceilings = budgets.map(b => BUDGET_CEILING[b]).filter((c): c is number => c !== undefined)
  const base = ceilings.length
  return { base, rows: WILLINGNESS_PRICES.map(({ key, manwon }) => {
    const count = ceilings.filter(c => c >= manwon).length
    return { key, count, percent: base ? Math.round((count / base) * 100) : 0 }
  }) }
}

export const PRICE_KEYS = [
  { key: 'price_too_cheap', label: '너무 싸서 믿기 어려운 가격' },
  { key: 'price_cheap', label: '싸다고 느끼는 가격' },
  { key: 'price_expensive', label: '비싸지만 고려할 가격' },
  { key: 'price_too_expensive', label: '너무 비싸서 맡기지 않을 가격' },
] as const

export function summarizeDemand(interests: InterestMetricRow[], applications: ApplicationMetricRow[]): DemandSummary {
  const answer = (row: InterestMetricRow, key: string) => row.answers?.[key] ?? null
  const text = (row: InterestMetricRow, key: string) => { const v = answer(row, key); return typeof v === 'string' ? v : null }
  const answered = interests.filter(row => row.answers && Object.values(row.answers).some(v => v !== null))
  const prices = PRICE_KEYS.map(({ key, label }) => {
    const values = interests.map(row => answer(row, key)).filter((v): v is number => typeof v === 'number').sort((a, b) => a - b)
    return { key, label, n: values.length, p25: quantile(values, 0.25), median: quantile(values, 0.5), p75: quantile(values, 0.75) }
  })
  return {
    interests: {
      total: interests.length,
      interviewOk: interests.filter(row => row.interview_ok).length,
      phoneExplanation: interests.filter(row => row.phone_explanation).length,
      hasExtendedAnswers: interests.some(row => row.answers !== undefined),
      bySource: tally(interests.map(row => row.source)),
      byProvince: tally(interests.map(row => provinceFromText(row.region))),
      byRegion: tally(interests.map(row => row.region.trim())),
      byResidence: tally(interests.map(row => row.residence)),
      byOwnerProvince: tally(interests.map(row => text(row, 'owner_region')).filter((v): v is string => v !== null).map(provinceFromText)),
      byIntent: tally(interests.map(row => row.intent)),
      byBudget: tally(interests.map(row => row.budget)),
      willingness: willingnessByPrice(interests.map(row => row.budget)),
      byService: tally(interests.flatMap(row => row.services ?? [])),
      byInheritance: tally(answered.map(row => text(row, 'inheritance'))),
      byLastVisit: tally(answered.map(row => text(row, 'last_visit'))),
      byCurrentSpend: tally(answered.map(row => text(row, 'current_spend'))),
      prices,
      byWeek: tally(interests.map(row => isoWeek(row.created_at)), 'key'),
    },
    applications: {
      total: applications.length,
      byProvince: tally(applications.map(provinceFromApplication)),
      byWeek: tally(applications.map(row => isoWeek(row.created_at)), 'key'),
    },
  }
}

const csvCell = (v: string | number | null) => { const s = v === null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }

/** One long table: section, item, value — easy to pivot in a spreadsheet. BOM keeps Korean readable in Excel. */
export function demandCsv(summary: DemandSummary, generatedAt: string): string {
  const { interests: i, applications: a } = summary
  const rows: (string | number | null)[][] = [['구분', '항목', '값'], ['기준 시각', generatedAt, ''],
    ['진단 신청', '합계', a.total], ['관리 설문', '합계', i.total], ['관리 설문', '인터뷰·시범 방문 연락 수락', i.interviewOk], ['관리 설문', '전화 설명 요청', i.phoneExplanation]]
  const add = (section: string, counts: Count[]) => counts.forEach(c => rows.push([section, c.key, c.count]))
  add('진단 신청 · 시도', a.byProvince); add('진단 신청 · 주차', a.byWeek)
  add('설문 · 유입 경로', i.bySource); add('설문 · 시도', i.byProvince); add('설문 · 시군', i.byRegion); add('설문 · 소유자 거주', i.byResidence); add('설문 · 소유자 사는 시도(다른 시·군)', i.byOwnerProvince)
  add('설문 · 고민 방향', i.byIntent); add('설문 · 월 최대 금액', i.byBudget); add('설문 · 필요한 관리', i.byService)
  add('설문 · 상속 정리', i.byInheritance); add('설문 · 마지막 방문', i.byLastVisit); add('설문 · 현재 관리 비용', i.byCurrentSpend)
  add('설문 · 주차', i.byWeek)
  for (const w of i.willingness.rows) rows.push([`금액별 이용 의향 (응답 ${i.willingness.base})`, w.key, `${w.count} (${w.percent}%)`])
  for (const p of i.prices) rows.push([`이전 방식 가격(만 원) · ${p.label}`, `응답 ${p.n} · 25%/중앙/75%`, [p.p25, p.median, p.p75].map(v => v ?? '-').join(' / ')])
  return '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\n')
}
