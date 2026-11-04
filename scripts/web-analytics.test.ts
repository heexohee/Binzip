import assert from 'node:assert/strict'
import {safePage,safeCampaign,trackForm,vercelSafeUrl,CONSENT_KEY} from '../src/web-analytics'
assert.equal(safePage('/admin/123'),null)
assert.equal(safePage('/report/private-id'),null)
assert.equal(safePage('/decision-report'),null)
assert.equal(safePage('/apply'),'https://www.binzipcare.kr/apply')
assert.deepEqual(safeCampaign('?address=secret&email=private@example.com&utm_source=instagram&utm_medium=paid_social&utm_campaign=binzip_diagnosis_202611&utm_content=image_a'),{utm_source:'instagram',utm_medium:'paid_social',utm_campaign:'binzip_diagnosis_202611',utm_content:'image_a'})
assert.deepEqual(safeCampaign('?utm_content=private@example.com&utm_campaign=01012345678'),{})
const sent:unknown[][]=[]
Object.assign(globalThis,{window:{gtag:(...args:unknown[])=>sent.push(args)},location:{pathname:'/apply'},localStorage:{getItem:(key:string)=>key===CONSENT_KEY?'denied':null}})
trackForm('generate_lead','diagnosis');assert.equal(sent.length,0)
Object.assign(globalThis,{localStorage:{getItem:()=> 'granted'}})
trackForm('generate_lead','diagnosis');assert.equal(sent.length,1)
Object.assign(globalThis,{location:{pathname:'/admin/123'}})
trackForm('generate_lead','diagnosis');assert.equal(sent.length,1)
// Vercel counts every visit without cookies, so it must drop personal pages and unknown query strings itself.
const base='https://www.binzipcare.kr'
assert.equal(vercelSafeUrl(base+'/diagnosis'),base+'/diagnosis')
assert.equal(vercelSafeUrl(base+'/diagnosis?utm_source=instagram&phone=01012345678'),base+'/diagnosis?utm_source=instagram')
assert.equal(vercelSafeUrl(base+'/?utm_source=evil'),base+'/')
for (const personal of ['/admin','/admin/metrics','/report/abc','/status/123','/experts/1']) assert.equal(vercelSafeUrl(base+personal),null,personal)
assert.equal(vercelSafeUrl('not a url'),null)
console.log('analytics privacy and consent checks passed')
