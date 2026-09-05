import { notFound } from 'next/navigation'
import { sbSelect } from '../../../src/supabase'
import { ReportDoc } from '../report-doc'
import type { ApplicationRow, ReportRow } from '../../admin/types'

export const dynamic = 'force-dynamic'
// 주소와 판정이 담긴다. 검색엔진에 색인되면 안 된다.
export const metadata = { title: '빈집 진단서', robots: { index: false, follow: false } }

type Row = ReportRow & { applications: ApplicationRow | null }

export default async function Report({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const rows = await sbSelect<Row>('reports?select=*,applications(*)&id=eq.' + id)
  const rep = rows[0]
  // 승인된 것만 공개한다. 초안과 실패는 존재하지 않는 것처럼 둔다.
  if (!rep || rep.status !== 'issued') notFound()

  const app = rep.applications
  if (!app) notFound()
  if (new Date(app.expires_at) < new Date()) notFound()

  return <ReportDoc rep={rep} app={app} />
}
