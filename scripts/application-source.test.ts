import assert from 'node:assert/strict'
import { applicationSource, saveApplication, type Application } from '../src/application'

assert.equal(applicationSource('instagram'), 'instagram')
assert.equal(applicationSource('https://private-url'), 'website')
assert.equal(applicationSource(''), 'website')

// Before the source migration runs, an insert with the new column is retried without it.
const app: Application = {
  address: '테스트 주소', condition: null, channel: null, contact: '01000000000', email: null,
  acquisition: null, ownership: null, concern: null, speed: null, createdAt: '2026-11-04T00:00:00Z',
  expiresAt: '2027-05-04T00:00:00Z', pnu: null, resolvedAddress: null, matchQuality: null, source: 'instagram',
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
  assert.equal(bodies.length, 2)
  assert.equal(bodies[0]?.source, 'instagram')
  assert.ok(!('source' in (bodies[1] ?? { source: 1 })))
} finally {
  globalThis.fetch = originalFetch
  process.env.SUPABASE_URL = oldUrl; process.env.SUPABASE_SERVICE_ROLE_KEY = oldKey
}
console.log('application-source ok')
