'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DECISIONS, DECISION_ACTIONS, type Decision } from '../../src/decision-actions'
import { guidanceOnly, instantOverview, parseInstantInput, type InstantInput, type InstantResult } from '../../src/instant-report'
import { lookupInstantReport } from './actions'
import { useInstantFlow } from '../instant-flow'
import { HomeFooter, HomeHeader, HomeLink } from '../home-ui'
import { ReportOverview } from '../report/report-overview'
import home from '../home.module.css'
import styles from './instant.module.css'

export function InstantDiagnosis() {
  const { draft, setDraft, result, setResult } = useInstantFlow()
  const [address, setAddress] = useState(draft?.address ?? '')
  const [decision, setDecision] = useState<Decision>(draft?.decision ?? 'undecided')
  const [pending, setPending] = useState(false)
  const started = useRef(false)
  const requestId = useRef(0)
  const mounted = useRef(false)
  const heading = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; requestId.current++; started.current = false } }, [])
  const lookup = useCallback(async (input: InstantInput) => {
    const id = ++requestId.current
    setPending(true)
    setDraft({ address: input.address, decision: input.decision })
    let next: InstantResult
    try { next = await lookupInstantReport(input) }
    catch { next = { kind: 'unavailable', message: '조회 결과를 받지 못했어요. 연결을 확인하고 다시 시도해 주세요.' } }
    if (!mounted.current || id !== requestId.current) return
    setResult(next)
    setPending(false)
  }, [setDraft, setResult])

  useEffect(() => {
    if (draft && !result && !started.current) {
      started.current = true
      void lookup(draft)
    }
  }, [draft, result, lookup])

  useEffect(() => {
    if (result?.kind === 'report' || result?.kind === 'confirm') {
      heading.current?.querySelector<HTMLElement>('h1, h2')?.focus({ preventScroll: true })
      heading.current?.scrollIntoView({ block: 'start' })
    }
  }, [result?.kind])

  const edit = () => {
    setAddress(draft?.address ?? address)
    setDecision(draft?.decision ?? decision)
    setResult(null)
    started.current = true
    window.scrollTo({ top: 0 })
  }
  if (result?.kind === 'report') {
    const report = result.report
    const known = report.records.filter(record => record.status === 'known').length
    const activeDecision = draft?.decision ?? report.decision
    const selected = DECISIONS.find(item => item.id === activeDecision)!
    const firstAction = DECISION_ACTIONS[activeDecision][0]!
    const review = () => {
      setDraft({ address: report.address, decision: draft?.decision ?? report.decision })
      router.push('/apply')
    }
    return <div ref={heading}>
      <ReportOverview {...instantOverview(report)}
        initialDecision={activeDecision}
        onDecisionChange={next => setDraft({ address: report.address, decision: next })}
        introNotice={<div className={styles.notice}><strong>{report.addressVerified ? '1차 진단서' : '자료 조회 미완료'}</strong><p>{report.addressVerified ? '조회된 공적 기록과 선택한 고민을 정리했어요. 현장·권리·가격은 추가 확인이 필요해요.' : '공적 기록을 확인하지 못해, 입력한 고민에 따른 확인 순서만 보여드려요.'}</p><button type="button" onClick={edit}>주소 수정·다시 조회</button><span>이 화면은 저장되지 않아요. 새로고침하면 주소를 다시 입력해야 해요.</span></div>}
        summary={<section className={styles.summary} aria-labelledby="instant-summary-title"><p className={styles.kicker}>지금 확인한 내용</p><h2 id="instant-summary-title">{known ? `공적 기록 ${known}개 항목을 확인했어요.` : '먼저 확인할 순서를 정리했어요.'}</h2><p>{known ? '공적 기록은 실제 현장과 다를 수 있어요. 아래에서 항목별 출처와 미확인 내용을 살펴보세요.' : '기록이 없거나 조회되지 않은 부분을 안전·거래 가능으로 판단하지 않아요.'}</p><div className={styles.next}><span>선택한 고민 · {selected.label}</span><strong>{firstAction.title}</strong><p>{firstAction.detail}</p></div><div className={styles.links}><a href="#property">조회 기록·근거 보기 ↓</a><a href="#next-actions">다음 할 일 3가지 보기 ↓</a></div></section>}
        followUp={<section className={styles.followUp} aria-labelledby="follow-up-title"><h2 id="follow-up-title">사진이나 더 아는 내용이 있나요?</h2><p>사진·집 상태를 보내 추가 확인을 신청할 수 있어요. 이 단계에서 연락처와 이메일을 받아요. 접수 후 확인 가능한 범위와 일정을 안내해 드려요.</p><button type="button" onClick={review}>사진·추가 정보 보내기 →</button><p className={styles.caption}>사진만으로 안전성·석면·실제 공사비를 확정하지 않아요.</p></section>}
      />
    </div>
  }

  const current = { address: address.trim(), decision }
  const canGuide = result && ['unavailable', 'not_found', 'busy'].includes(result.kind)
  return <div className={home.site}><div className={home.sheet}><HomeHeader /><main className={styles.intake}>
    <HomeLink /><p className={styles.kicker}>주소 확인 → 1차 진단서</p><h1>내 집의 기록과<br />다음 할 일을 바로 봐요.</h1><p className={styles.intro}>먼저 조회된 주소가 맞는지 확인해 주세요. 전화번호나 이메일은 필요 없어요.</p>
    <form className={styles.form} onSubmit={event => { event.preventDefault(); void lookup(current) }}>
      <label htmlFor="instant-address">확인할 빈집 주소</label><input id="instant-address" name="address" required minLength={3} maxLength={300} autoComplete="street-address" placeholder="시·군·구와 도로명·건물번호 또는 지번" value={address} disabled={pending} onChange={event => { setAddress(event.target.value); setResult(null) }} aria-describedby="instant-help" />
      <fieldset disabled={pending}><legend>지금 가장 고민하는 방향</legend><div className={styles.choices}>{DECISIONS.map(item => <label key={item.id}><input type="radio" name="decision" value={item.id} checked={decision === item.id} onChange={() => { setDecision(item.id); setResult(null) }} />{item.label}</label>)}</div></fieldset>
      <button className={home.primary} type="submit" disabled={pending}>{pending ? '자료 확인 중…' : '주소 확인하고 진단 시작하기'}</button>
      <p id="instant-help" className={styles.caption}>주소는 공적 자료 조회에 사용해요. 추가 확인 신청 전에는 신청 기록으로 저장하지 않아요. <Link href="/privacy">개인정보 안내</Link></p>
    </form>
    {pending && <div className={styles.progress} role="status" aria-live="polite"><strong>{result?.kind === 'confirm' ? '건물·토지 기록을 확인하고 있어요.' : '입력한 주소를 확인하고 있어요.'}</strong><p>자료가 조회되는 대로 결과를 보여드려요. 잠시만 기다려 주세요.</p></div>}
    {!pending && result?.kind === 'confirm' && <div ref={heading}><section className={styles.confirm} aria-labelledby="confirm-title"><p className={styles.kicker}>{result.similar ? '비슷한 주소를 찾았어요 · 반드시 확인해 주세요' : '조회된 주소를 확인해 주세요'}</p><h2 id="confirm-title" tabIndex={-1}>이 집이 맞나요?</h2><p className={styles.confirmAddress}>{result.address}</p>{result.roadAddress && <p>{result.roadAddress}</p>}<p>맞으면 이 주소의 공적 자료를 조회해요. 다른 집이면 위 주소를 고쳐 주세요.</p><button className={home.primary} type="button" onClick={() => void lookup({ ...current, confirmedPnu: result.pnu })}>이 주소로 1차 진단서 보기 →</button></section></div>}
    {!pending && result && result.kind !== 'confirm' && <div className={styles.problem} role="alert"><strong>{result.message}</strong>{canGuide && <button type="button" onClick={() => { const valid = parseInstantInput(current); if (valid) setResult({ kind: 'report', report: guidanceOnly(valid) }) }}>공적 기록 없이 확인 순서 먼저 보기 →</button>}</div>}
  </main><HomeFooter /></div></div>
}
