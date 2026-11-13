'use client'
import { useActionState, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { trackForm } from '../../src/web-analytics'
import { APPLICANTS, PLAN_CHOICES } from '../../src/management'
import { submitManagementApply } from './actions'
import m from './management.module.css'

const INITIAL = { ok: false, message: '', errors: {} as Record<string, string> }

export function ApplyForm() {
  const [state, action, pending] = useActionState(submitManagementApply, INITIAL)
  const [requestId, setRequestId] = useState('')
  // Controlled fields: React resets uncontrolled inputs after every submit, which would wipe answers on a validation error.
  const [values, setValues] = useState<Record<string, string>>({})
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const set = (name: string) => (e: { target: { value: string } }) => setValues(v => ({ ...v, [name]: e.target.value }))
  const toggle = (name: string) => (e: { target: { checked: boolean } }) => setChecks(c => ({ ...c, [name]: e.target.checked }))
  const started = useRef(false)
  const completed = useRef(false)
  const feedback = useRef<HTMLDivElement>(null)
  useEffect(() => { setRequestId(crypto.randomUUID()) }, [])
  useEffect(() => {
    if (state.ok && !completed.current) { completed.current = true; trackForm('generate_lead', 'care') }
    if (state.message) feedback.current?.focus()
  }, [state])
  const start = () => { if (!started.current) { started.current = true; trackForm('form_start', 'care') } }
  const err = (name: string) => state.errors[name] ? <p id={`${name}-error`} className={m.error}>{state.errors[name]}</p> : null
  const described = (name: string) => state.errors[name] ? `${name}-error` : undefined

  if (state.ok) return <div className={m.success} ref={feedback} tabIndex={-1} role="status">
    <strong>신청을 접수했어요</strong>
    <p>{state.message}</p>
  </div>

  return <form className={m.form} action={action} onFocus={start} noValidate>
    <input type="hidden" name="requestId" value={requestId} />
    <div hidden aria-hidden="true"><label>웹사이트<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

    <label className={m.field}>집이 있는 곳<small>읍·면·리까지만 적어도 돼요.</small>
      <input name="place" value={values.place ?? ''} onChange={set('place')} maxLength={80} placeholder="예: 포항시 북구 송라면 ○○리" required aria-invalid={state.errors.place ? true : undefined} aria-describedby={described('place')} />
    </label>
    {err('place')}

    <fieldset className={m.field}>
      <legend>신청하는 분</legend>
      <div className={m.choices}>{APPLICANTS.map(a => <label key={a} className={m.choice}><input type="radio" name="applicant" value={a} checked={values.applicant === a} onChange={set('applicant')} required aria-describedby={described('applicant')} />{a}</label>)}</div>
      {err('applicant')}
    </fieldset>

    <fieldset className={m.field}>
      <legend>원하는 상품<small>상담 후 바꿀 수 있어요.</small></legend>
      <div className={m.planChoices}>{PLAN_CHOICES.map(p => <label key={p} className={m.choice}><input type="radio" name="plan" value={p} checked={values.plan === p} onChange={set('plan')} required aria-describedby={described('plan')} />{p}</label>)}</div>
      {err('plan')}
    </fieldset>

    <label className={m.field}>연락받을 전화번호
      <input name="contact" value={values.contact ?? ''} onChange={set('contact')} type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="예: 010-1234-5678" required aria-invalid={state.errors.contact ? true : undefined} aria-describedby={described('contact')} />
    </label>
    {err('contact')}

    <details className={m.consent}>
      <summary>개인정보 수집·이용 안내 보기</summary>
      <p>전화번호, 집이 있는 곳, 신청하는 분, 원하는 상품을 관리 상담 연락과 계약 안내에 사용해요. 유입 경로도 함께 저장해요. 접수일부터 최대 6개월 보관하고, 그 전에 삭제를 요청하실 수 있어요. 광고 연락에는 쓰지 않아요.</p>
      <p>응답은 해외 업체의 서버에 저장·처리돼요. Supabase Pte. Ltd.(일본 도쿄): 응답 저장, 접수일부터 최대 6개월. Vercel Inc.(대한민국 서울·미국): 사이트 운영과 응답 처리. 동의하지 않으시면 010-7428-2624로 전화 신청해 주세요.</p>
      <Link href="/privacy">개인정보 처리방침 보기</Link>
    </details>
    <label className={m.check}><input type="checkbox" name="agree" checked={checks.agree ?? false} onChange={toggle('agree')} required aria-describedby={described('agree')} />개인정보 수집·이용에 동의하고 담당자의 연락을 요청합니다. (필수)</label>
    {err('agree')}
    <label className={m.check}><input type="checkbox" name="overseasAgree" checked={checks.overseasAgree ?? false} onChange={toggle('overseasAgree')} required aria-describedby={described('overseasAgree')} />개인정보 국외 이전에 동의합니다. (필수)</label>
    {err('overseasAgree')}

    <button className={m.submit} type="submit" disabled={pending || !requestId}>{pending ? '접수 중…' : '관리 신청하기'}</button>
    <p className={m.fine}>신청만으로 결제되지 않아요.</p>
    <div ref={feedback} tabIndex={-1} role="status">{state.message && <p className={m.error}>{state.message}</p>}{err('form')}</div>
  </form>
}
