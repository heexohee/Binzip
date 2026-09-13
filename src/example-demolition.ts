/** Synthetic transactions and workflow snapshots, used only by the example UI. */
export const EXAMPLE_TRANSACTIONS = [
  { id: 'house-a', kind: '단독주택', name: '호미곶면 주택 A', date: '2026. 06. 18.', land: 185, building: 52, price: 2800, note: '목조 · 1983년 사용승인' },
  { id: 'house-b', kind: '단독주택', name: '호미곶면 주택 B', date: '2026. 05. 22.', land: 205, building: 61, price: 3200, note: '목조 · 1988년 사용승인' },
  { id: 'house-c', kind: '단독주택', name: '호미곶면 주택 C', date: '2026. 03. 05.', land: 220, building: 64, price: 3500, note: '벽돌조 · 1991년 사용승인' },
  { id: 'land-a', kind: '토지', name: '호미곶면 토지 A', date: '2026. 07. 10.', land: 180, building: null, price: 3900, note: '지목 대 · 건물 없음' },
  { id: 'land-b', kind: '토지', name: '호미곶면 토지 B', date: '2026. 04. 16.', land: 205, building: null, price: 4400, note: '지목 대 · 건물 없음' },
] as const

// All amounts are in 만원, include VAT where applicable, and total 1,200.
export const EXAMPLE_DEMOLITION_BUDGET = [
  { name: '건물 해체', amount: 450, detail: '본채 56.2㎡ · 장비·인력' },
  { name: '짐·폐기물 처리', amount: 330, detail: '잔존물 정리 · 운반·처리' },
  { name: '설비 차단·부지 정리', amount: 120, detail: '설비 정리 · 공사 후 땅 고르기' },
  { name: '행정 서류·현장 관리', amount: 100, detail: '필요 서류 준비 · 현장 일정 관리' },
  { name: '예비비', amount: 150, detail: '현장 확인 후 달라질 작업에 대비' },
  { name: '빈집진단서 진행지원 수수료', amount: 50, detail: '견적 범위 비교 · 일정·완료자료 정리' },
] as const
export const EXAMPLE_BUDGET_TOTAL = EXAMPLE_DEMOLITION_BUDGET.reduce((sum, item) => sum + item.amount, 0)

export const EXAMPLE_PREPARATION = [
  { title: '담보 정리 순서를 확인해요.', status: '협의할 내용', detail: '토지·건물에 근저당 1건이 있어요. 채권최고액 600만 원과 상환 예정액 500만 원을 구분해 정리했어요.', service: '금융기관에 확인할 항목과 필요한 자료를 정리해요.', owner: '상환 예정액을 확인하고, 필요한 협의에 참여해요.', href: '#example-registry', link: '등기 내역 보기' },
  { title: '지원 조건을 먼저 살펴봐요.', status: '계약 전 확인', detail: '포항시 소재와 건축물 기록을 확인했어요. 지원 선정·본인 부담·철거 후 부지 사용 조건을 알아볼 차례예요.', service: '담당 창구와 제출자료, 신청 순서를 정리해요.', owner: '철거 후 땅을 팔 계획인지, 활용할 계획인지 알려주세요.', href: '#support-title', link: '지원 정보 보기' },
  { title: '같은 범위로 현장 견적을 받아요.', status: '방문 일정 조율', detail: '본채 해체부터 짐·폐기물 처리, 부지 정리까지 예산에 넣었어요. 석면 조사와 추가 작업 범위는 현장에서 확인해요.', service: '협력사 방문을 조율하고 포함·제외 항목을 비교해요.', owner: '출입 방법과 남길 물건, 가능한 방문 시간을 알려주세요.', href: '#demolition', link: '철거 예산 내역 보기' },
] as const

export type ProgressStage = {
  id: string; label: string; title: string; date: string; manager: string;
  description: string; next: string; ownerTask: string; work: readonly string[];
  records: readonly { name: string; state: string }[];
}

export const EXAMPLE_PROGRESS_STAGES: readonly ProgressStage[] = [
  { id: 'consultation', label: '상담 접수', title: '담당자가 집의 자료를 살펴보고 있어요.', date: '9월 14일 · 첫 상담', manager: '빈집진단서 담당 매니저', description: '등기부·건축물대장과 상담 요청을 한곳에 모았어요.', next: '원하시는 철거 범위와 방문 가능한 시간을 확인해요.', ownerTask: '본채에 들어가는 방법과 남길 물건을 알려주세요.', work: ['제출된 서류와 상담 내용 정리', '철거 목적과 희망 일정 확인'], records: [{ name: '등기부·건축물대장', state: '준비 완료' }, { name: '상담 요청서', state: '접수 완료' }] },
  { id: 'conditions', label: '권리·지원 확인', title: '공사 전에 정리할 조건을 확인하고 있어요.', date: '9월 16일 · 조건 정리 안내', manager: '빈집진단서 담당 매니저', description: '담보 관련 협의와 지원사업의 신청 순서를 정리하는 단계예요.', next: '지원 조건과 본인 부담을 정리한 뒤 현장 견적을 준비해요.', ownerTask: '금융기관의 상환 안내와 철거 후 부지 활용 계획을 알려주세요.', work: ['담보 관련 확인사항 정리', '지원 창구·선정 절차·부지 활용 조건 확인'], records: [{ name: '등기 확인 메모', state: '정리 완료' }, { name: '지원 조건 확인표', state: '확인 중' }] },
  { id: 'estimate', label: '현장 견적', title: '현장 방문 일정을 잡았어요.', date: '9월 18일 오전 10시 · 현장 방문', manager: '담당 매니저 · 철거 협력사 A', description: '같은 작업 범위로 견적을 받아 비교해요. 건물 해체·짐·폐기물·부지 정리 항목을 함께 살펴봐요.', next: '방문 결과와 포함·별도 비용을 정리해 전달해요.', ownerTask: '방문 당일 출입 방법과 보관할 물건을 확인해 주세요.', work: ['장비 진입·인접 건물·지붕 자재 확인', '총액과 포함·별도 작업 비교'], records: [{ name: '현장 방문 일정', state: '조율 완료' }, { name: '작업 범위 확인표', state: '준비 완료' }] },
  { id: 'contract', label: '범위·계약', title: '계약 전에 금액과 작업 범위를 확인해요.', date: '9월 21일 · 계약 내용 검토', manager: '담당 매니저 · 철거 협력사 A', description: '현장 견적 1,150만 원에 진행지원 수수료 50만 원을 더한 총 1,200만 원으로 내용을 정리했어요.', next: '범위·별도 비용·대금 일정에 동의한 뒤 공사 준비로 넘어가요.', ownerTask: '총금액과 추가 비용 조건, 맡기는 업무 범위를 읽어 주세요.', work: ['견적 포함·제외 항목 설명', '계약·대금 일정과 책임 범위 확인'], records: [{ name: '최종 견적 내역', state: '정리 완료' }, { name: '계약 확인사항', state: '검토 대기' }] },
  { id: 'ready', label: '공사 준비', title: '공사를 시작할 준비를 하고 있어요.', date: '9월 28일 · 착공 전 점검', manager: '담당 매니저 · 철거 협력사 A', description: '선행 조건과 필요한 행정 절차, 설비 차단·출입 여건을 확인해요.', next: '준비 항목이 완료되면 공사 일정을 최종 안내해요.', ownerTask: '남길 물건을 옮겼는지, 출입 방법이 바뀌지 않았는지 확인해 주세요.', work: ['지원·담보 관련 선행 조건 확인', '행정 서류와 설비·현장 준비 점검'], records: [{ name: '계약 내역', state: '확인 완료' }, { name: '착공 전 확인표', state: '점검 중' }] },
  { id: 'demolition', label: '철거 진행', title: '철거와 폐기물 정리를 진행하고 있어요.', date: '9월 30일 · 현장 작업 안내', manager: '철거 협력사 A · 담당 매니저', description: '오늘 진행한 작업과 다음 일정을 기록해요. 추가 작업이 생기면 금액과 사유를 먼저 설명해요.', next: '폐기물 반출과 부지 정리를 마친 뒤 완료자료를 모아요.', ownerTask: '변경 요청이 오면 작업 범위와 비용을 확인해 주세요.', work: ['건물 해체·폐기물 반출 진행', '일정·변경사항 전달'], records: [{ name: '공사 진행 기록', state: '업데이트 완료' }, { name: '폐기물 반출 내역', state: '정리 중' }] },
  { id: 'complete', label: '마무리', title: '철거와 마무리 자료 정리가 끝났어요.', date: '10월 5일 · 완료 안내', manager: '빈집진단서 담당 매니저', description: '부지 정리와 완료자료, 비용 정산 내역을 한곳에 모았어요.', next: '보관할 자료를 확인하고, 부지 매도나 활용 계획을 이어가세요.', ownerTask: '완료자료와 정산 내역을 보관해 주세요.', work: ['부지 정리와 잔존물 확인', '완료자료·공부 정리 확인·비용 정산 안내'], records: [{ name: '작업 완료 기록', state: '정리 완료' }, { name: '폐기물 처리자료', state: '정리 완료' }, { name: '공부 정리 확인·정산 내역', state: '정리 완료' }] },
]

export function progressSnapshot(index: number | null) {
  const active = index !== null && Number.isInteger(index) && index >= 0 && index < EXAMPLE_PROGRESS_STAGES.length ? index : null
  const finished = active === EXAMPLE_PROGRESS_STAGES.length - 1
  return {
    active,
    stage: active === null ? null : EXAMPLE_PROGRESS_STAGES[active]!,
    completed: finished ? EXAMPLE_PROGRESS_STAGES.length : active ?? 0,
    statuses: EXAMPLE_PROGRESS_STAGES.map((_, i) => active === null ? '대기' : finished || i < active ? '완료' : i === active ? '진행 중' : '예정'),
  }
}
