import assert from 'node:assert/strict'
import { applicationAddress, intakePhase, intakeScreens } from '../src/intake-flow'
import { parseRegion } from '../src/regions'

// Tap-only questions come first, the address after them, contact last.
assert.deepEqual(intakeScreens(null), ['region', 'basics', 'owner', 'house', 'address', 'contact'])
assert.deepEqual(intakeScreens('manage'), ['region', 'basics', 'owner', 'house', 'address', 'contact'])
assert.deepEqual(intakeScreens('repair'), ['region', 'basics', 'owner', 'repair', 'house', 'address', 'contact'])
assert.deepEqual(intakeScreens('all'), ['region', 'basics', 'owner', 'repair', 'demolition', 'house', 'address', 'contact'])
for (const goal of ['sell', 'repair', 'demolish', 'manage', 'all', null] as const) {
  const screens = intakeScreens(goal)
  assert.equal(screens.at(-1), 'contact')
  assert.ok(screens.indexOf('address') > screens.indexOf('basics'))
}
assert.deepEqual(['region', 'basics', 'owner', 'house', 'address', 'contact'].map(intakePhase), [0, 0, 1, 1, 2, 2])

// Skipping the address still leaves the region to save; a typed address wins.
assert.deepEqual(applicationAddress('  ', '경북 의성군'), { address: '경북 의성군', hasDetail: false })
assert.deepEqual(applicationAddress('의성읍 123', '경북 의성군'), { address: '의성읍 123', hasDetail: true })

// Only listed 시·도 + 시·군 pairs are accepted from the browser.
assert.equal(parseRegion('경북 의성군'), '경북 의성군')
assert.equal(parseRegion('대구 군위군'), '대구 군위군')
assert.equal(parseRegion('경북 군위군'), null)
assert.equal(parseRegion('경북 의성군 의성읍'), null)
assert.equal(parseRegion(''), null)
console.log('intake-flow ok')
