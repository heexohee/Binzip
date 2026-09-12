import type { AdminApplication } from '../../src/admin-workflow'
import type { ReportRow } from '../admin/types'

/** All records are fictional. This module never reads the application database. */
const report = (id: string, status: ReportRow['status']): ReportRow => ({
  id: 'demo-report-' + id, application_id: id, version: 1, status,
  verdict: null, axes: null, note: null, registry_note: null, registry_checked_at: null,
  issued_at: null, created_at: '2026-09-12T00:00:00+09:00',
})
const base = { resolved_address: null, pnu: null, match_quality: null, acquisition: '상속', ownership: '확인 필요', speed: '추가 확인', channel: '이메일', contact: '연락처 예시 · 실제 번호 없음', email: 'owner@example.invalid', expires_at: '2099-01-01T00:00:00Z' }
export const DEMO_APPLICATIONS: AdminApplication[] = [
  { ...base, id: 'sample-a', address: '포항시 북구 흥해읍 · 예시 주택 A', concern: '철거비·공적 지원', condition: '본채와 창고를 함께 정리할지 고민하고 있어요.', photo_count: 4, created_at: '2026-09-12T09:40:00+09:00', review_status: 'received', internal_note: '', reports: [report('sample-a', 'draft')] },
  { ...base, id: 'sample-b', address: '포항시 남구 장기면 · 예시 주택 B', concern: '매도', condition: '먼 곳에 살아서 현장을 자주 확인하기 어려워요.', photo_count: 0, created_at: '2026-09-12T09:10:00+09:00', review_status: 'received', internal_note: '', reports: [] },
  { ...base, id: 'sample-c', address: '포항시 북구 신광면 · 예시 주택 C', concern: '철거비·공적 지원', condition: '지붕 재질과 철거 범위를 확인하고 싶어요.', photo_count: 3, created_at: '2026-09-11T16:20:00+09:00', review_status: 'reviewing', internal_note: '사진에서 보이는 부분과 현장 확인이 필요한 부분을 구분할 예정.', reports: [report('sample-c', 'draft')] },
  { ...base, id: 'sample-d', address: '포항시 남구 구룡포읍 · 예시 주택 D', concern: '보유·관리', condition: '가족과 어떻게 정리할지 상의 중이에요.', photo_count: 2, created_at: '2026-09-11T14:00:00+09:00', review_status: 'waiting', internal_note: '고객에게 토지와 건물의 소유관계 확인을 요청한 상황의 예시.', reports: [report('sample-d', 'draft')] },
  { ...base, id: 'sample-e', address: '포항시 북구 기계면 · 예시 주택 E', concern: '아직 고민 중', condition: '입력한 주소가 맞는지 다시 확인하고 싶어요.', photo_count: 0, created_at: '2026-09-11T11:20:00+09:00', review_status: 'waiting', internal_note: '정확한 주소를 확인한 뒤 자료를 다시 조회할 예정.', reports: [report('sample-e', 'failed')] },
  { ...base, id: 'sample-f', address: '포항시 남구 동해면 · 예시 주택 F', concern: '매도', condition: '매도 전에 무엇을 확인해야 할지 궁금해요.', photo_count: 1, created_at: '2026-09-10T10:30:00+09:00', review_status: 'completed', internal_note: '확인사항과 문의할 곳을 안내한 상황의 예시. 거래 완료를 뜻하지 않음.', reports: [report('sample-f', 'issued')] },
]
