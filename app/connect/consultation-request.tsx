'use client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useState } from 'react'
import { providerFor, type Kind } from '@/src/consultations'
import { requestConsultation } from './consultation-store'
import s from './consultation-request.module.css'
export default function ConsultationRequest() {
  const router = useRouter()
  const [kind, setKind] = useState<Kind>('철거')
  const [consent, setConsent] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const provider = providerFor(kind)
  return <div className={s.request}>
      <div className={s.guide}>
        <Image src="/mascot/binzip-rabbit-report-transparent-v4.png" alt="" width={64} height={80} sizes="64px" />
        <div><strong>상담 요청은 무료예요.</strong><p>최종 계약 이전까지는 비용이 발생하지 않아요.</p></div>
      </div>
      <form className={s.form} aria-label="전문가 상담 요청" onSubmit={event => {
        event.preventDefault()
        if (!consent || busy) return
        setBusy(true)
        try { router.push('/status/' + requestConsultation(kind, message)) }
        catch { setError('요청을 저장하지 못했어요. 브라우저의 저장소 설정을 확인하고 다시 시도해 주세요.'); setBusy(false) }
      }}>
        <fieldset className={s.services}><legend>어떤 상담이 필요하세요?</legend><div className={s.switch + ' ' + s.serviceSwitch}>{(['철거', '매도'] as const).map(k => <button type="button" key={k} aria-pressed={kind === k} onClick={() => { setKind(k); setConsent(false) }}>{k === '철거' ? '철거 견적' : '매도 상담'}</button>)}</div></fieldset>
        <div className={s.partner} aria-live="polite"><span>연결 전문가 · 포항시 남구</span><strong>{provider}</strong></div>
        <label htmlFor="initial-message">문의 내용 <span className={s.optional}>(선택)</span><textarea id="initial-message" rows={2} maxLength={2000} value={message} onChange={e => setMessage(e.target.value)} placeholder="궁금한 점이 있으면 남겨주세요."/></label>
        <label className={s.check}><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}/><span>{provider}에게 집 정보·진단·문의 내용을 공유하는 데 동의해요.</span></label>
        <button className={s.primary} disabled={!consent || busy}>{busy ? '요청 저장 중…' : '무료 상담 요청하기'}</button>
        {error && <p role="alert">{error}</p>}
      </form>
  </div>
}
