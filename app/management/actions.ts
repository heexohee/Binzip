'use server'
import { validateManagementApply, type ManagementState } from '../../src/management'
import { sbRpc, supabaseConfigured } from '../../src/supabase'

const PHONE_FALLBACK = '010-7428-2624로 전화해 주세요.'

export async function submitManagementApply(_: ManagementState, data: FormData): Promise<ManagementState> {
  const { errors, row } = validateManagementApply(data)
  if (Object.keys(errors).length) return { ok: false, errors, message: '입력 내용을 확인해 주세요.' }
  if (!supabaseConfigured()) return { ok: false, errors: {}, message: `온라인 접수를 준비 중이에요. ${PHONE_FALLBACK}` }
  try {
    const saved = await sbRpc<string>('submit_care_interest', { payload: row })
    if (!saved) throw new Error('NO_RECEIPT')
    return { ok: true, errors: {}, message: '관리 신청을 접수했어요. 담당자가 전화로 연락드려요. 신청만으로 결제되지 않아요.' }
  } catch {
    return { ok: false, errors: {}, message: `접수되지 않았어요. 잠시 후 다시 시도하거나 ${PHONE_FALLBACK}` }
  }
}
