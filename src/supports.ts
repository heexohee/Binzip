/** Reviewed official sources, not a live budget/eligibility API. */
export const SUPPORT_CHECKED_AT = '2026-09-11'
export type SupportCheck = { label: string; detail: string; confirmed: boolean }
export type Support = {
  id: string
  title: string
  status: string
  amount: string
  period: string
  where: string
  phone: string
  checks: SupportCheck[]
  nextStep: string
  source: { title: string; url: string; publishedAt: string }
  checkedAt: string
}

export type SupportInput = { facts?: Record<string, unknown>; address?: string; pnu?: string | null }

export function buildSupports({ facts = {}, address = '', pnu }: SupportInput, now = new Date()): Support[] {
  // Only a resolved parcel establishes locality; raw text remains self-reported.
  const parcel = /^\d{19}$/.test(pnu ?? '') ? pnu! : null
  const pohang = Boolean(parcel && /^(47111|47113)/.test(parcel))
  const otherRegion = Boolean(parcel && !pohang)
  if (otherRegion) return []
  const region: SupportCheck = {
    label: '소재지', confirmed: pohang,
    detail: pohang ? '확인된 필지번호상 포항시 소재' : /포항/.test(address)
      ? '입력 주소는 포항 지역입니다. 정확한 소재지 확인이 필요합니다.'
      : '포항시 소재인지 주소 확인이 필요합니다.',
  }
  const thisYear = now.getFullYear() === 2026
  const stale = now.getTime() > Date.parse(SUPPORT_CHECKED_AT + 'T00:00:00+09:00') + 45 * 86400000
  const status = !thisYear || stale ? '최신 공고 재확인 필요' : '대상 여부 확인 필요'
  const budget = !thisYear ? '2026년 공고입니다. 올해 공고를 다시 확인해 주세요.'
    : '2026. 1. 28.부터 예산 소진 시까지 · 현재 접수·예산 잔액 미확인'

  return [
    {
      id: 'pohang-demolition-2026', title: '포항시 도시·농어촌 빈집정비사업', status,
      amount: '지원 한도·본인 부담은 최신 공고와 담당자 확인', period: budget,
      where: '소재지 읍·면·동 행정복지센터 / 포항시 공동주택과 주택정비팀', phone: '054-270-3608',
      checks: [region,
        { label: '건축물 기록', confirmed: facts.hasBuilding === true,
          detail: facts.hasBuilding === true ? '건축물 자료가 있습니다. 빈집 지원 자격이 확인된 것은 아닙니다.' : '건축물 기록과 빈집 인정 여부를 확인해야 합니다.' },
        { label: '빈집·권리 조건', confirmed: false, detail: '빈집 인정기준, 소유자·공유자 동의, 대상 선정 여부 확인' },
        { label: '공공 활용·중복 지원', confirmed: false, detail: '철거 후 부지 활용 의무와 기간, 다른 사업과의 중복 지원 조건 확인' },
      ],
      nextStep: '공사 계약 전에 주소를 알려주고 “현재 접수 가능한지, 소유주가 부담할 비용과 철거 후 부지 사용 조건은 무엇인지” 문의하세요.',
      source: { title: '포항시 2026년 도시·농어촌 빈집정비사업 신청 공고',
        url: 'https://www.pohang.go.kr/dept/board/post/view.do?bcIdx=100&mid=0307010000&idx=1017074', publishedAt: '2026-03-11' },
      checkedAt: SUPPORT_CHECKED_AT,
    },
    {
      id: 'pohang-slate-2026', title: '슬레이트 철거·지붕개량 지원', status,
      amount: '건축물 용도·가구 조건·작업 범위에 따라 확인',
      period: thisYear ? '2026년 사업 시행 확인 · 현재 신청 기간·예산 잔액 미확인' : '2026년 사업 자료입니다. 올해 공고 확인 필요',
      where: '포항시 환경정책과 / 소재지 행정복지센터 (대표전화 연결)', phone: '054-270-8282',
      checks: [region,
        { label: '지붕 재료', confirmed: false, detail: '슬레이트 포함 여부와 처리 면적 확인. 사진·건물 구조명만으로 석면을 확정하지 않습니다.' },
        { label: '지원 범위', confirmed: false, detail: '주택·비주택 구분, 우선지원 조건, 지붕개량 지원 여부 확인' },
        { label: '별도 비용', confirmed: false, detail: '집 전체 철거, 내부 짐 처리, 새 지붕 공사 중 지원에서 빠지는 비용 확인' },
      ],
      nextStep: '지붕 사진과 주소를 준비해 슬레이트 조사·철거 지원 절차와 빈집정비사업 연계 가능 여부를 문의하세요. 사진을 찍으려고 지붕에 올라가지 마세요.',
      source: { title: '포항시의회 제332회 복지환경위원회 — 슬레이트 지원사업 보고',
        url: 'https://council.pohang.go.kr/mnts/cnts/mnt/mntsViewer.php?schSn=6048', publishedAt: '2026-07-22' },
      checkedAt: SUPPORT_CHECKED_AT,
    },
  ]
}
