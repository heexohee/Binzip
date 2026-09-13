import test from 'node:test'
import assert from 'node:assert/strict'
import { HIGH_VALUE_EXAMPLE, compareTax, EMPTY_TAX, PURCHASE_EXAMPLE, INHERITED_EXAMPLE, basicTax } from '../src/tax-comparison'
test('purchase scenario reproduces the disclosed national and local tax', () => {
  const r = compareTax(PURCHASE_EXAMPLE)
  assert.equal(r.kind, 'comparison')
  if (r.kind !== 'comparison') throw Error('comparison missing')
  assert.equal(r.first,104126000); assert.equal(r.national,94660000); assert.equal(r.deduction,76000000)
})
test('unknown input and inheritance cannot become a guaranteed zero', () => {
  assert.equal(compareTax(EMPTY_TAX).kind,'review')
  const r = compareTax(INHERITED_EXAMPLE)
  assert.equal(r.kind,'review'); if (r.kind === 'review') assert.equal(r.inherited,true)
  for (const key of ['purchase','sale','expenses','acquired','apartmentAcquired','sellDate'] as const) assert.equal(compareTax({...PURCHASE_EXAMPLE,[key]:''}).kind,'review')
})
test('unsupported and invalid inputs stay in review', () => {
  for (const change of [{sale:'130000'},{sale:'-1'},{expenses:'NaN'},{acquired:'2026-02-30'},{otherHome:'없음'},{ordinary:false},{eligible:false},{acquisition:'증여'},{sellDate:'2027-01-01'}]) assert.equal(compareTax({...PURCHASE_EXAMPLE,...change}).kind,'review')
})
test('brackets and holding anniversary affect the estimate', () => {
  assert.equal(basicTax(14000000),840000); assert.equal(basicTax(50000000),6240000)
  const r = compareTax({...PURCHASE_EXAMPLE,sellDate:'2026-05-31'})
  if (r.kind !== 'comparison') throw Error('comparison missing')
  assert.equal(r.years,9); assert.equal(r.deduction,68400000)
})

test('20억 homepage scenario taxes excess over 12억 even after rural disposal', () => { assert.equal(HIGH_VALUE_EXAMPLE.first,551908500); assert.equal(HIGH_VALUE_EXAMPLE.after,114967600) })
