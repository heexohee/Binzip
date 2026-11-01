import { regionLabel } from './regions'

export const CARE_CONSENT_VERSION = '2026-11-02-v6'
export const OTHER_REGION_RESIDENCE = '다른 시·군'
export const RESIDENCES = ['빈집과 같은 시·군', '다른 시·군', '해외', '답변하지 않음'] as const
export const INTENTS = ['보유하며 관리', '수리 후 사용', '매각 검토', '철거 검토', '아직 미정'] as const
export const BUDGETS = ['월 3만 원 이하', '월 5만 원 이하', '월 10만 원 이하', '월 10만 원 초과도 검토', '유료 이용 의사 없음', '아직 모르겠어요'] as const
export const SERVICES = ['정기 방문·외관 사진', '집 안 환기·곰팡이·누수 확인', '잡초·마당 정리', '비·태풍 뒤 상태 확인', '수리업체 문의·일정 확인'] as const
export const INHERITANCE = ['상속 정리가 끝났어요', '정리하고 있어요', '아직 시작하지 않았어요', '상속받은 집이 아니에요', '잘 모르겠어요'] as const
export const LAST_VISITS = ['한 달 안', '1~6개월 전', '6개월~1년 전', '1년 넘었어요', '기억나지 않아요'] as const
export const CURRENT_SPENDS = ['거의 들지 않아요', '월 3만 원 이하', '월 3~10만 원', '월 10만 원 넘게', '잘 모르겠어요'] as const
export const SOURCES = ['instagram', 'website', 'example-report', 'unknown-address', 'family-share', 'other-region'] as const
export type InterestState = { ok: boolean; message: string; errors: Record<string, string> }
export function validateInterest(data: FormData) {
  const text = (name: string) => String(data.get(name) ?? '').trim()
  const errors: Record<string, string> = {}
  const region = regionLabel(text('regionProvince'), text('regionDistrict')) ?? '', location = text('location'), contact = text('contact').replace(/[ -]/g, ''), email = text('email')
  if (!region) errors.region = '빈집이 있는 시·도와 시·군을 골라 주세요.'
  if (location.length > 200) errors.location = '대략적인 위치를 200자 이내로 적어 주세요.'
  if (!contact) errors.contact = '연락받을 전화번호를 적어 주세요.'
  else if (!/^0[0-9]{8,10}$/.test(contact)) errors.contact = '전화번호를 다시 확인해 주세요. 예: 010-1234-5678'
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) errors.email = '이메일 주소를 확인하거나 비워 주세요.'
  const residence = text('residence'), intent = text('intent'), budget = text('budget')
  if (!(RESIDENCES as readonly string[]).includes(residence)) errors.residence = '거주 지역을 선택해 주세요.'
  const ownerRegion = residence === OTHER_REGION_RESIDENCE ? regionLabel(text('ownerProvince'), text('ownerDistrict')) : null
  if (residence === OTHER_REGION_RESIDENCE && !ownerRegion) errors.ownerRegion = '소유주께서 사시는 시·도와 시·군을 골라 주세요.'
  if (!(INTENTS as readonly string[]).includes(intent)) errors.intent = '고민하는 방향을 선택해 주세요.'
  if (!(BUDGETS as readonly string[]).includes(budget)) errors.budget = '한 달 최대 금액을 골라 주세요. 아직 모르겠어요도 괜찮아요.'
  const services = [...new Set(data.getAll('services').map(String))]
  if (services.some(v => !(SERVICES as readonly string[]).includes(v))) errors.services = '필요한 관리 항목을 다시 선택해 주세요.'
  const pick = (name: string, choices: readonly string[]) => { const v = text(name); return choices.includes(v) ? v : null }
  if (data.get('agree') !== 'on') errors.agree = '수집 항목과 연락 목적을 읽고 동의해 주세요.'
  if (data.get('overseasAgree') !== 'on') errors.overseasAgree = '개인정보 국외 이전에 동의해 주세요. 원하지 않으시면 전화로 의견을 들려주세요.'
  if (text('website')) errors.form = '접수할 수 없는 입력입니다.'
  if (!/^[0-9a-f-]{36}$/i.test(text('requestId'))) errors.form = '화면을 새로고침한 뒤 다시 신청해 주세요.'
  const source = (SOURCES as readonly string[]).includes(text('source')) ? text('source') : 'website'
  const answers = {
    owner_region: ownerRegion,
    inheritance: pick('inheritance', INHERITANCE), last_visit: pick('lastVisit', LAST_VISITS), current_spend: pick('currentSpend', CURRENT_SPENDS),
  }
  return { errors, row: { id: text('requestId'), region, location: location || null, residence, intent, budget, services, contact, email: email || null, source, phone_explanation: data.get('phoneExplanation') === 'on', interview_ok: data.get('interviewOk') === 'on', answers, consent_version: CARE_CONSENT_VERSION } }
}
