import Link from 'next/link'
import { requireAdmin } from '../../src/admin-auth'
import { summarizeApplication, type AdminApplication } from '../../src/admin-workflow'
import { sbSelect, supabaseConfigured } from '../../src/supabase'
import { AdminFrame, AdminTitle } from './admin-frame'
import { ApplicationList } from './application-list'
import { LogoutButton } from './logout-button'
import styles from './admin.module.css'

export const dynamic = 'force-dynamic'
export const metadata = { title: '신청 관리 — 빈집진단서', robots: { index: false, follow: false }, referrer: 'no-referrer' as const }

export default async function AdminList() {
  await requireAdmin()
  let rows: AdminApplication[] = []
  let error = !supabaseConfigured() ? '접수 데이터베이스가 연결되지 않았어요. 연결 후 실제 신청을 조회하고 저장할 수 있습니다.' : ''
  if (!error) {
    try {
      rows = await sbSelect<AdminApplication>('applications?select=*,reports(id,status,version,created_at)&order=created_at.desc&expires_at=gt.' + encodeURIComponent(new Date().toISOString()) + '&limit=100')
    } catch { error = '신청 목록을 불러오지 못했어요. 데이터 연결 상태를 확인한 뒤 새로고침해 주세요.' }
  }
  return <AdminFrame navigation={<LogoutButton />}><AdminTitle />
    {error ? <section className={styles.panel}><h2>신청 목록을 확인할 수 없어요</h2><p className={styles.description}>{error}</p><div className={styles.actions}><Link href="/admin" className={styles.secondary}>다시 불러오기</Link><Link href="/admin-preview" className={styles.button}>가상 신청으로 화면 둘러보기</Link></div></section> : <>
      {rows.some(row => row.review_status === undefined) && <p className={styles.notice}>관리 상태 저장을 위한 데이터베이스 업데이트가 필요합니다. 기존 신청 내용과 진단서는 확인할 수 있습니다.</p>}
      <ApplicationList rows={rows.map(summarizeApplication)} />
    </>}
  </AdminFrame>
}
