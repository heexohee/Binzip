import type { Axes } from '../app/admin/types'

export type Item = {
  label: string
  lines: string[]
  source: string | null
  /** 확인하지 못한 항목. 화면에서 면과 왼쪽 바로 구분한다 */
  unverified: boolean
}

export type PathKey =
  | 'rights' | 'sell' | 'rent' | 'repair' | 'secondhome' | 'manage' | 'demolish'

export type PathItem = {
  key: PathKey
  title: string
  lines: string[]
  /** 지금은 안 되는 경로. 지우지 않고 이유와 함께 보여준다 */
  blocked: boolean
  /** 철거만 earth 를 쓴다 — 페이지 전체 2곳 이하 규칙 */
  tone: 'deep' | 'earth' | 'muted'
}

const PATH_TITLE: Record<PathKey, string> = {
  rights: '권리정리 우선',
  sell: '매각',
  rent: '임대·활용',
  repair: '정비',
  secondhome: '보유·세컨드하우스',
  manage: '관리',
  demolish: '철거',
}

/** 소유주가 고른 걱정거리가 어느 경로를 맨 위로 올릴지 정한다 */
const CONCERN_TO_PATH: Record<string, PathKey> = {
  // 세금 걱정이 곧 매각 의사는 아니지만, ②세금축이 재산세 숫자로 이미 안심시킨다.
  // 경로 정렬까지 분기시키지 않는다.
  '세금': 'sell',
  '등기·상속': 'rights',
  '건물 상태': 'repair',
  '관리': 'manage',
  '매각 가능성': 'sell',
  '활용 방법': 'rent',
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
 * 진단서 2페이지 — 이 자산으로 할 수 있는 것.
 *
 * 피벗 이후 순서가 바뀌었다. '무엇을 확인하세요'가 아니라
 * '지금 얼마가 나가고, 그걸 바꾸려면 무엇을 하면 되는가'다.
 * 그래서 각 경로가 가능하면 금액을 먼저 말한다.
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

  // 선행필요·불가면 실행 경로를 닫는다. 등기가 안 풀리면 매각도 임대도 못 한다.
  const canAct = verdict !== 'blocked' && verdict !== 'precondition'

  const price = Number(facts.housePrice) || 0
  const age = Number(facts.buildingAge) || 0
  const zone = String(facts.zone1 ?? '')
  const taxSingle = Number(facts.taxSingle) || 0
  const hasBuilding = facts.hasBuilding === true
  const man = (n: number) => Math.round(n / 10_000).toLocaleString('ko-KR')

  const items: PathItem[] = []

  // 권리가 안 풀리면 1순위다. 예외 없다 — 등기가 막히면 나머지가 다 막힌다.
  items.push({
    key: 'rights',
    title: PATH_TITLE.rights,
    lines: registryDone
      ? [registry.note!, `등기사항증명서 ${dot(registry.checkedAt)} 확인`]
      : rightsOpen
        ? ['권리관계에서 걸리는 것이 확인되지 않았습니다.']
        : [
            '등기부는 공개 자료로 확인할 수 없어 아직 남아 있습니다.',
            '소유주께서 등기사항증명서를 확인하시거나, 열람 동의를 주시면 저희가 확인해 드립니다. 열람 수수료는 700원입니다.',
            '공동소유나 상속 정리가 남아 있으면 이것부터 끝나야 나머지가 진행됩니다.',
          ],
    blocked: false,
    tone: rightsOpen ? 'muted' : 'deep',
  })

  items.push({
    key: 'sell',
    title: PATH_TITLE.sell,
    lines: canAct
      ? [
          '공개 자료에서 매각을 막는 사유는 확인되지 않았습니다.',
          '재산세 과세기준일이 6월 1일입니다. 그 전에 잔금을 넘기시면 그해 재산세는 매수인이 냅니다.',
          ...(rightsOpen ? [] : ['다만 등기 확인이 끝난 뒤에 진행하실 수 있습니다.']),
        ]
      : ['지금 상태로는 어렵습니다. 위 권리관계를 먼저 정리하셔야 합니다.'],
    blocked: !canAct,
    tone: canAct ? 'deep' : 'muted',
  })

  items.push({
    key: 'rent',
    title: PATH_TITLE.rent,
    lines: canAct
      ? [
          zone
            ? `${zone}입니다. 사용을 막는 규제는 확인되지 않았습니다.`
            : '용도지역을 확인하지 못했습니다.',
          '용도를 바꾸실 생각이면 허가가 필요한지 먼저 보셔야 합니다. 같은 시설군 안에서 바꾸는 것은 건축물대장 기재 변경만으로 됩니다.',
        ]
      : ['권리관계가 정리된 뒤에 검토하실 수 있습니다.'],
    blocked: !canAct,
    tone: canAct ? 'deep' : 'muted',
  })

  items.push({
    key: 'repair',
    title: PATH_TITLE.repair,
    lines: [
      age > 0 ? `사용승인으로부터 ${age}년 지났습니다.` : '건축 연도를 확인하지 못했습니다.',
      '연면적 200㎡ 미만이고 3층 미만이면 대수선은 허가가 아니라 신고로 됩니다. 관리·농림·자연환경보전지역이면 신축도 신고 대상입니다.',
      '수리에 드는 금액은 이 진단서에서 계산해 드리지 않습니다.',
    ],
    blocked: false,
    tone: 'muted',
  })

  // '그대로 두셔도 됩니다' 로 끝내면 아무 정보가 아니다. 숫자를 준다.
  items.push({
    key: 'secondhome',
    title: PATH_TITLE.secondhome,
    lines: [
      taxSingle > 0
        ? `10년 보유하셔도 재산세 총액은 약 ${man(taxSingle * 10)}만원입니다. 보유 비용이 계획을 접을 수준은 아닙니다.`
        : '공시가격을 확인하지 못해 보유세를 계산하지 못했습니다.',
      price > 0 && price <= 400_000_000
        ? '공시가격이 4억원 이하라 2027년 1월 1일 취득분부터 세컨드홈 특례 대상입니다.'
        : '세컨드홈 특례 요건은 공시가격 기준으로 따로 확인이 필요합니다.',
    ],
    blocked: false,
    tone: 'deep',
  })

  items.push({
    key: 'manage',
    title: PATH_TITLE.manage,
    lines: [
      '비워두시더라도 최소한의 관리는 필요합니다.',
      '읍·면은 「농어촌 빈집 정비 및 관리에 관한 특별법」, 동은 「빈집 및 소규모주택 정비에 관한 특례법」이 적용됩니다. 특정빈집으로 판정되어 조치명령을 받고 60일 안에 이행하지 않으면 이행강제금이 부과됩니다.',
      '지붕·배수·잠금 세 가지만 유지해도 급격한 노후를 늦출 수 있습니다.',
    ],
    blocked: false,
    tone: 'muted',
  })

  // 철거 — 소유주가 돈을 받는 구조가 아니라고만 하면 한쪽만 보여주는 것이다.
  // 2026-01-01 부터 감면이 생겼으므로 함께 말한다.
  items.push({
    key: 'demolish',
    title: PATH_TITLE.demolish,
    lines: [
      hasBuilding
        ? '2026년 1월 1일부터 빈집을 철거한 뒤의 토지에 재산세를 5년간 50% 감면합니다. 철거일로부터 3년 안에 새로 지으시면 취득세도 최대 50%(150만원 한도) 감면됩니다.'
        : '건축물이 확인되지 않아 철거 대상 여부부터 확인이 필요합니다.',
      '다만 철거 후 소유권을 넘기시거나 개발사업으로 철거된 경우는 감면에서 빠집니다. 법적 빈집으로 인정받는 절차가 먼저인지 시청에 확인하셔야 합니다.',
      '지붕이 슬레이트인 경우 석면 처리 절차가 따로 있습니다.',
    ],
    blocked: false,
    tone: 'earth',
  })

  // 정렬 — 권리가 막혔으면 1순위, 그다음 걱정거리가 지목한 경로, 맨 아래 막힌 것
  const wanted = concern ? CONCERN_TO_PATH[concern] : undefined
  const rank = (p: PathItem) => {
    if (p.blocked) return 100
    if (p.key === 'rights' && !rightsOpen) return 0
    if (wanted && p.key === wanted) return 1
    return 10
  }
  return items
    .map((p, i) => ({ p, i }))
    .sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i)
    .map((x) => x.p)
}