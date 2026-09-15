'use client'
import { useRouter } from 'next/navigation'
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
    <div className={s.card}><h3>어떤 일을 도와드릴까요?</h3>
      <form className={s.form} onSubmit={event => {
        event.preventDefault()
        if (!consent || busy) return
        setBusy(true)
        try { router.push('/status/' + requestConsultation(kind, message)) }
        catch { setError('요청을 저장하지 못했어요. 브라우저의 저장소 설정을 확인하고 다시 시도해 주세요.'); setBusy(false) }
      }}>
        <div className={s.switch + ' ' + s.serviceSwitch} aria-label="상담 업무">{(['철거', '매도'] as const).map(k => <button type="button" key={k} aria-pressed={kind === k} onClick={() => { setKind(k); setConsent(false) }}>{k === '철거' ? '철거 견적' : '매도 상담'}</button>)}</div>
        <div className={s.partner} aria-live="polite"><span>상담을 요청할 전문가</span><strong>{provider}</strong><p>포항시 남구 · {kind === '철거' ? '주택 철거·정리 상담' : '단독주택 매도 상담'}</p></div>
        <label htmlFor="initial-message">문의 내용(선택)<textarea id="initial-message" maxLength={2000} value={message} onChange={e => setMessage(e.target.value)} placeholder="방문 일정, 견적 항목 등 궁금한 내용을 남겨 주세요."/></label>
        <label className={s.check}><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}/><span>{provider}에게 집 정보·진단 내용과 문의 내용을 공유하는 데 동의합니다.</span></label>
        <button className={s.primary} disabled={!consent || busy}>{busy ? '요청 저장 중…' : '상담 요청하기'}</button>
        <p className={s.note}>최종 계약 여부는 고객이 직접 결정해요.</p>
        {error && <p role="alert">{error}</p>}
      </form>
    </div>
  </div>
}
