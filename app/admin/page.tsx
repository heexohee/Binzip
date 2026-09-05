import Link from 'next/link'
import { sbSelect } from '../../src/supabase'
import { VERDICT_LABEL, type ApplicationRow, type ReportRow } from './types'

export const dynamic = 'force-dynamic'
export const metadata = { title: '검토 — 빈집이력서', robots: { index: false, follow: false } }

type Row = ApplicationRow & { reports: ReportRow[] }

const badge = (status?: string) =>
  status === 'issued'
    ? { text: '발송 완료', cls: 'border-mid bg-deep text-paper' }
    : status === 'failed'
      ? { text: '판정 실패', cls: 'border-earth text-earth' }
      : status === 'draft'
        ? { text: '검토 대기', cls: 'border-mid text-mid' }
        : { text: '판정 없음', cls: 'border-dash border-dashed text-muted' }

export default async function AdminList() {
  const rows = await sbSelect<Row>(
    'applications?select=*,reports(id,status,verdict,version,created_at)&order=created_at.desc&limit=100',
  )

  const latest = (r: Row) =>
    [...(r.reports ?? [])].sort((a, b) => b.version - a.version)[0]

  const waiting = rows.filter((r) => latest(r)?.status !== 'issued')
  const done = rows.filter((r) => latest(r)?.status === 'issued')

  const Section = ({ title, items }: { title: string; items: Row[] }) => (
    <section className="mt-10">
      <h2 className="text-[20px]">
        {title} <span className="text-[15px] font-normal text-muted">{items.length}건</span>
      </h2>
      {items.length === 0 ? (
        <p className="mt-4 text-[15px] text-muted">아직 없습니다.</p>
      ) : (
        <div className="mt-4 border-t border-line">
          {items.map((r) => {
            const rep = latest(r)
            const b = badge(rep?.status)
            return (
              <Link
                key={r.id}
                href={'/admin/' + r.id}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-line py-4 hover:bg-wash"
              >
                <span className={'rounded-[3px] border px-2 py-[2px] text-[12px] ' + b.cls}>
                  {b.text}
                </span>
                <span className="text-[16px] font-semibold">
                  {r.resolved_address || r.address}
                </span>
                {rep?.verdict && (
                  <span className="text-[14px] text-mid">{VERDICT_LABEL[rep.verdict]}</span>
                )}
                {r.concern && <span className="text-[13px] text-muted">걱정: {r.concern}</span>}
                <span className="ml-auto text-[13px] text-muted">
                  {new Date(r.created_at).toLocaleString('ko-KR')}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )

  return (
    <main className="mx-auto max-w-[900px] px-6 py-12">
      <p className="text-[13px] text-muted">빈집이력서 · 관리자</p>
      <h1 className="mt-2 text-[32px]">진단 신청 검토</h1>
      <p className="mt-3 max-w-[60ch] text-[15px] leading-[1.75] text-muted">
        자동 판정은 초안일 뿐입니다. 현장을 확인하고 승인해야 사용자에게 나갑니다.
      </p>
      <Section title="검토 대기" items={waiting} />
      <Section title="발송 완료" items={done} />
    </main>
  )
}
