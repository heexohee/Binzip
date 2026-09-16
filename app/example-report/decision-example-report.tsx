import Link from 'next/link'
import Image from 'next/image'
import { HomeHeader } from '../home-ui'
import styles from './decision-example.module.css'
import ConsultationRequest from '../connect/consultation-request'
import { POHANG_MARKET_EVIDENCE as market } from '@/src/pohang-market-evidence'
import { EXAMPLE_CASE } from '@/src/example-report-data'

const repairItems = [
  { area: '지붕', work: '파손 기와 교체 · 연결 부위 방수', amount: 500 },
  { area: '실내', work: '누수 부위 건조 · 천장과 벽 마감재 교체', amount: 300 },
  { area: '외벽', work: '손상된 표면 마감 부분 보수', amount: 100 },
]
const repairTotal = repairItems.reduce((total, item) => total + item.amount, 0)
const referenceDeal = market.deals.reduce((closest, deal) => Math.abs(deal.floorArea - 66) < Math.abs(closest.floorArea - 66) ? deal : closest)
const saleCommission = 40
const demolitionCost = 2000
const demolitionSupport = 700
const holdCost = 360
const landArea = EXAMPLE_CASE.land.area
const estimatedLandUnitPrice = 21.5
const estimatedLandValue = Math.round((landArea * estimatedLandUnitPrice) / 100) * 100
const demolitionNetCost = demolitionCost - demolitionSupport
const demolitionLandNetValue = estimatedLandValue - demolitionNetCost

export function DecisionExampleReport() {
  return <main className={styles.report} data-report>
    <HomeHeader><span className={styles.reportBadge}>예시 진단서</span></HomeHeader>
    <section className={styles.rabbitHero} aria-labelledby="report-title">
      <div className={styles.heroCopy}><p className={styles.eyebrow}>집토끼와 함께, 다음 결정</p><h1 id="report-title">우리 집의 다음 선택,<br />함께 살펴볼까요?</h1><p className={styles.bubble}>집 상태부터 비용, 다음 행동까지<br />하나씩 안내해 드릴게요.</p></div>
      <Image src="/mascot/binzip-rabbit-report-transparent-v4.png" alt="서류와 돋보기를 들고 살펴보는 집토끼" width={260} height={260} sizes="(max-width: 640px) 150px, 240px" className={styles.heroRabbit} priority />
    </section>
    <section id="condition" className={styles.section} aria-labelledby="condition-title">
      <div className={styles.heading}><span>01</span><h2 id="condition-title">지금 집은 어떤 상태인가요?</h2></div>
      <p className={styles.case}>포항시 남구 호미곶면 대보리 · 주택 66㎡</p>
      <div className={styles.verdict}><span>진단 결과</span><strong>지붕 수리와 실내 정비가 필요해요.</strong><p>지붕 일부가 파손돼 빗물이 들어오고 있어요.<br />지붕을 먼저 고친 뒤, 실내 천장과 벽을 정비하세요.</p></div>
      <dl className={styles.findings}>
        <div><dt>지붕 <span>수리 필요</span></dt><dd>기와 일부가 깨지고 연결 부위가 벌어졌어요. 파손된 기와 교체와 방수 작업이 필요해요.</dd></div>
        <div><dt>실내 <span>정비 필요</span></dt><dd>천장과 벽에 누수 얼룩이 있어요. 지붕 수리 후 충분히 말리고 마감재를 교체하세요.</dd></div>
        <div><dt>외벽 <span>부분 보수</span></dt><dd>표면 마감에 균열이 있어요. 손상된 마감 부위를 보수하세요.</dd></div>
      </dl>
    </section>

    <section id="choices" className={styles.section} aria-labelledby="choices-title">
      <div className={styles.heading}><span>02</span><h2 id="choices-title">어떤 선택이 가장 나을까요?</h2></div>
      <p className={styles.lead}>각 선택지를 같은 기준으로 비교했어요. 들어오는 돈에서 나가는 돈을 빼면, 지금 선택의 예상 결과를 볼 수 있어요.</p>
      <div className={styles.choiceGrid}>
        <article className={styles.choiceCard}>
          <div className={styles.cardHead}><b className={styles.choiceIndex}>01</b><h3>매매</h3><span>현재 상태로 팔 때</span></div>
          <dl className={styles.moneyFlow}>
            <div><dt>들어오는 돈</dt><dd><span>유사 규모 거래 참고값</span><strong>+{referenceDeal.priceManwon.toLocaleString()}만 원</strong></dd></div>
            <div><dt>나가는 돈</dt><dd><span>중개보수 상한</span><strong>−{saleCommission}만 원</strong></dd></div>
          </dl>
          <div className={styles.optionResult}><span>세금 전 예상 회수금</span><strong>{(referenceDeal.priceManwon - saleCommission).toLocaleString()}만 원</strong></div>
          <details className={styles.optionBasis}><summary>계산 근거 보기</summary><p>대보리 유사 연면적 {referenceDeal.floorArea}㎡ 주택의 {referenceDeal.date} 거래 {referenceDeal.priceManwon.toLocaleString()}만 원을 기준으로 했어요. 이 거래가는 건물과 토지를 합친 값이에요. 중개보수는 0.5% 상한을 적용했으며, 세금·정리비·기타 거래비용은 별도 확인이 필요해요.</p></details>
        </article>

        <article className={styles.choiceCard}>
          <div className={styles.cardHead}><b className={styles.choiceIndex}>02</b><h3>수리 후 활용</h3><span>다시 살거나 사용할 때</span></div>
          <dl className={styles.moneyFlow}>
            <div><dt>들어오는 돈</dt><dd><span>즉시 현금 유입</span><strong>0원</strong></dd></div>
            <div><dt>나가는 돈</dt><dd><span>지붕·실내·외벽 수리</span><strong>−{repairTotal.toLocaleString()}만 원</strong></dd></div>
          </dl>
          <div className={styles.optionResult}><span>예상 선투입 비용</span><strong>−{repairTotal.toLocaleString()}만 원</strong></div>
          <details className={styles.optionBasis}><summary>계산 근거 보기</summary><dl className={styles.repairCosts}>{repairItems.map(item => <div key={item.area}><dt><strong>{item.area}</strong><span>{item.work}</span></dt><dd>{item.amount.toLocaleString()}만 원</dd></div>)}</dl><p>수리 후 매각가 또는 사용 수익은 활용 계획과 현장 견적이 정해진 뒤 따로 계산해요.</p></details>
        </article>

        <article className={styles.choiceCard}>
          <div className={styles.cardHead}><b className={styles.choiceIndex}>03</b><h3>철거 후 토지 보유</h3><span>건물을 정리할 때</span></div>
          <dl className={styles.moneyFlow}>
            <div><dt>들어오는 돈</dt><dd><span>포항시 철거 지원금</span><strong>+{demolitionSupport.toLocaleString()}만 원</strong></dd></div>
            <div><dt>나가는 돈</dt><dd><span>철거·폐기물·부지 정리</span><strong>−{demolitionCost.toLocaleString()}만 원</strong></dd></div>
          </dl>
          <div className={styles.optionResult}><span>철거 후 예상 토지 순가치</span><strong>{demolitionLandNetValue.toLocaleString()}만 원</strong></div>
          <details className={styles.optionBasis}><summary>계산 근거 보기</summary><p>철거와 폐기물·부지 정리비 {demolitionCost.toLocaleString()}만 원에서 포항시 철거 지원금 {demolitionSupport.toLocaleString()}만 원을 빼면 순철거비는 {demolitionNetCost.toLocaleString()}만 원이에요.</p><p>남는 대지 {landArea}㎡에 기준 단가 {estimatedLandUnitPrice.toLocaleString()}만 원/㎡를 적용해 예상 토지가치 {estimatedLandValue.toLocaleString()}만 원을 계산했고, 순철거비를 빼면 {demolitionLandNetValue.toLocaleString()}만 원이에요. 실제 토지 가치는 지목·도로·규제·형상과 인근 거래를 확인해 다시 산정해요.</p></details>
        </article>

        <article className={styles.choiceCard}>
          <div className={styles.cardHead}><b className={styles.choiceIndex}>04</b><h3>보유</h3><span>결정을 미룰 때</span></div>
          <dl className={styles.moneyFlow}>
            <div><dt>들어오는 돈</dt><dd><span>즉시 현금 유입</span><strong>0원</strong></dd></div>
            <div><dt>나가는 돈</dt><dd><span>3년 보유·방치 비용</span><strong>−{holdCost.toLocaleString()}만 원</strong></dd></div>
          </dl>
          <div className={styles.optionResult}><span>3년 예상 순비용</span><strong>−{holdCost.toLocaleString()}만 원</strong></div>
          <details className={styles.optionBasis}><summary>계산 근거 보기</summary><p>세금·기본 점검·잡초와 배수 관리, 방치로 인한 정리 비용을 합쳐 월 평균 10만 원, 3년 기준으로 계산했어요. 토지의 기준 가치는 {estimatedLandValue.toLocaleString()}만 원으로 보되, 건물 상태가 더 나빠지면 매도 가능성과 정리 비용은 달라질 수 있어요.</p></details>
        </article>
      </div>
    </section>

    <section id="recommendation" className={styles.section} aria-labelledby="recommendation-title">
      <div className={styles.heading}><span>03</span><h2 id="recommendation-title">그래서, 무엇부터 할까요?</h2></div>
      <div className={styles.recommendation}>
        <div className={styles.rabbitAdvice}><Image src="/mascot/binzip-rabbit-report-transparent-v4.png" alt="" width={56} height={56} sizes="56px" /><span>집토끼의 제안</span></div>
        <strong>매도 가능성을 먼저 확인한 뒤 결정하세요.</strong>
        <p>유사 규모 거래를 기준으로 한 세금 전 예상 회수금은 {(referenceDeal.priceManwon - saleCommission).toLocaleString()}만 원이에요. 수리에는 {repairTotal.toLocaleString()}만 원, 철거에는 지원 반영 후 {demolitionNetCost.toLocaleString()}만 원이 먼저 필요해요.</p>
        <p>매도 상담에서 가격·기간·성사 가능성이 낮다고 확인되면, 철거 뒤 남는 예상 토지가치 {estimatedLandValue.toLocaleString()}만 원과 순철거비를 반영한 토지 순가치 {demolitionLandNetValue.toLocaleString()}만 원을 다음 선택지로 비교하세요. 결정을 미루면 3년 예상 보유·방치 비용 {holdCost.toLocaleString()}만 원이 계속 쌓여요.</p>
        <a href="#consultation">금액 기준으로 지역 전문가에게 상담 요청하기 ↓</a>
      </div>
    </section>

    <section id="consultation" className={styles.section + ' ' + styles.consultation} aria-labelledby="consultation-title">
      <div className={styles.heading}><span>04</span><h2 id="consultation-title">전문가 상담 요청</h2></div>
      <ConsultationRequest/>
      <div className={styles.actions}><Link className={styles.home} href="/">← 홈으로</Link></div>
    </section>
  </main>
}
