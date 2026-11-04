import assert from 'node:assert/strict'
import { conditionAnswer, demandCsv, summarizeDemand, willingnessByPrice } from '../src/demand-metrics'

const app = (over: object) => ({ address: '경북 포항시 북구 1', resolved_address: null, pnu: '4711310100100010000', created_at: '2026-11-03T00:00:00Z', ...over })
const condition = '최근 집 상태: 수리가 필요한 곳이 있어요\n가족·공동 소유자 협의: 아직 이야기 전이에요\n\n세금 메모: 010-1234-5678'
const summary = summarizeDemand([], [
  app({ condition, concern: '팔기, 고치기', ownership: '상속 정리 중', speed: '인터뷰·시범 방문 연락을 받아도 괜찮아요', photo_count: 2 }),
  app({ condition: '최근 집 상태: 최근 상태를 몰라요', concern: '팔기', ownership: '단독 소유', speed: null, photo_count: 0 }),
])
const a = summary.applications
assert.equal(a.total, 2)
assert.equal(a.interviewOk, 1)
assert.equal(a.withPhotos, 1)
assert.equal(a.hasAnswers, true)
assert.deepEqual(a.byConcern, [{ key: '팔기', count: 2 }, { key: '고치기', count: 1 }])
assert.deepEqual(a.byAgreement, [{ key: '아직 이야기 전이에요', count: 1 }])
assert.equal(a.byHouseCondition.length, 2)
assert.equal(conditionAnswer(condition, '없는 항목'), null)

// Without the answer columns the page still counts applications.
assert.equal(summarizeDemand([], [app({})]).applications.hasAnswers, false)
assert.equal(summarizeDemand([], []).applications.hasAnswers, true)

// Current range labels count toward willingness.
const w = willingnessByPrice(['월 3만 원 초과~5만 원 이하', '월 5만 원 초과~10만 원 이하', '아직 모르겠어요'])
assert.equal(w.base, 2)
assert.deepEqual(w.rows.map(r => r.count), [2, 2, 1, 0])

// Each CSV holds only its own service, and free text from condition never leaks.
const diagnosis = demandCsv(summary, 'now', 'diagnosis'), care = demandCsv(summary, 'now', 'care')
assert.ok(diagnosis.includes('진단 · 소유관계') && !diagnosis.includes('관리 설문'))
assert.ok(care.includes('관리 설문') && !care.includes('진단 신청'))
assert.ok(!diagnosis.includes('010-1234-5678'))
console.log('demand-metrics ok')
