'use client'
import Link from 'next/link'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
  const [visibleStart,setVisibleStart]=useState<number|null>(null)
  const firstVisible=visibleStart??Math.max(0,(row?.entries.length??0)-6)
  const loadedId=useRef<string|null>(null)
  useLayoutEffect(()=>{
    if(row&&loadedId.current!==row.id){
      loadedId.current=row.id
      setVisibleStart(Math.max(0,row.entries.length-6))
      nearBottom.current=true
    }
  },[row])
  const earlierScroll=useRef<{height:number;top:number}|null>(null)
  useLayoutEffect(()=>{
    const node=feed.current, previous=earlierScroll.current
    if(node&&previous){node.scrollTop=previous.top+node.scrollHeight-previous.height;earlierScroll.current=null}
  },[visibleStart])
  function showEarlier() {
    const node=feed.current
    if(node)earlierScroll.current={height:node.scrollHeight,top:node.scrollTop}
    setVisibleStart(Math.max(0,firstVisible-10))
  }
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
    <div className={s.body}>
    {!ready?<p role="status">상담을 불러오고 있어요.</p>:loadError?<p role="alert">{loadError}</p>:!row?<section className={s.card}><h1>상담 기록을 찾을 수 없어요.</h1><Link href={expert?'/experts':'/example-report#consultation'}>돌아가기</Link></section>:<>
      <div className={s.title}><div><p>고객과 담당자가 함께 보는 공간</p><h1>진행 현황</h1></div>{expert&&<span className={s.tag}>담당자 화면</span>}</div>
      <StatusOverview row={row} role={role}/>
      <div className={s.layout + (!expert ? ' ' + s.customerLayout : '')}>
        <section id="case-conversation" className={s.chat} aria-label="담당자와 상담">
          <header className={s.chatHead}>
            {expert&&<span className={s.avatar} aria-hidden="true">집</span>}
            <div><h2>우리 집 {row.kind} 상담방</h2><p className={s.participants}><span>고객님</span><span aria-hidden="true">↔</span><span>{row.provider}</span></p></div>
          </header>
          <div className={s.propertyBar}><span>호미곶 시골집 · 주택 66㎡</span><Link href="/example-report">진단서 보기 ↗</Link></div>
          {expert&&row.stage===1&&<div className={s.tools}><button aria-expanded={panel==='visit'} onClick={()=>setPanel(panel==='visit'?null:'visit')}>방문 일정 제안</button><button aria-expanded={panel==='quote'} onClick={()=>setPanel(panel==='quote'?null:'quote')}>견적·제안 보내기</button></div>}
          {expert&&row.stage===4&&<div className={s.tools}><button aria-expanded={panel==='finish'} onClick={()=>setPanel(panel==='finish'?null:'finish')}>완료 확인 요청</button></div>}
          <div id="case-action" className={s.actions + ' ' + s.actionArea}>
            {expert&&row.stage===0&&<button className={s.primary} disabled={busy} onClick={()=>act({type:'accept'})}>상담 수락하기</button>}
            {row.stage===1&&row.visit&&<VisitCard key={row.visit.proposalId} visit={row.visit} expert={expert} canChange busy={busy} act={act}/>}
            {expert&&row.stage===1&&panel==='visit'&&<VisitProposal busy={busy} act={act} onDone={()=>setPanel(null)}/>}
            {expert&&row.stage===1&&panel==='quote'&&<form className={s.form} onSubmit={async e=>{e.preventDefault();if(await act({type:'quote',amount:Number(amount),scope}))setPanel(null)}}><h3>고객에게 보낼 견적·제안</h3><label>{row.kind==='철거'?'제안 견적 (만원)':'매도 희망가격 제안 (만원)'}<input type="number" inputMode="decimal" min="0.01" step="0.01" required value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>포함·제외 항목과 확인 조건<textarea required maxLength={2000} value={scope} onChange={e=>setScope(e.target.value)}/></label><button className={s.primary} disabled={busy}>고객에게 제안 전달</button></form>}
            {row.quote&&row.stage===2&&<section className={s.quote}><span className={s.tag}>담당자가 보낸 제안</span><h3>{row.kind==='철거'?'철거 제안 견적':'매도 희망가격 제안'}</h3><strong>{row.quote.amount.toLocaleString()}만 원</strong><p className={s.prewrap}>{row.quote.scope}</p><small>{row.kind==='철거'?'현장·계약 조건 확인 필요':'희망가격 제안이며 실제 거래가격은 별도 협의해요.'}</small>{!expert?<button className={s.primary} disabled={busy} onClick={()=>act({type:'discuss'})}>계약 조건 논의하기</button>:<small>고객의 제안 확인을 기다리고 있어요.</small>}</section>}
            {!expert&&row.stage===3&&<section className={s.quote}><h3>계약 조건을 확인해 주세요</h3><p>업무 범위·금액·일정은 담당자와 별도로 협의합니다.</p><button className={s.primary} disabled={busy} onClick={()=>act({type:'contract'})}>업무 진행 요청하기</button></section>}
            {expert&&row.stage===4&&panel==='finish'&&<form className={s.form} onSubmit={async e=>{e.preventDefault();if(await act({type:'finish',text:finish}))setPanel(null)}}><label>완료 내용과 남은 확인사항<textarea required maxLength={2000} value={finish} onChange={e=>setFinish(e.target.value)}/></label><button className={s.primary} disabled={busy||!finish.trim()}>고객에게 완료 확인 요청</button></form>}
            {row.stage>=5&&<section className={s.visit}><h3>담당자가 남긴 완료 내용</h3><p className={s.prewrap}>{row.entries.findLast(entry=>entry.role==='expert'&&entry.text.startsWith('완료 확인 요청: '))?.text.slice('완료 확인 요청: '.length)}</p>{row.stage===5&&!expert&&<button className={s.primary} disabled={busy} onClick={()=>act({type:'complete'})}>결과 확인 · 완료하기</button>}</section>}
          </div>
          <div className={s.conversationLabel}><h3>함께 나누는 대화</h3></div>
          <div className={s.feed} ref={feed} onScroll={()=>{const node=feed.current;if(node){nearBottom.current=node.scrollHeight-node.scrollTop-node.clientHeight<80;if(nearBottom.current)setUnread(false)}}} role="region" tabIndex={0} aria-label="상담 대화 스크롤 영역">
            {firstVisible>0&&<button className={s.earlier} onClick={showEarlier}>이전 대화 {firstVisible}개 보기 ↑</button>}
            <div role="log" aria-label="상담 기록" aria-live="polite" aria-relevant="additions">
              {row.entries.slice(firstVisible).map((savedEntry,i)=>{
                // Show the initial request in older records as the customer's message too.
                const oldRequest=firstVisible+i===0 && (savedEntry.text===`${row.kind} 상담을 요청했어요.` || savedEntry.text===`${row.kind} 상담 요청이 접수됐어요. 담당자가 확인하면 이 상담방에서 답변을 드려요.`)
                const entry=oldRequest?{...savedEntry,role:'customer' as const,event:false,text:`${row.kind} 상담 요청을 보냈어요.`}:savedEntry
                const isEvent=automatic(entry)
                const quoteEvent=isEvent&&entry.text==='견적·제안을 전달했어요.'&&row.quote
                return <article key={firstVisible+i} className={isEvent?s.event:s.message} data-own={entry.role===role}>
                  <div className={s.sender}>{isEvent?'진행 기록':entry.role==='customer'?'고객님'+(!expert?' · 나':''):row.provider+' · 담당자'+(expert?' · 나':'')}</div>
                  <p>{entry.text}</p>
                  {quoteEvent&&<div className={s.quoteRecord}><strong>{row.kind==='철거'?'철거 견적':'매도 희망가격'} · {quoteEvent.amount.toLocaleString()}만 원</strong>{row.stage!==2&&<p>{quoteEvent.scope}</p>}</div>}
                  <time dateTime={entry.at}>{new Date(entry.at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</time>
                </article>
              })}
            </div>
          </div>
          {unread&&<button className={s.newMessages} onClick={scrollLatest}>새 내용 보기 ↓</button>}
          {error&&<p className={s.error} role="alert">{error}</p>}
          {row.stage<6 ? <form className={s.composer} onSubmit={async e=>{e.preventDefault();if(await act({type:'message',text:message})){setMessage('');scrollLatest()}}}>
            <label htmlFor="case-message">{expert?'고객에게 답변하기':'담당자에게 메시지 보내기'}</label>
            <div><textarea id="case-message" rows={2} maxLength={2000} disabled={expert&&row.stage===0} value={message} onChange={e=>setMessage(e.target.value)} placeholder={expert&&row.stage===0?'상담 수락 후 답변할 수 있어요.':'궁금한 점이나 전달할 내용을 남겨 주세요.'}/><button disabled={busy||!message.trim()||(expert&&row.stage===0)} type="submit">보내기</button></div>
          </form> : <p className={s.closed}>상담이 완료됐어요. 함께 나눈 기록은 계속 볼 수 있어요.</p>}

        </section>
        {expert&&<aside className={s.sidebar}>
          <section className={s.card}><h2>함께 보는 집 정보</h2><strong>호미곶 시골집</strong><p>포항시 남구 호미곶면<br/>주택 66㎡</p><Link href="/example-report">진단서 보기 ↗</Link></section>
          {row.contact&&<section className={s.card}><h2>연락 방법</h2><p>{row.contact.method==='chat'?'채팅 상담':'전화 상담'}</p>{row.contact.method==='phone'&&<><p>{row.contact.phone}</p><p>{row.contact.availability}</p></>}</section>}
          <details className={s.card}><summary>상담 진행 단계</summary><ol className={s.timeline}>{stages.map((label,i)=><li key={label} aria-current={i===row.stage?'step':undefined} data-done={i<row.stage}>{i<row.stage?'✓ ':''}{label}{i===row.stage?' · 현재':''}</li>)}</ol></details>
          <p className={s.note}>최종 계약 여부는 고객이 직접 결정해요.</p>
        </aside>}
      </div>
    </>}
    </div>
  </main>
}
