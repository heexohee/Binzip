import { notFound } from 'next/navigation'
import { sbSelect } from '../../../src/supabase'
import { buildItems, buildPaths } from '../../../src/report-view'
import { VERDICT_DOTS, VERDICT_LABEL, type ApplicationRow, type ReportRow } from '../../admin/types'

export const dynamic = 'force-dynamic'
// 주소와 판정이 담긴다. 검색엔진에 색인되면 안 된다.
export const metadata = { title: '빈집 진단서', robots: { index: false, follow: false } }

type Row = ReportRow & { applications: ApplicationRow | null }

const GRADE_DESC: Record<string, string> = {
  possible: '서류와 현장에서 걸리는 것이 없습니다.',
  conditional: '먼저 정리할 것이 한두 가지 있습니다.',
  blocked: '지금 상태로는 어렵습니다. 그래도 다음에 할 일은 남아 있습니다.',
}

const ORDER = ['possible', 'conditional', 'blocked']

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

  const axes = rep.axes ?? null
  const facts = (axes as unknown as { facts?: Record<string, unknown> })?.facts ?? {}
  const items = buildItems(axes, facts, rep.note)
  const paths = buildPaths(rep.verdict, axes, facts, app.concern)
  const docNo = '제' + new Date(rep.created_at).getFullYear() + '-' + rep.id.slice(0, 4)
  const day = (s: string) => new Date(s).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <main className="doc mx-auto max-w-[820px] px-5 py-8 md:px-12 md:py-14">
      {/* ───────────── 1페이지 ───────────── */}
      <section className="page">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-4">
          <div>
            <h1 className="font-serif text-[27px] font-semibold text-ink">빈집이력서 진단서</h1>
            <p className="mt-2 text-[15px]">대상: {app.resolved_address || app.address}</p>
          </div>
          <div className="flex flex-col text-[13px] text-muted md:text-right">
            <span>확인일 {day(rep.issued_at ?? rep.created_at)}</span>
            <span>작성 정소희</span>
            <span>{docNo}호</span>
          </div>
        </header>

        <section className="mt-7">
          {ORDER.map((v) => {
            const on = rep.verdict === v
            return (
              <p key={v} className={on ? 'flex flex-wrap items-baseline gap-3' : 'mt-2 text-[17px] text-muted'}>
                <span className={on ? 'font-serif text-[23px] font-semibold text-deep' : ''}>
                  {on ? '●' : '○'} {VERDICT_LABEL[v]}
                </span>
                <span className={on ? 'text-[16px]' : ''}>— {GRADE_DESC[v]}</span>
              </p>
            )
          })}
          {items.some((i) => i.unverified) && (
            <p className="mt-5 rounded-[3px] bg-wash px-4 py-3 text-[14px] leading-[1.7]">
              점선으로 적힌 항목은 아직 확인하지 못한 것입니다. 확인되면 판정이 달라질 수 있습니다.
            </p>
          )}
        </section>

        <section className="mt-8">
          {items.map((it) => (
            <div
              key={it.no}
              className={
                'grid grid-cols-[24px_1fr] gap-x-[14px] py-[14px] md:grid-cols-[26px_118px_1fr] ' +
                (it.unverified ? 'border-t border-dashed border-dash' : 'border-t border-line')
              }
            >
              <span className={'font-serif text-[15px] ' + (it.unverified ? 'text-muted' : 'text-mid')}>
                {it.no}
              </span>
              <span className="text-[15px] text-muted md:col-auto">{it.label}</span>
              <div className="col-span-2 flex flex-col gap-1 md:col-auto">
                {it.lines.map((l, i) => (
                  <span key={i} className={'text-[16px] leading-[1.6] ' + (it.unverified ? 'text-muted' : '')}>
                    {l}
                  </span>
                ))}
                {it.source ? (
                  <span className="text-[13px] text-muted">{it.source}</span>
                ) : (
                  <span className="text-[13px] text-muted">미확인</span>
                )}
              </div>
            </div>
          ))}
          <p className="mt-4 border-t border-line pt-4 text-[13px] text-muted">
            실선 항목은 확인한 것이고, 점선 항목은 아직 확인하지 못한 것입니다.
          </p>
        </section>

        <footer className="mt-8 flex justify-between border-t border-line pt-4 text-[12px] text-muted">
          <span>빈집이력서 진단서 {docNo}호</span>
          <span>1 / 2</span>
        </footer>
      </section>

      {/* ───────────── 2페이지 ───────────── */}
      <section className="page mt-12 md:mt-16">
        <h2 className="font-serif text-[23px] font-semibold text-ink">이 집으로 할 수 있는 것</h2>
        <div className="mt-5">
          {paths.map((p) => (
            <div
              key={p.key}
              className={
                'grid grid-cols-1 gap-x-4 gap-y-2 border-t py-4 md:grid-cols-[100px_1fr] ' +
                (p.blocked ? 'border-dashed border-dash' : 'border-line')
              }
            >
              <h3
                className={
                  'font-serif text-[18px] font-semibold ' +
                  (p.blocked ? 'text-muted' : p.tone === 'earth' ? 'text-earth' : p.tone === 'deep' ? 'text-deep' : 'text-ink')
                }
              >
                {p.title}
              </h3>
              <div className="flex flex-col gap-1">
                {p.lines.map((l, i) => (
                  <span key={i} className={'text-[15px] leading-[1.7] ' + (p.blocked ? 'text-muted' : '')}>
                    {l}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <h2 className="mt-10 font-serif text-[20px] font-semibold text-ink">이 진단서가 못 하는 것</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            '세금은 판단하지 않습니다. 양도세·상속세는 세무사 상담이 필요합니다.',
            '등기부를 대신 열람하지 않습니다. 소유주 확인이 필요합니다.',
            '대출 가능 여부는 알 수 없습니다.',
            '집을 사거나 팔아드리지 않습니다. 지금은 판정만 합니다.',
          ].map((t) => (
            <p key={t} className="rounded-[3px] border border-dashed border-dash px-4 py-3 text-[15px] leading-[1.7] text-muted">
              {t}
            </p>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[4px] bg-ink px-5 py-4">
          <div className="flex flex-col gap-1">
            <span className="font-serif text-[17px] font-semibold text-paper">이 정보가 틀렸어요</span>
            <span className="text-[14px] text-pale">
              틀린 항목을 알려주시면 다시 확인해서 고친 진단서를 보내드립니다.
            </span>
          </div>
          <span className="rounded-[6px] bg-pale px-4 py-2 text-[15px] font-semibold text-ink">
            010-7428-2624
          </span>
        </div>

        <footer className="mt-8 border-t border-line pt-4">
          <p className="max-w-[70ch] text-[12px] leading-[1.7] text-muted">
            본 서비스는 공개된 공적 자료와 현장 확인을 근거로 빈집의 처분 가능성을 정리해 제공하며,
            중개대상물의 표시·광고나 거래 알선을 하지 않습니다. 판정은 확인 시점의 자료에 근거하며
            이후 사정 변경에 따라 달라질 수 있습니다.
          </p>
          <div className="mt-3 flex justify-between text-[12px] text-muted">
            <span>빈집이력서 진단서 {docNo}호 · 작성 정소희 · {day(rep.issued_at ?? rep.created_at)}</span>
            <span>2 / 2</span>
          </div>
        </footer>
      </section>
    </main>
  )
}
