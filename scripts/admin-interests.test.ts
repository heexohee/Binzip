import assert from 'node:assert/strict'
import { countInterests, filterInterests, toInterestCard, type InterestRow } from '../src/admin-interests'

const base: InterestRow = {
  id: 'f9f5a1b2-0000-4000-8000-000000000001', region: '포항시 북구 흥해읍', location: null, residence: '답변하지 않음',
  intent: '보유하며 관리', budget: '1회성 방문', services: [], contact: '01012345678', email: null, source: 'management-apply',
  phone_explanation: true, status: 'new', created_at: '2026-11-18T07:00:00.000Z', consent_version: 'v3',
  answers: { applicant: '집 주인', plan: '월 1회', home_type: 'apt' },
}
const management = toInterestCard(base)
assert.equal(management.kind, 'management')
assert.equal(management.receipt, 'F9F5')
assert.equal(management.homeType, '아파트·빌라')
assert.equal(management.plan, '월 1회')
assert.deepEqual(management.details, [])

// Rows saved before the answers migration fall back to the plan stored in budget.
const legacy = toInterestCard({ ...base, id: 'aaaa0000-0000-4000-8000-000000000002', answers: undefined, status: 'contacted' })
assert.equal(legacy.plan, '1회성 방문')
assert.equal(legacy.homeType, null)
assert.equal(legacy.status, 'contacted')

const survey = toInterestCard({ ...base, id: 'bbbb0000-0000-4000-8000-000000000003', source: 'instagram', budget: '월 3만 원', services: ['환기'], answers: {}, status: 'weird' })
assert.equal(survey.kind, 'survey')
assert.equal(survey.status, 'new')
assert.equal(survey.plan, null)
assert.ok(survey.details.some(line => line.includes('환기')))

const cards = [management, legacy, survey]
assert.equal(filterInterests(cards, 'management', 'all', '').length, 2)
assert.equal(filterInterests(cards, 'survey', 'all', '').length, 1)
assert.deepEqual(filterInterests(cards, 'management', 'all', 'f9f5').map(c => c.receipt), ['F9F5'])
assert.equal(filterInterests(cards, 'management', 'all', '010-1234').length, 2)
assert.equal(filterInterests(cards, 'management', 'all', '12').length, 0, 'two digits are too short to match a phone')
assert.equal(filterInterests(cards, 'management', 'all', '흥해').length, 2)
assert.equal(filterInterests(cards, 'management', 'new', '').length, 1)
assert.deepEqual(countInterests(cards, 'management'), { new: 1, contacted: 1, scheduled: 0, subscribed: 0, closed: 0 })
assert.equal(toInterestCard({ ...base, status: 'subscribed' }).status, 'subscribed')
assert.equal(toInterestCard({ ...base, status: 'scheduled' }).status, 'scheduled')
console.log('admin interest list checks passed')
