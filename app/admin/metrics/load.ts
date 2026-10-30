import { type ApplicationMetricRow, type InterestMetricRow, summarizeDemand, type DemandSummary } from '../../../src/demand-metrics'
import { sbSelect, supabaseConfigured } from '../../../src/supabase'

// Contact columns are never selected: this data only feeds counts.
const INTEREST_BASE = 'region,residence,intent,budget,services,source,phone_explanation,created_at'
const INTEREST_EXTENDED = INTEREST_BASE + ',interview_ok,answers'
const APPLICATION_COLUMNS = 'address,resolved_address,pnu,created_at'
const ROW_LIMIT = 10000

export type MetricsResult = { summary: DemandSummary; error: '' } | { summary: null; error: string }

const live = (table: string, columns: string) =>
  `${table}?select=${columns}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&order=created_at.asc&limit=${ROW_LIMIT}`

/** The 2026-10-31 migration adds interview_ok/answers; until it runs, fall back to the base columns. */
async function loadInterests(): Promise<InterestMetricRow[]> {
  try { return await sbSelect<InterestMetricRow>(live('care_interests', INTEREST_EXTENDED)) }
  catch { return await sbSelect<InterestMetricRow>(live('care_interests', INTEREST_BASE)) }
}

export async function loadDemandMetrics(): Promise<MetricsResult> {
  if (!supabaseConfigured()) return { summary: null, error: '데이터베이스가 연결되지 않아 지표를 계산할 수 없어요.' }
  try {
    const [interests, applications] = await Promise.all([loadInterests(), sbSelect<ApplicationMetricRow>(live('applications', APPLICATION_COLUMNS))])
    return { summary: summarizeDemand(interests, applications), error: '' }
  } catch {
    return { summary: null, error: '지표를 불러오지 못했어요. 데이터 연결 상태를 확인한 뒤 새로고침해 주세요.' }
  }
}
