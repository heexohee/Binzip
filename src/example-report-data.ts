import type { AxisBlock } from './report-view'
import { DECISION_ACTIONS, type Decision, type DecisionAction } from './decision-actions'
import { EXAMPLE_DISPOSAL, formatWon } from './disposal'
import { buildSupports } from './supports'

// Fictional case for example routes only. The user supplied the address; no
// registry, ledger, ownership or valuation lookup was performed for this case.
// Never import this fixture into real address lookup or customer report models.
export const EXAMPLE_CASE = {
  address: '경상북도 포항시 남구 호미곶면 대보리 126-6',
  shortAddress: '호미곶면 대보리 126-6',
  checkedAt: '2026. 09. 12.',
  notice: '이 주소를 바탕으로 만든 가상 사례입니다. 건물·거래·금액·진행 정보는 시연용이며, 실제 상담·계약·공사는 진행되지 않습니다.',
  land: { category: '대', area: 198 },
  building: {
    purpose: '단독주택', structure: '목조', roof: '기와',
    area: 56.2, totalFloorArea: 56.2, floors: '지상 1층 / 지하 없음',
    approvedAt: '1985. 04. 18.', count: 1, violation: '표시 없음',
  },
  registry: {
    owner: '소유자 A', share: '단독 소유 · 지분 1/1',
    acquisition: '상속', acquiredAt: '2018. 03. 16.',
    ownerMatch: '토지·건물 동일 소유자',
    restriction: '압류·가압류·가처분 기재 없음',
    mortgageCount: 1, mortgageMaximum: 6_000_000, creditor: '금융기관 A',
  },
  owner: {
    vacantSince: '2021년',
    repayment: Number(EXAMPLE_DISPOSAL[0].debt) * 10_000,
    note: '상속받은 집으로, 2021년부터 비어 있어요. 현재 다른 지역에 거주하고 있어 그대로 팔지, 철거 후 땅을 팔지 고민하고 있어요.',
  },
} as const

export const EXAMPLE_REPORT_RECORDS = [
  { label: '건축물대장 용도', value: EXAMPLE_CASE.building.purpose },
  { label: '구조·지붕', value: `${EXAMPLE_CASE.building.structure} · ${EXAMPLE_CASE.building.roof}` },
  { label: '건축면적', value: `${EXAMPLE_CASE.building.area}㎡` },
  { label: '연면적', value: `${EXAMPLE_CASE.building.totalFloorArea}㎡` },
  { label: '토지면적', value: `${EXAMPLE_CASE.land.area}㎡` },
  { label: '층수', value: EXAMPLE_CASE.building.floors },
  { label: '사용승인일', value: EXAMPLE_CASE.building.approvedAt },
  { label: '소유관계', value: EXAMPLE_CASE.registry.ownerMatch },
]

export const EXAMPLE_SUPPORTS = buildSupports({ address: EXAMPLE_CASE.address, facts: { hasBuilding: true } }).map(support => ({
  ...support,
  checks: support.checks.map(check => check.label === '소재지'
    ? { ...check, confirmed: true, detail: '등기부·건축물대장상 포항시 남구 호미곶면 소재입니다.' }
    : check),
}))

export const EXAMPLE_DOCUMENTS = [
  {
    id: 'example-registry', title: '등기부 요약 보기', status: '토지·건물 등기 확인',
    groups: [
      { title: '표제부 · 부동산 표시', rows: [
        { label: '소재지', value: EXAMPLE_CASE.address },
        { label: '토지', value: `${EXAMPLE_CASE.land.category} · ${EXAMPLE_CASE.land.area}㎡` },
        { label: '건물', value: `${EXAMPLE_CASE.building.structure} ${EXAMPLE_CASE.building.roof}지붕 단층 ${EXAMPLE_CASE.building.purpose} · ${EXAMPLE_CASE.building.area}㎡` },
      ] },
      { title: '갑구 · 소유관계', rows: [
        { label: '소유자', value: `${EXAMPLE_CASE.registry.owner} · ${EXAMPLE_CASE.registry.share}` },
        { label: '토지·건물 소유', value: EXAMPLE_CASE.registry.ownerMatch },
        { label: '취득 원인·등기일', value: `${EXAMPLE_CASE.registry.acquisition} · ${EXAMPLE_CASE.registry.acquiredAt}` },
        { label: '권리 제한 기재', value: EXAMPLE_CASE.registry.restriction },
      ] },
      { title: '을구 · 담보 내역', rows: [
        { label: '근저당권', value: `${EXAMPLE_CASE.registry.mortgageCount}건 · 토지·건물 공동담보` },
        { label: '채권최고액', value: formatWon(EXAMPLE_CASE.registry.mortgageMaximum) },
        { label: '근저당권자', value: EXAMPLE_CASE.registry.creditor },
      ] },
    ],
  },
  {
    id: 'example-building-ledger', title: '건축물대장 요약 보기', status: '일반건축물대장 확인',
    groups: [
      { title: '건물의 기본 정보', rows: [
        { label: '대지 위치', value: EXAMPLE_CASE.address },
        { label: '건축물 수', value: `${EXAMPLE_CASE.building.count}동` },
        { label: '주용도', value: EXAMPLE_CASE.building.purpose },
        { label: '주구조·지붕', value: `${EXAMPLE_CASE.building.structure} · ${EXAMPLE_CASE.building.roof}` },
        { label: '층수', value: EXAMPLE_CASE.building.floors },
        { label: '건축면적 / 연면적', value: `${EXAMPLE_CASE.building.area}㎡ / ${EXAMPLE_CASE.building.totalFloorArea}㎡` },
        { label: '대지면적', value: `${EXAMPLE_CASE.land.area}㎡` },
        { label: '사용승인일', value: EXAMPLE_CASE.building.approvedAt },
      ] },
      { title: '소유자와 대장 기재', rows: [
        { label: '소유자', value: `${EXAMPLE_CASE.registry.owner} · 지분 1/1` },
        { label: '위반건축물 표시', value: EXAMPLE_CASE.building.violation },
      ] },
    ],
  },
] as const

export const EXAMPLE_REPORT_BLOCKS: AxisBlock[] = [
  { axis: 'rights', label: '권리관계', badge: '등기 확인 · 담보 1건', items: [
    { label: '집과 땅의 소유자가 같아요.', lines: [
      `토지와 건물 모두 ${EXAMPLE_CASE.registry.owner}의 단독 소유로, ${EXAMPLE_CASE.registry.acquiredAt} 상속 등기가 기재되어 있어요.`,
      EXAMPLE_CASE.registry.restriction + '.',
    ], source: `토지·건물 등기부 갑구 · ${EXAMPLE_CASE.checkedAt} 확인`, unverified: false },
    { label: '매도할 때 담보 정리가 필요해요.', lines: [
      `토지와 건물을 공동담보로 한 근저당권 ${EXAMPLE_CASE.registry.mortgageCount}건, 채권최고액 ${formatWon(EXAMPLE_CASE.registry.mortgageMaximum)}이 기재되어 있어요.`,
      `계산에는 소유자가 입력한 상환 예정액 ${formatWon(EXAMPLE_CASE.owner.repayment)}을 반영했어요. 계약 전에 금융기관과 상환액·말소 순서를 확인해요.`,
    ], source: `등기부 을구 · 소유자 입력 · ${EXAMPLE_CASE.checkedAt}`, unverified: true },
  ] },
  { axis: 'tax', label: '세금·거래비용', badge: '개인별 세금 확인 필요', items: [
    { label: '상속받은 주택의 거래비용을 반영했어요.', lines: [
      '상속 취득 이력을 바탕으로 매도 시 세금·거래비용을 확인할 차례예요.',
      '취득 당시 가액, 보유 주택과 공제 조건을 준비해 세무 상담을 받아요. 계약 전 세금과 중개보수 등 거래비용을 다시 확인하세요.',
    ], source: '소유자 입력 · 세무 상담 전', unverified: true },
  ] },
  { axis: 'property', label: '건물·토지와 현장 상태', badge: '대장 확인 · 현장 확인 필요', items: [
    { label: '단층 목조 단독주택이에요.', lines: [
      `${EXAMPLE_CASE.building.approvedAt} 사용승인을 받은 ${EXAMPLE_CASE.building.structure}·${EXAMPLE_CASE.building.roof} 단독주택이에요. 건축면적과 연면적은 각각 ${EXAMPLE_CASE.building.area}㎡, 대지면적은 ${EXAMPLE_CASE.land.area}㎡예요.`,
      '건축물대장에 위반건축물 표시는 없어요. 실제 증축·변경 여부는 현장에서 대장과 대조해요.',
    ], source: `일반건축물대장 · ${EXAMPLE_CASE.checkedAt} 확인`, unverified: false },
    { label: '견적 전에 현장에서 볼 부분이 있어요.', lines: [
      `${EXAMPLE_CASE.owner.vacantSince}부터 비어 있다는 소유자 설명이 있어요. 지붕 내부·목재 상태, 남은 짐과 장비 진입 여건을 확인해야 해요.`,
      '현장 방문과 석면 조사는 아직 진행하지 않았어요. 대장에 적힌 지붕 재료만으로 석면 유무를 판단하지 않아요.',
    ], source: '소유자 입력 · 현장 확인 대기', unverified: true },
  ] },
  { axis: 'market', label: '주변 거래와 매도 가능성', badge: '매도 상담 필요', items: [
    { label: '두 가지 매도 방향을 비교했어요.', lines: [
      '등기부와 건축물대장을 함께 준비했어요. 집을 남겨 둔 채 파는 방법과 철거 후 땅을 파는 방법을 비교할 수 있어요.',
      '지역 중개사에게 이 자료를 보여주고 실제 매수 수요, 가격 범위와 매도 기간을 함께 물어보세요.',
    ], source: '매도 비교 입력값 · 지역 중개사 상담 전', unverified: true },
  ] },
]

// The example has documents ready. Real cases keep their existing next steps.
export const EXAMPLE_DECISION_ACTIONS: Record<Decision, readonly DecisionAction[]> = {
  ...DECISION_ACTIONS,
  undecided: DECISION_ACTIONS.undecided.map(step => step.id === 'review-records' ? {
    ...step, title: '확인한 서류와 남은 현장 항목을 살펴봐요.',
    detail: '토지·건물 등기부와 건축물대장을 정리했어요. 담보 상환, 현장 상태와 매도 상담이 남아 있어요.',
    question: '서류상 소유관계와 건물 정보는 확인했어요. 상환·현장 점검·매도 상담 중 무엇부터 진행하면 좋을까요?',
    linkLabel: '확인한 서류와 남은 항목 보기',
  } : step),
  sell: DECISION_ACTIONS.sell.map(step => step.id === 'sale-rights' ? {
    id: step.id, title: '상환액과 담보를 말소할 순서를 확인해요.',
    detail: `등기부상 근저당권이 ${EXAMPLE_CASE.registry.mortgageCount}건 있어요. 입력한 상환 예정액 ${formatWon(EXAMPLE_CASE.owner.repayment)}과 말소 순서를 금융기관에 확인하고, 계약 전 최신 등기도 다시 살펴보세요.`,
    where: '금융기관 · 지역 공인중개사',
    question: `토지·건물을 함께 담보로 한 근저당권이 있어요. 상환 예정액 ${formatWon(EXAMPLE_CASE.owner.repayment)}에서 달라질 금액과 매도 시 말소 순서를 확인하고 싶어요.`,
    href: '#example-registry', linkLabel: '확인한 등기 내역 보기',
  } : step),
}
