export const CARE_CONSENT_VERSION = '2026-10-31-v2'
export const RESIDENCES = ['빈집과 같은 시·군', '다른 시·군', '해외', '답변하지 않음'] as const
export const INTENTS = ['보유하며 관리', '수리 후 사용', '매각 검토', '철거 검토', '아직 미정'] as const
export const BUDGETS = ['월 3만 원 이하', '월 5만 원 이하', '월 10만 원 이하', '월 10만 원 초과도 검토', '유료 이용 의사 없음', '아직 모르겠어요'] as const
export const SERVICES = ['정기 방문·외관 사진', '잡초·마당 정리', '비·태풍 뒤 상태 확인', '수리업체 문의·일정 확인'] as const
export const INHERITANCE = ['상속 정리가 끝났어요', '정리하고 있어요', '아직 시작하지 않았어요', '상속받은 집이 아니에요', '잘 모르겠어요'] as const
export const LAST_VISITS = ['한 달 안', '1~6개월 전', '6개월~1년 전', '1년 넘었어요', '기억나지 않아요'] as const
export const CURRENT_SPENDS = ['거의 들지 않아요', '월 3만 원 이하', '월 3~10만 원', '월 10만 원 넘게', '잘 모르겠어요'] as const
export const PRICE_POINTS = [
  { name: 'priceTooCheap', label: '너무 싸서 오히려 믿기 어려운 가격' },
  { name: 'priceCheap', label: '싸다고 느끼는 가격' },
  { name: 'priceExpensive', label: '비싸지만 고려해 볼 가격' },
  { name: 'priceTooExpensive', label: '너무 비싸서 맡기지 않을 가격' },
] as const
export const SOURCES = ['instagram', 'website', 'example-report', 'unknown-address', 'family-share', 'other-region'] as const
const MAX_PRICE_MANWON = 100
export type InterestState = { ok: boolean; message: string; errors: Record<string, string> }
export function validateInterest(data: FormData) {
  const text = (name: string) => String(data.get(name) ?? '').trim()
  const errors: Record<string, string> = {}
  const region = text('region'), location = text('location'), contact = text('contact').replace(/[ -]/g, ''), email = text('email')
  if (region.length < 2 || region.length > 80) errors.region = '빈집이 있는 시·군을 적어 주세요. 예: 전남 고흥군'
  if (location.length > 200) errors.location = '대략적인 위치를 200자 이내로 적어 주세요.'
  if (!/^0[0-9]{8,10}$/.test(contact)) errors.contact = '연락 가능한 전화번호를 확인해 주세요.'
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) errors.email = '이메일 주소를 확인하거나 비워 주세요.'
  const residence = text('residence'), intent = text('intent'), budget = text('budget')
  if (!(RESIDENCES as readonly string[]).includes(residence)) errors.residence = '거주 지역을 선택해 주세요.'
  if (!(INTENTS as readonly string[]).includes(intent)) errors.intent = '고민하는 방향을 선택해 주세요.'
  if (!(BUDGETS as readonly string[]).includes(budget)) errors.budget = '예상 이용 의향을 선택해 주세요. 모르겠어요도 괜찮아요.'
  const services = [...new Set(data.getAll('services').map(String))]
  if (services.some(v => !(SERVICES as readonly string[]).includes(v))) errors.services = '필요한 관리 항목을 다시 선택해 주세요.'
  const pick = (name: string, choices: readonly string[]) => { const v = text(name); return choices.includes(v) ? v : null }
  const prices: Record<string, number | null> = {}
  for (const { name } of PRICE_POINTS) {
    const raw = text(name)
    const value = raw === '' ? null : Number(raw)
    if (value !== null && !(Number.isInteger(value) && value >= 0 && value <= MAX_PRICE_MANWON)) errors[name] = `0~${MAX_PRICE_MANWON} 사이의 숫자(만 원)로 적거나 비워 주세요.`
    prices[name] = value
  }
  if (data.get('agree') !== 'on') errors.agree = '수집 항목과 연락 목적을 읽고 동의해 주세요.'
  if (text('website')) errors.form = '접수할 수 없는 입력입니다.'
  if (!/^[0-9a-f-]{36}$/i.test(text('requestId'))) errors.form = '화면을 새로고침한 뒤 다시 신청해 주세요.'
  const source = (SOURCES as readonly string[]).includes(text('source')) ? text('source') : 'website'
  const answers = {
    inheritance: pick('inheritance', INHERITANCE), last_visit: pick('lastVisit', LAST_VISITS), current_spend: pick('currentSpend', CURRENT_SPENDS),
    price_too_cheap: prices.priceTooCheap, price_cheap: prices.priceCheap, price_expensive: prices.priceExpensive, price_too_expensive: prices.priceTooExpensive,
  }
  return { errors, row: { id: text('requestId'), region, location: location || null, residence, intent, budget, services, contact, email: email || null, source, phone_explanation: data.get('phoneExplanation') === 'on', interview_ok: data.get('interviewOk') === 'on', answers, consent_version: CARE_CONSENT_VERSION } }
}
