'use client'

import { useId, useState } from 'react'
import { calculateDisposal, emptyDisposal, initialDisposal, formatWon, MONEY_FIELDS, type DisposalInput, type MoneyKey } from '../../src/disposal'
import styles from './report.module.css'

const OPTIONS = [
  { index: 0, title: '그대로 매도', description: '집을 남겨 둔 상태로 팔 때', cost: '잔존물 정리 등 직접 부담할 금액' },
  { index: 1, title: '철거 후 매도', description: '집을 철거하고 땅을 팔 때', cost: '철거·폐기물·행정 등 직접 부담할 총액' },
] as const

export function CostComparison({ example = false }: { example?: boolean }) {
  const prefix = useId()
  const [inputs, setInputs] = useState<[DisposalInput, DisposalInput]>(() => initialDisposal(example))
  const results = [calculateDisposal(inputs[0]), calculateDisposal(inputs[1])] as const
  const change = (index: number, key: MoneyKey, value: string) => setInputs(previous => previous.map((input, i) => i === index ? { ...input, [key]: value } : input) as [DisposalInput, DisposalInput])
  const [first, second] = results
  const difference = first.net !== null && second.net !== null ? second.net - first.net : null

  return <section id="money" className={styles.money} aria-labelledby="money-title">
    <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>01 · 돈부터 비교해요</p><h2 id="money-title">팔고 나면, 얼마가 남을까요?</h2></div><span className={styles.tag}>{example ? '설명용 가정값' : '직접 입력 계산'}</span></div>
    <p className={styles.intro}>{example ? '아래 금액은 계산 방법을 보여주는 가상의 숫자예요. 실제 매매가·철거 견적과 관련이 없어요.' : '중개사·금융기관·세무사·철거업체에서 확인한 금액을 넣어 비교해 보세요. 아직 모르는 금액은 비워 두세요.'}</p>
    <div className={styles.moneyGrid}>
      {OPTIONS.map(option => {
        const index = option.index
        const result = results[index]
        return <article className={styles.moneyCard} key={option.title}>
          <p className={styles.optionNumber}>선택 {index + 1}</p><h3>{option.title}</h3><p className={styles.optionDescription}>{option.description}</p>
          <div className={styles.total} aria-live="polite" aria-atomic="true">
            <p>{result.net !== null && result.net < 0 ? '추가로 필요한 돈' : '예상 순회수액'}</p>
            <strong className={result.net === null ? styles.unknownAmount : result.net < 0 ? styles.negativeAmount : undefined}>{result.net === null ? '금액 확인 필요' : formatWon(Math.abs(result.net))}</strong>
            <span>{result.net === null ? `${result.missing.length + result.invalid.length}개 항목을 확인해 주세요` : example ? '가정값 기준 · 실제 예상액 아님' : '직접 입력한 금액 기준 · 검증 전'}</span>
          </div>
          <dl className={styles.breakdown}>{MONEY_FIELDS.map((field, fieldIndex) => {
            const value = result.values[field.key]
            return <div key={field.key}><dt><span aria-hidden="true">{fieldIndex === 0 ? '+' : '−'}</span> {field.label}</dt><dd>{value.kind === 'known' ? formatWon(value.won) : value.kind === 'missing' ? '미확인' : '입력 확인'}</dd></div>
          })}</dl>
        </article>
      })}
    </div>
    <p className={styles.comparisonNote}>{difference === null ? '두 선택지의 금액이 모두 채워지면 차이를 함께 보여드려요.' : difference === 0 ? '입력값 기준으로 두 선택지의 순회수액이 같아요.' : <>입력값 기준, <strong>{difference > 0 ? '철거 후 매도' : '그대로 매도'}의 순회수액이 {formatWon(Math.abs(difference))} 더 커요.</strong> 매도 가능 여부와 소요 기간은 별도 확인이 필요해요.</>}</p>
    <details className={styles.editor}>
      <summary>{example ? '가정값을 바꿔서 계산해 보기' : '확인한 금액 입력하기'}<span aria-hidden="true">＋</span></summary>
      <div className={styles.editorContent}>
        <p id={`${prefix}-help`} className={styles.help}>단위는 만 원이에요. 3,000만 원이면 3000을 입력해 주세요. 모르는 값은 빈칸, 비용이 없다고 확인한 경우만 0을 입력해요. 이 화면의 입력값은 저장·전송되지 않으며 새로고침하면 초기화돼요.</p>
        <div className={styles.inputGrid}>{OPTIONS.map(option => <fieldset key={option.title}><legend>{option.title}</legend>{MONEY_FIELDS.map(field => {
          const index = option.index
          const id = `${prefix}-${index}-${field.key}`
          const invalid = results[index].values[field.key].kind === 'invalid'
          return <div className={styles.inputField} key={field.key}><label htmlFor={id}>{field.label}</label><div className={styles.inputWrap}><input id={id} type="text" inputMode="decimal" autoComplete="off" placeholder="미확인" value={inputs[index][field.key]} onChange={event => change(index, field.key, event.target.value)} aria-invalid={invalid || undefined} aria-describedby={`${prefix}-help${invalid ? ` ${id}-error` : ''}${field.key === 'clearance' ? ` ${id}-hint` : ''}`} /><span>만 원</span></div>{field.key === 'clearance' && <p id={`${id}-hint`} className={styles.fieldHint}>{option.cost}</p>}{invalid && <p id={`${id}-error`} className={styles.inputError}>0~100,000,000 사이 숫자를 쉼표 없이 입력해 주세요. 소수점은 4자리까지 가능해요.</p>}</div>
        })}</fieldset>)}</div>
        <div className={styles.editorActions}><button type="button" onClick={() => setInputs([emptyDisposal(), emptyDisposal()])}>입력값 비우기</button>{example && <button type="button" onClick={() => setInputs(initialDisposal(true))}>처음 가정값으로</button>}</div>
      </div>
    </details>
    <details className={styles.formula}><summary>계산 기준과 포함하지 않은 비용</summary><div><p><strong>순회수액 = 매도대금 − 상환할 채무 − 세금·거래비용 − 본인 부담 정리비용</strong></p><p>매각 시 남거나 추가로 필요한 현금을 비교해요. 과거 매입비를 반영한 투자수익은 아니며, 매각까지의 보유비용·금융비용은 별도로 확인해야 해요.</p><p>지원금은 자동으로 차감하지 않아요. 지원 방식·선정 여부·금액이 확인되면 실제 본인 부담액만 정리비용에 넣어 주세요. 철거 후에도 매도가 성사되어야 매도대금이 생겨요.</p></div></details>
  </section>
}
