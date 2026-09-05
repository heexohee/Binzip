import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { sbSelect } from '../../../src/supabase'
import { approveReport, revertReport, rerunJudgment, saveNote, saveRegistry } from '../actions'
import {
  AXIS_LABEL, VERDICT_DOTS, VERDICT_LABEL,
  type ApplicationRow, type ReportRow,
} from '../types'

export const dynamic = 'force-dynamic'
export const metadata = { title: '검토 — 빈집이력서', robots: { index: false, follow: false } }

type Row = ApplicationRow & { reports: ReportRow[] }

const V_TONE: Record<string, string> = {
  clear: 'text-mid',
  unknown: 'text-muted',
  suspect: 'text-earth',
  blocked: 'text-earth',
}
const V_TEXT: Record<string, string> = {
  clear: '확인됨', unknown: '미확인', suspect: '의심', blocked: '막힘',
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex gap-3 border-b border-line py-2 text-[15px]">
      <span className="w-[112px] flex-none text-muted">{label}</span>
      <span className={value ? '' : 'text-muted'}>{value || '— 적지 않음'}</span>
    </div>
  )
}

export default async function Review({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await sbSelect<Row>('applications?select=*,reports(*)&id=eq.' + id)
  const app = rows[0]
  if (!app) notFound()

  const report = [...(app.reports ?? [])].sort((a, b) => b.version - a.version)[0]

  // 수동 발송용 절대 URL. 도메인이 준비되기 전까지는 이걸 복사해 보낸다.
  const h = await headers()
  const origin =
    (h.get('x-forwarded-proto') ?? 'http') + '://' + (h.get('host') ?? 'localhost:3000')
  const publicUrl = report ? origin + '/report/' + report.id : null
  const axes = report?.axes ?? null
  const d = axes?.diagnosis

  return (
    <main className="mx-auto max-w-[900px] px-6 py-12">
      <Link href="/admin" className="text-[13px] text-mid hover:text-deep">← 목록</Link>
      <h1 className="mt-3 text-[28px]">{app.resolved_address || app.address}</h1>
      <p className="mt-2 text-[13px] text-muted">
        신청 {new Date(app.created_at).toLocaleString('ko-KR')} · 파기 예정{' '}
        {new Date(app.expires_at).toLocaleDateString('ko-KR')}
      </p>

      {/* ── 신청 내용 ── */}
      <section className="mt-9">
        <h2 className="text-[20px]">소유주가 알려준 것</h2>
        <div className="mt-4 border-t border-line">
          <Field label="입력 주소" value={app.address} />
          <Field label="확인된 주소" value={app.resolved_address} />
          <Field label="PNU" value={app.pnu ? app.pnu + ' (' + (app.match_quality ?? '') + ')' : null} />
          <Field label="집 상태" value={app.condition} />
          <Field label="취득 경위" value={app.acquisition} />
          <Field label="소유관계" value={app.ownership} />
          <Field label="가장 걱정" value={app.concern} />
          <Field label="희망 소요" value={app.speed} />
          <Field label="선호 방법" value={app.channel} />
          <Field label="전화번호" value={app.contact} />
          <Field label="이메일" value={app.email} />
        </div>
      </section>

      {/* ── 자동 판정 ── */}
      <section className="mt-10">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-[20px]">자동 판정</h2>
          {report && (
            <span className="text-[13px] text-muted">
              v{report.version} · {report.status} · {new Date(report.created_at).toLocaleString('ko-KR')}
            </span>
          )}
        </div>

        {!report && (
          <p className="mt-4 rounded-[4px] border border-dashed border-dash px-4 py-3 text-[15px] text-muted">
            판정 기록이 없습니다. 아래 재판정을 눌러 주세요.
          </p>
        )}

        {report?.status === 'failed' && (
          <p className="mt-4 rounded-[4px] border border-earth px-4 py-3 text-[15px] text-earth">
            판정이 실패했습니다. {axes?.error}
          </p>
        )}

        {axes?.status === 'out_of_scope' && (
          <div className="mt-4 rounded-[4px] border border-dashed border-dash px-4 py-3 text-[15px]">
            <p className="font-semibold">대상 아님 — {axes.reason}</p>
            {axes.observations && axes.observations.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1 text-[14px] text-muted">
                {axes.observations.map((o) => <li key={o}>· {o}</li>)}
              </ul>
            )}
          </div>
        )}

        {d && (
          <>
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-[14px] tracking-[0.2em] text-mid">
                {report?.verdict ? VERDICT_DOTS[report.verdict] : '○○○'}
              </span>
              <span className="font-serif text-[24px] font-semibold text-deep">
                {report?.verdict ? VERDICT_LABEL[report.verdict] : (d.grade ?? '—')}
              </span>
              {d.decidedBy && (
                <span className="text-[13px] text-muted">결정축 {AXIS_LABEL[d.decidedBy]}</span>
              )}
              {d.fieldVerified === false && (
                <span className="rounded-[3px] border border-dashed border-dash px-2 py-[2px] text-[12px] text-muted">
                  현장 미확인
                </span>
              )}
            </div>
            {d.headline && <p className="mt-3 max-w-[68ch] text-[16px] leading-[1.75]">{d.headline}</p>}

            <div className="mt-6 border-t border-line">
              {(d.axes ?? []).map((ax) => (
                <div key={ax.axis} className="border-b border-line py-4">
                  <div className="flex items-baseline gap-3">
                    <span className="w-[86px] flex-none text-[15px] font-semibold">
                      {AXIS_LABEL[ax.axis] ?? ax.axis}
                    </span>
                    <span className={'text-[14px] ' + (V_TONE[ax.verdict] ?? '')}>
                      {V_TEXT[ax.verdict] ?? ax.verdict}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-col gap-2 pl-[98px]">
                    {(ax.findings ?? []).map((f, i) => (
                      <div
                        key={i}
                        className={
                          'text-[15px] leading-[1.7] ' +
                          (f.verdict === 'unknown'
                            ? 'border-l border-dashed border-dash pl-3 text-muted'
                            : 'border-l border-line pl-3')
                        }
                      >
                        <span className="font-semibold">{f.label}</span>
                        <span className="mx-2 text-line">|</span>
                        <span>{f.reason}</span>
                        {f.source && <span className="ml-2 text-[13px] text-muted">{f.source}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {axes?.sourceErrors && axes.sourceErrors.length > 0 && (
          <p className="mt-4 text-[13px] text-earth">
            조달 실패: {axes.sourceErrors.join(' / ')}
          </p>
        )}
      </section>

      {/* ── 사람이 하는 일 ── */}
      <section className="mt-10 rounded-[6px] border border-line bg-wash p-6">
        <h2 className="text-[20px]">검토</h2>
        <p className="mt-2 max-w-[64ch] text-[15px] leading-[1.75] text-muted">
          자동 판정은 서류까지입니다. 현장을 확인한 내용을 메모에 적고, 진단서로 내보낼 준비가
          되면 승인하세요. 승인 전에는 사용자에게 아무것도 나가지 않습니다.
        </p>

        {report && (
          <>
            <form action={saveNote.bind(null, report.id, app.id)} className="mt-5 flex flex-col gap-2">
              <label className="text-[15px] font-semibold" htmlFor="note">현장 확인 메모</label>
              <textarea
                id="note"
                name="note"
                rows={4}
                defaultValue={report.note ?? ''}
                placeholder="지붕 일부 파손, 구조는 유지. 진입로 실제 통행 확인 (2026.09.06)"
                className="rounded-[6px] border border-line bg-paper p-3 text-[15px] leading-[1.7] outline-none focus:border-2 focus:border-mid"
              />
              <button
                type="submit"
                className="self-start rounded-[6px] border border-deep px-5 py-3 text-[15px] font-semibold text-deep hover:bg-pale"
              >
                메모 저장
              </button>
            </form>

            {/* ⑥ 등기 — 공개 API 가 없어 사람이 등기소에서 확인해 적는다 */}
            <form
              action={saveRegistry.bind(null, report.id, app.id)}
              className="mt-6 flex flex-col gap-2 border-t border-line pt-5"
            >
              <label className="text-[15px] font-semibold" htmlFor="registryNote">
                등기 확인 내용
                <span className="ml-2 text-[13px] font-normal text-muted">
                  적으면 진단서 ⑥번이 점선에서 실선으로 바뀝니다
                </span>
              </label>
              <textarea
                id="registryNote"
                name="registryNote"
                rows={3}
                defaultValue={report.registry_note ?? ''}
                placeholder="소유자 1인 단독. 근저당·가압류 없음. 상속 정리 완료."
                className="rounded-[6px] border border-line bg-paper p-3 text-[15px] leading-[1.7] outline-none focus:border-2 focus:border-mid"
              />
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-[14px] text-muted" htmlFor="registryCheckedAt">확인일</label>
                <input
                  id="registryCheckedAt"
                  name="registryCheckedAt"
                  type="date"
                  defaultValue={report.registry_checked_at ?? ''}
                  className="h-[44px] rounded-[6px] border border-line bg-paper px-3 text-[15px] outline-none focus:border-2 focus:border-mid"
                />
                <button
                  type="submit"
                  className="rounded-[6px] border border-deep px-5 py-3 text-[15px] font-semibold text-deep hover:bg-pale"
                >
                  등기 확인 저장
                </button>
              </div>
              <p className="text-[13px] leading-[1.6] text-muted">
                내용과 확인일이 <strong>둘 다</strong> 있어야 실선이 됩니다. 출처를 못 쓰면 확인한
                것으로 적지 않습니다. 실제로 열람한 뒤에만 적어 주세요.
              </p>
              {report.registry_note && report.registry_checked_at && (
                <p className="text-[13px] font-semibold text-mid">
                  ⑥ 등기 확인됨 — ①법적 축이 열려 판정이 올라갈 수 있습니다. 재판정을 눌러 보세요.
                </p>
              )}
            </form>

            <div className="mt-6 flex flex-wrap gap-3">
              {report.status !== 'issued' ? (
                <form action={approveReport.bind(null, report.id, app.id)}>
                  <button
                    type="submit"
                    className="rounded-[6px] bg-deep px-6 py-3 text-[16px] font-semibold text-paper hover:bg-ink"
                  >
                    승인하고 발송 준비
                  </button>
                </form>
              ) : (
                <form action={revertReport.bind(null, report.id, app.id)}>
                  <button
                    type="submit"
                    className="rounded-[6px] border border-deep px-6 py-3 text-[16px] font-semibold text-deep hover:bg-pale"
                  >
                    승인 되돌리기
                  </button>
                </form>
              )}
              <form action={rerunJudgment.bind(null, app.id)}>
                <button
                  type="submit"
                  className="rounded-[6px] border border-line px-6 py-3 text-[16px] text-body hover:bg-pale"
                >
                  재판정 (새 버전)
                </button>
              </form>
            </div>
          </>
        )}

        {!report && (
          <form action={rerunJudgment.bind(null, app.id)} className="mt-5">
            <button
              type="submit"
              className="rounded-[6px] bg-deep px-6 py-3 text-[16px] font-semibold text-paper hover:bg-ink"
            >
              판정 실행
            </button>
          </form>
        )}

        {report && (
          <div className="mt-6 border-t border-line pt-5">
            <div className="flex flex-wrap gap-3">
              <Link
                href={'/admin/' + app.id + '/preview'}
                className="rounded-[6px] border border-deep px-5 py-3 text-[15px] font-semibold text-deep hover:bg-pale"
              >
                진단서 미리보기
              </Link>
              {report.status === 'issued' && (
                <Link
                  href={'/report/' + report.id}
                  className="rounded-[6px] border border-line px-5 py-3 text-[15px] text-body hover:bg-pale"
                >
                  공개 링크로 열기 ↗
                </Link>
              )}
            </div>

            {report.status === 'issued' ? (
              <div className="mt-5 flex flex-col gap-2">
                <p className="text-[15px] font-semibold">
                  보내실 링크
                  <span className="ml-2 text-[13px] font-normal text-muted">
                    승인됨 {report.issued_at && new Date(report.issued_at).toLocaleString('ko-KR')}
                  </span>
                </p>
                {/* 도메인 인증 전이라 자동 발송이 안 된다. 복사해서 직접 보낸다. */}
                <input
                  readOnly
                  value={publicUrl ?? ''}
                  className="w-full rounded-[6px] border border-line bg-paper px-3 py-2 text-[14px]"
                />
                <p className="text-[13px] leading-[1.6] text-muted">
                  {app.email} 로 보내시면 됩니다. 전화는 {app.contact}.
                  <br />
                  이메일 자동 발송은 도메인 인증 후에 붙습니다.
                </p>
              </div>
            ) : (
              <p className="mt-4 text-[14px] text-muted">
                승인하면 사용자에게 보낼 공개 링크가 생깁니다. 그 전에는 미리보기로만 볼 수 있습니다.
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
