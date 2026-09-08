import { buildAxisBlocks, buildPaths, buildSupports } from '../../src/report-view'
import { VERDICT_LABEL, type ApplicationRow, type ReportRow } from '../admin/types'

const GRADE_DESC: Record<string, string> = {
  possible: '서류와 현장에서 걸리는 것이 없습니다.',
  conditional: '먼저 정리할 것이 한두 가지 있습니다.',
  precondition: '절차 하나를 먼저 밟으시면 나머지가 열립니다.',
  blocked: '지금 상태로는 어렵습니다. 그래도 다음에 할 일은 남아 있습니다.',
}

const ORDER = ['possible', 'conditional', 'precondition', 'blocked']

/**
 * 진단서 본문. 공개 라우트(/report/[id])와 관리자 미리보기가 같은 화면을 쓴다.
 * 두 벌로 만들면 미리보기에서 본 것과 실제 나가는 것이 달라진다.
 */
export function ReportDoc({ rep, app }: { rep: ReportRow; app: ApplicationRow }) {
  const axes = rep.axes ?? null
  const facts = (axes as unknown as { facts?: Record<string, unknown> })?.facts ?? {}
  const registry = { note: rep.registry_note, checkedAt: rep.registry_checked_at }
  const blocks = buildAxisBlocks(axes, facts, rep.note, registry)
  const anyUnverified = blocks.some((b) => b.items.some((i) => i.unverified))
  const paths = buildPaths(rep.verdict, axes, facts, app.concern, registry)
  const supports = buildSupports(facts)
  const docNo = '제' + new Date(rep.created_at).getFullYear() + '-' + rep.id.slice(0, 4)
  const day = (s: string) =>
    new Date(s).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

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
          {anyUnverified && (
            <p className="mt-5 rounded-[3px] border-l-[3px] border-dash bg-wash px-4 py-3 text-[14px] leading-[1.7]">
              아직 확인하지 못한 항목이 있습니다. 확인되면 판정이 달라질 수 있습니다.
            </p>
          )}
        </section>

        <section className="mt-8">
          {blocks.map((b) => (
            <div
              key={b.axis}
              className={
                'mt-7 first:mt-0 break-inside-avoid ' +
                // 스펙 §5.1 사전 결정 — 넘치면 ④시장·관리를 2페이지로 내린다
                (b.axis === 'market' ? 'break-before-page' : '')
              }
            >
              {/* 축 헤더가 판정을 진다. 훑는 사람은 이 4줄만 봐도 된다 */}
              <div className="flex items-baseline justify-between border-b border-mid pb-2">
                <h2 className="font-serif text-[18px] font-semibold text-ink">{b.label}</h2>
                <span className="text-[13px] text-muted">{b.badge}</span>
              </div>

              {b.items.map((it, n) => (
                <div
                  key={b.axis + n}
                  className={
                    'mt-2 grid grid-cols-1 gap-x-[14px] border-l-[3px] py-[12px] pl-4 md:grid-cols-[118px_1fr] ' +
                    // 확인 여부를 선 모양이 아니라 면과 바 굵기로 가른다.
                    // 점선은 한눈에 안 들어오고 인쇄에서 더 흐려진다.
                    (it.unverified ? 'border-dash bg-wash' : 'border-mid bg-paper')
                  }
                >
                  <span className="text-[15px] text-muted">{it.label}</span>
                  <div className="flex flex-col gap-1">
                    {it.lines.map((l, i) => (
                      <span
                        key={i}
                        className={'text-[16px] leading-[1.6] ' + (it.unverified ? 'text-muted' : '')}
                      >
                        {l}
                      </span>
                    ))}
                    {it.unverified ? (
                      // 시각 부호보다 글자가 확실하다. 주 독자가 40~70대다.
                      <span className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-[3px] bg-pale px-2 py-[2px] text-[12px] font-semibold text-ink">
                          아직 확인하지 못함
                        </span>
                        <span className="text-[13px] text-muted">{it.source ?? '출처 없음'}</span>
                      </span>
                    ) : (
                      it.source && <span className="mt-1 text-[13px] text-muted">{it.source}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
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
                'mt-2 grid grid-cols-1 gap-x-4 gap-y-2 border-l-[3px] py-4 pl-4 md:grid-cols-[100px_1fr] ' +
                (p.blocked ? 'border-dash bg-wash' : 'border-line bg-paper')
              }
            >
              <h3
                className={
                  'flex flex-wrap items-center gap-2 font-serif text-[18px] font-semibold ' +
                  (p.blocked ? 'text-muted' : p.tone === 'earth' ? 'text-earth' : p.tone === 'deep' ? 'text-deep' : 'text-ink')
                }
              >
                {p.title}
                {p.blocked && (
                  <span className="rounded-[3px] bg-pale px-2 py-[2px] font-sans text-[12px] font-semibold text-ink">
                    지금은 어려움
                  </span>
                )}
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

        {supports.length > 0 && (
          <>
            <h2 className="mt-10 font-serif text-[20px] font-semibold text-ink">
              지금 받으실 수 있는 지원
            </h2>
            <p className="mt-2 text-[15px] leading-[1.7] text-muted">
              제도가 부처별로 흩어져 있어 한 번에 보기 어렵습니다. 이 집에 해당되는 것만 모았습니다.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {supports.map((sp) => (
                <div
                  key={sp.title}
                  className="break-inside-avoid rounded-[4px] border-l-[3px] border-mid bg-paper py-[14px] pl-4 pr-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="font-serif text-[17px] font-semibold text-ink">{sp.title}</span>
                    <span className="text-[16px] font-semibold text-deep">
                      {sp.capText ?? (sp.cap != null ? `최대 ${(sp.cap / 10000).toLocaleString('ko-KR')}만원` : '')}
                    </span>
                  </div>
                  {sp.lines.map((l, i) => (
                    <p key={i} className="mt-2 text-[15px] leading-[1.7]">
                      {l}
                    </p>
                  ))}
                  {/* 놓치면 손해 보는 조건은 흘려 읽히면 안 된다. 면으로 가른다 */}
                  {sp.warn && (
                    <p className="mt-2 rounded-[3px] bg-wash px-3 py-2 text-[15px] leading-[1.7] text-earth">
                      {sp.warn}
                    </p>
                  )}
                  <p className="mt-2 text-[13px] text-muted">신청 · {sp.where}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[13px] leading-[1.7] text-muted">
              금액은 제도상 상한이며 실제 지원액은 심사에 따라 달라집니다. 예산이 소진되면 접수가 마감됩니다.
            </p>
          </>
        )}

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
