import Link from 'next/link'
import { notFound } from 'next/navigation'
import { sbSelect } from '../../../../src/supabase'
import { ReportDoc } from '../../../report/report-doc'
import type { ApplicationRow, ReportRow } from '../../types'

export const dynamic = 'force-dynamic'
export const metadata = { title: '진단서 미리보기', robots: { index: false, follow: false } }

type Row = ApplicationRow & { reports: ReportRow[] }

/**
 * 관리자 미리보기.
 * /admin 아래라 미들웨어가 이미 막고 있어 별도 인증이 필요 없다.
 * 공개 라우트와 달리 status 를 가리지 않는다 — 승인 전에 무엇이 나갈지 봐야 하니까.
 */
export default async function Preview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await sbSelect<Row>('applications?select=*,reports(*)&id=eq.' + id)
  const app = rows[0]
  if (!app) notFound()

  const rep = [...(app.reports ?? [])].sort((a, b) => b.version - a.version)[0]
  if (!rep) notFound()

  const issued = rep.status === 'issued'

  return (
    <>
      {/* 인쇄에는 나가지 않는다 — 진단서 자체가 아니다 */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 bg-ink px-5 py-3 text-[14px] text-pale print:hidden">
        <Link href={'/admin/' + app.id} className="text-mid hover:text-pale">← 검토</Link>
        <span className={issued ? 'font-semibold text-paper' : 'font-semibold text-pale'}>
          {issued ? '발송 가능 — 사용자가 보는 것과 같습니다' : '미리보기 — 아직 발송되지 않았습니다'}
        </span>
        <span className="text-dash">v{rep.version} · {rep.status}</span>
        {issued && (
          <Link href={'/report/' + rep.id} className="ml-auto text-mid hover:text-pale">
            공개 링크로 열기 ↗
          </Link>
        )}
      </div>
      <ReportDoc rep={rep} app={app} />
    </>
  )
}
