import Link from 'next/link'
import { AdminFrame } from '../admin-frame'
import { LoginForm } from './login-form'
import styles from '../admin.module.css'

export const dynamic = 'force-dynamic'
export const metadata = { title: '관리자 로그인 — 빈집진단서', robots: { index: false, follow: false }, referrer: 'no-referrer' as const }

export default function AdminLogin() {
  return <AdminFrame><section className={`${styles.panel} ${styles.setup}`}><p className={styles.eyebrow}>빈집진단서 · 운영자 전용</p><h1>관리자 로그인</h1><p>접수된 신청과 사진, 고객 연락처는 로그인한 관리자만 확인할 수 있어요.</p>
    {process.env.ADMIN_TOKEN ? <LoginForm /> : <div className={styles.notice}><strong>관리자 접근 설정이 필요해요</strong>운영 환경에 ADMIN_TOKEN을 설정하면 로그인할 수 있습니다. 지금은 가상 데이터로 화면을 먼저 확인할 수 있어요.</div>}
    <div className={styles.actions}><Link href="/admin-preview" className={styles.secondary}>관리자 화면 미리보기</Link></div>
  </section></AdminFrame>
}
