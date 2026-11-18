import Link from 'next/link'
import { requireAdmin } from '../../../src/admin-auth'
import { toInterestCard, type InterestRow } from '../../../src/admin-interests'
import { sbSelect, supabaseConfigured } from '../../../src/supabase'
import { AdminFrame } from '../admin-frame'
import { LogoutButton } from '../logout-button'
import { InterestList } from './interest-list'
import styles from '../admin.module.css'

export const dynamic = 'force-dynamic'
export const metadata = { title: '관리 신청 관리 — 빈집진단서', robots: { index: false, follow: false }, referrer: 'no-referrer' as const }

export default async function Page() {
  await requireAdmin()
  let rows: InterestRow[] = [], error = ''
  try {
    if (!supabaseConfigured()) throw new Error('NOT_CONFIGURED')
    rows = await sbSelect<InterestRow>('care_interests?select=*&expires_at=gt.' + encodeURIComponent(new Date().toISOString()) + '&order=created_at.desc&limit=500')
  } catch { error = '관리 신청을 불러오지 못했어요. 데이터 연결 상태를 확인한 뒤 새로고침해 주세요.' }
  return <AdminFrame navigation={<><Link href="/admin">진단 신청</Link><Link href="/admin/metrics">수요 지표</Link><LogoutButton /></>}>
    <div className={styles.titleRow}><div><p className={styles.eyebrow}>최근 500건 · 보관 기간 안의 기록</p><h1 tabIndex={-1} className={styles.title}>관리 신청</h1><p className={styles.description}>새 신청부터 전화로 연락하고, 진행 상태를 바꿔 두세요. 상태는 고르는 즉시 저장돼요.</p></div></div>
    {error ? <section className={styles.panel}><h2>목록을 확인할 수 없어요</h2><p className={styles.description}>{error}</p><div className={styles.actions}><Link href="/admin/interests" className={styles.secondary}>다시 불러오기</Link></div></section>
      : <InterestList cards={rows.map(toInterestCard)} />}
  </AdminFrame>
}
