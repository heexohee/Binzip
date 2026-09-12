'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { DECISIONS, DECISION_ACTIONS, type Decision } from '../../src/decision-actions'
import { resourceById } from '../../src/official-resources'
import { CopyQuestion } from './report-tools'
import styles from './report.module.css'

export function DecisionActions({ attention = [], initialDecision = 'undecided', onDecisionChange }: { attention?: string[]; initialDecision?: Decision; onDecisionChange?: (decision: Decision) => void }) {
  const group = useId()
  const [decision, setDecision] = useState<Decision>(initialDecision)
  const selected = DECISIONS.find(item => item.id === decision)!
  return <section id="next-actions" className={styles.section} aria-labelledby="actions-title">
    <p className={styles.eyebrow}>02 · 내가 선택할 다음 행동</p><h2 id="actions-title">지금은 어느 쪽을 생각하고 있나요?</h2><p className={styles.intro}>고민하는 방향을 누르면 다음 할 일이 바뀌어요. 선택은 언제든 바꿀 수 있어요.</p>
    <fieldset className={styles.decisionPicker}><legend className="sr-only">현재 고민하는 방향</legend>{DECISIONS.map(item => <label key={item.id} className={decision === item.id ? styles.decisionSelected : undefined}><input type="radio" name={group} value={item.id} checked={decision === item.id} onChange={() => { setDecision(item.id); onDecisionChange?.(item.id) }} /><span>{item.label}</span></label>)}</fieldset>
    <p className={styles.decisionTitle} role="status">{selected.title}</p>
    {attention.length > 0 && <aside className={styles.actionPriority}><strong>선택과 관계없이 먼저 확인할 내용이 있어요.</strong><ul>{attention.map((message, index) => <li key={index}>{message}</li>)}</ul><a href="#property">선행 확인사항과 근거 보기 ↓</a></aside>}
    <ol className={styles.steps} key={decision}>{DECISION_ACTIONS[decision].map((step, index) => <li key={step.id}><span className={styles.stepNumber}>{index + 1}</span><div><p className={styles.stepWhere}>{step.where}</p><h3>{step.title}</h3><p className={styles.stepDetail}>{step.detail}</p>
      {step.resource ? <a className={styles.actionLink} href={resourceById(step.resource).href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{step.linkLabel} <span aria-hidden="true">↗</span><span className="sr-only"> (새 창)</span></a> : <Link className={styles.actionLink} href={step.href}>{step.linkLabel} <span aria-hidden="true">→</span></Link>}
      <details className={styles.question}><summary>이렇게 물어보세요</summary><div><p>{step.question}</p><CopyQuestion text={step.question} /></div></details>
    </div></li>)}</ol>
    <Link href="/resources" className={styles.resourceLink}>빈집 지원·정보 모음 전체 보기 →</Link>
  </section>
}
