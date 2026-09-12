import test from 'node:test'
import assert from 'node:assert/strict'
import { buildReportOverview } from '../src/report-overview-model'
import type { ApplicationRow, Axes, ReportRow } from '../app/admin/types'

const application: ApplicationRow = {
  id: 'test-application', address: '설명용 주소', resolved_address: null, pnu: null, match_quality: null,
  condition: '소유자가 입력한 메모', acquisition: null, ownership: null, concern: null, speed: null,
  channel: null, contact: 'private-contact', email: 'private@example.invalid',
  created_at: '2026-09-11T00:00:00Z', expires_at: '2027-03-11T00:00:00Z', photo_count: 2,
}
const report: ReportRow = {
  id: 'test-report', application_id: application.id, version: 1, status: 'issued', verdict: null, axes: null,
  note: null, registry_note: null, registry_checked_at: null, issued_at: '2026-09-11T00:00:00Z', created_at: '2026-09-11T00:00:00Z',
}

test('missing records stay unknown, owner photos do not imply inspection, and contacts are not serialized', () => {
  const model = buildReportOverview(report, application)
  assert.ok(model.records.every(record => record.value === '미확인'))
  assert.equal(model.photoCount, 2)
  assert.equal(model.fieldVerified, false)
  assert.equal(model.ownerCondition, application.condition)
  assert.ok(!JSON.stringify(model).includes('private'))
  assert.ok(!('example' in model))
})

test('blocking findings and failed sources remain visible above folded evidence', () => {
  const axes: Axes = { sourceErrors: ['ledger'], diagnosis: { axes: [{ axis: 'rights', verdict: 'precondition', findings: [{ label: '소유관계', reason: '공유자 확인이 필요합니다.', verdict: 'precondition' }] }] } }
  const model = buildReportOverview({ ...report, verdict: 'precondition', axes }, application)
  assert.ok(model.attention.includes('공유자 확인이 필요합니다.'))
  assert.ok(model.attention.some(message => message.includes('조회하지 못했어요')))
  assert.equal(model.blocks[0]?.items[0]?.lines[0], '공유자 확인이 필요합니다.')
})

test('assessment is not a sale amount and desk notes are not called site visits', () => {
  const axes = { facts: { housePrice: 30_000_000, buildingArea: 0, landArea: null }, diagnosis: { fieldVerified: false, axes: [{ axis: 'property', verdict: 'unknown', findings: [] }] } }
  const model = buildReportOverview({ ...report, note: '사진상 외벽 변색', axes }, application)
  assert.equal(model.records.find(record => record.label === '건축면적')?.value, '0㎡')
  assert.equal(model.records.find(record => record.label === '토지면적')?.value, '미확인')
  assert.match(model.blocks[0]!.items[0]!.source!, /현장 방문 여부 미확인/)
  assert.ok(!('sale' in model))
})
