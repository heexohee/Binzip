'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { stages, type Action, type Role, type Consultation } from '@/src/consultations'
import { actOnConsultation, useConsultations } from './consultation-store'
import { ConnectionHeader } from './shared'
import { VisitCard, VisitProposal } from './visit-planner'
import StatusOverview from './status-overview'
import s from './chat.module.css'

// Existing records predate explicit system-event metadata.
const oldEvents = new Set(['철거 상담을 요청했어요.','매도 상담을 요청했어요.','상담을 수락했어요. 현장 조건을 확인합니다.','견적·제안을 전달했어요.','제안을 확인하고 계약 협의를 요청했어요.','별도 계약의 업무 범위·금액·일정을 확인했어요.','고객이 결과를 확인하고 업무를 완료했어요.'])
function automatic(entry: Consultation['entries'][number]) {
  return entry.role==='system' || entry.event===true || (entry.event===undefined && oldEvents.has(entry.text))
}
export default function CaseView({ id, role }: { id:string;role:Role }) {
  const {rows,ready,error:loadError}=useConsultations()
  const row=rows.find(item=>item.id===id)
  const expert=role==='expert'
  const [message,setMessage]=useState('')
  const [panel,setPanel]=useState<'visit'|'quote'|'finish'|null>(null)
  const [amount,setAmount]=useState('')
  const [scope,setScope]=useState('')
  const [finish,setFinish]=useState('')
  const [busy,setBusy]=useState(false)
  const busyRef=useRef(false)
  const [error,setError]=useState('')
  const feed=useRef<HTMLDivElement>(null)
  const nearBottom=useRef(true)
  const [unread,setUnread]=useState(false)
  function scrollLatest() { const node=feed.current;if(node)node.scrollTop=node.scrollHeight;nearBottom.current=true;setUnread(false) }
  useEffect(()=>{if(nearBottom.current)scrollLatest();else setUnread(true)},[row?.entries.length])
  useEffect(()=>{scrollLatest()},[panel])
  async function act(action:Action) {
    if(busyRef.current)return false
    busyRef.current=true;setBusy(true);setError('')
    try{await actOnConsultation(id,role,action);nearBottom.current=true;return true}
    catch(e){setError(e instanceof Error?e.message:'저장하지 못했어요. 다시 시도해 주세요.');return false}
    finally{busyRef.current=false;setBusy(false)}
  }
  return <main className={s.page}><ConnectionHeader expert={expert}/>
    {!ready?<p role="status">상담을 불러오고 있어요.</p>:loadError?<p role="alert">{loadError}</p>:!row?<section className={s.card}><h1>상담 기록을 찾을 수 없어요.</h1><Link href={expert?'/experts':'/example-report#consultation'}>돌아가기</Link></section>:<>
      <div className={s.title}><div><p>고객과 업체가 함께 보는 진행 현황</p><h1>내 빈집의 다음 단계, 함께 확인해요.</h1></div><span className={s.tag}>{row.kind} 상담</span></div>
      <StatusOverview row={row} role={role}/>
      <div className={s.layout + (!expert ? ' ' + s.customerLayout : '')}>
        <section id="case-conversation" className={s.chat} aria-label="담당자와 상담">
          <header className={s.chatHead}><span className={s.avatar} aria-hidden="true">{expert?'고':'담'}</span><div><h2>{expert?'호미곶 시골집 고객':row.provider}</h2><p>{expert?'고객과 직접 대화하는 상담방':row.stage===0?'담당자 확인 대기':'업체 담당자와 직접 대화해요'}</p></div></header>
          {expert&&<div className={s.next}><strong>지금 할 일</strong><p>{row.stage===0?'문의를 확인하고 상담을 수락해 주세요.':row.stage===1?'답변하거나 방문 일정·견적을 보내세요.':row.stage===4?'진행 내용을 공유하고 완료 확인을 요청하세요.':row.stage===6?'고객의 완료 확인까지 마쳤어요.':'고객의 확인을 기다리며 궁금한 내용에 답변해 주세요.'}</p></div>}
          {expert&&row.stage===1&&<div className={s.tools}><button aria-expanded={panel==='visit'} onClick={()=>setPanel(panel==='visit'?null:'visit')}>방문 일정 제안</button><button aria-expanded={panel==='quote'} onClick={()=>setPanel(panel==='quote'?null:'quote')}>견적·제안 보내기</button></div>}
          {expert&&row.stage===4&&<div className={s.tools}><button aria-expanded={panel==='finish'} onClick={()=>setPanel(panel==='finish'?null:'finish')}>완료 확인 요청</button></div>}
          <div className={s.actions + ' ' + s.actionArea}>
            {expert&&row.stage===0&&<button className={s.primary} disabled={busy} onClick={()=>act({type:'accept'})}>상담 수락하기</button>}
            {!expert&&row.stage===1&&row.visit&&<VisitCard key={row.visit.proposalId} visit={row.visit} expert={expert} canChange busy={busy} act={act}/>} 
            {expert&&row.stage===1&&panel==='visit'&&<VisitProposal busy={busy} act={act} onDone={()=>setPanel(null)}/>} 
            {expert&&row.stage===1&&panel==='quote'&&<form className={s.form} onSubmit={async e=>{e.preventDefault();if(await act({type:'quote',amount:Number(amount),scope}))setPanel(null)}}><h3>고객에게 보낼 견적·제안</h3><label>{row.kind==='철거'?'제안 견적 (만원)':'매도 희망가격 제안 (만원)'}<input type="number" inputMode="decimal" min="0.01" step="0.01" required value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>포함·제외 항목과 확인 조건<textarea required maxLength={2000} value={scope} onChange={e=>setScope(e.target.value)}/></label><button className={s.primary} disabled={busy}>고객에게 제안 전달</button></form>}
            {!expert&&row.quote&&row.stage===2&&<section className={s.quote}><span className={s.tag}>담당자가 보낸 제안</span><h3>{row.kind==='철거'?'철거 제안 견적':'매도 희망가격 제안'}</h3><strong>{row.quote.amount.toLocaleString()}만 원</strong><p className={s.prewrap}>{row.quote.scope}</p><small>{row.kind==='철거'?'현장·계약 조건 확인 필요':'희망가격 제안이며 실제 거래가격은 별도 협의해요.'}</small><button className={s.primary} disabled={busy} onClick={()=>act({type:'discuss'})}>계약 조건 논의하기</button></section>}
            {!expert&&row.stage===3&&<section className={s.quote}><h3>계약 조건을 확인해 주세요</h3><p>업무 범위·금액·일정은 담당자와 별도로 협의합니다.</p><button className={s.primary} disabled={busy} onClick={()=>act({type:'contract'})}>업무 진행 요청하기</button></section>}
            {expert&&row.stage===4&&panel==='finish'&&<form className={s.form} onSubmit={async e=>{e.preventDefault();if(await act({type:'finish',text:finish}))setPanel(null)}}><label>완료 내용과 남은 확인사항<textarea required maxLength={2000} value={finish} onChange={e=>setFinish(e.target.value)}/></label><button className={s.primary} disabled={busy||!finish.trim()}>고객에게 완료 확인 요청</button></form>}
            {row.stage>=5&&<section className={s.visit}><h3>담당자가 남긴 완료 내용</h3><p className={s.prewrap}>{row.entries.findLast(entry=>entry.role==='expert'&&entry.text.startsWith('완료 확인 요청: '))?.text.slice('완료 확인 요청: '.length)}</p>{row.stage===5&&!expert&&<button className={s.primary} disabled={busy} onClick={()=>act({type:'complete'})}>결과 확인 · 완료하기</button>}</section>}
          </div>
          {expert ? <div className={s.feed} ref={feed} onScroll={()=>{const node=feed.current;if(node){nearBottom.current=node.scrollHeight-node.scrollTop-node.clientHeight<80;if(nearBottom.current)setUnread(false)}}} tabIndex={0} aria-label="대화와 다음 행동">
            <div role="log" aria-label="상담 기록" aria-live="polite" aria-relevant="additions">
              {row.entries.map((entry,i)=><article key={i} className={automatic(entry)?s.event:s.message} data-own={entry.role===role}>
                <div className={s.sender}>{automatic(entry)?'빈집진단서 · 자동 안내':entry.role==='customer'?'고객':row.provider+' · 담당자'}</div>
                <p>{entry.text}</p><time dateTime={entry.at}>{new Date(entry.at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</time>
              </article>)}
            </div>
          </div> : <details className={s.history}><summary>상담 기록 보기</summary><div className={s.feed} ref={feed} onScroll={()=>{const node=feed.current;if(node){nearBottom.current=node.scrollHeight-node.scrollTop-node.clientHeight<80;if(nearBottom.current)setUnread(false)}}} tabIndex={0} aria-label="상담 기록"><div role="log" aria-label="상담 기록" aria-live="polite" aria-relevant="additions">{row.entries.map((entry,i)=><article key={i} className={automatic(entry)?s.event:s.message} data-own={entry.role===role}><div className={s.sender}>{automatic(entry)?'빈집진단서 · 자동 안내':entry.role==='customer'?'고객':row.provider+' · 담당자'}</div><p>{entry.text}</p><time dateTime={entry.at}>{new Date(entry.at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</time></article>)}</div></div></details>}
          {unread&&<button className={s.newMessages} onClick={scrollLatest}>새 내용 보기 ↓</button>}
          {error&&<p className={s.error} role="alert">{error}</p>}
          {row.stage<6 ? (expert ? <form className={s.composer} onSubmit={async e=>{e.preventDefault();if(await act({type:'message',text:message})){setMessage('');scrollLatest()}}}><label htmlFor="case-message">담당자 답변</label><div><textarea id="case-message" rows={2} maxLength={2000} disabled={row.stage===0} value={message} onChange={e=>setMessage(e.target.value)} placeholder={row.stage===0?'상담 수락 후 답변할 수 있어요.':'궁금한 내용이나 진행 상황을 남겨 주세요.'}/><button disabled={busy||!message.trim()||row.stage===0} type="submit">보내기</button></div></form> : <details className={s.question}><summary>담당자에게 질문 남기기</summary><form className={s.composer} onSubmit={async e=>{e.preventDefault();if(await act({type:'message',text:message})){setMessage('');scrollLatest()}}}><label htmlFor="case-message">질문 또는 요청사항</label><div><textarea id="case-message" rows={2} maxLength={2000} value={message} onChange={e=>setMessage(e.target.value)} placeholder="궁금한 내용이 있으면 남겨 주세요."/><button disabled={busy||!message.trim()} type="submit">보내기</button></div></form></details>) : <p className={s.closed}>완료된 상담입니다.</p>}
        </section>
        {expert&&<aside className={s.sidebar}>
          <section className={s.card}><h2>함께 보는 집 정보</h2><strong>호미곶 시골집</strong><p>포항시 남구 호미곶면<br/>주택 66㎡</p><Link href="/example-report">진단서 보기 ↗</Link></section>
          {row.contact&&<section className={s.card}><h2>연락 방법</h2><p>{row.contact.method==='chat'?'채팅 상담':'전화 상담'}</p>{row.contact.method==='phone'&&<><p>{row.contact.phone}</p><p>{row.contact.availability}</p></>}</section>}
          <details className={s.card}><summary>상담 진행 단계</summary><ol className={s.timeline}>{stages.map((label,i)=><li key={label} aria-current={i===row.stage?'step':undefined} data-done={i<row.stage}>{i<row.stage?'✓ ':''}{label}{i===row.stage?' · 현재':''}</li>)}</ol></details>
          <p className={s.note}>최종 계약 여부는 고객이 직접 결정해요.</p>
        </aside>}
      </div>
    </>}
  </main>
}
