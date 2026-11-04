import assert from 'node:assert/strict'
import {safePage,safeCampaign,trackForm,CONSENT_KEY} from '../src/web-analytics'
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
console.log('analytics privacy and consent checks passed')
