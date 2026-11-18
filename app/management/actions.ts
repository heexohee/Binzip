'use server'
import { validateManagementApply, type ManagementState } from '../../src/management'
import { sbRpc, supabaseConfigured } from '../../src/supabase'
import { receiptCode, sendOperatorEmail } from '../../src/operator-email'

const PHONE_FALLBACK = '010-7428-2624로 전화해 주세요.'

export async function submitManagementApply(_: ManagementState, data: FormData): Promise<ManagementState> {
  const { errors, row } = validateManagementApply(data)
  if (Object.keys(errors).length) return { ok: false, errors, message: '입력 내용을 확인해 주세요.' }
  if (!supabaseConfigured()) return { ok: false, errors: {}, message: `온라인 접수를 준비 중이에요. ${PHONE_FALLBACK}` }
  try {
    const saved = await sbRpc<string>('submit_care_interest', { payload: row })
    if (!saved) throw new Error('NO_RECEIPT')
  } catch {
    return { ok: false, errors: {}, message: `접수되지 않았어요. 잠시 후 다시 시도하거나 ${PHONE_FALLBACK}` }
  }
  const receipt = receiptCode(row.id)
  try {
    await sendOperatorEmail('[빈집진단서] 관리 신청 ' + receipt + ' — ' + row.region, [
      '접수번호: ' + receipt,
      '집이 있는 곳: ' + row.region,
      '집 종류: ' + (row.answers.home_type === 'apt' ? '아파트·빌라' : '단독주택·시골집'),
      '신청하는 분: ' + row.answers.applicant,
      '원하는 상품: ' + row.answers.plan,
      '전화번호: ' + row.contact,
      '',
      '손님이 카카오톡 채널 채팅에 접수번호를 보내면 이 신청과 맞춰 보세요.',
    ])
  } catch {
    // The application is already stored; a failed alert must not fail the applicant.
    console.error('[management] 신청 저장 완료, 운영자 알림 실패')
  }
  return { ok: true, receipt, errors: {}, message: '관리 신청을 접수했어요. 담당자가 전화로 연락드려요. 신청만으로 결제되지 않아요.' }
}
