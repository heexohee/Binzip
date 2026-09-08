import type { Axes } from '../app/admin/types'
import { compareScenarios, type Scenario } from './tax'

export type Item = {
  label: string
  lines: string[]
  source: string | null
  /** 확인하지 못한 항목. 화면에서 면과 왼쪽 바로 구분한다 */
  unverified: boolean
}

/**
 * 소유주가 실제로 고르는 것은 셋뿐이다.
 * rights 는 선택지가 아니라 셋 앞에 오는 선행 조건이다.
 */
export type PathKey = 'rights' | 'keep' | 'demolish' | 'renovate'

export type PathItem = {
  key: PathKey
  title: string
  lines: string[]
  /** 지금은 안 되는 경로. 지우지 않고 이유와 함께 보여준다 */
  blocked: boolean
  /** 철거만 earth 를 쓴다 — 페이지 전체 2곳 이하 규칙 */
  tone: 'deep' | 'earth' | 'muted'
}

const dot = (s: unknown): string => String(s ?? '').replace(/-/g, '. ') + '.'

/**
 * 진단서 1페이지 — 4축.
 *
 * 룰 엔진이 이미 축별 근거를 만들어 두므로 facts 에서 손으로 조립하지 않는다.
 * 예전에는 6항목을 여기서 하나씩 짰는데, 그러면 룰과 화면이 두 벌이 되어
 * 룰을 고쳐도 진단서가 안 바뀌었다. 이제 룰이 유일한 출처다.
 */
export type RegistryCheck = { note: string | null; checkedAt: string | null }

export type AxisBlock = {
  axis: string
  /** '① 권리' */
  label: string
  /** 축 헤더에 붙는 한국어 배지 */
  badge: string
  items: Item[]
}

const AXIS_LABEL: Record<string, string> = {
  rights: '① 권리',
  tax: '② 세금',
  property: '③ 건물·토지',
  market: '④ 시장·관리',
}

const BADGE: Record<string, string> = {
  clear: '확인됨',
  unknown: '확인 필요',
  suspect: '조건 있음',
  precondition: '선행 필요',
  blocked: '막힘',
}

export function buildAxisBlocks(
  axes: Axes | null,
  _facts: Record<string, unknown>,
  note: string | null,
  registry: RegistryCheck = { note: null, checkedAt: null },
): AxisBlock[] {
  const checked = axes?.checkedAt ? dot(axes.checkedAt) : null
  const src = (name: string) => (checked ? `${name} ${checked} 확인` : name)
  // 내용과 확인일이 함께 있을 때만 확인된 것으로 본다 — 출처를 못 쓰면 실선이 될 수 없다
  const registryDone = Boolean(registry.note && registry.checkedAt)

  const blocks = (axes?.diagnosis?.axes ?? []).map((a) => {
    const items: Item[] = (a.findings ?? []).map((f) => ({
      label: f.label ?? '',
      lines: [f.reason ?? '', ...(f.nextStep ? [f.nextStep] : [])].filter(Boolean),
      source: f.source && f.source !== '—' ? src(f.source) : null,
      unverified: f.verdict === 'unknown',
    }))

    // ① 권리 — 사람이 등기소에서 확인해 적었으면 그 내용이 자동 판정을 대체한다
    if (a.axis === 'rights' && registryDone) {
      const idx = items.findIndex((i) => i.label === '등기')
      const filled: Item = {
        label: '등기',
        lines: registry.note!.split('\n').filter(Boolean),
        source: `등기사항증명서 ${dot(registry.checkedAt)} 확인`,
        unverified: false,
      }
      if (idx >= 0) items[idx] = filled
      else items.unshift(filled)
    }

    // ③ 건물·토지 — 현장 메모는 룰이 만들 수 없다. 사람이 다녀와야 채워진다
    if (a.axis === 'property') {
      items.push({
        label: '현장 상태',
        lines: note ? note.split('\n').filter(Boolean) : ['현장 확인이 필요합니다.'],
        source: note ? src('현장 방문') : null,
        unverified: !note,
      })
    }

    return {
      axis: a.axis,
      label: AXIS_LABEL[a.axis] ?? a.axis,
      badge: BADGE[a.verdict ?? 'unknown'] ?? '확인 필요',
      items,
    }
  })

  return blocks
}

/**
 * 진단서 2페이지 — 이 빈집을 어떻게 할 것인가.
 *
 * 예전에는 경로 7개를 나열했다. 나열은 결정을 돕지 않는다.
 * 소유주가 실제로 고르는 것은 셋뿐이고, 그 셋은 서로 배타적이다 —
 * 철거 지원을 받으면 공공활용 의무가 붙어 그 기간에는 못 판다.
 * 그래서 같은 잣대로 나란히 놓는 것이 이 장의 일이다.
 */
export function buildPaths(
  verdict: string | null,
  axes: Axes | null,
  facts: Record<string, unknown>,
  concern: string | null,
  registry: RegistryCheck = { note: null, checkedAt: null },
): PathItem[] {
  const rightsAxis = axes?.diagnosis?.axes?.find((a) => a.axis === 'rights')
  const registryDone = Boolean(registry.note && registry.checkedAt)
  const rightsOpen =
    rightsAxis?.verdict === 'clear' || (registryDone && rightsAxis?.verdict !== 'precondition')

  const price = Number(facts.housePrice) || 0
  const age = Number(facts.buildingAge) || 0
  const hasBuilding = facts.hasBuilding === true
  const isHouse = /주택/.test(String(facts.mainPurpose ?? ''))
  const slate = /슬레이트/.test(String(facts.structure ?? ''))

  const s = compareScenarios({
    housePrice: price || null,
    landPrice: price || null,
    zone1: (facts.zone1 as string) ?? null,
    slate,
    isHouse,
  })
  const pick = (k: Scenario['key']) => s.find((x) => x.key === k)!
  const man = (n: number | null) => (n == null ? '확인 필요' : (n / 10_000).toFixed(1) + '만원')

  const items: PathItem[] = []

  // 권리가 안 풀렸으면 셋 다 못 한다. 맨 앞에 둔다.
  if (!rightsOpen) {
    items.push({
      key: 'rights',
      title: '먼저 — 권리관계 확인',
      lines: registryDone
        ? [registry.note!, `등기사항증명서 ${dot(registry.checkedAt)} 확인`]
        : [
            '등기부를 확인하기 전에는 아래 셋 중 무엇도 진행할 수 없습니다.',
            '상속 정리가 안 됐거나 공유자가 여럿이면 그것부터입니다.',
            '인터넷등기소 열람 수수료는 700원입니다.',
          ],
      blocked: false,
      tone: 'deep',
    })
  }

  const keep = pick('keep')
  items.push({
    key: 'keep',
    title: '① 그대로 둔다',
    lines: [
      `보유세는 연 ${man(keep.annualTaxSingle)} 수준입니다 (1주택 기준·추정). 다른 집이 있으시면 ${man(keep.annualTaxGeneral)}입니다.`,
      ...keep.caveats,
    ],
    blocked: false,
    tone: 'muted',
  })

  const dem = pick('demolish')
  items.push({
    key: 'demolish',
    title: '② 철거한다',
    lines: hasBuilding
      ? [
          `철거하면 보유세가 연 ${man(dem.annualTaxSingle)}이 되고, 감면이 끝나면 ${man(dem.annualTaxAfterRelief)}입니다.`,
          ...dem.caveats,
          ...(dem.support ? [`슬레이트 지붕이라 처리 지원 최대 ${man(dem.support)}을 별도로 받을 수 있습니다.`] : []),
          '철거비 지원은 최대 1,600만원입니다. 신청은 빈집애(binzibe.kr)에서 합니다.',
        ]
      : ['건축물이 확인되지 않아 철거 대상 여부부터 확인이 필요합니다.'],
    blocked: false,
    tone: 'earth',
  })

  const ren = pick('renovate')
  items.push({
    key: 'renovate',
    title: '③ 고쳐서 쓴다',
    lines: [
      age > 0 ? `사용승인으로부터 ${age}년 지났습니다.` : '건축 연도를 확인하지 못했습니다.',
      `보유세는 ${man(ren.annualTaxSingle)}으로 그대로입니다. 주택으로 남기 때문입니다.`,
      ...ren.caveats,
    ],
    blocked: false,
    tone: 'muted',
  })

  return items
}