import test from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { preparePhotos, photoResponse } from '../src/photos'
import { buildSupports } from '../src/supports'
import { saveApplication, type Application } from '../src/application'
import { MAX_PHOTOS, MAX_PHOTO_BYTES } from '../src/photo-limits'

const date = new Date('2026-09-11T12:00:00+09:00')
const appId = '11111111-1111-4111-8111-111111111111'
const photoId = '22222222-2222-4222-8222-222222222222'

test('public support never becomes eligibility from building or structure alone', () => {
  const result = buildSupports({ facts: { hasBuilding: true, structure: '슬레이트', mainPurpose: '주택' }, pnu: '4711310100100010000' }, date)
  assert.equal(result.length, 2)
  assert.ok(result.every(s => s.status === '대상 여부 확인 필요'))
  assert.equal(result[1]!.checks.find(c => c.label === '지붕 재료')!.confirmed, false)
  assert.match(result[0]!.period, /예산 잔액 미확인/)
  assert.ok(!JSON.stringify(result).includes('1,600'))
})

test('missing location stays unknown; other regions are not given Pohang support', () => {
  assert.equal(buildSupports({ address: '포항시' }, date)[0]!.checks[0]!.confirmed, false)
  assert.deepEqual(buildSupports({ pnu: '1111010100100010000' }, date), [])
  assert.equal(buildSupports({}, new Date('2027-01-02'))[0]!.status, '최신 공고 재확인 필요')
  assert.equal(buildSupports({}, new Date('2026-12-01'))[0]!.status, '최신 공고 재확인 필요')
})

test('photos are decoded, resized, anonymized and stripped of EXIF', async () => {
  const input = await sharp({ create: { width: 2200, height: 1200, channels: 3, background: '#507060' } })
    .withExif({ IFD0: { Artist: 'Private test owner' } }).jpeg().toBuffer()
  const photos = await preparePhotos([new File([new Uint8Array(input)], 'private-address.jpg', { type: 'image/jpeg' })])
  assert.equal(photos.length, 1)
  const photo = photos[0]!
  const metadata = await sharp(Buffer.from(photo.content, 'base64')).metadata()
  assert.equal(metadata.format, 'jpeg')
  assert.equal(metadata.width, 1600)
  assert.equal(metadata.exif, undefined)
  assert.ok(photo.size <= MAX_PHOTO_BYTES)
  assert.ok(!JSON.stringify(photo).includes('private-address'))
})

test('reject forged images, unsupported files, oversized bytes and too many photos', async () => {
  await assert.rejects(preparePhotos(['text']), /JPG/)
  await assert.rejects(preparePhotos([new File(['<svg/>'], 'fake.jpg', { type: 'image/jpeg' })]), /읽을 수 없는/)
  await assert.rejects(preparePhotos([new File(['abc'], 'a.svg', { type: 'image/svg+xml' })]), /JPG/)
  await assert.rejects(preparePhotos([new File([new Uint8Array(MAX_PHOTO_BYTES + 1)], 'big.jpg', { type: 'image/jpeg' })]), /용량/)
  await assert.rejects(preparePhotos(Array.from({ length: MAX_PHOTOS + 1 }, () => new File(['a'], 'a.jpg', { type: 'image/jpeg' }))), /6장/)
})

test('photo lookup is bound to its application and returns private, non-cacheable bytes', async () => {
  const oldFetch = globalThis.fetch
  const oldUrl = process.env.SUPABASE_URL
  const oldKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  process.env.SUPABASE_URL = 'https://test.invalid'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only'
  const calls: string[] = []
  globalThis.fetch = async input => {
    calls.push(String(input))
    return Response.json([{ content: '\\xffd8ff00' }])
  }
  try {
    const response = await photoResponse(appId, photoId)
    assert.ok(calls[0]?.includes('application_id=eq.' + appId))
    assert.ok(calls[0]?.includes('id=eq.' + photoId))
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    assert.equal(response.headers.get('content-type'), 'image/jpeg')
    assert.equal((await photoResponse('../another', photoId)).status, 404)
    assert.equal(calls.length, 1)
  } finally {
    globalThis.fetch = oldFetch
    if (oldUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = oldUrl
    if (oldKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = oldKey
  }
})

test('a photo transaction failure cannot be reported as an email-only success', async () => {
  const oldFetch = globalThis.fetch
  const names = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'NOTIFY_EMAIL', 'NOTIFY_FROM']
  const old = names.map(n => process.env[n])
  names.forEach(n => { process.env[n] = 'test-only' })
  process.env.SUPABASE_URL = 'https://test.invalid'
  const calls: string[] = []
  globalThis.fetch = async input => { calls.push(String(input)); return Response.json({ code: '23514' }, { status: 400 }) }
  const app: Application = {
    address: '테스트 주소', condition: null, channel: null, contact: '01000000000', email: 'test@example.invalid',
    acquisition: null, ownership: null, concern: null, speed: null, createdAt: date.toISOString(),
    expiresAt: '2027-03-11T00:00:00Z', pnu: null, resolvedAddress: null, matchQuality: null,
  }
  try {
    await assert.rejects(saveApplication(app, [{ content: '/9j/AA==', width: 1, height: 1, size: 4 }]), /rpc/)
    assert.equal(calls.length, 1)
    assert.match(calls[0]!, /create_application_with_photos/)
  } finally {
    globalThis.fetch = oldFetch
    names.forEach((n, i) => { if (old[i] === undefined) delete process.env[n]; else process.env[n] = old[i] })
  }
})
