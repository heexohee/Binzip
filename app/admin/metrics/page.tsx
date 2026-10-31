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
    <p className={m.note}>현재 보관 중인(접수 6개월 이내) 응답만 집계해요. 오래된 응답은 자동으로 삭제되니, 사업계획서에 쓸 숫자는 아래 버튼으로 주기적으로 내려받아 두세요. 내려받는 파일에는 연락처가 들어 있지 않아요.</p>
    <p className={m.note}>설문의 가격·이용 의향은 의견이에요. 구매 의사나 계약으로 표현하지 마세요. 방문자 수는 Vercel 대시보드의 Analytics에서 확인해요.</p>
    {!summary ? <section className={styles.panel}><h2>지표를 확인할 수 없어요</h2><p className={styles.description}>{error}</p></section> : <div className={m.grid}>
      <div className={styles.actions}><a className={styles.button} href="/admin/metrics/export">집계 CSV 내려받기</a></div>
      <div className={m.kpis}>
        <div className={m.kpi}><strong>{summary.applications.total}</strong><span>진단 신청</span></div>
        <div className={m.kpi}><strong>{summary.interests.total}</strong><span>관리 설문 응답</span></div>
        <div className={m.kpi}><strong>{summary.interests.interviewOk}</strong><span>인터뷰·시범 방문 연락 수락</span></div>
        <div className={m.kpi}><strong>{summary.interests.phoneExplanation}</strong><span>전화 설명 요청</span></div>
      </div>
      {!summary.interests.hasExtendedAnswers && <p className={styles.notice}>설문 추가 문항(상속·방문·가격 범위·인터뷰)을 저장하려면 데이터베이스 업데이트(20261031 마이그레이션)가 필요해요.</p>}
      <div className={m.tables}>
        <Table title="진단 신청 · 시도" rows={summary.applications.byProvince} />
        <Table title="진단 신청 · 주차" rows={summary.applications.byWeek} />
        <Table title="설문 · 유입 경로" rows={summary.interests.bySource} />
        <Table title="설문 · 시도" rows={summary.interests.byProvince} />
        <Table title="설문 · 시군" rows={summary.interests.byRegion} />
        <Table title="설문 · 주차" rows={summary.interests.byWeek} />
        <Table title="설문 · 소유자 거주" rows={summary.interests.byResidence} />
        <Table title="설문 · 소유자가 사는 시도 (다른 시·군)" rows={summary.interests.byOwnerProvince} />
        <Table title="설문 · 고민 방향" rows={summary.interests.byIntent} />
        <Table title="설문 · 월 최대 금액" rows={summary.interests.byBudget} />
        <section className={m.card}><h3>금액별 이용 의향</h3>{summary.interests.willingness.base ? <table><tbody>{summary.interests.willingness.rows.map(w => <tr key={w.key}><td>{w.key}<span className={m.bar} style={{ width: `${w.percent}%` }} /></td><td>{w.percent}%<br /><small>{w.count}명</small></td></tr>)}</tbody></table> : <p className={m.note}>아직 응답이 없어요.</p>}<p className={m.note}>최대 금액이 그 금액 이상인 응답의 비율이에요(응답 {summary.interests.willingness.base}명, '아직 모르겠어요' 제외). 구간의 위쪽 끝으로 계산해서 실제보다 조금 높게 나올 수 있어요.</p></section>
        <Table title="설문 · 필요한 관리" rows={summary.interests.byService} />
        <Table title="설문 · 상속 정리" rows={summary.interests.byInheritance} />
        <Table title="설문 · 마지막 방문" rows={summary.interests.byLastVisit} />
        <Table title="설문 · 현재 관리 비용" rows={summary.interests.byCurrentSpend} />
        <section className={m.card}><h3>가격 범위 (이전 방식 응답, 월·만 원)</h3><table><tbody>{summary.interests.prices.map(p => <tr key={p.key}><td>{p.label}<br /><small>응답 {p.n}</small></td><td>{p.median ?? '-'}<br /><small>{p.p25 ?? '-'}~{p.p75 ?? '-'}</small></td></tr>)}</tbody></table><p className={m.note}>오른쪽 큰 숫자는 중앙값, 아래는 25~75% 범위예요.</p></section>
      </div>
    </div>}
  </AdminFrame>
}
