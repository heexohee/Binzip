export type IntakeGoal = 'sell' | 'repair' | 'demolish' | 'manage' | 'all'

/** The single biggest worry. `title` is what the owner taps; `stored` keeps the words earlier applications used. */
export const GOALS: { value: IntakeGoal; title: string; text: string; stored: string }[] = [
  { value: 'sell', title: '팔기', text: '팔 수 있을지, 얼마에 팔릴지', stored: '매매' },
  { value: 'repair', title: '고치기', text: '고쳐 쓸 수 있을지, 수리 비용', stored: '수리' },
  { value: 'demolish', title: '철거', text: '철거 비용과 지원 조건', stored: '철거' },
  { value: 'manage', title: '관리', text: '당분간 두면서 관리하는 방법', stored: '관리' },
  { value: 'all', title: '아직 모르겠어요', text: '여러 방법을 함께 비교할게요', stored: '전체 비교' },
]

export const VACANCY_OPTIONS = ['1년이 안 됐어요', '1~3년', '3~5년', '5년이 넘었어요', '잘 모르겠어요'] as const
export const APPLICANT_OPTIONS = ['소유자 본인', '자녀·가족', '기타'] as const

/** Screen order: tap-only questions first, location asked once (시·군 required, exact address skippable), contact last. */
export function intakeScreens(goal: IntakeGoal | null): string[] {
  const includes = (value: IntakeGoal) => goal === 'all' || goal === value
  return ['basics', 'owner',
    ...(includes('repair') ? ['repair'] : []),
    ...(includes('demolish') ? ['demolition'] : []),
    'house', 'location', 'contact']
}

/** Progress bar group for each screen: 0 간단한 질문, 1 집 상황, 2 위치·연락처. */
export function intakePhase(screen: string): number {
  if (screen === 'basics') return 0
  if (screen === 'location' || screen === 'contact') return 2
  return 1
}

/** Text saved as the application address: the typed address, or just the region when it was skipped. */
export function applicationAddress(detail: string, region: string): { address: string; hasDetail: boolean } {
  const typed = detail.trim()
  return typed ? { address: typed, hasDetail: true } : { address: region.trim(), hasDetail: false }
}
