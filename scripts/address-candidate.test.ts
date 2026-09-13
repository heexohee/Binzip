import test from 'node:test'
import assert from 'node:assert/strict'
import { parseAddressCandidate } from '../src/address-candidate'

const response = { found: true, pnu: '4711110100100010000', jibunAddress: '경상북도 포항시 남구 대잠동 1001', roadAddress: '경상북도 포항시 남구 시청로 1', matchQuality: 'road', x: 129.3434, y: 36.019 }

test('keeps query, candidate and fuzzy quality distinct for explicit confirmation', () => {
  const candidate = parseAddressCandidate({ ...response, matchQuality: 'fuzzy' }, '대잠동 100')!
  assert.equal(candidate.query, '대잠동 100')
  assert.equal(candidate.address, response.jibunAddress)
  assert.equal(candidate.quality, 'fuzzy')
  assert.equal(candidate.pnu, response.pnu)
})

test('missing or invalid map coordinates do not prevent an address candidate', () => {
  for (const fields of [{ x: null, y: null }, { x: 0, y: 36 }, { x: 129, y: null }, { x: '129', y: '36' }, { x: Infinity, y: 36 }]) {
    const candidate = parseAddressCandidate({ ...response, ...fields }, '시청로 1')!
    assert.ok(candidate)
    assert.equal(candidate.x, null)
    assert.equal(candidate.y, null)
  }
})

test('does not treat malformed, absent or failed lookups as a confirmed parcel', () => {
  for (const data of [null, {}, { ...response, found: false }, { ...response, pnu: 'bad' }, { ...response, matchQuality: 'unknown' }, { ...response, jibunAddress: '', roadAddress: null }]) {
    assert.equal(parseAddressCandidate(data, '시청로 1'), null)
  }
})

test('preserves a road address when parcel address is absent', () => {
  const candidate = parseAddressCandidate({ ...response, jibunAddress: null }, '시청로 1')!
  assert.equal(candidate.address, response.roadAddress)
  assert.equal(candidate.x, response.x)
})
