import test from 'node:test'
import assert from 'node:assert/strict'
import { runInstantLookup, type InstantSources } from '../src/instant-lookup'
import { guidanceOnly, instantOverview, parseInstantInput } from '../src/instant-report'
import type { ResolvedAddress } from '../src/types'

const address: ResolvedAddress = {
  pnu: '4711110100100010000', bcode: '4711110100', sigunguCd: '47111', bjdongCd: '10100', platGbCd: '0', bun: '0001', ji: '0000',
  isMountain: false, x: null, y: null, jibunAddress: '포항시 테스트용 주소 1', roadAddress: null, provider: 'juso', matchQuality: 'exact',
}
const input = { address: '포항시 테스트용 주소 1', decision: 'demolish', confirmedPnu: address.pnu }
const sources: InstantSources = {
  resolve: async () => address,
  building: async () => ({ exists: true, mainPurpose: '단독주택', structure: '목구조', useApprovalDate: '1960-01-01', totalArea: 50, purposeClass: null, groundFloors: 1, undergroundFloors: null, age: null }),
  land: async () => ({ roadSide: '맹지', useSituation: null, zone1: '자연녹지지역', category: '대', slope: null, area: 150, landPrice: null, year: '2025' }),
  price: async () => ({ value: 30_000_000, year: '2025', landArea: null, buildingArea: null }),
}

test('invalid inputs never reach providers', async () => {
  for (const raw of [null, { ...input, address: '' }, { ...input, address: 'x'.repeat(301) }, { ...input, decision: 'approve' }, { ...input, confirmedPnu: 'invalid' }]) {
    const result = await runInstantLookup(raw, { ...sources, resolve: async () => { assert.fail('must not query') } })
    assert.equal(result.kind, 'invalid')
  }
})

test('all parcels need confirmation and changed or forged parcels trigger reconfirmation', async () => {
  const guarded = { ...sources, building: async () => { assert.fail('must not read unconfirmed parcel') } }
  for (const raw of [{ ...input, confirmedPnu: undefined }, { ...input, confirmedPnu: '4711310100100020000' }]) {
    const result = await runInstantLookup(raw, guarded)
    assert.equal(result.kind, 'confirm')
  }
  const fuzzy = await runInstantLookup({ ...input, confirmedPnu: undefined }, { ...guarded, resolve: async () => ({ ...address, matchQuality: 'fuzzy' }) })
  assert.ok(fuzzy.kind === 'confirm' && fuzzy.similar)
})

test('first report keeps facts separate from prices, eligibility and legal verdicts', async () => {
  const result = await runInstantLookup(input, sources)
  assert.equal(result.kind, 'report')
  if (result.kind !== 'report') return
  assert.equal(result.report.decision, 'demolish')
  assert.equal(result.report.records.find(r => r.label === '건물 연면적')?.value, '50㎡')
  assert.match(result.report.records.find(r => r.label === '개별주택 공시가격')!.source, /예상 매도가가 아니/)
  assert.ok(result.report.attention.some(message => message.includes('실제 진입')))
  assert.ok(result.report.supports.every(s => s.status.includes('확인 필요')))
  const serialized = JSON.stringify(result)
  assert.ok(!serialized.includes('verdict'))
  assert.ok(!serialized.includes('taxSingle'))
  assert.equal(instantOverview(result.report).initialDecision, 'demolish')
})

test('failed providers preserve other facts without leaking errors or creating zero amounts', async () => {
  const result = await runInstantLookup(input, { ...sources, building: async () => { throw new Error('PRIVATE_API_KEY') }, price: async () => { throw new Error('PRIVATE_ENDPOINT') } })
  assert.equal(result.kind, 'report')
  if (result.kind !== 'report') return
  assert.equal(result.report.records[0]?.status, 'error')
  assert.equal(result.report.records.find(r => r.label === '토지면적')?.value, '150㎡')
  assert.ok(!JSON.stringify(result).includes('PRIVATE'))
  assert.ok(!JSON.stringify(result).includes('0원'))
})

test('empty building results never claim demolition or building absence', async () => {
  const result = await runInstantLookup(input, { ...sources, building: async () => ({ ...(await sources.building(address.pnu)), exists: false, mainPurpose: null, structure: null, useApprovalDate: null, totalArea: null }) })
  assert.equal(result.kind, 'report')
  if (result.kind !== 'report') return
  assert.equal(result.report.records[0]?.status, 'empty')
  assert.ok(result.report.attention.some(m => m.includes('판단할 수는 없어요')))
})

test('unavailable address, not found and timeout remain distinct from successful reports', async () => {
  assert.equal((await runInstantLookup(input, { ...sources, resolve: async () => null })).kind, 'not_found')
  const failure = await runInstantLookup(input, { ...sources, resolve: async () => { throw new Error('PRIVATE') } })
  assert.equal(failure.kind, 'unavailable')
  assert.ok(!JSON.stringify(failure).includes('PRIVATE'))
  assert.equal((await runInstantLookup(input, { ...sources, resolve: () => new Promise(() => {}) }, 5)).kind, 'unavailable')
  const partial = await runInstantLookup(input, { ...sources, price: () => new Promise(() => {}) }, 5)
  assert.ok(partial.kind === 'report' && partial.report.records.at(-1)?.status === 'error')
})

test('outside Pohang and guidance-only results never confirm Pohang support eligibility', async () => {
  const other = { ...address, pnu: '4713010100100010000' }
  const result = await runInstantLookup({ ...input, confirmedPnu: other.pnu }, { ...sources, resolve: async () => other })
  assert.ok(result.kind === 'report' && result.report.supports.length === 0)
  const guidance = guidanceOnly(parseInstantInput(input)!)
  assert.equal(guidance.addressVerified, false)
  assert.equal(guidance.records.length, 0)
  assert.equal(guidance.supports.length, 0)
  assert.match(instantOverview(guidance).documentLabel, /조회 미완료/)
})

test('a non-house purpose is called out without claiming vacant-house qualification', async () => {
  const result = await runInstantLookup(input, { ...sources, building: async () => ({ ...(await sources.building(address.pnu)), mainPurpose: '업무시설' }) })
  assert.ok(result.kind === 'report' && result.report.attention.some(message => message.includes('빈집 해당 여부')))
})
