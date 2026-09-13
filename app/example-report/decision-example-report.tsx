import Link from 'next/link'
import styles from './decision-example.module.css'

export function DecisionExampleReport() {
  return <main className={styles.report} data-report>
    <section id="condition" className={styles.section} aria-labelledby="condition-title">
      <div className={styles.heading}><span>01</span><h1 id="condition-title">지금 집은 어떤 상태인가요?</h1></div>
      <p className={styles.case}>진단서 예시 · 가상 주택 66㎡</p>
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
        <article><div className={styles.cardHead}><h3>철거</h3><span>집을 없애고 정리할 때</span></div><p>예상 철거·정리비</p><strong className={styles.amount}>2,000만 원</strong><p>건물 철거와 폐기물 처리를 포함한 금액이에요.</p></article>
        <article><div className={styles.cardHead}><h3>수리</h3><span>다시 살거나 사용할 때</span></div><p>예상 지붕 수리비</p><strong className={styles.amount}>500만 원</strong><p>파손 기와 교체와 방수 작업 기준이에요. 실내·외벽 보수비는 별도예요.</p></article>
        <article><div className={styles.cardHead}><h3>매매</h3><span>현재 상태로 팔 때</span></div><p>예상 매매가</p><strong className={styles.amount}>2,000만 원</strong><dl className={styles.fees}><div><dt>예상 중개수수료</dt><dd>최대 12만 원</dd></div><div><dt>기타 거래비용·세금</dt><dd>서류 확인 후 산정</dd></div></dl><p>매매가에서 채무·세금·거래비용을 빼면 내게 남는 돈이에요.</p><details className={styles.feeBasis}><summary>중개수수료 계산 근거</summary><p>주택 매매 기준으로 2,000만 원 × 상한요율 0.6% = 12만 원이에요. 한도액 25만 원보다 작아 12만 원이 상한이며, 실제 보수는 이 범위에서 협의해요. 부가세는 별도예요.</p><a href="https://land.seoul.go.kr/land/broker/brokerageCommission.do" target="_blank" rel="noopener noreferrer">서울시 주택 중개보수 요율표 ↗</a><p>예시는 위 요율표를 적용했어요. 실제 계산에는 소재지 조례와 주택·토지 등 거래 대상 구분을 확인해요.</p></details></article>
      </div>
      <p className={styles.note}>가상 주택의 진단·금액 예시예요. 실제 비용은 공사 범위와 거래 조건에 따라 달라져요.</p>
    </section>
    <section id="next" className={styles.section} aria-labelledby="next-title">
      <div className={styles.heading}><span>03</span><h2 id="next-title">다음에는 무엇을 하면 되나요?</h2></div>
      <ol className={styles.steps}>
        <li><span>1</span><div><h3>수리할지, 팔지 먼저 정하세요.</h3><p>다시 살 예정이면 지붕 수리 견적을 받으세요. 사용 계획이 없다면 철거 전에 매도 상담부터 받으세요.</p></div></li>
        <li><span>2</span><div><h3>선택한 방향에 맞는 전문가를 연결해드려요.</h3><dl className={styles.contacts}><div><dt>수리</dt><dd>지붕·방수 업체</dd></div><div><dt>매매</dt><dd>지역 공인중개사</dd></div><div><dt>철거</dt><dd>철거업체 · 지자체 지원사업 담당자</dd></div></dl></div></li>
        <li><span>3</span><div><h3>최종 비용을 확인하고 진행하세요.</h3><p>진단서와 집 정보를 업체에 전달해 상담을 도와드려요. 공사 범위와 추가 비용을 확인한 뒤 계약하세요.</p></div></li>
      </ol>
      <Link className={styles.home} href="/">← 홈으로</Link>
    </section>
  </main>
}
