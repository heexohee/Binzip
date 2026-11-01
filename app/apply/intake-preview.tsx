'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useInstantFlow } from '../instant-flow'
import { submitApplication } from '../actions'
import { PhotoPicker } from '../photo-picker'
import styles from './intake-preview.module.css'
import { intakeScreens, toggleGoal, type IntakeGoal } from '../../src/intake-flow'

const PHONE = '010-7428-2624'

const GOALS: { value: IntakeGoal; title: string; text: string }[] = [
  { value: 'sell', title: '매매', text: '팔 수 있을지, 얼마에 팔릴지' },
  { value: 'demolish', title: '철거', text: '철거 비용과 지원 조건' },
  { value: 'repair', title: '수리', text: '고쳐 쓸 수 있을지, 수리 비용' },
  { value: 'all', title: '전체 비교', text: '아직 모르겠어요. 함께 비교할게요' },
]
/** Goal-specific screens say which choice they come from, so owners see why they are asked. */
const CATEGORY: Record<string, { tag: string; why: string }> = {
  ownership: { tag: '공통', why: '어떤 선택이든 먼저 확인하는 내용이에요.' },
  repair: { tag: '수리', why: '궁금한 내용에서 수리를 고르셔서 여쭤봐요.' },
  demolition: { tag: '철거', why: '궁금한 내용에서 철거를 고르셔서 여쭤봐요.' },
}
/** Questions that must be answered before 다음; each offers a "don't know" choice. */
const REQUIRED: Record<string, [string, string][]> = {
  house: [['condition', '최근에 본 집 상태']],
  ownership: [['ownership', '현재 소유관계'], ['agreement', '가족·공동 소유자와 이야기'], ['timing', '매매 시기']],
  repair: [['damage', '누수나 파손이 있는 곳'], ['use', '고친 뒤 쓰임새']],
  demolition: [['belongings', '집 안에 남은 짐'], ['access', '차량 진입']],
}
/** 을/를 by whether the last syllable has a final consonant. */
const objectParticle = (word: string) => { const code = word.charCodeAt(word.length - 1) - 0xac00; return code >= 0 && code <= 11171 && code % 28 ? '을' : '를' }
/** Picking one of these clears the specific spots, and the reverse. */
const DAMAGE_ONLY = ['없어요', '잘 모르겠어요']
const TITLES: Record<string, string> = {
  house: '집의 현재 상태를 알려주세요', goals: '어떤 내용이 궁금하신가요?',
  demolition: '철거 전에 확인할 게 있어요', repair: '어디를 고쳐야 할까요?',
  ownership: '집의 소유관계를 알려주세요', contact: '진단서를 받을 연락처를 남겨주세요',
}

export function IntakePreview({ initialAddress = '' }: { initialAddress?: string }) {
  const { draft, confirmedAddress } = useInstantFlow()
  const [answers, setAnswers] = useState<Record<string, string>>({ address: initialAddress || confirmedAddress?.address || draft?.address || '' })
  const [goals, setGoals] = useState<IntakeGoal[]>([])
  const [damage, setDamage] = useState<string[]>([])
  const [screen, setScreen] = useState('house')
  const [review, setReview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const [error, setError] = useState('')
  const errorRef = useRef<HTMLParagraphElement>(null)
  const honeypot = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [photoBusy, setPhotoBusy] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [photoAgreed, setPhotoAgreed] = useState(false)
  const [done, setDone] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const didNavigate = useRef(false)
  const screens = intakeScreens(goals)
  const index = screens.indexOf(screen)
  const phase = review ? 3 : screen === 'house' ? 0 : screen === 'contact' ? 2 : 1
  const set = (key: string, value: string) => setAnswers(current => ({ ...current, [key]: value }))
  useEffect(() => {
    if (didNavigate.current) heading.current?.focus()
  }, [screen, review, done])
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [error])
  function move(next: string | undefined) {
    if (!next) return
    didNavigate.current = true; setError(''); setScreen(next)
  }
  function next() {
    if (screen === 'house' && !answers.address?.trim()) { setError('빈집 주소를 입력해 주세요.'); return }
    if (screen === 'goals' && !goals.length) { setError('궁금한 내용을 선택하거나 전체 비교를 선택해 주세요.'); return }
    const missing = (REQUIRED[screen] ?? []).filter(([key]) => key === 'damage' ? !damage.length : !answers[key])
      .filter(([key]) => key !== 'agreement' || answers.ownership === '공동 소유' || answers.ownership === '상속 정리 중')
      .filter(([key]) => key !== 'timing' || selected('sell'))
    if (missing[0]) { setError(`‘${missing[0][1]}’${objectParticle(missing[0][1])} 골라 주세요. 아직 모르거나 정하지 않았다는 답도 괜찮아요.`); return }
    if (screen === 'contact') {
      if (!/^0\d{8,10}$/.test((answers.phone || '').replace(/[\s-]/g, ''))) { setError('연락받을 휴대폰 번호를 확인해 주세요.'); return }
      if (answers.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email)) { setError('이메일 주소를 확인해 주세요.'); return }
      if (photos.length && !photoAgreed) { setError('사진 이용에 동의하거나 첨부 사진을 삭제해 주세요.'); return }
      if (!agreed) { setError('개인정보 수집·이용에 동의해 주세요.'); return }
      didNavigate.current = true; setError(''); setReview(true); return
    }
    move(screens[index + 1])
  }
  function choices(key: string, title: string, options: string[], tag?: string) {
    return <fieldset className={styles.question}><legend>{tag && <span className={styles.tag}>{tag} 관련 질문</span>}{title} <span className={styles.optional}>필수</span></legend><div className={styles.options}>
      {options.map(option => <label className={styles.option} key={option}>
        <input type="radio" name={key} checked={answers[key] === option} onChange={() => set(key, option)} />{option}
      </label>)}
    </div></fieldset>
  }
  /** Sends the answers to the same server action the operator's admin list reads from. */
  async function submit() {
    submittingRef.current = true
    setSubmitting(true); setError('')
    const data = new FormData()
    const address = (answers.address ?? '').trim()
    data.set('address', address)
    if (confirmedAddress && (address === confirmedAddress.address || address === confirmedAddress.query)) {
      data.set('pnu', confirmedAddress.pnu); data.set('resolvedAddress', confirmedAddress.address); data.set('matchQuality', confirmedAddress.quality)
    }
    data.set('condition', rows.filter(([label]) => !['빈집 주소', '궁금한 내용', '소유관계', '인터뷰·시범 방문 연락', '휴대폰 번호', '이메일'].includes(String(label))).map(([label, value]) => `${label}: ${value}`).join('\n'))
    goals.forEach(goal => data.append('concern', GOALS.find(item => item.value === goal)?.title ?? goal))
    if (answers.ownership) data.set('ownership', answers.ownership)
    if (answers.visit === 'yes') data.set('speed', '인터뷰·시범 방문 연락을 받아도 괜찮아요')
    data.set('contact', answers.phone || ''); if (answers.email) data.set('email', answers.email)
    data.set('agree', 'on'); if (photoAgreed) data.set('photoAgree', 'on')
    photos.forEach(photo => data.append('photos', photo))
    data.set('website', honeypot.current?.value ?? '')
    try {
      const result = await submitApplication({ ok: false, errors: {}, message: null }, data)
      if (result.ok) { didNavigate.current = true; setDone(true); return }
      setError(result.message ?? Object.values(result.errors)[0] ?? '입력 내용을 다시 확인해 주세요.')
    } catch {
      setError(`접수 결과를 확인하지 못했어요. 잠시 후 다시 시도하거나 ${PHONE}로 연락 주세요.`)
    }
    submittingRef.current = false
    setSubmitting(false)
  }
  const selected = (goal: IntakeGoal) => goals.includes('all') || goals.includes(goal)
  const rows = [
    ['빈집 주소', answers.address], ['최근 집 상태', answers.condition || '확인 필요'],
    ['궁금한 내용', GOALS.filter(goal => goals.includes(goal.value)).map(goal => goal.title).join(' · ')],
    ['소유관계', answers.ownership || '확인 필요'],
    ...(answers.ownership === '공동 소유' || answers.ownership === '상속 정리 중' ? [['가족·공동 소유자 협의', answers.agreement || '확인 필요']] : []),
    ...(selected('sell') ? [['매매 시기', answers.timing || '미정']] : []),
    ...(selected('repair') ? [['수리할 곳', damage.join(' · ') || '확인 필요'], ['수리 후 용도', answers.use || '미정']] : []),
    ...(selected('demolish') ? [['집 안의 짐', answers.belongings || '확인 필요'], ['차량 접근', answers.access || '확인 필요']] : []),
    ['인터뷰·시범 방문 연락', answers.visit === 'yes' ? '받아도 괜찮아요' : '선택하지 않음'],
    ['휴대폰 번호', answers.phone], ...(answers.email ? [['이메일', answers.email]] : []),
  ]

  if (done) return <div className={styles.card} role="status">
    <header className={styles.heading}>
      <p>접수 완료</p>
      <h2 ref={heading} tabIndex={-1}>신청이 접수됐어요</h2>
    </header>
    <p className={styles.nextHint}>담당자가 신청 내용을 살펴보고, <strong>7일 안에</strong> 문자나 메일로 진행 여부를 알려드려요. 이메일을 남기셨다면 진단서는 메일로 보내드려요.</p>
    <p className={styles.nextHint}>연락이 없거나 급하면 전화 주세요 · <a href={`tel:${PHONE.replaceAll('-', '')}`}>{PHONE}</a></p>
    <div className={styles.navigation}>
      <Link className={styles.secondary} href="/">처음으로</Link>
      <Link className={styles.primary} href="/example-report">기다리는 동안 진단서 예시 보기<span aria-hidden="true"> →</span></Link>
    </div>
  </div>

  return <form className={styles.form} onSubmit={event => {
    event.preventDefault()
    if (submittingRef.current) return
    if (review) void submit()
    else next()
  }}>
    <div hidden aria-hidden="true"><label>웹사이트<input ref={honeypot} name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <ol className={styles.steps} aria-label="진단 신청 단계">
      {['집 상태', '궁금한 내용', '연락처', '확인·제출'].map((label, i) => <li key={label} aria-current={phase === i ? 'step' : undefined} data-complete={phase > i}><span>{phase > i ? '✓' : i + 1}</span>{label}</li>)}
    </ol>
    <div className={styles.card}>
      <header className={styles.heading}>
        <p>{review ? '4단계 · 확인·제출' : `${phase + 1}단계${phase === 1 && screen !== 'goals' ? ` · ${index - 1} / ${screens.length - 3}` : ''}`}</p>
        {!review && CATEGORY[screen] && <span className={styles.tag}>{CATEGORY[screen].tag === '공통' ? '공통 질문' : `${CATEGORY[screen].tag} 관련 질문`}</span>}
        <h2 ref={heading} tabIndex={-1}>{review ? '제출 전에 내용을 확인해 주세요' : TITLES[screen]}</h2>
        {!review && <p>{CATEGORY[screen] ? `${goals.includes('all') && screen !== 'ownership' ? `전체 비교를 고르셔서 ${CATEGORY[screen].tag}도 함께 여쭤봐요.` : CATEGORY[screen].why} 모르는 내용은 ‘잘 모르겠어요’나 ‘미정’을 골라 주세요.` : screen === 'goals' ? '여러 개 골라도 괜찮아요.' : screen === 'contact' ? '휴대폰 번호는 필수, 이메일은 선택이에요.' : '아는 만큼 답해 주세요. 모르는 부분은 확인이 필요한 항목으로 남겨요.'}</p>}
      </header>

      {review ? <>
        <dl className={styles.summary}>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}<div><dt>첨부 사진</dt><dd>{photos.length}장</dd></div></dl>
        <button className={styles.edit} type="button" disabled={submitting} onClick={() => { setReview(false); move('house') }}>입력 내용 수정하기</button>
        <p className={styles.nextHint}>제출하면 신청이 접수돼요. 담당자가 살펴보고 7일 안에 문자나 메일로 진행 여부를 알려드려요.</p>
        {submitting && <p role="status">신청을 보내고 있어요.</p>}
        {error && <p ref={errorRef} className={styles.error} role="alert">{error}</p>}
        <div className={styles.navigation}>
          <button className={styles.secondary} type="button" disabled={submitting} onClick={() => { setReview(false); move('contact') }}>이전</button>
          <button className={styles.primary} type="submit" disabled={submitting}>{submitting ? '접수 중…' : '신청 접수하기'}<span aria-hidden="true"> →</span></button>
        </div>
      </> : <>
      {screen === 'house' && <>
        <label className={styles.question}>빈집 주소 <span className={styles.optional}>필수</span><input className={styles.input} value={answers.address} onChange={e => set('address', e.target.value)} placeholder="빈집의 도로명 또는 지번 주소" autoComplete="street-address" /></label>
        {choices('condition', '최근에 본 집 상태는 어떤가요?', ['큰 이상은 없어 보여요', '수리가 필요한 곳이 있어요', '최근 상태를 몰라요'])}
        <PhotoPicker initial={photos} onChange={setPhotos} onBusyChange={setPhotoBusy} disabled={submitting} />
      </>}
      {screen === 'goals' && <>
        <fieldset className={styles.question}><legend className={styles.srOnly}>궁금한 내용 · 복수 선택</legend><div className={styles.goalGrid}>
          {GOALS.map(goal => <label className={styles.goal} key={goal.value}><input type="checkbox" checked={goals.includes(goal.value)} onChange={() => setGoals(current => toggleGoal(current, goal.value))} /><span><strong>{goal.title}</strong><small>{goal.text}</small></span></label>)}
        </div></fieldset>
        <p className={styles.nextHint}>{goals.length ? '선택한 내용에 필요한 질문만 이어서 확인할게요.' : '아직 방향을 정하지 않았다면 전체 비교를 골라 주세요.'}</p>
      </>}
      {screen === 'demolition' && <>
        {choices('belongings', '집 안에 남아 있는 짐이 있나요?', ['거의 없어요', '가구·생활용품이 남아 있어요', '잘 모르겠어요'])}
        {choices('access', '집 앞까지 차량이 들어갈 수 있나요?', ['트럭도 들어갈 수 있어요', '승용차 정도만 가능해요', '차량 진입이 어려워요', '잘 모르겠어요'])}
      </>}
      {screen === 'repair' && <>
        <fieldset className={styles.question}><legend>누수나 파손이 있는 곳을 골라 주세요 <span className={styles.optional}>필수 · 복수 선택</span></legend><div className={styles.options}>{['지붕', '천장·실내 벽', '외벽', '창문·출입문', '없어요', '잘 모르겠어요'].map(option => <label key={option} className={styles.option}><input type="checkbox" checked={damage.includes(option)} onChange={() => setDamage(current => current.includes(option) ? current.filter(item => item !== option) : DAMAGE_ONLY.includes(option) ? [option] : [...current.filter(item => !DAMAGE_ONLY.includes(item)), option])} />{option}</label>)}</div></fieldset>
        {choices('use', '고친 뒤 어떻게 쓰고 싶으세요?', ['직접 사용', '임대', '아직 미정'])}
      </>}
      {screen === 'ownership' && <>
        {choices('ownership', '현재 소유관계는 어떻게 되나요?', ['단독 소유', '공동 소유', '상속 정리 중', '잘 모르겠어요'])}
        {(answers.ownership === '공동 소유' || answers.ownership === '상속 정리 중') && choices('agreement', '다른 소유자·가족과 방향을 이야기했나요?', ['이야기를 나눴어요', '아직 이야기 전이에요', '잘 모르겠어요'])}
        {selected('sell') && choices('timing', '매매 시기를 생각해 두셨나요?', ['가능한 빨리', '서두르지 않아도 돼요', '가격부터 알고 싶어요'], '매매')}
      </>}
      {screen === 'contact' && <>
        <label className={styles.question}>연락받을 휴대폰 번호 <span className={styles.optional}>필수</span><span id="phone-hint" className={styles.fieldHint}>숫자만 적어도 돼요. 신청 내용 확인 연락에만 써요.</span><input className={styles.input} type="tel" inputMode="tel" autoComplete="tel" maxLength={20} aria-describedby="phone-hint" value={answers.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="예: 010-1234-5678" /></label>
        <label className={styles.question}>이메일 <span className={styles.optional}>선택</span><input className={styles.input} type="email" autoComplete="email" value={answers.email || ''} onChange={e => set('email', e.target.value)} placeholder="예: name@example.com" /></label>
        <div><label className={styles.option}><input type="checkbox" checked={answers.visit === 'yes'} onChange={e => set('visit', e.target.checked ? 'yes' : '')} />인터뷰·시범 방문 연락을 받아도 괜찮아요 (선택)</label><p className={styles.nextHint}>인터뷰는 20분 정도 전화로 여쭤보고, 참여해 주신 분께 소정의 감사 선물을 드려요. 시범 방문은 포항·경주에 빈집이 있는 분 중 몇 분과 무료로 진행해 드려요.</p></div>
        {photos.length > 0 && <label className={styles.option}><input type="checkbox" checked={photoAgreed} onChange={e => setPhotoAgreed(e.target.checked)} />첨부 사진을 담당자가 집 상태 확인과 진단서 작성에 쓰는 데 동의해요. 사진은 6개월 보관하고, 공개 진단서에 사진 자체를 올리지 않아요.</label>}
        <div><label className={styles.option}><input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />개인정보 수집·이용에 동의해요 (필수)</label>
          <p className={styles.nextHint}>주소·전화번호·이메일(선택)과 집에 대해 답해주신 내용, 인터뷰·시범 방문 참여 의향을 진단과 이번 신청에 대한 연락에만 써요. 인터뷰에 참여하시면 감사 선물 발송에도 전화번호를 써요. 신청일부터 6개월 뒤 지우고, 그 전에 말씀하시면 바로 지워요. 동의하지 않으면 신청이 접수되지 않아요. <Link className={styles.inlineLink} href="/privacy" target="_blank">개인정보 처리방침 보기</Link></p></div>
      </>}
      {error && <p ref={errorRef} className={styles.error} role="alert">{error}</p>}
      <div className={styles.navigation}>{index > 0 && <button className={styles.secondary} type="button" onClick={() => move(screens[index - 1])}>이전</button>}<button className={styles.primary} type="submit" disabled={photoBusy}>{screen === 'contact' ? '입력 내용 확인하기' : '다음'}<span aria-hidden="true"> →</span></button></div>
      </>}
    </div>
  </form>
}
