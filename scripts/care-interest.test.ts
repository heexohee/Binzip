import assert from 'node:assert/strict'
import { validateInterest, CARE_CONSENT_VERSION } from '../src/care-interest'
import { submitInterest } from '../app/interest/actions'
function valid() {const f = new FormData(); for (const [k,v] of Object.entries({requestId:'00000000-0000-4000-8000-000000000001',region:'경북 포항시',residence:'다른 시·군',intent:'보유하며 관리',budget:'유료 이용 의사 없음',contact:'010-0000-0000',agree:'on',source:'instagram'})) f.set(k,v);return f}
assert.deepEqual(validateInterest(valid()).errors,{})
assert.equal(validateInterest(valid()).row.email,null)
assert.equal(validateInterest(valid()).row.consent_version,CARE_CONSENT_VERSION)
for (const [k,v] of [['agree',''],['contact','bad'],['budget','무료'],['intent','hacked'],['region',''],['email','invalid'],['website','spam']] as const) { const f=valid();f.set(k,v);assert.ok(Object.keys(validateInterest(f).errors).length,k) }
const bad=valid();bad.append('services','<script>');assert.ok(validateInterest(bad).errors.services)
const unknown=valid();unknown.set('source','https://private-url');assert.equal(validateInterest(unknown).row.source,'website')
const prev={ok:false,errors:{},message:''}
const originalFetch=globalThis.fetch
const oldUrl=process.env.SUPABASE_URL, oldKey=process.env.SUPABASE_SERVICE_ROLE_KEY
try {
 delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SERVICE_ROLE_KEY
 assert.equal((await submitInterest(prev,valid())).ok,false)
 process.env.SUPABASE_URL='https://db.example';process.env.SUPABASE_SERVICE_ROLE_KEY='test-only'
 let calls=0
 globalThis.fetch=async (_url,init)=>{calls++;const payload=JSON.parse(String(init?.body)).payload;assert.equal(payload.email,null);assert.equal(payload.intent,'보유하며 관리');return new Response(JSON.stringify(payload.id),{status:200})}
 assert.equal((await submitInterest(prev,valid())).ok,true)
 assert.equal(calls,1)
 const noConsent=valid();noConsent.delete('agree');assert.equal((await submitInterest(prev,noConsent)).ok,false);assert.equal(calls,1)
 globalThis.fetch=async()=>new Response(JSON.stringify({code:'42P01'}),{status:404})
 assert.equal((await submitInterest(prev,valid())).ok,false)
 globalThis.fetch=async()=>{throw new Error('offline')}
 assert.equal((await submitInterest(prev,valid())).ok,false)
} finally { globalThis.fetch=originalFetch; if(oldUrl)process.env.SUPABASE_URL=oldUrl;else delete process.env.SUPABASE_URL;if(oldKey)process.env.SUPABASE_SERVICE_ROLE_KEY=oldKey;else delete process.env.SUPABASE_SERVICE_ROLE_KEY }
console.log('care interest: validation, optional email, consent, successful receipt and storage failures passed')
