import type { Finding } from './rules/engine'
import type { AxisVerdict } from './types'

/** 심각도. 축별로 가장 심한 것이 그 축의 판정이 된다. */
const RANK: Record<AxisVerdict, number> = {
  clear: 0,
  unknown: 1,
  suspect: 2,
  precondition: 3,
  blocked: 4,
}

export type Axis = 'rights' | 'tax' | 'property' | 'market'

/** 진단서 표시 순서. 4개 전부 나온다. */
export const AXIS_ORDER: Axis[] = ['rights', 'tax', 'property', 'market']

/**
 * 등급을 결정하는 축.
 *
 * 세금이 나쁘다고 거래가 막히지는 않는다 — 셈법이 바뀔 뿐이다. 시장성도 같다.
 * rights·property 는 '할 수 있느냐'를 막고,
 * tax·market 은 '어느 쪽이 유리하냐'를 정한다.
 * tax·market 도 축 판정은 내되 여기에는 들어오지 않는다.
 */
const GATING: Axis[] = ['rights', 'property']

export const AXIS_LABEL: Record<Axis, string> = {
  rights: '① 권리',
  tax: '② 세금',
  property: '③ 건물·토지',
  market: '④ 시장·관리',
}

export type AxisSummary = {
  axis: Axis
  verdict: AxisVerdict
  findings: Finding[]
}

export type Grade = '가능' | '조건부' | '선행필요' | '불가'

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
  return AXIS_ORDER.map((axis) => {
    const own = findings.filter((f) => f.axis === axis)
    const verdict = own.reduce<AxisVerdict>(
      (worst, f) => (RANK[f.verdict] > RANK[worst] ? f.verdict : worst),
      'clear',
    )
    // 같은 항목(label)에 문제가 잡혔으면 그 항목의 clear 는 지운다 — 상충 표시 방지.
    // 다른 항목의 clear 는 남긴다. '위반건축물 등재 없음' 같은 확인 사실은
    // 축 전체가 unknown 이라는 이유로 사라지면 안 된다.
    const troubled = new Set(own.filter((f) => f.verdict !== 'clear').map((f) => f.label))
    const findingsOut = own.filter((f) => f.verdict !== 'clear' || !troubled.has(f.label))

    // 심각한 것부터 보여준다
    findingsOut.sort((a, b) => RANK[b.verdict] - RANK[a.verdict])

    return { axis, verdict, findings: findingsOut }
  })
}

export function combine(findings: Finding[], fieldVerified = false): Diagnosis {
  const axes = summarize(findings)

  // 등급은 GATING 축만 본다. 우선순위는 앞선 축이 이긴다.
  const gating = GATING.map((a) => axes.find((x) => x.axis === a)!)
  const worstOf = (v: AxisVerdict) => gating.find((x) => x.verdict === v)

  const blocked = worstOf('blocked')
  if (blocked) {
    return {
      grade: '불가',
      decidedBy: blocked.axis,
      headline: blocked.findings[0]?.reason ?? '거래를 막는 사유가 있습니다.',
      axes,
      fieldVerified,
    }
  }

  // 해결형 — "불가"가 아니라 "이것부터 하면 됩니다"
  const pre = worstOf('precondition')
  if (pre) {
    return {
      grade: '선행필요',
      decidedBy: pre.axis,
      headline: pre.findings[0]?.reason ?? '먼저 정리해야 할 절차가 있습니다.',
      axes,
      fieldVerified,
    }
  }

  const concern = worstOf('suspect')
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
  const unknown = worstOf('unknown')
  if (unknown) {
    return {
      grade: '조건부',
      decidedBy: unknown.axis,
      headline:
        '공개 자료에서는 거래를 막는 사유가 확인되지 않았습니다. 등기와 현장 확인이 남았습니다.',
      axes,
      fieldVerified,
    }
  }

  // 두 축이 모두 clear 여도 현장 확인 전에는 '가능'을 주지 않는다
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
