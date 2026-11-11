import assert from 'node:assert/strict'
import { applicationAddress, intakePhase, intakeScreens } from '../src/intake-flow'
import { parseRegion } from '../src/regions'

// Tap-only questions come first; location is asked once, right before contact.
assert.deepEqual(intakeScreens(null), ['basics', 'owner', 'house', 'location', 'contact'])
assert.deepEqual(intakeScreens('manage'), ['basics', 'owner', 'house', 'location', 'contact'])
assert.deepEqual(intakeScreens('repair'), ['basics', 'owner', 'repair', 'house', 'location', 'contact'])
assert.deepEqual(intakeScreens('all'), ['basics', 'owner', 'repair', 'demolition', 'house', 'location', 'contact'])
for (const goal of ['sell', 'repair', 'demolish', 'manage', 'all', null] as const) {
  const screens = intakeScreens(goal)
  assert.equal(screens[0], 'basics')
  assert.deepEqual(screens.slice(-2), ['location', 'contact'])
  assert.equal(screens.filter(screen => screen === 'location').length, 1)
  assert.ok(!screens.includes('region') && !screens.includes('address'))
}
assert.deepEqual(['basics', 'owner', 'house', 'location', 'contact'].map(intakePhase), [0, 1, 1, 2, 2])

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
