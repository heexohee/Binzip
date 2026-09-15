import Link from 'next/link'
import styles from './decision-example.module.css'
import ConsultationRequest from '../connect/consultation-request'
import { POHANG_MARKET_EVIDENCE as market } from '@/src/pohang-market-evidence'

const repairItems = [
  { area: '지붕', work: '파손 기와 교체 · 연결 부위 방수', amount: 500 },
  { area: '실내', work: '누수 부위 건조 · 천장과 벽 마감재 교체', amount: 300 },
  { area: '외벽', work: '손상된 표면 마감 부분 보수', amount: 100 },
]
const repairTotal = repairItems.reduce((total, item) => total + item.amount, 0)
const referenceDeal = market.deals.reduce((closest, deal) => Math.abs(deal.floorArea - 66) < Math.abs(closest.floorArea - 66) ? deal : closest)

export function DecisionExampleReport() {
  return <main className={styles.report} data-report>
    <section id="condition" className={styles.section} aria-labelledby="condition-title">
      <div className={styles.heading}><span>01</span><h1 id="condition-title">지금 집은 어떤 상태인가요?</h1></div>
      <p className={styles.case}>포항시 남구 호미곶면 대보리 · 주택 66㎡</p>
      <div className={styles.verdict}><span>진단 결과</span><strong>지붕 수리와 실내 정비가 필요해요.</strong><p>지붕 일부가 파손돼 빗물이 들어오고 있어요.<br />지붕을 먼저 고친 뒤, 실내 천장과 벽을 정비하세요.</p></div>
      <dl className={styles.findings}>
        <div><dt>지붕 <span>수리 필요</span></dt><dd>기와 일부가 깨지고 연결 부위가 벌어졌어요. 파손된 기와 교체와 방수 작업이 필요해요.</dd></div>
        <div><dt>실내 <span>정비 필요</span></dt><dd>천장과 벽에 누수 얼룩이 있어요. 지붕 수리 후 충분히 말리고 마감재를 교체하세요.</dd></div>
        <div><dt>외벽 <span>부분 보수</span></dt><dd>표면 마감에 균열이 있어요. 손상된 마감 부위를 보수하세요.</dd></div>
      </dl>
    </section>
    <section id="choices" className={styles.section} aria-labelledby="choices-title">
      <div className={styles.heading}><span>02</span><h2 id="choices-title">고칠까요, 팔까요, 철거할까요?</h2></div>
      <p className={styles.lead}>다시 살 계획이라면 수리를, 사용 계획이 없다면 매도를 먼저 알아보세요.</p>
      <div className={styles.costs}>
        <article>
          <div className={styles.cardHead}><h3>철거</h3><span>집을 없애고 정리할 때</span></div>
          <p>예상 철거·정리비</p><strong className={styles.amount}>2,000만 원</strong><p>건물 철거와 폐기물 처리를 포함한 금액이에요.</p>
          <section className={styles.support} aria-labelledby="demolition-support-title">
            <h4 id="demolition-support-title">포항시 철거 지원을 받는다면?</h4>
            <p>지원금 700만 원을 받는 경우, 예상 본인 부담은 1,300만 원으로 줄어들어요.</p>
            <dl className={styles.fees}>
              <div><dt>예상 철거·정리비</dt><dd>2,000만 원</dd></div>
              <div><dt>포항시 철거 지원금 적용</dt><dd>−700만 원</dd></div>
            </dl>
            <p>지원 적용 후 예상 본인 부담</p><strong className={styles.amount}>1,300만 원</strong>
            <p className={styles.note}>계산 기준: 포항시 철거 지원금 700만 원을 받는 경우를 가정했어요. 실제 사업 운영 여부·지원 금액·선정 조건은 해당 연도 공고 확인이 필요해요.</p>
            <details className={styles.feeBasis}><summary>신청 전 확인할 내용</summary><p>포항시 해당 연도 공고에서 대상 주택, 신청 기간, 필요한 서류와 철거 착수 시점을 확인하세요. 지원금 지급 방식과 지원 범위 밖의 비용도 확인한 뒤 최종 본인 부담액을 정하세요.</p></details>
          </section>
        </article>
        <article>
          <div className={styles.cardHead}><h3>수리</h3><span>다시 살거나 사용할 때</span></div>
          <p>상태 진단에 따른 예상 총 수리비</p><strong className={styles.amount}>{repairTotal.toLocaleString()}만 원</strong>
          <p>위 상태 진단에서 확인한 지붕·실내·외벽의 보수 항목을 합산했어요.</p>
          <dl className={styles.repairCosts}>{repairItems.map(item => <div key={item.area}><dt><strong>{item.area}</strong><span>{item.work}</span></dt><dd>{item.amount.toLocaleString()}만 원</dd></div>)}</dl>
          <p>지붕 누수를 먼저 막고, 실내를 충분히 말린 뒤 마감재를 교체하세요. 외벽은 손상 부위를 부분 보수해요.</p>
          <p className={styles.note}>항목별 금액은 비용 비교를 위해 설정한 계산 기준이며, 현장 견적 전 추정금액이에요. 실제 보수 면적·자재·추가 손상과 부가세 포함 여부를 확인해 최종 견적을 받아보세요.</p>
        </article>
        <article>
          <div className={styles.cardHead}><h3>매매</h3><span>현재 상태로 팔 때</span></div>
          <p>같은 대보리 · 연면적 {referenceDeal.floorArea}㎡ 주택의 거래가격</p>
          <strong className={styles.amount}>{referenceDeal.priceManwon.toLocaleString()}만 원</strong>
          <p>{referenceDeal.date} 계약 · 대지 {referenceDeal.landArea}㎡ · {referenceDeal.type}</p>
          <p className={styles.note}>내 집 66㎡와 연면적이 가장 가까운 확인 거래예요. 내 집의 예상가는 대지·도로·수리 상태를 비교한 뒤 정해요.</p>
          <details className={styles.feeBasis}>
            <summary>비교 거래·출처 보기</summary>
            <p>2025~2026년 대보리 단독주택 중 연면적 60~85㎡ · 조회 시 해제 표시 없는 거래 {market.deals.length}건에서 골랐어요.</p>
            <div className={styles.marketTableWrap} role="region" aria-label="대보리 단독주택 신고 거래 비교" tabIndex={0}>
              <table className={styles.marketTable}>
                <caption>{market.region} · 모두 직거래</caption>
                <thead><tr><th scope="col">계약일·위치</th><th scope="col">연면적</th><th scope="col">대지면적</th><th scope="col">신고금액</th></tr></thead>
                <tbody>{market.deals.map(deal => <tr key={deal.date}><th scope="row">{deal.date}<span>{deal.road} · {deal.jibun}</span></th><td>{deal.floorArea}㎡</td><td>{deal.landArea}㎡</td><td>{deal.priceManwon.toLocaleString()}만 원</td></tr>)}</tbody>
              </table>
            </div>
            <p>대지면적과 건물 상태·거래 조건이 달라 가격 차이가 있어요. 공개 지번이 일부 가려져 정확한 거리와 개별 필지는 확인하지 않았어요.</p>
            <a className={styles.evidenceLink} href={market.sourceUrl} target="_blank" rel="noopener noreferrer">국토교통부 단독·다가구 실거래 원문 ↗</a>
            <p className={styles.note}>조회: 경상북도 → 포항시 남구 → 호미곶면 → 대보리 · 매매 · 2025/2026년<br/>자료 확인 {market.checkedAt}</p>
          </details>
          <details className={styles.feeBasis}><summary>중개보수·거래비용 보기</summary><p>중개보수는 거래가격을 정한 뒤 계산해요. 경북 주택 매매 5천만 원 미만은 0.6%·한도 25만 원, 5천만 원 이상 2억 원 미만은 0.5%·한도 80만 원 이내에서 협의해요. 부가세와 세금·기타 거래비용은 별도로 확인하세요.</p><a href={market.commissionUrl} target="_blank" rel="noopener noreferrer">경상북도 공식 중개보수 안내 ↗</a></details>
        </article>
      </div>
    </section>
    <section id="next" className={styles.section} aria-labelledby="next-title">
      <div className={styles.heading}><span>03</span><h2 id="next-title">다음에는 무엇을 하면 되나요?</h2></div>
      <ol className={styles.steps}>
        <li><span>1</span><div><h3>수리할지, 팔지 먼저 정하세요.</h3><p>다시 살 예정이면 지붕·실내·외벽의 항목별 수리 견적을 받으세요. 사용 계획이 없다면 철거 전에 매도 상담부터 받으세요.</p></div></li>
        <li><span>2</span><div><h3>선택한 방향에 맞는 전문가를 연결해드려요.</h3><dl className={styles.contacts}><div><dt>수리</dt><dd>지붕·방수 · 실내·외벽 보수 업체</dd></div><div><dt>매매</dt><dd>지역 공인중개사</dd></div><div><dt>철거</dt><dd>철거업체 · 지자체 지원사업 담당자</dd></div></dl></div></li>
        <li><span>3</span><div><h3>최종 비용을 확인하고 진행하세요.</h3><p>진단서와 집 정보를 업체에 전달해 상담을 도와드려요. 공사 범위와 추가 비용을 확인한 뒤 계약하세요.</p></div></li>
      </ol>
    </section>
    <section id="consultation" className={styles.section + ' ' + styles.consultation} aria-labelledby="consultation-title">
      <div className={styles.heading}><span>04</span><h2 id="consultation-title">내 빈집의 다음 단계,<br/>전문가와 함께해요.</h2></div>
      <p className={styles.lead}>철거 견적이나 매도 상담이 필요하시면, 지역 전문가에게 상담을 요청해 보세요.</p>
      <ConsultationRequest/>
      <div className={styles.actions}><Link className={styles.home} href="/">← 홈으로</Link></div>
    </section>
  </main>
}
