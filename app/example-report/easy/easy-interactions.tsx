'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { calculateDisposal, emptyDisposal, initialDisposal, formatWon, MONEY_FIELDS, type DisposalInput, type MoneyKey } from '../../../src/disposal'
import { DECISIONS, type Decision } from '../../../src/decision-actions'
import { EXAMPLE_DECISION_ACTIONS } from '../../../src/example-report-data'
import { resourceById } from '../../../src/official-resources'
import { CopyQuestion } from '../../report/report-tools'
import styles from './easy-report.module.css'

const OPTIONS = [
  { index: 0, title: '그대로 팔기', description: '집을 남겨 두고 팔 때', cost: '남은 짐 정리 등 직접 부담할 비용' },
  { index: 1, title: '철거 후 팔기', description: '집을 없애고 땅을 팔 때', cost: '철거·폐기물·행정 등 직접 부담할 총비용' },
] as const
const LABELS: Record<Decision, string> = { undecided: '아직 고민 중', sell: '팔기', demolish: '철거하기', hold: '당분간 두기' }

/** A separate example worksheet. Real customer reports never receive these defaults. */
export function EasyMoney({ embedded = false }: { embedded?: boolean }) {
  const id = useId()
  const [inputs, setInputs] = useState<[DisposalInput, DisposalInput]>(() => initialDisposal(true))
  const results = [calculateDisposal(inputs[0]), calculateDisposal(inputs[1])] as const
  const change = (index: 0 | 1, key: MoneyKey, value: string) => setInputs(previous => {
    const next: [DisposalInput, DisposalInput] = [...previous]
    next[index] = { ...previous[index], [key]: value }
    return next
  })
  const Heading = embedded ? 'h3' : 'h2'
  return <section id="money" className={embedded ? styles.embeddedMoney : styles.section} aria-labelledby="money-title">
    {!embedded && <p className={styles.chapter}>01 · 돈 비교</p>}
    <Heading id="money-title">팔고 나면, 얼마가 남을까요?</Heading>
    <p className={styles.lead}>팔아서 받는 돈에서 갚을 돈과 정리 비용을 빼면, 내게 남는 돈을 알 수 있어요.</p>
    <div className={styles.moneyGrid}>{OPTIONS.map(option => {
      const result = results[option.index]
      return <article className={styles.moneyCard} key={option.index} aria-labelledby={`${id}-option-${option.index}`}>
        <h3 id={`${id}-option-${option.index}`}>{option.title}</h3>
        <p className={styles.small}>{option.description}</p>
        <div className={styles.total} aria-live="polite" aria-atomic="true">
          <p>{result.net !== null && result.net < 0 ? '추가로 필요한 돈' : '내게 남는 돈'}</p>
          <strong className={result.net === null ? styles.unknown : result.net < 0 ? styles.negative : undefined}>{result.net === null ? '금액 확인 필요' : formatWon(Math.abs(result.net))}</strong>
          {result.net === null && <p className={styles.small}>{result.missing.length + result.invalid.length}개 금액을 확인해 주세요.</p>}
        </div>
        <dl className={styles.printBreakdown}>{MONEY_FIELDS.map(field => {
          const value = result.values[field.key]
          return <div key={field.key}><dt>{field.label}</dt><dd>{value.kind === 'known' ? formatWon(value.won) : value.kind === 'missing' ? '미확인' : '입력 확인'}</dd></div>
        })}</dl>
      </article>
    })}</div>
    <p className={styles.small}>집이나 땅이 실제로 팔려야 받을 수 있는 돈이에요. 매도 가능 여부와 기간은 별도로 확인해야 해요.</p>

    <details className={styles.disclosure} data-money-editor>
      <summary><span>금액을 바꿔서 계산해 보기<small>매도대금에서 무엇을 빼는지 확인해요.</small></span><span className={styles.plus} aria-hidden="true" /></summary>
      <div className={styles.detailBody}>
        <p id={`${id}-help`}>단위는 <strong>만 원</strong>이에요. 3,000만 원은 <strong>3000</strong>으로 적어요. 모르는 금액은 비워 두고, 비용이 없다고 확인한 경우만 0을 넣어 주세요.</p>
        <div className={styles.inputGrid}>{OPTIONS.map(option => <fieldset key={option.index}><legend>{option.title}</legend>{MONEY_FIELDS.map(field => {
          const fieldId = `${id}-${option.index}-${field.key}`
          const invalid = results[option.index].values[field.key].kind === 'invalid'
          return <div className={styles.field} key={field.key}><label htmlFor={fieldId}>{field.label}</label><div className={styles.inputWrap}><input id={fieldId} type="text" inputMode="decimal" autoComplete="off" placeholder="미확인" value={inputs[option.index][field.key]} onChange={e => change(option.index, field.key, e.target.value)} aria-invalid={invalid || undefined} aria-describedby={`${id}-help${invalid ? ` ${fieldId}-error` : ''}${field.key === 'clearance' ? ` ${fieldId}-hint` : ''}`} /><span>만 원</span></div>{field.key === 'clearance' && <p className={styles.small} id={`${fieldId}-hint`}>{option.cost}</p>}{invalid && <p className={styles.error} id={`${fieldId}-error`}>0~100,000,000 사이 숫자를 쉼표 없이 적어 주세요. 소수점은 4자리까지 가능해요.</p>}</div>
        })}</fieldset>)}</div>
        <div className={styles.editorActions}><button className={styles.editorButton} type="button" onClick={() => setInputs([emptyDisposal(), emptyDisposal()])}>입력값 비우기</button><button className={styles.editorButton} type="button" onClick={() => setInputs(initialDisposal(true))}>처음 금액으로</button></div>
        <p className={styles.small}>입력값은 저장·전송하지 않아요. 새로고침하면 처음 금액으로 돌아가요.</p>
        <div className={styles.calculationNote}><h3>이렇게 계산해요.</h3><p>내게 남는 돈 = 매도대금 − 상환할 채무 − 세금·거래비용 − 본인 부담 정리비용</p><p>과거에 집을 산 비용과 매도까지의 보유·금융비용은 포함하지 않았어요. 투자수익을 계산한 금액은 아니에요.</p><p>지원금은 자동으로 빼지 않아요. 지원 방식·선정 여부·금액을 확인한 뒤 실제 본인 부담만 정리비용에 넣어 주세요.</p></div>
      </div>
    </details>
  </section>
}

export function EasyActions() {
  const group = useId()
  const [decision, setDecision] = useState<Decision>('undecided')
  const selected = DECISIONS.find(item => item.id === decision)!
  return <section id="next-actions" className={styles.section} aria-labelledby="actions-title">
    <p className={styles.chapter}>02 · 다음 할 일</p>
    <h2 id="actions-title">지금, 어느 쪽을 생각하세요?</h2>
    <p className={styles.lead}>하나를 고르면 해야 할 일을 순서대로 보여드려요. 언제든 바꿀 수 있어요.</p>
    <fieldset className={styles.choices}><legend className="sr-only">현재 고민하는 방향</legend>{DECISIONS.map(item => <label key={item.id}><input type="radio" name={group} value={item.id} checked={decision === item.id} onChange={() => setDecision(item.id)} /><span>{LABELS[item.id]}</span></label>)}</fieldset>
    <p className={styles.actionTitle} role="status">{selected.title}</p>
    <ol className={styles.steps} key={decision}>{EXAMPLE_DECISION_ACTIONS[decision].map((step, index) => <li key={step.id}>
      <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
      <div className={styles.stepContent}><h3>{step.title}</h3><p className={styles.small}>{step.where}</p>
        <details className={styles.stepDetails}><summary>어떻게 확인하나요?<span className={styles.plus} aria-hidden="true" /></summary><div className={styles.detailBody}>
          <p>{step.detail}</p><p className={styles.questionBox}><strong>이렇게 물어보세요.</strong><br />{step.question}</p>
          <CopyQuestion text={step.question} />
          {step.resource ? <a className={styles.actionLink} href={resourceById(step.resource).href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{step.linkLabel} <span aria-hidden="true">↗</span><span className="sr-only"> (새 창)</span></a> : <Link className={styles.actionLink} href={step.href}>{step.linkLabel} <span aria-hidden="true">→</span></Link>}
        </div></details>
      </div>
    </li>)}</ol>
  </section>
}
