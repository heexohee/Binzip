import type { ResourceId } from './official-resources'

export const DECISIONS = [
  { id: 'undecided', label: '아직 고민 중', title: '결정하기 전, 이 세 가지부터 확인해요.' },
  { id: 'sell', label: '팔고 싶어요', title: '팔기 전에, 자료와 가격을 준비해요.' },
  { id: 'demolish', label: '철거하고 싶어요', title: '공사 전에, 지원과 견적 범위를 확인해요.' },
  { id: 'hold', label: '당분간 둘래요', title: '보유하는 동안, 상태와 지출을 살펴요.' },
] as const
export type Decision = (typeof DECISIONS)[number]['id']
type ActionTarget = { resource: ResourceId; href?: never } | { href: string; resource?: never }
export type DecisionAction = {
  id: string; title: string; detail: string; where: string; question: string; linkLabel: string
} & ActionTarget

/** User intent changes guidance, never the property's diagnosis or eligibility. */
export const DECISION_ACTIONS: Record<Decision, readonly DecisionAction[]> = {
  undecided: [
    { id: 'review-records', title: '집의 기록과 모르는 부분부터 확인해요.', detail: '소유관계, 건축물 기록, 현장 상태 중 빠진 정보를 먼저 정리해요.', where: '이 보고서 · 소유자 · 담당자', question: '우리 집에서 아직 확인하지 못한 항목은 무엇인가요? 어떤 서류나 현장 확인이 먼저 필요한가요?', href: '#property', linkLabel: '집 상태·근거 확인하기' },
    { id: 'compare-money', title: '팔 때 남는 돈과 철거에 드는 돈을 비교해요.', detail: '중개사·금융기관·세무사·철거업체에서 알아본 금액을 계산기에 넣어 보세요.', where: '비용 비교 · 중개사 · 철거업체', question: '그대로 팔 때와 철거 후 팔 때의 가격, 제가 부담할 정리비용을 각각 확인하고 싶어요. 아직 모르는 금액은 무엇인가요?', href: '#money', linkLabel: '매도·철거 비용 비교하기' },
    { id: 'explore-options', title: '지원과 활용 사례를 보고 방향을 정해요.', detail: '당장 결론을 내리지 않아도 돼요. 적용 가능한 지원과 다른 집의 사례를 살펴보세요.', where: '공식 사이트 · 지자체', question: '우리 집에서 알아볼 수 있는 지원이나 활용 경로가 있나요? 신청 조건과 아직 확인할 점을 알려주세요.', href: '/resources', linkLabel: '빈집 지원·정보 모음 보기' },
  ],
  sell: [
    { id: 'sale-rights', title: '집과 땅의 소유관계, 갚을 돈을 확인해요.', detail: '등기자료를 준비하고 실제 상환액은 금융기관에, 세금·거래비용은 상담으로 확인해요.', where: '인터넷등기소 · 금융기관 · 세무사', question: '매도 전에 정리할 소유·공유·상속 관계가 있나요? 대출의 실제 상환액과 예상 세금·거래비용을 각각 확인하고 싶어요.', resource: 'registry', linkLabel: '등기자료 준비하러 가기' },
    { id: 'sale-price', title: '거래 사례를 바탕으로 매도 가격을 물어봐요.', detail: '현재 상태와 철거 후 토지 상태의 가격·매도 기간을 각각 물어보세요.', where: '실거래가 공개시스템 · 지역 공인중개사', question: '이 집과 비교할 만한 최근 거래가 있나요? 현상태와 철거 후 토지의 예상 가격대, 예상 매도 기간을 각각 알고 싶어요.', resource: 'transactions', linkLabel: '주변 단독주택·토지 거래 보기' },
    { id: 'sale-route', title: '내 집을 알릴 수 있는 경로를 확인해요.', detail: '지역 중개사와 상담하고 농촌 빈집은행의 참여 지역·등록 절차도 문의해 보세요.', where: '지역 공인중개사 · 소재지 담당 부서', question: '이 주소가 농촌 빈집은행에 등록할 수 있는 대상인가요? 등록에 필요한 자료와 거래를 담당하는 창구를 알려주세요.', resource: 'greendaero', linkLabel: '농촌 빈집은행 살펴보기' },
  ],
  demolish: [
    { id: 'demolition-support', title: '계약 전에 지원 조건과 본인 부담을 물어봐요.', detail: '접수 여부, 선정 절차, 착공 시점과 철거 후 부지 활용 조건을 확인해요.', where: '관할 지자체 · 읍·면·동 행정복지센터', question: '현재 빈집정비 지원을 접수하나요? 공사 계약 전에 필요한 절차, 본인 부담, 철거 후 부지 사용 조건은 무엇인가요?', href: '#support-title', linkLabel: '철거 지원 조건·문의처 보기' },
    { id: 'demolition-scope', title: '같은 작업 범위로 현장 견적을 받아요.', detail: '해체, 석면 확인·처리, 잔존물·폐기물, 행정 비용의 포함·제외를 구분해요.', where: '철거업체 · 현장 확인', question: '견적 총액에 건물 해체, 석면 조사·처리, 잔존물·폐기물, 행정 비용과 부가세가 포함되나요? 현장 확인 뒤 추가되는 조건도 적어 주세요.', href: '#demolition', linkLabel: '견적에 포함할 항목 보기' },
    { id: 'demolition-procedure', title: '우리 집의 해체 절차와 서류를 확인해요.', detail: '관할 부서에 해체 관련 신고·허가, 계획서 등 해당 건물에 필요한 절차를 물어보세요.', where: '관할 건축·주택 담당 부서', question: '이 주소의 건물을 해체할 때 필요한 신고·허가와 서류는 무엇인가요? 지원사업 절차와 공사 후 정리할 공부까지 안내받고 싶어요.', href: '/resources#laws', linkLabel: '관련 법령·조례 확인하기' },
  ],
  hold: [
    { id: 'hold-record', title: '현재 상태와 보유 중 지출을 기록해요.', detail: '안전하게 확인할 수 있는 외관과 최근 고지서·정리비 지출을 기록해 두세요.', where: '소유자 · 현장 담당자', question: '확인된 외관 상태와 아직 보지 못한 부분은 어디인가요? 최근 세금·공과금·정리비를 모아 보유 부담을 파악하고 싶어요.', href: '#property', linkLabel: '현재 기록·미확인 항목 보기' },
    { id: 'hold-inspection', title: '필요한 점검과 지원 창구를 알아봐요.', detail: '노후 건축물 점검 등 이용 가능한 사업이 있는지, 내 집이 대상인지 문의해요.', where: '관할 지자체 · 건축 담당 부서', question: '이 집이 노후 건축물 점검 등 지원 대상에 해당하나요? 신청 방법과 현재 우선 확인할 부분을 안내받고 싶어요.', resource: 'pohang-notices', linkLabel: '포항시 점검·지원 공고 보기' },
    { id: 'hold-options', title: '다음 결정을 위한 활용 사례를 살펴요.', detail: '정비·활용 사례를 보며 계속 보유할지 다시 비교해 보세요. 같은 방식이 가능한지는 별도 확인이 필요해요.', where: '빈집애 · 지역 담당자', question: '우리 집과 비슷한 조건에서 참고할 정비·활용 사례가 있나요? 가능한 범위와 소유자가 부담할 비용을 확인하고 싶어요.', resource: 'binzibe', linkLabel: '빈집 정비·활용 사례 찾아보기' },
  ],
}
