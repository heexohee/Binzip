'use client'
import { useState } from 'react'
import type { Action, Consultation } from '@/src/consultations'
import s from './chat.module.css'
export default function ContactOptions({ contact, busy, act }: {contact:Consultation['contact'];busy:boolean;act:(action:Action)=>Promise<boolean>}) {
  const [method,setMethod] = useState<'phone'|'chat'>(contact?.method || 'chat')
  const [phone,setPhone] = useState(contact?.phone || '')
  const [availability,setAvailability] = useState(contact?.availability || '')
  return <form className={s.form} onSubmit={async e=>{e.preventDefault();await act({type:'contact',method,phone,availability})}}>
    <h3>어떻게 상담받고 싶으세요?</h3>
    <div className={s.options}><button type="button" aria-pressed={method==='chat'} onClick={()=>setMethod('chat')}>채팅으로 상담</button><button type="button" aria-pressed={method==='phone'} onClick={()=>setMethod('phone')}>전화로 상담</button></div>
    {method==='phone' && <><label>연락받을 전화번호<input type="tel" autoComplete="tel" required maxLength={15} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="010-0000-0000"/></label><label>연락 가능한 시간<input required maxLength={100} value={availability} onChange={e=>setAvailability(e.target.value)} placeholder="예: 평일 오전 10시~12시"/></label><small>입력한 연락 정보는 이 상담의 담당자에게 공유돼요.</small></>}
    <button className={s.primary} disabled={busy}>연락 방법 저장</button>
  </form>
}
