import assert from 'node:assert/strict'
import {createConsultation,updateConsultation,conversationEntries,consultationGreeting} from '../src/consultations'
const at = '2026-09-15T00:00:00.000Z'
for (const kind of ['철거','매도'] as const) {
  let row = createConsultation(kind,kind,'  방문 일정을 알고 싶어요.  ',at)
  assert.deepEqual(row.entries[0],{role:'customer',event:false,text:`${kind} 상담 요청을 보냈어요.`,at})
  assert.equal(row.entries[1]?.text,'방문 일정을 알고 싶어요.')
  assert.throws(()=>updateConsultation(row,'customer',{type:'accept'},at))
  assert.throws(()=>updateConsultation(row,'expert',{type:'quote',amount:2000,scope:'전체'},at))
  row=updateConsultation(row,'expert',{type:'accept'},at)
  assert.throws(()=>updateConsultation(row,'expert',{type:'quote',amount:NaN,scope:'전체'},at))
  assert.throws(()=>updateConsultation(row,'expert',{type:'message',text:' '},at))
  row=updateConsultation(row,'expert',{type:'message',text:'금요일 방문 가능합니다.'},at)
  assert.equal(row.stage,1)
  row=updateConsultation(row,'expert',{type:'quote',amount:1800,scope:'철거 / 석면 제외'},at)
  assert.throws(()=>updateConsultation(row,'expert',{type:'discuss'},at))
  row=updateConsultation(row,'customer',{type:'discuss'},at)
  row=updateConsultation(row,'customer',{type:'contract'},at)
  assert.throws(()=>updateConsultation(row,'customer',{type:'complete'},at))
  assert.throws(()=>updateConsultation(row,'expert',{type:'finish',text:''},at))
  row=updateConsultation(row,'expert',{type:'finish',text:'현장 정리 완료'},at)
  row=updateConsultation(row,'customer',{type:'complete'},at)
  assert.equal(row.stage,6)
  assert.equal(row.quote?.amount,1800)
  assert.throws(()=>updateConsultation(row,'expert',{type:'message',text:'추가'},at))
}
assert.equal(createConsultation('empty','철거','',at).entries.length,2)
console.log('Consultation transitions: passed for demolition and sale')


let scheduled = createConsultation('visit','철거','',at)
assert.equal(scheduled.entries[0]?.role,'customer')
scheduled = updateConsultation(scheduled,'customer',{type:'message',text:'방문이 필요해요.'},at)
assert.equal(scheduled.entries.at(-1)?.event,false)
assert.throws(()=>updateConsultation(scheduled,'expert',{type:'message',text:'안녕하세요'},at))
assert.throws(()=>updateConsultation(scheduled,'customer',{type:'contact',method:'phone',phone:'123',availability:'오전'},at))
scheduled = updateConsultation(scheduled,'customer',{type:'contact',method:'phone',phone:'010-0000-0000',availability:'평일 10~12시'},at)
assert.equal(scheduled.contact?.phone,'010-0000-0000')
scheduled = updateConsultation(scheduled,'customer',{type:'contact',method:'chat',phone:'010-0000-0000',availability:'오전'},at)
assert.equal(scheduled.contact?.phone,'')
scheduled = updateConsultation(scheduled,'expert',{type:'accept'},at)
const proposal = {type:'propose-visit' as const,proposalId:'p1',slots:['2026-09-18T10:00','2026-09-19T14:00'],fee:30000,preparations:'출입 방법을 알려주세요.'}
assert.throws(()=>updateConsultation(scheduled,'customer',proposal,at))
assert.throws(()=>updateConsultation(scheduled,'expert',{...proposal,slots:['2026-09-14T10:00','2026-09-19T14:00']},at))
assert.throws(()=>updateConsultation(scheduled,'expert',{...proposal,slots:['2026-02-30T10:00','2026-09-19T14:00']},at))
assert.throws(()=>updateConsultation(scheduled,'expert',{...proposal,slots:['2026-09-18T10:00','2026-09-18T10:00']},at))
assert.throws(()=>updateConsultation(scheduled,'expert',{...proposal,fee:-1},at))
scheduled = updateConsultation(scheduled,'expert',proposal,at)
assert.throws(()=>updateConsultation(scheduled,'expert',{type:'confirm-visit',proposalId:'p1'},at))
assert.throws(()=>updateConsultation(scheduled,'expert',{type:'quote',amount:1000,scope:'해체'},at))
const select = {type:'select-visit' as const,proposalId:'p1',slot:'2026-09-18T10:00',feeAccepted:true}
assert.throws(()=>updateConsultation(scheduled,'customer',{...select,feeAccepted:false},at))
assert.throws(()=>updateConsultation(scheduled,'customer',{...select,proposalId:'stale'},at))
assert.throws(()=>updateConsultation(scheduled,'customer',{...select,slot:'2026-09-20T10:00'},at))
scheduled = updateConsultation(scheduled,'customer',select,at)
assert.equal(scheduled.visit?.status,'selected')
assert.throws(()=>updateConsultation(scheduled,'customer',{type:'confirm-visit',proposalId:'p1'},at))
scheduled = updateConsultation(scheduled,'expert',{type:'confirm-visit',proposalId:'p1'},at)
assert.equal(scheduled.visit?.status,'confirmed')
scheduled = updateConsultation(scheduled,'customer',{type:'change-visit',proposalId:'p1'},at)
assert.equal(scheduled.visit?.selected,undefined)
scheduled = updateConsultation(scheduled,'expert',{...proposal,proposalId:'p2'},at)
assert.throws(()=>updateConsultation(scheduled,'customer',select,at))
assert.throws(()=>updateConsultation(scheduled,'customer',{...select,proposalId:'p2'},'2026-09-20T00:00:00.000Z'))
console.log('Chat, contact preferences and visit scheduling: passed')

for (const kind of ['철거', '매도'] as const) {
  const row = createConsultation('greeting',kind,'문의 내용',at)
  assert.equal(row.stage,0)
  assert.deepEqual(row.entries.at(-1),{role:'expert',event:false,automated:true,text:consultationGreeting,at})
  assert.equal(conversationEntries(row).filter(entry=>entry.automated).length,1)
  const previous = {...row,entries:row.entries.map(entry=>entry.automated ? {...entry,text:'안녕하세요. 확인 후 메세지 드리겠습니다!'} : entry)}
  const original = JSON.stringify(previous)
  assert.equal(conversationEntries(previous).at(-1)?.text,consultationGreeting)
  assert.equal(conversationEntries(previous).filter(entry=>entry.automated).length,1)
  assert.equal(JSON.stringify(previous),original)
  const humanReply = {...previous,entries:previous.entries.map(entry=>({...entry,automated:false}))}
  assert.equal(conversationEntries(humanReply).at(-1)?.text,'안녕하세요. 확인 후 메세지 드리겠습니다!')
  const legacy = {...row,entries:row.entries.filter(entry=>!entry.automated)}
  const saved = JSON.stringify(legacy)
  const displayed = conversationEntries(legacy)
  assert.equal(displayed.at(-1)?.text,consultationGreeting)
  assert.equal(JSON.stringify(legacy),saved)
  assert.deepEqual(conversationEntries({...legacy,entries:displayed}),displayed)
  for (const text of [`${kind} 상담을 요청했어요.`,`${kind} 상담 요청이 접수됐어요. 담당자가 확인하면 이 상담방에서 답변을 드려요.`]) {
    const old = {...legacy,entries:[{role:'system' as const,text,at}]}
    assert.equal(conversationEntries(old)[0]?.role,'customer')
    assert.equal(conversationEntries(old)[1]?.text,consultationGreeting)
  }
}
console.log('Automatic greeting and legacy display compatibility: passed')
