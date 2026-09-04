import type { Finding } from './rules/engine'
import type { AxisVerdict } from './types'

/** 심각도. 축별로 가장 심한 것이 그 축의 판정이 된다. */
const RANK: Record<AxisVerdict, number> = { clear: 0, unknown: 1, suspect: 2, blocked: 3 }

export type Axis = 'legal' | 'physical' | 'regulatory'

/** W3 우선순위 — 한 집에 장애가 둘 이상이면 가장 먼저 걸리는 것 하나로 분류한다 */
export const AXIS_ORDER: Axis[] = ['legal', 'physical', 'regulatory']

export const AXIS_LABEL: Record<Axis, string> = {
  legal: '① 법적',
  physical: '② 물리적',
  regulatory: '③ 규제',
}

export type AxisSummary = {
  axis: Axis
  verdict: AxisVerdict
  findings: Finding[]
}

export type Grade = '가능' | '조건부' | '불가'

export type Diagnosis = {
  grade: Grade
  /** 등급을 결정한 축 (가능이면 null) */
  decidedBy: Axis | null
  headline: string
  axes: AxisSummary[]
  /** 사람이 현장 확인을 마쳤는지. 자동 판정만으로는 '가능'이 나오지 않는다 */
  fieldVerified: boolean
}

export function summarize(findings: Finding[]): AxisSummary[] {
  return AXIS_ORDER.map(axis => {
    const own = findings.filter(f => f.axis === axis)
    const verdict = own.reduce<AxisVerdict>(
      (worst, f) => (RANK[f.verdict] > RANK[worst] ? f.verdict : worst),
      'clear',
    )
    // 같은 항목(label)에 문제가 잡혔으면 그 항목의 clear 는 지운다 — 상충 표시 방지.
    // 다른 항목의 clear 는 남긴다. '위반건축물 등재 없음' 같은 확인 사실은
    // 축 전체가 unknown 이라는 이유로 사라지면 안 된다.
    const troubled = new Set(own.filter(f => f.verdict !== 'clear').map(f => f.label))
    const findingsOut = own.filter(f => f.verdict !== 'clear' || !troubled.has(f.label))

    // 문제 → 미확인 → 확인됨 순으로 보여준다
    const order: Record<AxisVerdict, number> = { blocked: 0, suspect: 1, unknown: 2, clear: 3 }
    findingsOut.sort((a, b) => order[a.verdict] - order[b.verdict])

    return { axis, verdict, findings: findingsOut }
  })
}

export function combine(findings: Finding[], fieldVerified = false): Diagnosis {
  const axes = summarize(findings)

  const blocked = AXIS_ORDER.map(a => axes.find(x => x.axis === a)!).find(
    x => x.verdict === 'blocked',
  )
  if (blocked) {
    return {
      grade: '불가',
      decidedBy: blocked.axis,
      headline: blocked.findings[0]?.reason ?? '거래를 막는 사유가 있습니다.',
      axes,
      fieldVerified,
    }
  }

  // 구체적 문제(suspect)가 있으면 그것을 헤드라인으로 쓴다
  const concern = AXIS_ORDER.map(a => axes.find(x => x.axis === a)!).find(
    x => x.verdict === 'suspect',
  )
  if (concern) {
    return {
      grade: '조건부',
      decidedBy: concern.axis,
      headline: concern.findings[0]?.reason ?? '확인이 더 필요합니다.',
      axes,
      fieldVerified,
    }
  }

  // 남은 게 '자동으로 확인 못 한 것'뿐이라면, 그 사실 자체가 좋은 소식이다.
  // 모든 진단서가 "등기부는 공개 API가 없어…" 로 시작하면 아무 정보가 안 된다.
  const unknown = AXIS_ORDER.map(a => axes.find(x => x.axis === a)!).find(
    x => x.verdict === 'unknown',
  )
  if (unknown) {
    return {
      grade: '조건부',
      decidedBy: unknown.axis,
      headline: '공개 자료에서는 거래를 막는 사유가 확인되지 않았습니다. 등기와 현장 확인이 남았습니다.',
      axes,
      fieldVerified,
    }
  }

  // 세 축이 모두 clear 여도 현장 확인 전에는 '가능'을 주지 않는다
  if (!fieldVerified) {
    return {
      grade: '조건부',
      decidedBy: null,
      headline: '공개 자료상으로는 막는 사유가 없습니다. 현장 확인이 남았습니다.',
      axes,
      fieldVerified,
    }
  }

  return {
    grade: '가능',
    decidedBy: null,
    headline: '지금 처분할 수 있는 상태입니다.',
    axes,
    fieldVerified,
  }
}
