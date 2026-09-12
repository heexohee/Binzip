import test from 'node:test'
import assert from 'node:assert/strict'
import { DEMO_APPLICATIONS } from '../app/admin-preview/demo-data'
import { adminDate, filterApplications, latestReport, parseWorkflow, summarizeApplication } from '../src/admin-workflow'
import { buildReportOverview } from '../src/report-overview-model'

test('list payload excludes contact information, internal notes, and raw report facts', () => {
  const app = DEMO_APPLICATIONS[0]!
  const serialized = JSON.stringify(summarizeApplication({ ...app, internal_note: 'private-secret', contact: 'private-phone', email: 'private-email' }))
  assert.doesNotMatch(serialized, /private-secret|private-phone|private-email|internal_note|axes/)
})

test('workflow completion and report approval are independent', () => {
  const app = DEMO_APPLICATIONS[0]!
  const issued = { ...app.reports[0]!, status: 'issued' as const }
  assert.equal(summarizeApplication({ ...app, review_status: undefined, reports: [issued] }).reviewStatus, 'received')
  assert.equal(summarizeApplication({ ...app, review_status: 'completed' }).reportStatus, 'draft')
  assert.equal(summarizeApplication({ ...app, review_status: 'reviewing', reports: [issued] }).nextCheck, '고객 전달 여부 확인')
})

test('search, status, and photo filters compose; no results stays empty', () => {
  const rows = DEMO_APPLICATIONS.map(summarizeApplication)
  assert.equal(filterApplications(rows, '철거', 'received', true).length, 1)
  assert.equal(filterApplications(rows, '없는주소', 'all', false).length, 0)
  assert.equal(filterApplications(rows, '  흥해  ', 'all', false)[0]?.id, 'sample-a')
  assert.equal(filterApplications(rows, '', 'completed', false).length, 1)
})

test('latest report uses version, preserves input, and keeps failures visible', () => {
  const app = DEMO_APPLICATIONS[0]!
  const old = app.reports[0]!
  const failed = { ...old, version: 3, status: 'failed' as const }
  const reports = [old, failed, { ...old, version: 2 }]
  assert.equal(latestReport(reports), failed)
  assert.equal(reports[0], old)
  assert.equal(summarizeApplication({ ...app, reports }).nextCheck, '자료 조회 실패 확인')
})

test('workflow validation rejects invalid statuses, oversized and non-text notes', () => {
  assert.equal(parseWorkflow('issued', 'note'), null)
  assert.equal(parseWorkflow('received', 'x'.repeat(5001)), null)
  assert.equal(parseWorkflow('received', new File([], 'note.txt')), null)
  assert.deepEqual(parseWorkflow('waiting', '  사진 요청  '), { status: 'waiting', note: '사진 요청' })
})

test('internal workflow notes never enter customer report presentation', () => {
  const app = DEMO_APPLICATIONS[0]!
  const baseline = buildReportOverview(app.reports[0]!, app)
  const changed = buildReportOverview(app.reports[0]!, { ...app, internal_note: 'private-secret', review_status: 'completed' })
  assert.deepEqual(changed, baseline)
  assert.doesNotMatch(JSON.stringify(changed), /private-secret/)
})

test('date labels are stable across runtimes and cross the day boundary in KST', () => {
  assert.equal(adminDate('2026-09-11T16:40:00Z'), '9. 12. 01:40')
  assert.equal(adminDate('2026-09-12T09:40:00+09:00'), '9. 12. 09:40')
  assert.equal(adminDate('invalid'), '일시 미확인')
})
