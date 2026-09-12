import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { sbSelect } from '../../../src/supabase'
import { listPhotos } from '../../../src/photos'
import { requireAdmin } from '../../../src/admin-auth'
import { isReviewStatus } from '../../../src/admin-workflow'
import { UUID_PATTERN } from '../../../src/photo-limits'
import { AdminFrame } from '../admin-frame'
import { WorkflowEditor } from '../workflow-editor'
import { LogoutButton } from '../logout-button'
import styles from '../admin.module.css'
import ui from '../../ui.module.css'
import { approveReport, revertReport, rerunJudgment, saveNote, saveRegistry } from '../actions'
import {
  AXIS_LABEL, VERDICT_DOTS, VERDICT_LABEL,
  type ApplicationRow, type ReportRow,
} from '../types'

export const dynamic = 'force-dynamic'
export const metadata = { title: '검토 — 빈집진단서', robots: { index: false, follow: false } }

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
    <div className={styles.detailField}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={value ? '' : 'text-muted'}>{value || '— 적지 않음'}</span>
    </div>
  )
}

export default async function Review({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  if (!UUID_PATTERN.test(id)) notFound()
  const rows = await sbSelect<Row>('applications?select=*,reports(*)&id=eq.' + id + '&expires_at=gt.' + encodeURIComponent(new Date().toISOString()))
  const app = rows[0]
  if (!app) notFound()
  const photos = (app.photo_count ?? 0) > 0 && Date.parse(app.expires_at) > Date.now() ? await listPhotos(app.id) : []

  const report = [...(app.reports ?? [])].sort((a, b) => b.version - a.version)[0]

  // 수동 발송용 절대 URL. 도메인이 준비되기 전까지는 이걸 복사해 보낸다.
  const h = await headers()
  const origin =
    (h.get('x-forwarded-proto') ?? 'http') + '://' + (h.get('host') ?? 'localhost:3000')
  const publicUrl = report ? origin + '/report/' + report.id : null
  const axes = report?.axes ?? null
  const d = axes?.diagnosis

  return (
    <AdminFrame navigation={<LogoutButton />}><div className={styles.review}>
      <Link href="/admin" className={styles.back}>← 신청 목록으로</Link>
      <h1 className="mt-3 text-[length:var(--type-page)]">{app.resolved_address || app.address}</h1>
      <p className="mt-2 text-[length:var(--type-help)] text-muted">
        신청 {new Date(app.created_at).toLocaleString('ko-KR')} · 파기 예정{' '}
        {new Date(app.expires_at).toLocaleDateString('ko-KR')}
      </p>

      <div className="mt-7"><WorkflowEditor key={app.id} id={app.id} status={isReviewStatus(app.review_status) ? app.review_status : 'received'} note={app.internal_note ?? ''} updatedAt={app.review_updated_at} available={app.review_status !== undefined} /></div>

      {/* ── 신청 내용 ── */}
      <section className="mt-9">
        <h2 className="text-[length:var(--type-card)]">소유주가 알려준 것</h2>
        <div className="mt-4 border-t border-line">
          <Field label="입력 주소" value={app.address} />
          <Field label="확인된 주소" value={app.resolved_address} />
          <Field label="PNU" value={app.pnu ? app.pnu + ' (' + (app.match_quality ?? '') + ')' : null} />
          <Field label="집 상태" value={app.condition} />
          <Field label="취득 경위" value={app.acquisition} />
          <Field label="소유관계" value={app.ownership} />
          <Field label="가장 걱정" value={app.concern} />
          <Field label="원하는 확인" value={app.speed} />
          <Field label="선호 방법" value={app.channel} />
          <Field label="전화번호" value={app.contact} />
          <Field label="이메일" value={app.email} />
        </div>
      </section>

      <section className="mt-9">
        <h2 className="text-[length:var(--type-card)]">고객이 첨부한 사진 · {photos.length}장</h2>
        <p className="mt-2 text-[length:var(--type-help)] text-muted">담당자 검토용입니다. 공개 진단서에는 사진 자체가 노출되지 않습니다. 사진의 관찰 내용과 현장 방문 결과를 구분해 기록하세요.</p>
        {photos.length === 0 && <p className="mt-4 text-[14px] text-muted">첨부된 사진이 없습니다.</p>}
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">{photos.map(photo => <a key={photo.id} href={`/admin/${app.id}/photos/${photo.id}`} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/admin/${app.id}/photos/${photo.id}`} alt={`고객 첨부 사진 ${photo.position}`} width={photo.width} height={photo.height} className="aspect-[4/3] w-full rounded object-cover" loading="lazy" />
          <span className="text-[length:var(--type-help)] underline">사진 {photo.position} 크게 보기</span>
        </a>)}</div>
      </section>

      {/* ── 자동 판정 ── */}
      <section className="mt-10">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-[length:var(--type-card)]">자동 판정</h2>
          {report && (
            <span className="text-[length:var(--type-help)] text-muted">
              v{report.version} · {report.status} · {new Date(report.created_at).toLocaleString('ko-KR')}
            </span>
          )}
        </div>

        {!report && (
          <p className="mt-4 rounded-[4px] border border-dashed border-dash px-4 py-3 text-[length:var(--type-body)] text-muted">
            판정 기록이 없습니다. 아래 재판정을 눌러 주세요.
          </p>
        )}

        {report?.status === 'failed' && (
          <p className="mt-4 rounded-[4px] border border-earth px-4 py-3 text-[length:var(--type-body)] text-earth">
            판정이 실패했습니다. {axes?.error}
          </p>
        )}

        {axes?.status === 'out_of_scope' && (
          <div className="mt-4 rounded-[4px] border border-dashed border-dash px-4 py-3 text-[length:var(--type-body)]">
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
              <span className="font-sans text-[length:var(--type-section)] font-semibold text-deep">
                {report?.verdict ? VERDICT_LABEL[report.verdict] : (d.grade ?? '—')}
              </span>
              {d.decidedBy && (
                <span className="text-[length:var(--type-help)] text-muted">결정축 {AXIS_LABEL[d.decidedBy]}</span>
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
                    <span className="w-[86px] flex-none text-[length:var(--type-body)] font-semibold">
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
                          'text-[length:var(--type-body)] leading-[1.7] ' +
                          (f.verdict === 'unknown'
                            ? 'border-l border-dashed border-dash pl-3 text-muted'
                            : 'border-l border-line pl-3')
                        }
                      >
                        <span className="font-semibold">{f.label}</span>
                        <span className="mx-2 text-line">|</span>
                        <span>{f.reason}</span>
                        {f.source && <span className="ml-2 text-[length:var(--type-help)] text-muted">{f.source}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {axes?.sourceErrors && axes.sourceErrors.length > 0 && (
          <p className="mt-4 text-[length:var(--type-help)] text-earth">
            조달 실패: {axes.sourceErrors.join(' / ')}
          </p>
        )}
      </section>

      {/* ── 사람이 하는 일 ── */}
      <section className={styles.reviewPanel}>
        <h2 className="text-[length:var(--type-card)]">검토</h2>
        <p className="mt-2 max-w-[64ch] text-[length:var(--type-body)] leading-[1.75] text-muted">
          아래 메모는 고객 진단서에 반영됩니다. 위의 내부 메모와 구분해서 작성하세요.
          고객은 이미 1차 진단을 확인할 수 있으며, 여기서는 추가 검토 진단서의 공개 여부를 관리합니다.
        </p>

        {report && (
          <>
            {report.status === 'issued' && <p className="mt-4 text-[14px] text-muted">공개 중인 진단서입니다. 공개 메모를 수정하려면 먼저 아래에서 승인을 되돌려 주세요. 내부 메모는 계속 수정할 수 있습니다.</p>}
            <form action={saveNote.bind(null, report.id, app.id)} className="mt-5 flex flex-col gap-2">
              <label className="text-[length:var(--type-body)] font-semibold" htmlFor="note">현장 확인 메모 · 고객에게 공개</label>
              <textarea
                id="note"
                name="note"
                rows={4}
                maxLength={5000}
                disabled={report.status === 'issued'}
                defaultValue={report.note ?? ''}
                placeholder="지붕 일부 파손, 구조는 유지. 진입로 실제 통행 확인 (2026.09.06)"
                className={ui.input}
              />
              <button
                type="submit"
                disabled={report.status === 'issued'}
                className={`${ui.compact} self-start`}
              >
                메모 저장
              </button>
            </form>

            {/* ⑥ 등기 — 공개 API 가 없어 사람이 등기소에서 확인해 적는다 */}
            <form
              action={saveRegistry.bind(null, report.id, app.id)}
              className="mt-6 flex flex-col gap-2 border-t border-line pt-5"
            >
              <label className="text-[length:var(--type-body)] font-semibold" htmlFor="registryNote">
                등기 확인 내용
                <span className="ml-2 text-[length:var(--type-help)] font-normal text-muted">
                  적으면 진단서 ⑥번이 점선에서 실선으로 바뀝니다
                </span>
              </label>
              <textarea
                id="registryNote"
                name="registryNote"
                rows={3}
                maxLength={5000}
                disabled={report.status === 'issued'}
                defaultValue={report.registry_note ?? ''}
                placeholder="소유자 1인 단독. 근저당·가압류 없음. 상속 정리 완료."
                className={ui.input}
              />
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-[14px] text-muted" htmlFor="registryCheckedAt">확인일</label>
                <input
                  id="registryCheckedAt"
                  name="registryCheckedAt"
                  type="date"
                  disabled={report.status === 'issued'}
                  defaultValue={report.registry_checked_at ?? ''}
                  className={ui.input}
                />
                <button
                  type="submit"
                  disabled={report.status === 'issued'}
                  className={ui.compact}
                >
                  등기 확인 저장
                </button>
              </div>
              <p className="text-[length:var(--type-help)] leading-[1.6] text-muted">
                내용과 확인일이 <strong>둘 다</strong> 있어야 실선이 됩니다. 출처를 못 쓰면 확인한
                것으로 적지 않습니다. 실제로 열람한 뒤에만 적어 주세요.
              </p>
              {report.registry_note && report.registry_checked_at && (
                <p className="text-[length:var(--type-help)] font-semibold text-mid">
                  ⑥ 등기 확인됨 — ①법적 축이 열려 판정이 올라갈 수 있습니다. 재판정을 눌러 보세요.
                </p>
              )}
            </form>

            <div className="mt-6 flex flex-wrap gap-3">
              {report.status === 'draft' ? (
                <form action={approveReport.bind(null, report.id, app.id)}>
                  <button
                    type="submit"
                    className={styles.button}
                  >
                    검토 진단서 공개 승인
                  </button>
                </form>
              ) : report.status === 'issued' ? (
                <form action={revertReport.bind(null, report.id, app.id)}>
                  <button
                    type="submit"
                    className={ui.compact}
                  >
                    승인 되돌리기
                  </button>
                </form>
              ) : <p className="text-[14px] text-earth">실패한 초안은 공개할 수 없습니다. 재판정 후 검토해 주세요.</p>}
              <form action={rerunJudgment.bind(null, app.id)}>
                <button
                  type="submit"
                  className={ui.compact}
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
              className={styles.button}
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
                className={ui.compact}
              >
                진단서 미리보기
              </Link>
              {report.status === 'issued' && (
                <Link
                  href={'/report/' + report.id}
                  className={ui.compact}
                >
                  공개 링크로 열기 ↗
                </Link>
              )}
            </div>

            {report.status === 'issued' ? (
              <div className="mt-5 flex flex-col gap-2">
                <p className="text-[length:var(--type-body)] font-semibold">
                  보내실 링크
                  <span className="ml-2 text-[length:var(--type-help)] font-normal text-muted">
                    승인됨 {report.issued_at && new Date(report.issued_at).toLocaleString('ko-KR')}
                  </span>
                </p>
                {/* 도메인 인증 전이라 자동 발송이 안 된다. 복사해서 직접 보낸다. */}
                <input
                  readOnly
                  value={publicUrl ?? ''}
                  className={ui.input}
                />
                <p className="text-[length:var(--type-help)] leading-[1.6] text-muted">
                  {app.email} 로 보내시면 됩니다. 전화는 {app.contact}.
                  <br />
                  승인은 이메일·문자를 자동으로 발송하지 않습니다. 고객에게 전달한 뒤 내부 메모에 기록해 주세요.
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
    </div></AdminFrame>
  )
}
