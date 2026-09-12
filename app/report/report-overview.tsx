import Image from 'next/image'
import Link from 'next/link'
import type { AxisBlock } from '../../src/report-view'
import type { Support } from '../../src/supports'
import { CostComparison } from './cost-comparison'
import { ReportTools } from './report-tools'
import { DecisionActions } from './decision-actions'
import { SupportCards } from './support-cards'
import { Brand, HomeLink, Icon } from '../home-ui'
import styles from './report.module.css'
import type { ReactNode } from 'react'
import type { Decision } from '../../src/decision-actions'

export type ReportOverviewProps = {
  example?: boolean
  address: string
  dateLabel: string
  documentLabel: string
  blocks: AxisBlock[]
  supports: Support[]
  records: { label: string; value: string }[]
  attention?: string[]
  ownerCondition?: string | null
  photoCount?: number
  fieldVerified?: boolean
  initialDecision?: Decision
  onDecisionChange?: (decision: Decision) => void
  introNotice?: ReactNode
  summary?: ReactNode
  followUp?: ReactNode
}

const COST_SCOPE = [
  ['건물 해체', '면적·구조·진입로·인접 건물 등 현장 조건'],
  ['잔존물·폐기물 처리', '가구와 짐, 폐기물 운반·처리의 포함 여부'],
  ['석면 확인·처리', '자재 확인이 필요한지, 조사·처리가 별도인지'],
  ['행정·부대 작업', '해체 관련 절차, 설비 차단, 정지 작업 등의 범위'],
]

export function ReportOverview({ example = false, address, dateLabel, documentLabel, blocks, supports, records, attention = [], ownerCondition, photoCount = 0, fieldVerified = false, initialDecision, onDecisionChange, introNotice, summary, followUp }: ReportOverviewProps) {
  return <div className={styles.site} data-report>
    <div className={styles.shell}>
      <header className={styles.header}><Brand /><div className={styles.headerActions}><Link href="/resources">지원·정보 모음</Link>{example && <Link href="/#address-search">내 집으로 시작하기</Link>}<ReportTools /></div></header>
      <main className={styles.main}>
        <HomeLink />
        {introNotice}
        {example && <p className={styles.exampleBanner}><strong>진단서 미리보기</strong> 가상의 상황과 금액으로 구성한 설명용 예시예요.</p>}
        <section className={styles.hero} aria-labelledby="report-title"><div><p className={styles.eyebrow}>집토끼와 함께, 다음 결정</p><h1 id="report-title" tabIndex={-1}>우리 집 정리,<br />돈과 순서부터 알아봐요.</h1><p className={styles.address}>{address}</p><p className={styles.meta}>{dateLabel} · {documentLabel}</p></div><Image src="/mascot/binzip-rabbit-report-transparent-v4.png" alt="" width={144} height={144} sizes="(max-width: 620px) 126px, 238px" className={styles.rabbit} priority /></section>
        <nav className={styles.nav} aria-label="진단서 목차"><a href="#money">남는 돈</a><a href="#next-actions">다음 할 일</a><a href="#demolition">철거비·지원</a><a href="#property">집 상태·근거</a></nav>
        {attention.length > 0 && <aside className={styles.attention}><strong>금액 비교와 함께 먼저 확인해 주세요</strong><ul>{attention.map((item, index) => <li key={index}>{item}</li>)}</ul><a href="#property">관련 근거 확인하기 ↓</a></aside>}
        {summary}
        <CostComparison example={example} />
        <DecisionActions attention={attention} initialDecision={initialDecision} onDecisionChange={onDecisionChange} />
        <section id="demolition" className={styles.section} aria-labelledby="demolition-title"><p className={styles.eyebrow}>03 · 철거비와 공적 지원</p><h2 id="demolition-title">철거비는, 어디까지 포함한 금액일까요?</h2><p className={styles.intro}>사진만으로 총공사비를 정할 수는 없어요. 아래 네 가지를 같은 범위로 받아 비교해 보세요.</p><div className={styles.scopeGrid}>{COST_SCOPE.map(([title, description], index) => <div key={title}><span>{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{description}</p></div>)}</div><p className={styles.note}>견적에는 포함 항목·별도 비용·부가세·현장 확인 후 변경 조건을 함께 적어 달라고 요청하세요.</p><SupportCards supports={supports} compact /></section>
        <section id="property" className={styles.section} aria-labelledby="property-title"><p className={styles.eyebrow}>04 · 집 상태와 판단 근거</p><h2 id="property-title">무엇을 확인했고, 무엇이 남았나요?</h2><p className={styles.intro}>공적 기록과 입력 내용, 아직 확인하지 못한 부분을 구분해서 읽어 주세요.</p>
          <dl className={styles.records}>{records.map(record => <div key={record.label}><dt>{record.label}</dt><dd>{record.value}</dd></div>)}</dl>
          <div className={styles.photoSummary}><Icon name="document" /><div><strong>{photoCount > 0 ? `사진 ${photoCount}장 접수` : '현장 사진 미접수'}</strong><p>{photoCount > 0 ? '담당자가 확인할 자료로 접수했어요. 접수 자체가 상태 분석의 완료를 뜻하지 않아요.' : '사진이 있으면 지붕·외벽·진입 여건 등 눈에 보이는 상태를 정리하는 데 도움이 돼요.'} {fieldVerified ? '현장 확인 내용은 아래 담당자 메모를 참고해 주세요.' : '현장 확인은 아직 완료되지 않았어요.'}</p></div></div>
          {ownerCondition && <div className={styles.ownerNote}><span className={styles.tag}>소유자 입력</span><p>{ownerCondition}</p></div>}
          <div className={styles.evidenceList}>{blocks.length ? blocks.map(block => <details className={styles.evidence} key={block.axis}><summary><span>{block.label.replace(/^[①②③④]\s*/, '')}</span><span className={styles.evidenceBadge}>{block.badge}</span><span className={styles.chevron} aria-hidden="true">＋</span></summary><div>{block.items.length ? block.items.map((item, index) => <article className={styles.finding} key={`${block.axis}-${index}`}><div className={styles.findingHeading}><h3>{item.label || '확인 항목'}</h3>{item.unverified && <span className={styles.unverified}>추가 확인 필요</span>}</div>{item.lines.map((line, i) => <p key={i}>{line}</p>)}<p className={styles.source}>{item.source || '확인 근거 미등록'}</p></article>) : <p className={styles.note}>아직 정리된 확인 내용이 없어요.</p>}</div></details>) : <p className={styles.note}>조회·확인한 근거가 아직 없어요. 자료가 확인되면 이곳에 출처와 함께 표시해요.</p>}</div>
          <p className={styles.note}>공시가격은 예상 매도가와 달라요. 공개 자료나 사진만으로 소유권·구조 안전·석면 유무·최종 세금을 확정하지 않아요.</p>
        </section>
        {followUp}
        <aside className={styles.helpCard}><div><h2>틀린 정보나 빠진 내용이 있나요?</h2><p>주소와 수정할 항목을 알려주시면 다시 확인할게요.</p></div><a href="tel:01074282624">문의하기 ↗</a></aside>
        {example && <Link href="/#address-search" className={styles.cta}>내 빈집 주소로 시작하기 <span aria-hidden="true">→</span></Link>}
      </main>
      <footer className={styles.footer}><p><strong>빈집진단서</strong> · {documentLabel}</p><p>이 진단서는 확인한 자료와 입력값을 정리한 의사결정 참고 자료예요. 매도·철거의 가능 여부, 실제 거래가격과 공사비는 개별 확인이 필요해요.</p><Link href="/resources">빈집 지원·정보 모음</Link><Link href="/privacy">개인정보 처리방침</Link><a href="tel:01074282624">010-7428-2624</a></footer>
    </div>
  </div>
}
