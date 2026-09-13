'use client'

import { useRef, useState, type FormEvent } from 'react'
import { EXAMPLE_CASE } from '../../src/example-report-data'
import { EXAMPLE_PROGRESS_STAGES, progressSnapshot } from '../../src/example-demolition'
import reading from './easy/easy-report.module.css'
import styles from './journey.module.css'

export function ExampleJourney() {
  const [requested, setRequested] = useState(false)
  const [channel, setChannel] = useState('전화 상담')
  const [time, setTime] = useState('오후 2시~5시')
  const [note, setNote] = useState('담보가 있는 집의 철거 절차와 지원 조건을 확인하고, 현장 견적을 함께 받고 싶어요.')
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const progressTitle = useRef<HTMLHeadingElement>(null)
  const view = progressSnapshot(previewIndex ?? (requested ? 0 : null))
  const showProgress = () => requestAnimationFrame(() => {
    progressTitle.current?.scrollIntoView({ block: 'start', behavior: 'auto' })
    progressTitle.current?.focus({ preventScroll: true })
  })
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setRequested(true)
    setPreviewIndex(null)
    showProgress()
  }

  return <>
    <section id="consultation" className={reading.section} aria-labelledby="consultation-title">
      <p className={reading.chapter}>03 · 철거 준비 맡기기</p>
      <h2 id="consultation-title">이 집의 철거 준비,<br />함께 시작할까요?</h2>
      <p className={reading.lead}>준비한 자료를 바탕으로 상담부터 현장 견적, 일정과 완료자료까지 연결해 드려요.</p>
      <div className={styles.serviceScope}><h3>빈집진단서가 함께할 일</h3><ul><li>서류·지원 조건과 다음 순서 정리</li><li>협력사 현장 방문과 견적 범위 비교</li><li>공사 일정·변경사항·완료자료 안내</li></ul><p>공사 계약 전, 진행지원 수수료와 맡길 업무 범위를 함께 확인해요.</p></div>
      {!requested ? <form className={styles.consultationForm} onSubmit={submit}>
        <div className={styles.requestProperty}><span>상담할 집</span><strong>{EXAMPLE_CASE.shortAddress}</strong><p>등기부·건축물대장과 이 진단서가 함께 전달돼요.</p></div>
        <fieldset className={styles.channel}><legend>어떻게 상담받고 싶으세요?</legend>{['전화 상담', '온라인 상담'].map(value => <label key={value}><input type="radio" name="consultation-channel" value={value} checked={channel === value} onChange={() => setChannel(value)} />{value}</label>)}</fieldset>
        <div className={styles.field}><label htmlFor="consultation-time">편한 상담 시간</label><select id="consultation-time" value={time} onChange={event => setTime(event.target.value)}><option>오전 9시~12시</option><option>오후 2시~5시</option><option>시간 상관없음</option></select></div>
        <div className={styles.field}><label htmlFor="consultation-note">함께 확인하고 싶은 내용</label><textarea id="consultation-note" rows={3} value={note} onChange={event => setNote(event.target.value)} maxLength={500} /></div>
        <button className={reading.primary} type="submit">철거 준비 상담하기 <span aria-hidden="true">→</span></button>
        <p className={reading.small}>상담에서 범위와 비용을 확인한 뒤 진행 여부를 정해요.</p>
      </form> : <div className={styles.receipt} role="status">
        <span className={styles.badge}>상담 접수 완료</span><h3>준비한 자료와 상담 요청을 모았어요.</h3>
        <p>{EXAMPLE_CASE.shortAddress} · {channel} · {time}</p>
        <details className={reading.disclosure}><summary>내가 요청한 내용<span className={reading.plus} aria-hidden="true" /></summary><div className={reading.detailBody}><p className={styles.userNote}>{note || '상담에서 함께 이야기할게요.'}</p><p>함께 준비한 자료: 등기부, 건축물대장, 철거 예산 내역</p></div></details>
        <button className={reading.primary} type="button" onClick={showProgress}>내 진행 상황 보기 <span aria-hidden="true">↓</span></button>
        <button className={styles.textButton} type="button" onClick={() => { setRequested(false); setPreviewIndex(null) }}>상담 내용 다시 입력하기</button>
      </div>}
    </section>

    <section id="progress" className={reading.section} aria-labelledby="progress-title">
      <p className={reading.chapter}>04 · 진행 상황 확인</p>
      <h2 id="progress-title" ref={progressTitle} tabIndex={-1}>어디까지 진행됐는지,<br />여기서 확인하세요.</h2>
      <p className={reading.lead}>담당자가 하는 일과 다음 일정, 내가 준비할 자료를 한눈에 볼 수 있어요.</p>
      {view.stage ? <>
        <div className={styles.previewControl}><label htmlFor="progress-view">다른 단계 화면 보기</label><select id="progress-view" value={view.active!} onChange={event => setPreviewIndex(Number(event.target.value))}>{EXAMPLE_PROGRESS_STAGES.map((stage, index) => <option key={stage.id} value={index}>{index + 1}. {stage.label}</option>)}</select></div>
        <div className={styles.progressCard} aria-live="polite" aria-atomic="true">
          <div className={styles.statusLine}><span className={styles.badge}>{view.active === EXAMPLE_PROGRESS_STAGES.length - 1 ? '모든 단계 완료' : view.stage.label + ' 단계'}</span><span>{view.completed} / {EXAMPLE_PROGRESS_STAGES.length}단계 완료</span></div>
          <h3>{view.stage.title}</h3><p>{view.stage.description}</p>
          <dl className={styles.schedule}><div><dt>담당</dt><dd>{view.stage.manager}</dd></div><div><dt>주요 일정</dt><dd>{view.stage.date}</dd></div><div><dt>다음 안내</dt><dd>{view.stage.next}</dd></div></dl>
          <div className={styles.ownerTask}><strong>지금 내가 할 일</strong><p>{view.stage.ownerTask}</p></div>
        </div>
      </> : <div className={styles.beforeStart}><h3>상담을 시작하면 내 진행 현황이 생겨요.</h3><p>서류 확인부터 철거 마무리까지, 아래 순서로 함께 진행해요.</p><button className={styles.secondary} type="button" onClick={() => { setPreviewIndex(2); showProgress() }}>진행 화면 먼저 둘러보기 <span aria-hidden="true">→</span></button></div>}
      <ol className={styles.timeline} aria-label="철거 진행 단계">{EXAMPLE_PROGRESS_STAGES.map((stage, index) => <li key={stage.id} data-state={view.statuses[index]} aria-current={view.statuses[index] === '진행 중' ? 'step' : undefined}><span className={styles.stageNumber} aria-hidden="true">{view.statuses[index] === '완료' ? '✓' : index + 1}</span><span className={styles.stageLabel}>{stage.label}</span><span className={styles.stageState}>{view.statuses[index]}</span></li>)}</ol>
      {view.stage && <div className={styles.progressDetails}>
        <div><h3>담당자가 진행할 일</h3><ul>{view.stage.work.map(work => <li key={work}>{work}</li>)}</ul></div>
        <div><h3>자료 정리 현황</h3><dl>{view.stage.records.map(record => <div key={record.name}><dt>{record.name}</dt><dd>{record.state}</dd></div>)}</dl></div>
      </div>}
      <p className={reading.small}>일정이나 비용이 달라지는 일은 사유와 함께 안내하고, 필요한 동의를 받은 뒤 진행해요.</p>
    </section>
  </>
}
