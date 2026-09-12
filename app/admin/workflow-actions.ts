'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '../../src/admin-auth'
import { parseWorkflow, type WorkflowState } from '../../src/admin-workflow'
import { UUID_PATTERN } from '../../src/photo-limits'
import { sbSelect, sbUpdate, supabaseConfigured } from '../../src/supabase'

export async function saveWorkflow(applicationId: string, _previous: WorkflowState, formData: FormData): Promise<WorkflowState> {
  try { await requireAdmin() }
  catch { return { ok: false, message: '로그인이 만료됐어요. 다시 로그인해 주세요.' } }
  const input = parseWorkflow(formData.get('reviewStatus'), formData.get('internalNote'))
  if (!UUID_PATTERN.test(applicationId) || !input) return { ok: false, message: '처리 상태를 선택하고 메모를 5,000자 이내로 작성해 주세요.' }
  if (!supabaseConfigured()) return { ok: false, message: '접수 데이터베이스가 연결되지 않아 저장하지 못했어요.' }
  try {
    const rows = await sbSelect<{ id: string; review_status?: string }>(`applications?select=*&id=eq.${applicationId}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&limit=1`)
    if (!rows[0]) return { ok: false, message: '신청을 찾을 수 없거나 보관 기간이 지났어요.' }
    if (!('review_status' in rows[0])) return { ok: false, message: '관리 상태 저장을 위한 데이터베이스 업데이트가 필요해요.' }
    const saved = await sbUpdate('applications', `id=eq.${applicationId}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}`, {
      review_status: input.status, internal_note: input.note || null, review_updated_at: new Date().toISOString(),
    })
    if (!saved) return { ok: false, message: '저장하지 못했어요. 신청 상태를 새로고침해 주세요.' }
  } catch {
    return { ok: false, message: '저장하지 못했어요. 연결을 확인하고 다시 시도해 주세요.' }
  }
  revalidatePath('/admin')
  revalidatePath('/admin/' + applicationId)
  return { ok: true, message: '처리 상태와 내부 메모를 저장했어요. 고객에게 알림은 발송되지 않습니다.' }
}
