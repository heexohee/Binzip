import test from 'node:test'
import assert from 'node:assert/strict'
import { EXAMPLE_BUDGET_TOTAL, EXAMPLE_DEMOLITION_BUDGET, EXAMPLE_PROGRESS_STAGES, progressSnapshot } from '../src/example-demolition'
import { EXAMPLE_DISPOSAL, initialDisposal } from '../src/disposal'

test('a report before consultation does not claim any stage has started', () => {
  const view = progressSnapshot(null)
  assert.equal(view.stage, null)
  assert.equal(view.completed, 0)
  assert.ok(view.statuses.every(status => status === '대기'))
})

test('a workflow snapshot completes only earlier stages, never upcoming work', () => {
  const view = progressSnapshot(2)
  assert.equal(view.stage?.id, 'estimate')
  assert.equal(view.completed, 2)
  assert.deepEqual(view.statuses.slice(0, 3), ['완료', '완료', '진행 중'])
  assert.ok(view.statuses.slice(3).every(status => status === '예정'))
  const last = progressSnapshot(EXAMPLE_PROGRESS_STAGES.length - 1)
  assert.equal(last.completed, EXAMPLE_PROGRESS_STAGES.length)
  assert.ok(last.statuses.every(status => status === '완료'))
})

test('invalid workflow state returns the idle view', () => {
  for (const index of [-1, 0.5, NaN, Infinity, EXAMPLE_PROGRESS_STAGES.length]) {
    assert.equal(progressSnapshot(index).active, null)
    assert.ok(progressSnapshot(index).statuses.every(status => status === '대기'))
  }
})

test('demolition budget includes the service fee and agrees with the cash comparison', () => {
  assert.equal(EXAMPLE_BUDGET_TOTAL, Number(EXAMPLE_DISPOSAL[1].clearance))
  const fee = EXAMPLE_DEMOLITION_BUDGET.find(item => item.name.includes('수수료'))!
  assert.equal(fee.amount, 50)
  assert.equal(EXAMPLE_BUDGET_TOTAL - fee.amount, 1150)
  assert.ok(initialDisposal(false).every(input => Object.values(input).every(value => value === '')))
})
