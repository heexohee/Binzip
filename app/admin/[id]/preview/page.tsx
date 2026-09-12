import Link from 'next/link'
import styles from '../../admin.module.css'
import { notFound } from 'next/navigation'
import { sbSelect } from '../../../../src/supabase'
import { ReportDoc } from '../../../report/report-doc'
import type { ApplicationRow, ReportRow } from '../../types'
import { requireAdmin } from '../../../../src/admin-auth'
import { UUID_PATTERN } from '../../../../src/photo-limits'

export const dynamic = 'force-dynamic'
export const metadata = { title: '진단서 미리보기', robots: { index: false, follow: false } }

type Row = ApplicationRow & { reports: ReportRow[] }

/**
 * 관리자 미리보기.
 * 미들웨어와 서버 양쪽에서 관리자 인증을 확인한다.
 * 공개 라우트와 달리 status 를 가리지 않는다 — 승인 전에 무엇이 나갈지 봐야 하니까.
 */
export default async function Preview({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  if (!UUID_PATTERN.test(id)) notFound()
  const rows = await sbSelect<Row>('applications?select=*,reports(*)&id=eq.' + id + '&expires_at=gt.' + encodeURIComponent(new Date().toISOString()))
  const app = rows[0]
  if (!app) notFound()

  const rep = [...(app.reports ?? [])].sort((a, b) => b.version - a.version)[0]
  if (!rep) notFound()

  const issued = rep.status === 'issued'

  return (
    <>
      {/* 인쇄에는 나가지 않는다 — 진단서 자체가 아니다 */}
      <div className={styles.previewBar}>
        <Link href={'/admin/' + app.id} >← 검토</Link>
        <span className="font-semibold">
          {issued ? '발송 가능 — 사용자가 보는 것과 같습니다' : '미리보기 — 아직 발송되지 않았습니다'}
        </span>
        <span >v{rep.version} · {rep.status}</span>
        {issued && (
          <Link href={'/report/' + rep.id} className="ml-auto">
            공개 링크로 열기 ↗
          </Link>
        )}
      </div>
      <ReportDoc rep={rep} app={app} />
    </>
  )
}
