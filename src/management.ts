/** Prices shown on /management. Pilot prices chosen by the operator on 2026-11-14; change here only. */
export const PLANS = [
  { name: '1회성 방문', note: '한 번만 봐 드려요', price: 77000, unit: '1회', base: false },
  { name: '월 1회', note: '기본 관리 · 한 달에 한 번', price: 55000, unit: '매달', base: true },
  { name: '월 2회', note: '2주에 한 번', price: 99000, unit: '매달', base: false },
  { name: '2개월 1회', note: '두 달에 한 번', price: 66000, unit: '2개월마다', base: false },
] as const

export const OPTIONS = [
  { name: '태풍·폭우 뒤 비상점검', note: '전화로 요청', price: 33000, unit: '1회' },
  { name: '겨울 동파 대비 점검', note: '한파 예보 전', price: 33000, unit: '1회' },
  { name: '마당 풀베기·폐기물 처리', note: '크기·양을 보고 안내', price: null, unit: '상담 후' },
] as const

/** Which kind of house the visitor chose at the top of /management. 'apt' = a lived-in flat left empty for a while. */
export const HOME_TYPES = [
  { id: 'house', label: '시골집·별장', note: '단독주택' },
  { id: 'apt', label: '살던 집을 비움', note: '아파트·빌라' },
] as const
export type HomeType = (typeof HOME_TYPES)[number]['id']
export const toHomeType = (value: unknown): HomeType => (value === 'apt' ? 'apt' : 'house')

/** Flats have 14 check items instead of 20, so every plan is this much cheaper. Operator decision, 2026-11-17. */
const APT_DISCOUNT = 11000
export const plansFor = (home: HomeType) => PLANS.map(plan => ({ ...plan, price: home === 'apt' ? plan.price - APT_DISCOUNT : plan.price }))

export const PLAN_CHOICES = [...PLANS.map(plan => plan.name), '상담 후 정할게요'] as const
export const APPLICANTS = ['집 주인', '가족 (자녀 등)'] as const
export const MANAGEMENT_SOURCE = 'management-apply'
export const MANAGEMENT_CONSENT_VERSION = '2026-11-18-management-v3'

export const won = (price: number) => `${price.toLocaleString('ko-KR')}원`

export type ManagementState = { ok: boolean; message: string; errors: Record<string, string>; receipt?: string }

/**
 * Management applications reuse the care_interests table and its submit_care_interest RPC,
 * so no migration is needed. Columns the old survey required get fixed values; the
 * application-specific answers go into `answers`.
 */
export function validateManagementApply(data: FormData) {
  const text = (name: string) => String(data.get(name) ?? '').trim()
  const errors: Record<string, string> = {}
  const place = text('place')
  const contact = text('contact').replace(/[ -]/g, '')
  const applicant = text('applicant')
  const plan = text('plan')
  if (place.length < 2) errors.place = '집이 있는 곳을 적어 주세요. 읍·면·리까지만 적어도 돼요.'
  else if (place.length > 80) errors.place = '80자 이내로 적어 주세요.'
  if (!(APPLICANTS as readonly string[]).includes(applicant)) errors.applicant = '신청하는 분을 골라 주세요.'
  if (!(PLAN_CHOICES as readonly string[]).includes(plan)) errors.plan = '원하는 상품을 골라 주세요. 상담 후 정해도 괜찮아요.'
  if (!contact) errors.contact = '연락받을 전화번호를 적어 주세요.'
  else if (!/^0[0-9]{8,10}$/.test(contact)) errors.contact = '전화번호를 다시 확인해 주세요. 예: 010-1234-5678'
  if (data.get('agree') !== 'on') errors.agree = '수집 항목과 연락 목적을 읽고 동의해 주세요.'
  if (data.get('overseasAgree') !== 'on') errors.overseasAgree = '개인정보 국외 이전에 동의해 주세요. 원하지 않으시면 전화로 신청해 주세요.'
  if (text('website')) errors.form = '접수할 수 없는 입력입니다.'
  if (!/^[0-9a-f-]{36}$/i.test(text('requestId'))) errors.form = '화면을 새로고침한 뒤 다시 신청해 주세요.'
  const answers = { survey_version: '2026-11-17-management-apply-v2', applicant, plan, home_type: toHomeType(text('homeType')) }
  return {
    errors,
    row: {
      id: text('requestId'), region: place, location: null, residence: '답변하지 않음', intent: '보유하며 관리',
      budget: plan, services: [], contact, email: null, source: MANAGEMENT_SOURCE,
      phone_explanation: true, interview_ok: false, answers, consent_version: MANAGEMENT_CONSENT_VERSION,
    },
  }
}
