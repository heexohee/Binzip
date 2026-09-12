import type { ApplicationRow, ReportRow } from '../app/admin/types'

export const REVIEW_STATES = [
  { id: 'received', label: '새 접수' },
  { id: 'reviewing', label: '검토 중' },
  { id: 'waiting', label: '고객 확인 대기' },
  { id: 'completed', label: '처리 완료' },
] as const
export type ReviewStatus = typeof REVIEW_STATES[number]['id']
export type AdminApplication = ApplicationRow & { reports: ReportRow[] }
export type WorkflowState = { ok: boolean; message: string }
export type ApplicationSummary = Pick<ApplicationRow, 'id' | 'address' | 'resolved_address' | 'concern' | 'created_at' | 'photo_count'> & {
  reviewStatus: ReviewStatus
  reportStatus: ReportRow['status'] | null
  nextCheck: string
}

export function isReviewStatus(value: unknown): value is ReviewStatus {
  return REVIEW_STATES.some(state => state.id === value)
}

export function latestReport(reports: ReportRow[]): ReportRow | undefined {
  return reports.reduce<ReportRow | undefined>((latest, report) => !latest || report.version > latest.version ? report : latest, undefined)
}

/** List payload intentionally omits contact details, notes, and the report's raw facts. */
export function summarizeApplication(app: AdminApplication): ApplicationSummary {
  const report = latestReport(app.reports ?? [])
  const reviewStatus = isReviewStatus(app.review_status) ? app.review_status : 'received'
  const nextCheck = reviewStatus === 'completed' ? '처리 기록 확인'
    : reviewStatus === 'waiting' ? '고객에게 요청한 정보 확인'
    : report?.status === 'failed' ? '자료 조회 실패 확인'
    : !report ? '진단서 초안 생성 필요'
    : report.status === 'issued' ? '고객 전달 여부 확인'
    : (app.photo_count ?? 0) > 0 ? '사진과 미확인 항목 검토'
    : '신청 내용과 미확인 항목 검토'
  return {
    id: app.id, address: app.address, resolved_address: app.resolved_address,
    concern: app.concern, created_at: app.created_at, photo_count: app.photo_count,
    reviewStatus, reportStatus: report?.status ?? null, nextCheck,
  }
}

export function filterApplications(rows: ApplicationSummary[], query: string, status: ReviewStatus | 'all', photosOnly: boolean): ApplicationSummary[] {
  const search = query.trim().toLocaleLowerCase('ko-KR')
  return rows.filter(row => (status === 'all' || row.reviewStatus === status)
    && (!photosOnly || (row.photo_count ?? 0) > 0)
    && (!search || [row.address, row.resolved_address, row.concern].some(value => value?.toLocaleLowerCase('ko-KR').includes(search))))
}

export function parseWorkflow(status: unknown, note: unknown): { status: ReviewStatus; note: string } | null {
  if (!isReviewStatus(status) || typeof note !== 'string' || note.trim().length > 5000) return null
  return { status, note: note.trim() }
}

export function adminDate(value: string): string {
  const time = Date.parse(value)
  if (!Number.isFinite(time)) return '일시 미확인'
  // Explicit KST formatting avoids Node/Chrome ICU text differences during hydration.
  const kst = new Date(time + 9 * 60 * 60 * 1000)
  return `${kst.getUTCMonth() + 1}. ${kst.getUTCDate()}. ${String(kst.getUTCHours()).padStart(2, '0')}:${String(kst.getUTCMinutes()).padStart(2, '0')}`
}
