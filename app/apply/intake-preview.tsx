'use client'

import { useEffect, useRef, useState } from 'react'
import { useInstantFlow } from '../instant-flow'
import styles from './intake-preview.module.css'
import { intakeScreens, toggleGoal, type IntakeGoal } from '../../src/intake-flow'

const GOALS: { value: IntakeGoal; title: string; text: string }[] = [
  { value: 'sell', title: '매매', text: '팔 수 있을지, 얼마에 팔릴지' },
  { value: 'demolish', title: '철거', text: '철거 비용과 지원 조건' },
  { value: 'repair', title: '수리', text: '고쳐 쓸 수 있을지, 수리 비용' },
  { value: 'all', title: '전체 비교', text: '아직 모르겠어요. 함께 비교할게요' },
]
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
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState<{ name: string; url: string }[]>([])
  const photoRef = useRef(photos)
  const heading = useRef<HTMLHeadingElement>(null)
  const didNavigate = useRef(false)
  const screens = intakeScreens(goals)
  const index = screens.indexOf(screen)
  const phase = submitted ? 4 : review ? 3 : screen === 'house' ? 0 : screen === 'contact' ? 2 : 1
  const set = (key: string, value: string) => setAnswers(current => ({ ...current, [key]: value }))
  useEffect(() => { photoRef.current = photos }, [photos])
  useEffect(() => () => photoRef.current.forEach(photo => URL.revokeObjectURL(photo.url)), [])
  useEffect(() => {
    if (didNavigate.current) heading.current?.focus()
  }, [screen, review, submitted])
  function move(next: string | undefined) {
    if (!next) return
    didNavigate.current = true; setError(''); setScreen(next)
  }
  function next() {
    if (screen === 'house' && !answers.address?.trim()) { setError('빈집 주소를 입력해 주세요.'); return }
    if (screen === 'goals' && !goals.length) { setError('궁금한 내용을 선택하거나 전체 비교를 선택해 주세요.'); return }
    if (screen === 'contact') {
      if (!/^0\d{8,10}$/.test((answers.phone || '').replace(/[\s-]/g, ''))) { setError('연락받을 휴대폰 번호를 확인해 주세요.'); return }
      if (answers.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email)) { setError('이메일 주소를 확인해 주세요.'); return }
      didNavigate.current = true; setError(''); setReview(true); return
    }
    move(screens[index + 1])
  }
  function choices(key: string, title: string, options: string[]) {
    return <fieldset className={styles.question}><legend>{title}</legend><div className={styles.options}>
      {options.map(option => <label className={styles.option} key={option}>
        <input type="radio" name={key} checked={answers[key] === option} onChange={() => set(key, option)} />{option}
      </label>)}
    </div></fieldset>
  }
  const selected = (goal: IntakeGoal) => goals.includes('all') || goals.includes(goal)
  const rows = [
    ['빈집 주소', answers.address], ['최근 집 상태', answers.condition || '확인 필요'],
    ['궁금한 내용', GOALS.filter(goal => goals.includes(goal.value)).map(goal => goal.title).join(' · ')],
    ...(selected('demolish') ? [['집 안의 짐', answers.belongings || '확인 필요'], ['차량 접근', answers.access || '확인 필요']] : []),
    ...(selected('repair') ? [['수리할 곳', damage.join(' · ') || '확인 필요'], ['수리 후 용도', answers.use || '미정']] : []),
    ['소유관계', answers.ownership || '확인 필요'],
    ...(answers.ownership === '공동 소유' || answers.ownership === '상속 정리 중' ? [['가족·공동 소유자 협의', answers.agreement || '확인 필요']] : []),
    ...(selected('sell') ? [['매매 시기', answers.timing || '미정']] : []),
    ['현장 방문 상담', answers.visit === 'yes' ? '희망해요' : '선택하지 않음'],
    ['휴대폰 번호', answers.phone], ...(answers.email ? [['이메일', answers.email]] : []),
  ]

  return <form className={styles.form} onSubmit={event => {
    event.preventDefault()
    if (submitted) return
    if (review) { didNavigate.current = true; setSubmitted(true) }
    else next()
  }}>
    <ol className={styles.steps} aria-label="진단 신청 단계">
      {['집 상태', '궁금한 내용', '연락처', '확인·제출'].map((label, i) => <li key={label} aria-current={phase === i ? 'step' : undefined} data-complete={phase > i}><span>{phase > i ? '✓' : i + 1}</span>{label}</li>)}
    </ol>
    <div className={styles.card}>
      <header className={styles.heading}>
        <p>{submitted ? '작성 완료' : review ? '4단계 · 확인·제출' : `${phase + 1}단계${phase === 1 ? ` · ${index} / ${screens.length - 2}` : ''}`}</p>
        <h2 ref={heading} tabIndex={-1}>{submitted ? '신청서 작성이 완료됐어요' : review ? '제출 전에 내용을 확인해 주세요' : TITLES[screen]}</h2>
        {!review && <p>{screen === 'goals' ? '여러 개 골라도 괜찮아요.' : screen === 'contact' ? '휴대폰 번호는 필수, 이메일은 선택이에요.' : '아는 만큼 답해 주세요. 모르는 부분은 확인이 필요한 항목으로 남겨요.'}</p>}
      </header>

      {submitted ? <a className={styles.secondary} href="/">홈으로</a> : review ? <>
        <dl className={styles.summary}>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}<div><dt>첨부 사진</dt><dd>{photos.length}장</dd></div></dl>
        <button className={styles.edit} type="button" onClick={() => { setReview(false); move('house') }}>입력 내용 수정하기</button>
        <div className={styles.navigation}>
          <button className={styles.secondary} type="button" onClick={() => { setReview(false); move('contact') }}>이전</button>
          <button className={styles.primary} type="submit">제출하기<span aria-hidden="true"> →</span></button>
        </div>
      </> : <>
      {screen === 'house' && <>
        <label className={styles.question}>빈집 주소 <span className={styles.optional}>필수</span><input className={styles.input} value={answers.address} onChange={e => set('address', e.target.value)} placeholder="빈집의 도로명 또는 지번 주소" autoComplete="street-address" /></label>
        {choices('condition', '최근에 본 집 상태는 어떤가요?', ['큰 이상은 없어 보여요', '수리가 필요한 곳이 있어요', '최근 상태를 몰라요'])}
        <fieldset className={styles.question}><legend>집 사진 <span className={styles.optional}>선택</span></legend>
          <label className={styles.upload}>＋ 사진 추가하기 <span>{photos.length} / 6</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple aria-label="집 사진 추가" onChange={e => {
            const files = Array.from(e.target.files || []); e.target.value = ''
            if (photos.length + files.length > 6) { setError('사진은 최대 6장까지 선택해 주세요.'); return }
            if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024)) { setError('20MB 이하 JPG·PNG·WebP 사진을 선택해 주세요.'); return }
            setError(''); setPhotos(current => [...current, ...files.map(file => ({ name: file.name, url: URL.createObjectURL(file) }))])
          }} /></label>
          {photos.length > 0 && <ul className={styles.photos}>{photos.map((photo, i) => <li key={photo.url}>
            {/* Local previews stay in this browser and are never uploaded. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={`집 사진 ${i + 1}`} /><button type="button" aria-label={`사진 ${i + 1} 삭제`} onClick={() => { URL.revokeObjectURL(photo.url); setPhotos(current => current.filter(item => item.url !== photo.url)) }}>삭제</button>
          </li>)}</ul>}
        </fieldset>
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
        <fieldset className={styles.question}><legend>누수나 파손이 있는 곳을 골라 주세요 <span className={styles.optional}>복수 선택</span></legend><div className={styles.options}>{['지붕', '천장·실내 벽', '외벽', '창문·출입문', '잘 모르겠어요'].map(option => <label key={option} className={styles.option}><input type="checkbox" checked={damage.includes(option)} onChange={() => setDamage(current => current.includes(option) ? current.filter(item => item !== option) : option === '잘 모르겠어요' ? [option] : [...current.filter(item => item !== '잘 모르겠어요'), option])} />{option}</label>)}</div></fieldset>
        {choices('use', '고친 뒤 어떻게 쓰고 싶으세요?', ['직접 사용', '임대', '아직 미정'])}
      </>}
      {screen === 'ownership' && <>
        {choices('ownership', '현재 소유관계는 어떻게 되나요?', ['단독 소유', '공동 소유', '상속 정리 중', '잘 모르겠어요'])}
        {(answers.ownership === '공동 소유' || answers.ownership === '상속 정리 중') && choices('agreement', '다른 소유자·가족과 방향을 이야기했나요?', ['이야기를 나눴어요', '아직 이야기 전이에요', '잘 모르겠어요'])}
        {selected('sell') && choices('timing', '매매 시기를 생각해 두셨나요?', ['가능한 빨리', '서두르지 않아도 돼요', '가격부터 알고 싶어요'])}
      </>}
      {screen === 'contact' && <>
        <label className={styles.question}>휴대폰 번호 <span className={styles.optional}>필수</span><input className={styles.input} type="tel" autoComplete="tel" value={answers.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="010-0000-0000" /></label>
        <label className={styles.question}>이메일 <span className={styles.optional}>선택</span><input className={styles.input} type="email" autoComplete="email" value={answers.email || ''} onChange={e => set('email', e.target.value)} placeholder="name@example.com" /></label>
        <div><label className={styles.option}><input type="checkbox" checked={answers.visit === 'yes'} onChange={e => set('visit', e.target.checked ? 'yes' : '')} />멀리 있어서 현장 방문 상담을 받고 싶어요</label>{answers.visit === 'yes' && <p className={styles.nextHint}>지역과 확인 범위에 따라 비용이 발생할 수 있으며, 방문 전 안내해 드려요.</p>}</div>
      </>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.navigation}>{index > 0 && <button className={styles.secondary} type="button" onClick={() => move(screens[index - 1])}>이전</button>}<button className={styles.primary} type="submit">{screen === 'contact' ? '입력 내용 확인하기' : '다음'}<span aria-hidden="true"> →</span></button></div>
      </>}
    </div>
  </form>
}
