'use server'

import { revalidatePath } from 'next/cache'
import { sbSelect, sbUpdate } from '../../src/supabase'
import { createDraftReport } from '../../src/report'
import type { ApplicationRow } from './types'

/**
 * 승인 — 자동 판정 초안을 사람이 확인하고 내보낸다.
 * 이 지점이 W11 의 '게이트'다. 여기를 지나야 사용자에게 나간다.
 */
export async function approveReport(reportId: string, applicationId: string) {
  await sbUpdate('reports', 'id=eq.' + reportId, {
    status: 'issued',
    issued_at: new Date().toISOString(),
  })
  revalidatePath('/admin')
  revalidatePath('/admin/' + applicationId)
}

/** 승인 되돌리기 — 잘못 눌렀을 때 초안으로 되돌린다 */
export async function revertReport(reportId: string, applicationId: string) {
  await sbUpdate('reports', 'id=eq.' + reportId, { status: 'draft', issued_at: null })
  revalidatePath('/admin')
  revalidatePath('/admin/' + applicationId)
}

export async function saveNote(reportId: string, applicationId: string, formData: FormData) {
  const note = String(formData.get('note') ?? '').trim()
  await sbUpdate('reports', 'id=eq.' + reportId, { note: note || null })
  revalidatePath('/admin/' + applicationId)
}

/**
 * 재판정 — 판정이 실패했거나 자료가 갱신됐을 때 다시 돌린다.
 * 기존 진단서는 지우지 않고 새 버전으로 쌓는다. 무엇이 어떻게 바뀌었는지 남아야 한다.
 */
export async function rerunJudgment(applicationId: string) {
  const rows = await sbSelect<ApplicationRow>(
    'applications?select=address,resolved_address&id=eq.' + applicationId,
  )
  const app = rows[0]
  if (!app) return
  await createDraftReport(applicationId, app.resolved_address || app.address)
  revalidatePath('/admin/' + applicationId)
  revalidatePath('/admin')
}
