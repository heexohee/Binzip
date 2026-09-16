import { TaxTeaser } from './tax-comparison'
import Image from 'next/image'
import Link from 'next/link'
import { Arrow, Icon } from './home-ui'
import styles from './home.module.css'
import { AddressStartForm } from './address-start-form'
import { ConcernCarousel } from './concern-carousel'
import { HOME_CONCERNS, HOME_CONCERNS_CHECKED_AT } from '../src/home-concerns'

export const maxDuration = 60

export default function Home() {
  return (
    <div className={styles.site}>
      <a className={styles.skipLink} href="#address-search">주소 입력으로 건너뛰기</a>
      <div className={styles.sheet}>
        <main>
          <section className={styles.brandHero} aria-labelledby="brand-title">
            <div>
              <Image src="/brand/binzip-house-logo-b-3d-v2.png" alt="" width={72} height={72} className={styles.heroLogo} />
              <h1 id="brand-title">빈집진단서</h1>
            </div>
            <Image src="/mascot/binzip-rabbit-v1.png" alt="작은 집을 안고 있는 집토끼" width={256} height={256} sizes="(max-width: 360px) 120px, (max-width: 540px) 150px, 280px" className={styles.brandRabbit} priority />
          </section>

          <section id="address-search" className={styles.addressSection} aria-labelledby="address-title">
            <nav className={styles.folderNav} aria-label="빈집진단서 이용하기">
              <a href="#address-search" aria-current="page"><Icon name="house" />내 빈집 확인</a>
              <Link href="/example-report"><Icon name="document" />진단서 보기</Link>
            </nav>
            <h2 id="address-title">시골 빈집, 혹시 그냥 두고 계시나요?</h2>
            <p className={styles.intakeDescription}>당장은 지출이 적어 보여도, 갈수록 비용 부담이 커질 수 있어요.<br />무료 진단을 받아보세요.</p>
            <AddressStartForm />
          </section>

          <section className={styles.empathySection} aria-labelledby="empathy-title">
            <h2 id="empathy-title">비용도, 절차도 막막해서<br />정리를 미루고 있으셨죠?</h2>
            <ConcernCarousel />
          </section>

          <section className={styles.concernsSection} aria-labelledby="concerns-title">
            <h2 id="concerns-title">시골 빈집, 그냥 두고만 계신가요?<br />이젠 방치가 가장 비싼 선택이 될 수도 있습니다.</h2>
            <ol className={styles.concernsList}>{HOME_CONCERNS.map((concern, index) => <li key={concern.id}>
              <span className={styles.concernNumber} aria-hidden="true">0{index + 1}</span>
              <div><p className={styles.concernLabel}>{concern.label}</p>{concern.id !== 'tax' && <h3>{concern.title}</h3>}
                {'metric' in concern && <div className={styles.concernMetric}><strong>{concern.metric}</strong><p>{concern.metricCondition}</p></div>}
                {concern.id === 'tax' && <TaxTeaser />}
                <details className={styles.concernSource} data-concern={concern.id}>
                  <summary>근거와 적용 조건 보기</summary>
                  <div>
                    {'evidenceItems' in concern ? <dl className={styles.concernFacts}>{concern.evidenceItems.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : <p>{concern.evidence}</p>}
                    <div className={styles.concernLegalNote}>{concern.laws.map(law => <a key={law.url} href={law.url} target="_blank" rel="noopener noreferrer">근거: {law.label}<span className="sr-only"> (새 창)</span></a>)}</div>
                    <p className={styles.concernDate}>내용 확인 {HOME_CONCERNS_CHECKED_AT}</p>
                  </div>
                </details>
              </div>
            </li>)}</ol>
          </section>

          <section className={styles.reportContentsSection} aria-labelledby="service-title">
            <h2 id="service-title">그래서,<br />빈집진단서가 필요해요.</h2>
            <p className={styles.intakeDescription}>팔지, 철거할지 고민되는 시골 빈집.<br />의사결정에 필요한 정보와 다음 액션까지 진단서로 정리해 드려요.</p>
            <div className={styles.reportContentsCard}>
              <ol className={styles.reportContentsList}>
                <li>
                  <span className={styles.concernNumber} aria-hidden="true">01</span>
                  <div><h3>빈집, 지금 어떤 상태인가요?</h3><p>건축물대장·토지이용계획 등 서류와 공공자료를 함께 살펴, 집과 땅의 기본 정보와 확인할 사항을 정리해 드려요.</p><p>멀리 계신 분들을 위해 저희가 직접 현장 방문으로 상태를 진단해드릴 수 있어요.</p><p>현장 방문은 지역과 확인 범위에 따라 비용이 발생할 수 있으며, 방문 전 안내해 드려요.</p></div>
                </li>
                <li>
                  <span className={styles.concernNumber} aria-hidden="true">02</span>
                  <div><h3>빈집 철거/매매에 지자체 지원을 받을 수 있도록 도와드려요.</h3><p>빈집 상태를 진단한 후 지자체의 지원사업의 신청 조건·준비 서류까지 알려드려요.</p>
                    <div className={styles.supportEstimate}>
                      <p className={styles.estimateSaving}><span>지자체 지원사업을 받으면</span><strong><span>700만 원</span> 절약</strong><span>예상 철거·정리비의 35%를 줄일 수 있어요.</span></p>
                      <dl>
                        <div><dt>예상 철거·정리비</dt><dd>2,000만 원</dd></div>
                        <div><dt>지원 대상으로 선정될 경우</dt><dd>−700만 원</dd></div>
                        <div className={styles.estimateTotal}><dt>예상 본인 부담</dt><dd>1,300만 원</dd></div>
                      </dl>
                    </div>
                    <p className={styles.estimateCaveat}>설명용 가정값이며, 실제 지원금은 지역·사업·선정 결과에 따라 달라져요.</p>
                  </div>
                </li>
                <li>
                  <span className={styles.concernNumber} aria-hidden="true">03</span>
                  <div>
                    <h3>매도도 철거도, 검증받은 업체를 연결해드려요.</h3>
                    <p>원하시면 진단 결과와 집 정보를 바탕으로 공인중개사나 철거업체에 연결해드릴 수 있어요.</p>
                    <div className={styles.partnerFlow}>
                      <strong className={styles.partnerFlowStart}>진단 결과에 따른 의사결정</strong>
                      <div className={styles.partnerFlowOptions}>
                        <div><span>매도하고 싶어요</span><span aria-hidden="true">↓</span><strong>검증받은 공인중개사 연결</strong></div>
                        <div><span>철거하고 싶어요</span><span aria-hidden="true">↓</span><strong>검증받은 철거업체 연결</strong></div>
                      </div>
                    </div>
                  </div>
                </li>
              </ol>
              <Link href="/example-report" className={styles.reportExampleLink}>진단서 보기</Link>
            </div>
            <a href="#address-search" className={styles.primary}>내 빈집 무료로 확인하기<Arrow /></a>
          </section>
        </main>

      </div>
    </div>
  )
}
