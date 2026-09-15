'use client'
import { useState } from 'react'
import { formatVisit, visitDate, type Action, type Consultation } from '@/src/consultations'
import s from './chat.module.css'
export function VisitProposal({busy,act,onDone}:{busy:boolean;act:(action:Action)=>Promise<boolean>;onDone:()=>void}) {
  const [slots,setSlots]=useState(['','',''])
  const [times,setTimes]=useState(['09:00','09:00','09:00'])
  const [dates]=useState(()=>Array.from({length:90},(_,i)=>new Date(Date.now()+9*3600000+i*86400000).toISOString().slice(0,10)))
  const [fee,setFee]=useState('')
  const [preparations,setPreparations]=useState('')
  return <form className={s.form} onSubmit={async e=>{e.preventDefault();if(await act({type:'propose-visit',proposalId:crypto.randomUUID(),slots:slots.flatMap((date,i)=>date?[date+'T'+times[i]]:[]),fee:Number(fee),preparations}))onDone()}}>
    <h3>방문 가능한 시간을 제안하세요.</h3><p>고객이 날짜를 고르면 담당자가 최종 확정해요.</p>
    {slots.map((slot,index)=><fieldset className={s.dateFields} key={index}><legend>방문 후보 {index+1}{index===2?' (선택)':''}</legend><label>날짜<select aria-label={'방문 후보 '+(index+1)+' 날짜'} required={index<2} value={slot} onChange={e=>setSlots(values=>values.map((value,i)=>i===index?e.target.value:value))}><option value="">날짜 선택</option>{dates.map(date=><option key={date} value={date}>{date.replaceAll('-','. ')}</option>)}</select></label><label>시간<select aria-label={'방문 후보 '+(index+1)+' 시간'} value={times[index]} onChange={e=>setTimes(values=>values.map((value,i)=>i===index?e.target.value:value))}>{Array.from({length:48},(_,i)=>{const time=String(Math.floor(i/2)).padStart(2,'0')+':'+(i%2?'30':'00');return <option key={time} value={time}>{time}</option>})}</select></label></fieldset>)}
    <small>방문 날짜는 향후 90일 중 선택할 수 있어요. 한국 시간 기준이에요.</small>
    <label>방문비 (원)<input type="number" inputMode="numeric" min="0" step="1" required value={fee} onChange={e=>setFee(e.target.value)} placeholder="무료이면 0"/></label>
    <label>고객 준비사항<textarea required maxLength={2000} value={preparations} onChange={e=>setPreparations(e.target.value)} placeholder="출입 방법, 현장에 필요한 자료 등을 안내해 주세요."/></label>
    <button className={s.primary} disabled={busy}>방문 일정 제안 보내기</button>
  </form>
}
export function VisitCard({visit,expert,canChange,busy,act}:{visit:NonNullable<Consultation['visit']>;expert:boolean;canChange:boolean;busy:boolean;act:(action:Action)=>Promise<boolean>}) {
  const [feeAccepted,setFeeAccepted]=useState(false)
  return <section className={s.visit}><span className={s.tag}>{visit.status==='confirmed'?'방문 확정':visit.status==='selected'?'담당자 확정 대기':visit.status==='change-requested'?'다른 날짜 요청':'방문 일정 제안'}</span>
    <h3>{visit.selected ? formatVisit(visit.selected) : visit.status==='change-requested'?'새 방문 일정을 조율하고 있어요.':expert?'고객의 날짜 선택을 기다리고 있어요.':'방문하기 좋은 날짜를 골라 주세요.'}</h3>
    <p><strong>방문비 {visit.fee === 0 ? '무료' : visit.fee.toLocaleString()+'원'}</strong></p><p className={s.prewrap}>준비사항: {visit.preparations}</p>
    {!expert && canChange && visit.status==='proposed' && <>{visit.fee>0 && <label className={s.check}><input type="checkbox" checked={feeAccepted} onChange={e=>setFeeAccepted(e.target.checked)}/><span>방문비 {visit.fee.toLocaleString()}원 안내를 확인했습니다.</span></label>}<div className={s.dates}>{visit.slots.map(slot=><button key={slot} disabled={busy || (visit.fee>0&&!feeAccepted) || visitDate(slot)<=Date.now()} onClick={()=>act({type:'select-visit',proposalId:visit.proposalId,slot,feeAccepted})}>{formatVisit(slot)} 선택</button>)}</div></>}
    {expert && visit.status==='proposed' && <ul>{visit.slots.map(slot=><li key={slot}>{formatVisit(slot)}</li>)}</ul>}
    {expert && canChange && visit.status==='selected' && <button className={s.primary} disabled={busy} onClick={()=>act({type:'confirm-visit',proposalId:visit.proposalId})}>방문 일정 확정하기</button>}
    {!expert && canChange && visit.status!=='change-requested' && <button className={s.secondary} disabled={busy} onClick={()=>act({type:'change-visit',proposalId:visit.proposalId})}>{visit.status==='confirmed'?'일정 변경 요청':'다른 날짜 요청'}</button>}
    {visit.status==='selected' && <small>아직 확정 전이에요. 담당자가 확인하면 알려드려요.</small>}
  </section>
}
