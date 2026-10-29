'use server'
import { validateInterest, type InterestState } from '../../src/care-interest'
import { sbRpc, supabaseConfigured } from '../../src/supabase'
export async function submitInterest(_: InterestState, data: FormData): Promise<InterestState> {
  const { errors, row } = validateInterest(data)
  if (Object.keys(errors).length) return { ok: false, errors, message: '입력 내용을 확인해 주세요.' }
  if (!supabaseConfigured()) return { ok: false, errors: {}, message: '온라인 접수를 준비 중이에요. 010-7428-2624로 전화해 주세요.' }
  try {
    const saved = await sbRpc<string>('submit_care_interest', { payload: row })
    if (!saved) throw new Error('NO_RECEIPT')
    return { ok: true, errors: {}, message: '관심 등록을 접수했어요. 담당자가 내용을 확인한 뒤 연락드려요. 결제나 구독 계약은 발생하지 않아요.' }
  } catch {
    return { ok: false, errors: {}, message: '접수되지 않았어요. 잠시 후 다시 시도하거나 010-7428-2624로 전화해 주세요.' }
  }
}
