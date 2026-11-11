import assert from 'node:assert/strict'
import { applicantRole, applicationSource, applicationUtmContent, saveApplication, type Application } from '../src/application'

assert.equal(applicationSource('instagram'), 'instagram')
assert.equal(applicationSource('https://private-url'), 'website')
assert.equal(applicationSource(''), 'website')

// utm_content follows the analytics rule: image_<name> or a numeric ad id, nothing else.
assert.equal(applicationUtmContent('image_a'), 'image_a')
assert.equal(applicationUtmContent('120212345678'), '120212345678')
assert.equal(applicationUtmContent('private@example.com'), null)
assert.equal(applicationUtmContent('Image_A'), null)
assert.equal(applicationUtmContent('1234'), null)
assert.equal(applicantRole('자녀·가족'), '자녀·가족')
assert.equal(applicantRole('대리인'), null)

// Before the migrations run, an insert is retried without the newest columns, then without source too.
const app: Application = {
  address: '테스트 주소', condition: null, channel: null, contact: '01000000000', email: null,
  acquisition: null, ownership: null, concern: null, speed: null, createdAt: '2026-11-04T00:00:00Z',
  expiresAt: '2027-05-04T00:00:00Z', pnu: null, resolvedAddress: null, matchQuality: null, source: 'instagram',
  region: '경북 의성군', vacancy: '3~5년', applicant: '자녀·가족', utmContent: 'image_a',
}
const bodies: Record<string, unknown>[] = []
const originalFetch = globalThis.fetch
const oldUrl = process.env.SUPABASE_URL, oldKey = process.env.SUPABASE_SERVICE_ROLE_KEY
process.env.SUPABASE_URL = 'https://example.invalid'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
globalThis.fetch = async (_input, init) => {
  const row = (JSON.parse(String(init?.body)) as Record<string, unknown>[])[0] ?? {}
  bodies.push(row)
  return 'source' in row ? Response.json({ code: 'PGRST204' }, { status: 400 }) : Response.json([{ id: 'new-id' }], { status: 201 })
}
try {
  const saved = await saveApplication(app)
  assert.equal(saved.applicationId, 'new-id')
  assert.equal(bodies.length, 3)
  assert.deepEqual([bodies[0]?.region, bodies[0]?.vacancy_period, bodies[0]?.applicant, bodies[0]?.utm_content], ['경북 의성군', '3~5년', '자녀·가족', 'image_a'])
  assert.equal(bodies[1]?.source, 'instagram')
  assert.ok(!('utm_content' in (bodies[1] ?? { utm_content: 1 })))
  assert.ok(!('source' in (bodies[2] ?? { source: 1 })))

  // With every column migrated, one insert carries all of it.
  bodies.length = 0
  globalThis.fetch = async (_input, init) => { bodies.push((JSON.parse(String(init?.body)) as Record<string, unknown>[])[0] ?? {}); return Response.json([{ id: 'full-id' }], { status: 201 }) }
  assert.equal((await saveApplication(app)).applicationId, 'full-id')
  assert.equal(bodies.length, 1)
  assert.equal(bodies[0]?.utm_content, 'image_a')
} finally {
  globalThis.fetch = originalFetch
  process.env.SUPABASE_URL = oldUrl; process.env.SUPABASE_SERVICE_ROLE_KEY = oldKey
}
console.log('application-source ok')
