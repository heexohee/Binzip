'use client'
import { startTransition, useActionState, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { submitInterest } from './actions'
import { RESIDENCES, INTENTS, BUDGETS, SERVICES } from '../../src/care-interest'
import s from './interest.module.css'
export default function InterestForm() {
  const [state, action, pending] = useActionState(submitInterest, { ok: false, message: '', errors: {} })
  const [requestId, setRequestId] = useState('')
  const [source, setSource] = useState('website')
  const [values, setValues] = useState<Record<string,string>>({})
  const [checks, setChecks] = useState<Record<string,boolean>>({})
  const feedback = useRef<HTMLDivElement>(null)
  useEffect(() => { setRequestId(crypto.randomUUID()); const q = new URLSearchParams(location.search); let campaign = ''; try { campaign = sessionStorage.getItem('binzip-campaign') ?? '' } catch {} setSource(q.get('utm_source') === 'instagram' || campaign === 'instagram' ? 'instagram' : q.get('source') ?? 'website') }, [])
  useEffect(() => { if (state.message) feedback.current?.focus() }, [state])
  const error = (name: string) => state.errors[name] && <p id={`${name}-error`} role="alert" className={s.error}>{state.errors[name]}</p>
  const group = (name: string, label: string, choices: readonly string[]) => <fieldset><legend>{label} (필수)</legend>{choices.map(choice => <label key={choice} className={s.option}><input type="radio" name={name} value={choice} checked={values[name] === choice} onChange={() => setValues(v => ({...v,[name]:choice}))} required aria-describedby={state.errors[name] ? `${name}-error` : undefined}/>{choice}</label>)}{error(name)}</fieldset>
  if (state.ok) return <div ref={feedback} tabIndex={-1} role="status" className={s.success}><h2>관심 등록이 완료됐어요</h2><p>{state.message}</p><p>포항부터 운영 가능 여부를 확인하고 있어요. 다른 지역은 수요를 모으는 단계이며 제공 일정은 정해지지 않았어요.</p><Link href="/">홈으로 돌아가기</Link></div>
  return <form onSubmit={event => {event.preventDefault(); if (pending) return; const data = new FormData(event.currentTarget); startTransition(() => action(data))}} className={s.form}>
    <input type="hidden" name="requestId" value={requestId}/><input type="hidden" name="source" value={source}/>
    <div hidden aria-hidden="true"><label>웹사이트<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <label>빈집이 있는 시·군 (필수)<input value={values.region ?? ''} onChange={e => setValues(v => ({...v,region:e.target.value}))} name="region" required minLength={2} maxLength={80} placeholder="예: 경북 포항시" aria-describedby={state.errors.region ? 'region-error' : undefined}/>{error('region')}</label>
    <label>대략적인 위치 (선택)<input value={values.location ?? ''} onChange={e => setValues(v => ({...v,location:e.target.value}))} name="location" maxLength={200} placeholder="예: 호미곶면 강사리"/><span>정확한 번지를 몰라도 괜찮아요. 주민번호나 등기 서류는 보내지 마세요.</span>{error('location')}</label>
    {group('residence', '소유주께서는 어디에 살고 계세요?', RESIDENCES)}
    {group('intent', '지금은 어떤 방향을 고민하세요?', INTENTS)}
    <fieldset><legend>어떤 도움이 필요한가요? (선택·복수 선택)</legend>{SERVICES.map(v => <label key={v} className={s.option}><input type="checkbox" name="services" value={v} checked={checks[v] ?? false} onChange={e => setChecks(c => ({...c,[v]:e.target.checked}))}/>{v}</label>)}{error('services')}</fieldset>
    <aside className={s.notice}><strong>아래는 가격을 알아보기 위한 질문이에요.</strong><p>월 1회 방문해 집 바깥 상태를 살피고 사진과 메모를 보내드리는 서비스를 가정했어요. 수리·제초 작업비와 긴급 출동은 별도이며, 구조 안전 진단은 포함하지 않아요.</p><p>방문 범위·요금·제공 지역은 아직 확정되지 않았어요.</p></aside>
    {group('budget', '이런 관리에 한 달 최대 얼마까지 생각하세요?', BUDGETS)}
    <label>연락받을 전화번호 (필수)<input value={values.contact ?? ''} onChange={e => setValues(v => ({...v,contact:e.target.value}))} name="contact" type="tel" autoComplete="tel" required maxLength={20} placeholder="010-0000-0000" aria-describedby={state.errors.contact ? 'contact-error' : undefined}/>{error('contact')}</label>
    <label>이메일 (선택)<input value={values.email ?? ''} onChange={e => setValues(v => ({...v,email:e.target.value}))} name="email" type="email" autoComplete="email" maxLength={254}/>{error('email')}</label>
    <label className={s.option}><input type="checkbox" name="phoneExplanation" checked={checks.phoneExplanation ?? false} onChange={e => setChecks(c => ({...c,phoneExplanation:e.target.checked}))}/>전화로 설명을 듣고 싶어요 (선택)</label>
    <div className={s.notice}><strong>개인정보 수집·이용 및 신청 관련 연락 동의</strong><p>전화번호, 빈집 소재 시·군, 거주 지역 구분, 고민하는 방향, 가격 응답과 선택 입력한 위치·관리 항목·이메일·전화 설명 선호를 수요 파악과 이번 신청에 대한 연락에 사용해요. 유입 경로도 함께 저장해요.</p><p>접수일부터 6개월 보관 후 삭제하며, 먼저 삭제를 요청하실 수 있어요. 업체에 제공하거나 별도 광고 연락에 사용하지 않아요. 동의를 거부할 수 있지만 관심 등록은 접수할 수 없어요.</p><Link href="/privacy">개인정보 처리방침 보기</Link></div>
    <label className={s.option}><input type="checkbox" name="agree" checked={checks.agree ?? false} onChange={e => setChecks(c => ({...c,agree:e.target.checked}))} required/>위 내용에 동의하고 담당자의 연락을 요청합니다. (필수)</label>{error('agree')}
    <button disabled={pending || !requestId} type="submit">{pending ? '접수 중…' : '무료로 관심 등록하기'}</button>
    <div ref={feedback} tabIndex={-1} role="status">{state.message && <p className={s.error}>{state.message}</p>}{error('form')}</div>
  </form>
}
