'use server'

import { revalidatePath } from 'next/cache'
import { sbSelect, sbUpdate } from '../../src/supabase'
import { createDraftReport, VERDICT } from '../../src/report'
import { evaluate, type Context, type Finding } from '../../src/rules/engine'
import { combine } from '../../src/verdict'
import type { ApplicationRow } from './types'
import { requireAdmin } from '../../src/admin-auth'
import { UUID_PATTERN } from '../../src/photo-limits'
import { supabaseConfigured } from '../../src/supabase'

async function requireApplication(applicationId: string) {
  await requireAdmin()
  if (!supabaseConfigured() || !UUID_PATTERN.test(applicationId)) throw new Error('ADMIN_APPLICATION_UNAVAILABLE')
  const apps = await sbSelect<ApplicationRow>('applications?select=*&id=eq.' + applicationId + '&expires_at=gt.' + encodeURIComponent(new Date().toISOString()) + '&limit=1')
  if (!apps[0]) throw new Error('ADMIN_APPLICATION_UNAVAILABLE')
  return apps[0]
}

async function requireReport(reportId: string, applicationId: string) {
  await requireApplication(applicationId)
  if (!UUID_PATTERN.test(reportId)) throw new Error('ADMIN_REPORT_UNAVAILABLE')
  const reports = await sbSelect<{ id: string; status: string }>('reports?select=id,status&id=eq.' + reportId + '&application_id=eq.' + applicationId + '&limit=1')
  if (!reports[0]) throw new Error('ADMIN_REPORT_UNAVAILABLE')
  return reports[0]
}

/** reports 에서 재판정에 필요한 것만 읽는다 */
type ReviewRow = {
  axes: { facts?: Context } | null
  note: string | null
  registry_note: string | null
  registry_checked_at: string | null
}

/**
 * 승인 — 자동 판정 초안을 사람이 확인하고 내보낸다.
 * 이 지점이 W11 의 '게이트'다. 여기를 지나야 사용자에게 나간다.
 *
 * 그래서 여기서 판정을 다시 낸다. 자동 판정에는 자물쇠가 둘 걸려 있다.
 *
 *   1. combine(…, fieldVerified=false) — 세 축이 clear 여도 '가능'을 안 준다
 *   2. L-REGISTRY — when:always·unknown 이라 법적 축이 영원히 unknown 이다
 *
 * 둘 다 의도된 잠금이고, 여는 열쇠는 사람의 확인뿐이다.
 * 이 함수가 없으면 현장·등기를 다 확인하고 승인해도 진단서는
 * 영원히 '조건부 — 현장 확인이 남았습니다'로 나간다.
 */
export async function approveReport(reportId: string, applicationId: string) {
  const checked = await requireReport(reportId, applicationId)
  if (checked.status !== 'draft') throw new Error('ADMIN_DRAFT_REQUIRED')
  const patch: Record<string, unknown> = {
    status: 'issued',
    issued_at: new Date().toISOString(),
  }

  const rows = await sbSelect<ReviewRow>(
    'reports?select=axes,note,registry_note,registry_checked_at&id=eq.' + reportId,
  )
  const rep = rows[0]
  const facts = rep?.axes?.facts

  // 실패한 초안은 위에서 거부했다. 대상 외 등 facts가 없는 초안은 기존 내용을 유지한다.
  if (facts) {
    // 내용과 확인일이 함께 있을 때만 확인된 것으로 본다 —
    // 출처를 쓸 수 없으면 진단서에 실선을 그릴 수 없다.
    const registryDone = Boolean(rep.registry_note && rep.registry_checked_at)
    // 현장 메모가 있으면 사람이 다녀온 것으로 본다.
    const fieldVerified = Boolean(rep.note)

    const findings = registryDone
      ? [...evaluate(facts).filter((f) => f.ruleId !== 'L-REGISTRY'), registryFinding()]
      : evaluate(facts)

    const diagnosis = combine(findings, fieldVerified)
    patch.verdict = VERDICT[diagnosis.grade] ?? null
    patch.axes = { ...rep.axes, diagnosis }
  }

  await sbUpdate('reports', 'id=eq.' + reportId, patch)
  revalidatePath('/admin')
  revalidatePath('/admin/' + applicationId)
}

/**
 * 등기를 확인했다는 사실을 판정에 넣는다.
 *
 * rules.json 은 공개 데이터만 다루고 등기는 공개 API 가 없다.
 * 그래서 룰로 표현할 수 없고, 사람이 확인한 사실을 여기서 주입한다.
 * 등기에 걸리는 것이 있었다면 운영자는 승인하지 않거나 note 에 적는다 —
 * 승인 버튼을 누르는 행위가 곧 '내보내도 된다'는 판단이다.
 */
function registryFinding(): Finding {
  return {
    ruleId: 'REG-CHECKED',
    axis: 'rights',
    verdict: 'clear',
    label: '등기',
    reason: '등기사항증명서를 열람해 확인했습니다.',
    source: '등기사항증명서',
  }
}

/** 승인 되돌리기 — 잘못 눌렀을 때 초안으로 되돌린다 */
export async function revertReport(reportId: string, applicationId: string) {
  await requireReport(reportId, applicationId)
  await sbUpdate('reports', 'id=eq.' + reportId, { status: 'draft', issued_at: null })
  revalidatePath('/admin')
  revalidatePath('/admin/' + applicationId)
}

export async function saveNote(reportId: string, applicationId: string, formData: FormData) {
  const checked = await requireReport(reportId, applicationId)
  if (checked.status === 'issued') throw new Error('ADMIN_UNPUBLISH_BEFORE_EDIT')
  const note = String(formData.get('note') ?? '').trim()
  if (note.length > 5000) throw new Error('ADMIN_NOTE_TOO_LONG')
  await sbUpdate('reports', 'id=eq.' + reportId, { note: note || null })
  revalidatePath('/admin/' + applicationId)
}

/**
 * 재판정 — 판정이 실패했거나 자료가 갱신됐을 때 다시 돌린다.
 * 기존 진단서는 지우지 않고 새 버전으로 쌓는다. 무엇이 어떻게 바뀌었는지 남아야 한다.
 */
/**
 * ⑥ 등기 확인 결과를 적는다.
 * 현장(⑤)과 등기(⑥)는 확인 주체도 시점도 달라 note 를 재사용하지 않는다.
 * 채워지면 진단서에서 점선이 실선으로 바뀌므로, 실제로 열람한 뒤에만 적어야 한다.
 */
export async function saveRegistry(reportId: string, applicationId: string, formData: FormData) {
  const checked = await requireReport(reportId, applicationId)
  if (checked.status === 'issued') throw new Error('ADMIN_UNPUBLISH_BEFORE_EDIT')
  const note = String(formData.get('registryNote') ?? '').trim()
  const at = String(formData.get('registryCheckedAt') ?? '').trim()
  if (note.length > 5000 || (at && (!/^\d{4}-\d{2}-\d{2}$/.test(at) || !Number.isFinite(Date.parse(at))))) throw new Error('ADMIN_INVALID_REGISTRY_INPUT')
  await sbUpdate('reports', 'id=eq.' + reportId, {
    registry_note: note || null,
    // 확인일 없이 내용만 적히면 출처를 쓸 수 없다. 둘은 함께 간다.
    registry_checked_at: note && at ? at : null,
  })
  revalidatePath('/admin/' + applicationId)
}

export async function rerunJudgment(applicationId: string) {
  const app = await requireApplication(applicationId)
  await createDraftReport(applicationId, app.resolved_address || app.address)
  revalidatePath('/admin/' + applicationId)
  revalidatePath('/admin')
}
