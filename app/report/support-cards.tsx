import type { Support } from '../../src/supports'
import styles from './support-cards.module.css'

export function SupportCards({ supports, compact = false }: { supports: Support[]; compact?: boolean }) {
  return <section className={styles.section} aria-labelledby="support-title">
    <p className={styles.eyebrow}>공적 지원 확인</p>
    <h2 id="support-title">우리 집도 지원을 받을 수 있을까요?</h2>
    <p className={styles.intro}>공식 자료에서 찾은 사업과 내 집에서 더 확인할 조건을 함께 정리했어요. 신청 가능 여부와 지원액은 담당 기관의 확인·선정이 필요해요.</p>
    {!supports.length && <p className={styles.empty}>현재 정리한 공고는 포항시 사업이에요. 이 주소의 관할 지자체 공고는 추가 확인이 필요해요.</p>}
    <div className={styles.cards}>{supports.map(s => <article key={s.id} className={styles.card}>
      <span className={styles.status}>{s.status}</span>
      <h3>{s.title}</h3>
      <dl className={styles.summary}>
        <div><dt>지원 금액</dt><dd>{s.amount}</dd></div>
        <div><dt>신청 시기</dt><dd>{s.period}</dd></div>
      </dl>
      <div className={styles.next}><strong>먼저 할 일</strong><p>{s.nextStep}</p></div>
      <details className={styles.details} open={compact ? undefined : true}><summary>지원 조건·문의처·근거 확인</summary><ul className={styles.checks}>{s.checks.map(c => <li key={c.label}>
        <span className={c.confirmed ? styles.known : styles.unknown}>{c.confirmed ? '자료 확인' : '확인 필요'}</span>
        <div><strong>{c.label}</strong><p>{c.detail}</p></div>
      </li>)}</ul>
      <p className={styles.contact}>{s.where}<br /><a href={'tel:' + s.phone}>{s.phone}</a></p>
      <a className={styles.source} href={s.source.url} target="_blank" rel="noopener noreferrer">공식 근거 보기 ↗</a>
      <p className={styles.date}>자료 {s.source.publishedAt} · 내용 확인 {s.checkedAt}<br />접수·예산 상태를 실시간으로 조회한 결과는 아니에요.</p>
      </details>
    </article>)}</div>
    <p className={styles.footnote}>지원금을 받는다고 가정해 철거 견적에서 미리 빼지 않아요. 지자체가 직접 시행하는 범위와 본인 부담부터 확인해 주세요.</p>
  </section>
}
