import { TaxPlanner } from '../tax-comparison'
import Image from 'next/image'
import Link from 'next/link'
import { Brand } from '../home-ui'
import { ReportTools } from '../report/report-tools'
import { EXAMPLE_CASE, EXAMPLE_REPORT_RECORDS, EXAMPLE_SUPPORTS } from '../../src/example-report-data'
import { EXAMPLE_BUDGET_TOTAL, EXAMPLE_DEMOLITION_BUDGET, EXAMPLE_PREPARATION, EXAMPLE_TRANSACTIONS } from '../../src/example-demolition'
import { formatWon } from '../../src/disposal'
import { ExampleDocuments } from './example-documents'
import { ExampleJourney } from './example-journey'
import { EasyMoney } from './easy/easy-interactions'
import reading from './easy/easy-report.module.css'
import styles from './journey.module.css'

export function RenewedExampleReport() {
  return <div className={reading.site} data-report data-easy-report data-renewed-report>
    <a href="#report-title" className={reading.skip}>진단서 내용으로 바로 가기</a>
    <div className={reading.sheet}>
      <header className={reading.header}><Brand /><Link className={reading.homeLink} href="/"><span aria-hidden="true">←</span> 홈으로</Link></header>
      <main className={reading.main}>
        <section className={`${reading.hero} ${styles.hero}`} aria-labelledby="report-title">
          <div><p className={reading.eyebrow}>빈집진단서 · 철거 준비 안내</p><h1 id="report-title" tabIndex={-1}>우리 집 철거 준비,<br />차근차근 함께해요.</h1></div>
          <Image className={reading.rabbit} src="/mascot/binzip-rabbit-report-transparent-v4.png" alt="" width={132} height={168} sizes="(max-width: 620px) 76px, 132px" priority />
          <p className={`${reading.heroDescription} ${styles.heroDescription}`}>집의 기록부터 비용과 절차,<br />철거가 끝날 때까지 한곳에서 살펴봐요.</p>
          <div className={reading.caseSummary}><p className={reading.caseAddress}>{EXAMPLE_CASE.address}</p><p className={reading.small}>자료 정리 · {EXAMPLE_CASE.checkedAt}</p></div>
        </section>
        <nav className={reading.contents} aria-label="진단서 목차">
          <a href="#tax-order">처분 순서·세금</a><a href="#property"><span>01</span> 집의 정보</a><a href="#preparation"><span>02</span> 철거 준비</a><a href="#consultation"><span>03</span> 상담 맡기기</a><a href="#progress"><span>04</span> 진행 확인</a>
        </nav>
        <TaxPlanner example />
        <dl className={styles.summary} aria-label="핵심 요약"><div><dt>준비된 자료</dt><dd>등기부·건축물대장</dd></div><div><dt>철거 준비 예산</dt><dd>{formatWon(EXAMPLE_BUDGET_TOTAL * 10_000)}</dd><p>진행지원 수수료 포함</p></div><div><dt>먼저 할 일</dt><dd><a href="#preparation">담보·지원 조건 확인</a></dd></div></dl>

        <section id="property" className={reading.section} aria-labelledby="property-title">
          <p className={reading.chapter}>01 · 우리 집 이해하기</p><h2 id="property-title">이 집의 기록을 모았어요.</h2>
          <p className={reading.lead}>상속받은 단층 주택이에요. 집과 땅의 소유관계, 건물 정보와 주변 거래를 함께 살펴보세요.</p>
          <dl className={styles.keyFacts}><div><dt>건물</dt><dd>목조·기와 단독주택 · 1층</dd></div><div><dt>건물 / 대지 면적</dt><dd>{EXAMPLE_CASE.building.area}㎡ / {EXAMPLE_CASE.land.area}㎡</dd></div><div><dt>사용승인일</dt><dd>{EXAMPLE_CASE.building.approvedAt}</dd></div><div><dt>취득과 소유</dt><dd>2018년 상속 · 단독 소유</dd></div></dl>
          <div className={styles.ownership}><h3>집과 땅의 소유자가 같아요.</h3><p>{EXAMPLE_CASE.registry.ownerMatch}이며, 각 지분은 1/1이에요. 등기부에는 압류·가압류·가처분 기재가 없어요.</p><p><strong>근저당권 1건 · 채권최고액 {formatWon(EXAMPLE_CASE.registry.mortgageMaximum)}</strong><br />소유자가 알려준 상환 예정액은 {formatWon(EXAMPLE_CASE.owner.repayment)}이에요. 철거 준비 과정에서 금융기관과 필요한 협의 순서를 확인해요.</p></div>
          <details className={reading.disclosure}><summary>건물의 상세 정보<span className={reading.plus} aria-hidden="true" /></summary><div className={reading.detailBody}><dl className={reading.facts}>{EXAMPLE_REPORT_RECORDS.map(record => <div key={record.label}><dt>{record.label}</dt><dd>{record.value}</dd></div>)}</dl><p className={styles.caseNotes}><strong>소유자가 알려준 이야기</strong><br />{EXAMPLE_CASE.owner.note}</p></div></details>
          <ExampleDocuments />
          <details id="transactions" className={reading.disclosure}><summary><span>주변 거래 사례 5건 보기<small>주택 3건 · 토지 2건의 거래금액을 모았어요.</small></span><span className={reading.plus} aria-hidden="true" /></summary><div className={reading.detailBody}>
            <p>건물을 포함한 주택 거래와 건물 없는 토지 거래를 나누어 비교해요.</p>
            <ul className={styles.transactions}>{EXAMPLE_TRANSACTIONS.map(transaction => <li key={transaction.id}><div className={styles.transactionHead}><h3>{transaction.name}</h3><strong>{formatWon(transaction.price * 10_000)}</strong></div><dl><div><dt>계약일</dt><dd>{transaction.date}</dd></div><div><dt>대지</dt><dd>{transaction.land}㎡</dd></div>{transaction.building !== null && <div><dt>건물</dt><dd>{transaction.building}㎡</dd></div>}</dl><p className={reading.small}>{transaction.note}</p></li>)}</ul>
            <p className={reading.small}>도로·대지 형태·건물 상태가 달라 거래금액을 그대로 우리 집 가격으로 적용하지는 않아요.</p>
          </div></details>
          <details className={reading.disclosure} data-sale-comparison><summary><span>팔 때 남는 돈도 비교해 보기<small>그대로 팔기와 철거 후 팔기를 함께 살펴봐요.</small></span><span className={reading.plus} aria-hidden="true" /></summary><div className={reading.detailBody}><EasyMoney embedded /></div></details>
        </section>

        <section id="preparation" className={reading.section} aria-labelledby="preparation-title">
          <span id="next-actions" aria-hidden="true" />
          <p className={reading.chapter}>02 · 이 집의 철거 준비</p><h2 id="preparation-title">비용과 순서를 먼저 정리해요.</h2>
          <p className={reading.lead}>준비한 서류를 바탕으로 담보·지원 조건과 현장 작업 범위를 확인해요.</p>
          <div id="demolition" className={styles.budget}><p>철거 준비 예산</p><strong className={styles.budgetTotal}>{formatWon(EXAMPLE_BUDGET_TOTAL * 10_000)}</strong><p className={reading.small}>공사·정리 예산 1,150만 원 + 진행지원 수수료 50만 원<br />부가세 포함 기준 · 지원금 차감 전</p>
            <details className={reading.disclosure}><summary>무엇이 포함되어 있나요?<span className={reading.plus} aria-hidden="true" /></summary><div className={reading.detailBody}><dl>{EXAMPLE_DEMOLITION_BUDGET.map(item => <div key={item.name}><dt>{item.name}<small>{item.detail}</small></dt><dd>{formatWon(item.amount * 10_000)}</dd></div>)}</dl><p className={reading.small}>현장 확인 후 예비비 사용과 추가 작업 여부를 정리해요. 석면 조사·처리, 별채 등 별도 작업이 필요하면 범위와 비용을 먼저 설명해요.</p></div></details>
          </div>
          <ol className={styles.preparations}>{EXAMPLE_PREPARATION.map((step, index) => <li key={step.title}><span className={styles.number} aria-hidden="true">{index + 1}</span><div><span className={reading.small}>{step.status}</span><h3>{step.title}</h3><p>{step.detail}</p><details className={reading.disclosure}><summary>누가 어떻게 준비하나요?<span className={reading.plus} aria-hidden="true" /></summary><div className={reading.detailBody}><dl><div><dt>빈집진단서가 도울 일</dt><dd>{step.service}</dd></div><div><dt>내가 준비할 일</dt><dd>{step.owner}</dd></div></dl><a className={reading.actionLink} href={step.href}>{step.link} <span aria-hidden="true">→</span></a></div></details></div></li>)}</ol>
          <details id="support-title" className={`${reading.disclosure} ${styles.support}`}><summary><span>철거 지원·담당 창구 보기<small>소재지와 건축물 기록을 준비했어요.</small></span><span className={reading.plus} aria-hidden="true" /></summary><div className={reading.detailBody}>
            {EXAMPLE_SUPPORTS.map(support => <article key={support.id}><h3>{support.title}</h3><p>{support.nextStep}</p><dl className={reading.facts}><div><dt>지원 금액</dt><dd>{support.amount}</dd></div><div><dt>신청 시기</dt><dd>{support.period}</dd></div></dl><ul className={reading.checks}>{support.checks.map(check => <li key={check.label}><strong>{check.label} · {check.confirmed ? '자료 준비' : '다음 확인'}</strong><p>{check.detail}</p></li>)}</ul><p>{support.where}</p><a className={reading.actionLink} href={`tel:${support.phone}`}>담당 기관 · {support.phone}</a><a className={reading.actionLink} href={support.source.url} target="_blank" rel="noopener noreferrer">공식 근거 보기 <span aria-hidden="true">↗</span><span className="sr-only"> (새 창)</span></a><p className={reading.small}>자료 게시 {support.source.publishedAt} · 내용 확인 {support.checkedAt}</p></article>)}
            <p className={reading.small}>선정 여부와 부지 사용 조건을 확인한 뒤 본인 부담을 계산해요. 지원금은 예산에서 미리 빼지 않았어요.</p><Link className={reading.actionLink} href="/resources">빈집 지원·정보 모음 보기 <span aria-hidden="true">→</span></Link>
          </div></details>
        </section>

        <ExampleJourney />
        <div className={reading.tools}><ReportTools /><Link className={reading.actionLink} href="/#address-search">내 빈집 주소로 시작하기 <span aria-hidden="true">→</span></Link></div>
      </main>

    </div>
  </div>
}
