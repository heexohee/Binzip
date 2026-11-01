'use client'
import { startTransition, useActionState, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { submitInterest } from './actions'
import { RegionSelect } from './region-select'
import { OTHER_REGION_RESIDENCE, RESIDENCES, INTENTS, BUDGETS, SERVICES, INHERITANCE, LAST_VISITS, CURRENT_SPENDS, SOURCES, validateInterest } from '../../src/care-interest'
import s from './interest.module.css'

/** Every step stays mounted (only hidden) so the final FormData still carries all answers. */
const STEPS = [
  { label: '빈집', title: '빈집과 소유주에 대해 알려주세요', fields: ['region', 'location', 'residence', 'ownerRegion'] },
  { label: '고민', title: '지금 어떤 고민이 있으세요?', fields: ['intent', 'services'] },
  { label: '금액', title: '관리 요금은 어느 정도가 괜찮으세요?', fields: ['budget'] },
  { label: '연락처', title: '연락받을 곳을 남겨주세요', fields: ['contact', 'email', 'agree', 'overseasAgree', 'form'] },
]
const stepOf = (key: string) => Math.max(0, STEPS.findIndex(step => step.fields.includes(key)))
const without = (errors: Record<string, string>, key: string) => Object.fromEntries(Object.entries(errors).filter(([k]) => k !== key))

export default function InterestForm() {
  const [state, action, pending] = useActionState(submitInterest, { ok: false, message: '', errors: {} })
  const [requestId, setRequestId] = useState('')
  const [source, setSource] = useState('website')
  const [values, setValues] = useState<Record<string,string>>({})
  const [checks, setChecks] = useState<Record<string,boolean>>({})
  const [step, setStep] = useState(0)
  const [local, setLocal] = useState<Record<string,string>>({})
  const [attempt, setAttempt] = useState(0)
  const form = useRef<HTMLFormElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const feedback = useRef<HTMLDivElement>(null)
  const moved = useRef(false)
  const errors = { ...state.errors, ...local }
  useEffect(() => { setRequestId(crypto.randomUUID()); const q = new URLSearchParams(location.search); let campaign = ''; try { campaign = sessionStorage.getItem('binzip-campaign') ?? '' } catch {} const known = (v: string | null) => v && (SOURCES as readonly string[]).includes(v) ? v : null; setSource(known(q.get('source')) ?? known(q.get('utm_source')) ?? known(campaign) ?? 'website') }, [])
  // Server errors after submit: open the step that holds the first one.
  useEffect(() => {
    const keys = Object.keys(state.errors)
    if (keys.length) { setLocal({}); setStep(Math.min(...keys.map(stepOf))); setAttempt(a => a + 1) }
    else if (state.message) feedback.current?.focus()
  }, [state])
  useEffect(() => {
    if (!attempt) return
    const firstError = [...(form.current?.querySelectorAll('[role=alert]') ?? [])].find(el => !el.closest('[hidden]'))
    const field = firstError?.closest('label, fieldset')?.querySelector<HTMLElement>('input:not([type=hidden]), select')
    if (field) { field.focus(); field.scrollIntoView({ block: 'center', behavior: 'smooth' }) } else firstError?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [attempt])
  useEffect(() => { if (moved.current) { heading.current?.focus(); heading.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }) } }, [step])

  /** Checks only the current step's required answers, so 다음 always says what is missing. */
  function stepErrors() {
    if (!form.current) return {}
    const all = validateInterest(new FormData(form.current)).errors
    return Object.fromEntries(Object.entries(all).filter(([key]) => STEPS[step]?.fields.includes(key) && key !== 'form'))
  }
  function check() {
    const found = stepErrors()
    setLocal(found)
    if (Object.keys(found).length) { setAttempt(a => a + 1); return false }
    return true
  }
  const clear = (key: string) => setLocal(current => without(current, key))

  const error = (name: string) => errors[name] && <p id={`${name}-error`} role="alert" className={s.error}>{errors[name]}</p>
  /** `follow` renders right under a choice while it is selected (e.g. the owner's region under 다른 시·군). */
  const group = (name: string, label: string, choices: readonly string[], follow: Record<string, ReactNode> = {}) => <fieldset><legend>{label} (필수)</legend>{choices.map(choice => <div key={choice}><label className={s.option}><input type="radio" name={name} value={choice} checked={values[name] === choice} onChange={() => { setValues(v => ({...v,[name]:choice})); clear(name) }} required aria-describedby={errors[name] ? `${name}-error` : undefined}/>{choice}</label>{values[name] === choice && follow[choice] && <div className={s.follow}>{follow[choice]}</div>}</div>)}{error(name)}</fieldset>
  const optionalGroup = (name: string, label: string, choices: readonly string[]) => <fieldset><legend>{label} (선택)</legend>{choices.map(choice => <label key={choice} className={s.option}><input type="radio" name={name} value={choice} checked={values[name] === choice} onChange={() => setValues(v => ({...v,[name]:choice}))}/>{choice}</label>)}</fieldset>
  if (state.ok) return <div ref={feedback} tabIndex={-1} role="status" className={s.success}><h2>의견이 잘 전달됐어요</h2><p>{state.message}</p><p>서비스는 포항·경주부터 준비하고 있어요. 다른 지역은 의견을 모으는 단계이며 제공 일정은 정해지지 않았어요.</p><Link href="/">홈으로 돌아가기</Link></div>
  const last = step === STEPS.length - 1
  return <form ref={form} noValidate onSubmit={event => {
    event.preventDefault(); if (pending || !check()) return
    if (!last) { moved.current = true; setStep(current => current + 1); return }
    const data = new FormData(event.currentTarget); startTransition(() => action(data))
  }} className={s.form}>
    <ol className={s.steps} aria-label="설문 단계">{STEPS.map((item, i) => <li key={item.label} aria-current={step === i ? 'step' : undefined} data-complete={step > i}><span>{step > i ? '✓' : i + 1}</span>{item.label}</li>)}</ol>
    <h2 ref={heading} tabIndex={-1} className={s.stepTitle}><small>{step + 1} / {STEPS.length}</small>{STEPS[step]?.title}</h2>
    <input type="hidden" name="requestId" value={requestId}/><input type="hidden" name="source" value={source}/>
    <div hidden aria-hidden="true"><label>웹사이트<input name="website" tabIndex={-1} autoComplete="off"/></label></div>

    <div hidden={step !== 0} className={s.stepBody} onChange={() => { clear('region'); clear('ownerRegion') }}>
      <RegionSelect prefix="region" legend="빈집이 있는 곳" error={error('region')} errorId="region-error"/>
      <label>대략적인 위치 (선택)<input value={values.location ?? ''} onChange={e => setValues(v => ({...v,location:e.target.value}))} name="location" maxLength={200} placeholder="예: 호미곶면 강사리"/>{error('location')}</label>
      {group('residence', '소유주께서는 어디에 살고 계세요?', RESIDENCES, {[OTHER_REGION_RESIDENCE]: <RegionSelect prefix="owner" legend="어느 시·군에 사세요?" error={error('ownerRegion')} errorId="ownerRegion-error"/>})}
    </div>

    <div hidden={step !== 1} className={s.stepBody}>
      {group('intent', '지금은 어떤 방향을 고민하세요?', INTENTS)}
      {optionalGroup('inheritance', '상속 정리는 어디까지 됐나요?', INHERITANCE)}
      {optionalGroup('lastVisit', '마지막으로 집에 가 보신 건 언제예요?', LAST_VISITS)}
      <fieldset><legend>어떤 도움이 필요한가요? (선택·복수 선택)</legend>{SERVICES.map(v => <label key={v} className={s.option}><input type="checkbox" name="services" value={v} checked={checks[v] ?? false} onChange={e => setChecks(c => ({...c,[v]:e.target.checked}))}/>{v}</label>)}{error('services')}</fieldset>
    </div>

    <div hidden={step !== 2} className={s.stepBody}>
      <aside className={s.notice}><strong>아래는 가격을 알아보기 위한 질문이에요.</strong><p>월 1회 방문해 집 바깥 상태를 살피고 사진과 메모를 보내드리는 서비스를 가정했어요. 수리·제초 작업비와 긴급 출동은 별도이며, 구조 안전 진단은 포함하지 않아요.</p><p>방문 범위·요금·제공 지역은 아직 확정되지 않았어요.</p></aside>
      {optionalGroup('currentSpend', '지금 이 집을 챙기는 데 한 달에 얼마쯤 드나요? 교통비·제초비·이웃께 드리는 사례까지 생각해 주세요.', CURRENT_SPENDS)}
      {group('budget', '이런 관리에 한 달 최대 얼마까지 생각하세요?', BUDGETS)}
    </div>

    <div hidden={step !== 3} className={s.stepBody}>
      <label>연락받을 전화번호 (필수)<span id="contact-hint" className={s.fieldHint}>숫자만 적어도 돼요. 남겨 주신 의견에 대한 연락에 써요.</span><input value={values.contact ?? ''} onChange={e => { setValues(v => ({...v,contact:e.target.value})); clear('contact') }} name="contact" type="tel" inputMode="tel" autoComplete="tel" required maxLength={20} placeholder="예: 010-1234-5678" aria-invalid={errors.contact ? true : undefined} aria-describedby={errors.contact ? 'contact-hint contact-error' : 'contact-hint'}/>{error('contact')}</label>
      <label>이메일 (선택)<input value={values.email ?? ''} onChange={e => { setValues(v => ({...v,email:e.target.value})); clear('email') }} name="email" type="email" autoComplete="email" maxLength={254} placeholder="예: name@example.com" aria-invalid={errors.email ? true : undefined}/>{error('email')}</label>
      <label className={s.option}><input type="checkbox" name="phoneExplanation" checked={checks.phoneExplanation ?? false} onChange={e => setChecks(c => ({...c,phoneExplanation:e.target.checked}))}/>전화로 설명을 듣고 싶어요 (선택)</label>
      <div className={s.notice}><strong>인터뷰나 시범 방문에 참여해 주실 수 있나요?</strong><p>인터뷰는 20분 정도 전화로 집 이야기와 지금 겪는 어려움을 여쭤봐요. 인터뷰를 마친 분께는 모바일 상품권을 드려요. 시범 방문은 포항·경주에 빈집이 있는 분 중 일부와 해요. 인원이 정해져 있어서 담당자가 연락드린 분과만 진행해요. 통화 녹음은 그때 따로 여쭤보고, 동의하신 경우에만 해요. 체크하셔도 인터뷰·방문이 정해지는 것은 아니에요.</p><label className={s.option}><input type="checkbox" name="interviewOk" checked={checks.interviewOk ?? false} onChange={e => setChecks(c => ({...c,interviewOk:e.target.checked}))}/>인터뷰·시범 방문 연락을 받아도 괜찮아요 (선택)</label></div>
      <div className={s.notice}><strong>개인정보 수집·이용 및 신청 관련 연락 동의</strong><p>전화번호, 빈집 소재 시·군, 거주 지역 구분(다른 시·군에 사시면 그 시·군), 고민하는 방향, 가격 응답과 선택 입력한 위치·상속 정리 상태·마지막 방문 시기·현재 관리 비용·관리 항목·이메일·전화 설명 선호·인터뷰·시범 방문 참여 의향을 수요 파악과 이번 신청에 대한 연락에 사용해요. 인터뷰를 마치시면 감사 선물 발송에도 전화번호를 사용해요. 유입 경로도 함께 저장해요. 모은 응답은 개인을 알아볼 수 없는 통계로 만들어 서비스 설계와 사업계획에 써요.</p><p>접수일부터 최대 6개월 보관하고, 그 전에 삭제를 요청하실 수 있어요. 응답을 중개·관리업체가 영업에 쓰도록 넘기지 않고, 광고 연락에도 쓰지 않아요. 저장·사이트 운영과 감사 선물 발송은 처리방침에 적은 업체에 맡겨요. 동의하지 않으실 수 있지만, 그 경우 의견을 접수할 수 없어요.</p><Link href="/privacy">개인정보 처리방침 보기</Link></div>
      <fieldset><label className={s.option}><input type="checkbox" name="agree" checked={checks.agree ?? false} onChange={e => { setChecks(c => ({...c,agree:e.target.checked})); clear('agree') }} required aria-describedby={errors.agree ? 'agree-error' : undefined}/>위 내용에 동의하고 담당자의 연락을 요청합니다. (필수)</label>{error('agree')}</fieldset>
      <div className={s.notice}><strong>개인정보 국외 이전 동의</strong><p>응답은 해외 업체의 서버에 저장·처리돼요. 제출할 때 암호화된 통신으로 보내요. Supabase Pte. Ltd.(일본 도쿄): 응답 저장, 접수일부터 최대 6개월. Vercel Inc.(대한민국 서울·미국): 사이트 운영과 응답 처리. 동의하지 않으셔도 010-7428-2624로 전화 주시면 온라인에 저장하지 않고 의견을 들어요. 업체 연락처는 처리방침에서 볼 수 있어요.</p></div>
      <fieldset><label className={s.option}><input type="checkbox" name="overseasAgree" checked={checks.overseasAgree ?? false} onChange={e => { setChecks(c => ({...c,overseasAgree:e.target.checked})); clear('overseasAgree') }} required aria-describedby={errors.overseasAgree ? 'overseasAgree-error' : undefined}/>개인정보 국외 이전에 동의합니다. (필수)</label>{error('overseasAgree')}</fieldset>
    </div>

    <div className={s.stepNav}>
      {step > 0 && <button type="button" className={s.secondary} disabled={pending} onClick={() => { moved.current = true; setLocal({}); setStep(current => current - 1) }}>이전</button>}
      <button disabled={pending || !requestId} type="submit">{last ? (pending ? '접수 중…' : '의견 보내고 연락 요청하기') : '다음 →'}</button>
    </div>
    <div ref={feedback} tabIndex={-1} role="status">{state.message && <p className={s.error}>{state.message}</p>}{error('form')}</div>
  </form>
}
