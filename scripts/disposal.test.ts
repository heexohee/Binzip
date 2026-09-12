import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateDisposal, emptyDisposal, EXAMPLE_DISPOSAL, initialDisposal, parseManwon } from '../src/disposal'

test('missing costs prevent a total, while an explicit zero is a real input', () => {
  const partial = { ...emptyDisposal(), sale: '3000', debt: '0', taxAndFees: '100' }
  assert.equal(calculateDisposal(partial).net, null)
  assert.deepEqual(calculateDisposal(partial).missing, ['clearance'])
  assert.equal(calculateDisposal({ ...partial, clearance: '0' }).net, 29_000_000)
})

test('uses integer won and preserves a negative cash balance', () => {
  assert.equal(parseManwon('1.2345').kind, 'known')
  const result = calculateDisposal({ sale: '100', debt: '50', taxAndFees: '25.0001', clearance: '100' })
  assert.equal(result.net, -750001)
  assert.equal(result.deductions, 1750001)
})

test('rejects malformed, negative, nonfinite and out-of-range amounts', () => {
  for (const value of ['NaN', 'Infinity', '-1', '1e3', '1.12345', '100000001', '1,2', '12원']) {
    assert.equal(parseManwon(value).kind, 'invalid', value)
    assert.equal(calculateDisposal({ sale: value, debt: '0', taxAndFees: '0', clearance: '0' }).net, null)
  }
})

test('demo comparisons are 2200 and 2250만원 without any automatic subsidy deduction', () => {
  assert.equal(calculateDisposal(EXAMPLE_DISPOSAL[0]).net, 22_000_000)
  assert.equal(calculateDisposal(EXAMPLE_DISPOSAL[1]).net, 22_500_000)
  assert.deepEqual(Object.keys(emptyDisposal()), ['sale', 'debt', 'taxAndFees', 'clearance'])
})

test('customer worksheets never inherit demo amounts or edits', () => {
  assert.ok(initialDisposal().every(input => calculateDisposal(input).net === null))
  const example = initialDisposal(true)
  example[0].sale = '1'
  assert.equal(initialDisposal(true)[0].sale, '3000')
  assert.equal(initialDisposal(false)[0].sale, '')
})
