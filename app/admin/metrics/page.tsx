import Link from 'next/link'
import { requireAdmin } from '../../../src/admin-auth'
import type { Count } from '../../../src/demand-metrics'
import { AdminFrame } from '../admin-frame'
import { LogoutButton } from '../logout-button'
import styles from '../admin.module.css'
import m from './metrics.module.css'
import { loadDemandMetrics } from './load'

export const dynamic = 'force-dynamic'
export const metadata = { title: '수요 지표 — 빈집진단서', robots: { index: false, follow: false }, referrer: 'no-referrer' as const }

function Table({ title, rows, empty = '아직 응답이 없어요.' }: { title: string; rows: Count[]; empty?: string }) {
  const max = Math.max(1, ...rows.map(r => r.count))
  return <section className={m.card}><h3>{title}</h3>{rows.length ? <table><tbody>{rows.map(r => <tr key={r.key}><td>{r.key}<span className={m.bar} style={{ width: `${(r.count / max) * 100}%` }} /></td><td>{r.count}</td></tr>)}</tbody></table> : <p className={m.note}>{empty}</p>}</section>
}

export default async function MetricsPage() {
  await requireAdmin()
  const { summary, error } = await loadDemandMetrics()
  return <AdminFrame navigation={<LogoutButton />}>
    <Link href="/admin">← 진단 신청 관리</Link>
    <h1>수요 지표</h1>
    <p className={m.note}>현재 보관 중인(접수 6개월 이내) 응답만 집계해요. 오래된 응답은 자동으로 삭제되니, 사업계획서에 쓸 숫자는 아래 버튼으로 주기적으로 내려받아 두세요. 내려받는 파일에는 연락처가 들어 있지 않아요. 방문자 수는 Vercel 대시보드의 Analytics에서 확인해요.</p>
    {!summary ? <section className={styles.panel}><h2>지표를 확인할 수 없어요</h2><p className={styles.description}>{error}</p></section> : <div className={m.sections}>
      <section className={m.section} aria-labelledby="diagnosis-metrics">
        <div className={m.sectionHead}>
          <div><h2 id="diagnosis-metrics">빈집 진단</h2><p className={m.note}>무료 시범 진단에 들어온 신청이에요.</p></div>
          <a className={styles.button} href="/admin/metrics/export?kind=diagnosis">진단 CSV 내려받기</a>
        </div>
        <div className={m.kpis}>
          <div className={m.kpi}><strong>{summary.applications.total}</strong><span>진단 신청</span></div>
          <div className={m.kpi}><strong>{summary.applications.interviewOk}</strong><span>인터뷰·방문 연락 동의</span></div>
          <div className={m.kpi}><strong>{summary.applications.withPhotos}</strong><span>사진 첨부</span></div>
        </div>
        {!summary.applications.hasAnswers && <p className={styles.notice}>신청 답변을 집계하지 못해 신청 수·시도·주차만 보여요. 사진 마이그레이션(20260911)이 적용됐는지 확인해 주세요.</p>}
        <div className={m.tables}>
          <Table title="시도" rows={summary.applications.byProvince} />
          <Table title="주차" rows={summary.applications.byWeek} />
          <Table title="궁금한 내용 (여러 개 선택)" rows={summary.applications.byConcern} />
          <Table title="소유관계" rows={summary.applications.byOwnership} />
          <Table title="가족·공동 소유자 협의 (공동 소유·상속 정리 중만)" rows={summary.applications.byAgreement} />
          <Table title="최근 집 상태" rows={summary.applications.byHouseCondition} />
        </div>
      </section>
      <section className={m.section} aria-labelledby="care-metrics">
        <div className={m.sectionHead}>
          <div><h2 id="care-metrics">빈집 관리 설문</h2><p className={m.note}>준비 중인 관리 서비스에 대한 의견이에요. 가격·이용 의향은 의견이니 구매 의사나 계약으로 표현하지 마세요.</p></div>
          <a className={styles.button} href="/admin/metrics/export?kind=care">설문 CSV 내려받기</a>
        </div>
        <div className={m.kpis}>
          <div className={m.kpi}><strong>{summary.interests.total}</strong><span>설문 응답</span></div>
          <div className={m.kpi}><strong>{summary.interests.interviewOk}</strong><span>인터뷰·시범 방문 연락 수락</span></div>
          <div className={m.kpi}><strong>{summary.interests.phoneExplanation}</strong><span>전화 설명 요청</span></div>
        </div>
        {!summary.interests.hasExtendedAnswers && <p className={styles.notice}>설문 추가 문항(상속·방문·가격 범위·인터뷰)을 저장하려면 데이터베이스 업데이트(20261031 마이그레이션)가 필요해요.</p>}
        <div className={m.tables}>
          <Table title="유입 경로" rows={summary.interests.bySource} />
          <Table title="시도" rows={summary.interests.byProvince} />
          <Table title="시군" rows={summary.interests.byRegion} />
          <Table title="주차" rows={summary.interests.byWeek} />
          <Table title="소유자 거주" rows={summary.interests.byResidence} />
          <Table title="소유자가 사는 시도 (다른 시·군)" rows={summary.interests.byOwnerProvince} />
          <Table title="고민 방향" rows={summary.interests.byIntent} />
          <Table title="월 최대 금액" rows={summary.interests.byBudget} />
          <section className={m.card}><h3>금액별 이용 의향</h3>{summary.interests.willingness.base ? <table><tbody>{summary.interests.willingness.rows.map(w => <tr key={w.key}><td>{w.key}<span className={m.bar} style={{ width: `${w.percent}%` }} /></td><td>{w.percent}%<br /><small>{w.count}명</small></td></tr>)}</tbody></table> : <p className={m.note}>아직 응답이 없어요.</p>}<p className={m.note}>최대 금액이 그 금액 이상인 응답의 비율이에요(응답 {summary.interests.willingness.base}명, '아직 모르겠어요' 제외). 구간의 위쪽 끝으로 계산해서 실제보다 조금 높게 나올 수 있어요.</p></section>
          <Table title="필요한 관리" rows={summary.interests.byService} />
          <Table title="상속 정리" rows={summary.interests.byInheritance} />
          <Table title="마지막 방문" rows={summary.interests.byLastVisit} />
          <Table title="현재 관리 비용" rows={summary.interests.byCurrentSpend} />
          <section className={m.card}><h3>가격 범위 (이전 방식 응답, 월·만 원)</h3><table><tbody>{summary.interests.prices.map(p => <tr key={p.key}><td>{p.label}<br /><small>응답 {p.n}</small></td><td>{p.median ?? '-'}<br /><small>{p.p25 ?? '-'}~{p.p75 ?? '-'}</small></td></tr>)}</tbody></table><p className={m.note}>오른쪽 큰 숫자는 중앙값, 아래는 25~75% 범위예요.</p></section>
        </div>
      </section>
    </div>}
  </AdminFrame>
}
