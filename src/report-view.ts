import type { Axes, Finding } from '../app/admin/types'

export type Item = {
  label: string
  lines: string[]
  source: string | null
  /** 확인하지 못한 항목. 화면에서 면과 왼쪽 바로 구분한다 */
  unverified: boolean
}

export type PathKey = 'rights' | 'sell' | 'rent' | 'repair' | 'hold' | 'demolish'

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
  rights: '권리관계 선행',
  sell: '매각',
  rent: '임대 활용',
  repair: '수리 후 사용',
  hold: '당분간 보유',
  demolish: '철거 검토',
}

/** 소유주가 고른 걱정거리가 어느 경로를 맨 위로 올릴지 정한다 */
const CONCERN_TO_PATH: Record<string, PathKey> = {
  '세금': 'rights',
  '등기·상속': 'rights',
  '건물 상태': 'repair',
  '관리': 'hold',
  '매각 가능성': 'sell',
  '활용 방법': 'rent',
}

const won = (v: unknown): string | null => {
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) return null
  return (n / 10_000).toLocaleString('ko-KR') + '만원'
}

const dot = (s: unknown): string => String(s ?? '').replace(/-/g, '. ') + '.'

function findingsBy(axes: Axes | null, labels: string[]): Finding[] {
  const out: Finding[] = []
  for (const ax of axes?.diagnosis?.axes ?? []) {
    for (const f of ax.findings ?? []) if (f.label && labels.includes(f.label)) out.push(f)
  }
  return out
}

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

/** 진단서 2페이지 — 이 집으로 할 수 있는 것 */
export function buildPaths(
  verdict: string | null,
  axes: Axes | null,
  facts: Record<string, unknown>,
  concern: string | null,
  registry: RegistryCheck = { note: null, checkedAt: null },
): PathItem[] {
  const legal = axes?.diagnosis?.axes?.find((a) => a.axis === 'rights')
  // 사람이 등기를 확인했으면 ①법적 축이 열린 것으로 본다.
  // 자동 판정이 unknown 인 유일한 이유가 등기부 접근 불가였기 때문이다.
  const registryDone = Boolean(registry.note && registry.checkedAt)
  const legalOpen = legal?.verdict === 'clear' || registryDone
  const price = Number(facts.housePrice) || 0
  const age = Number(facts.buildingAge) || 0
  const zone = String(facts.zone1 ?? '')

  const items: PathItem[] = []

  // ①이 막혔거나 미확인이면 권리관계 선행이 1순위다. 예외 없다 —
  // 등기가 안 풀리면 매각도 임대도 못 한다.
  items.push({
    key: 'rights',
    title: PATH_TITLE.rights,
    lines: registryDone
      ? [registry.note!, `등기사항증명서 ${dot(registry.checkedAt)} 확인`]
      : legalOpen
      ? ['권리관계에서 걸리는 것이 확인되지 않았습니다.']
      : [
          '등기부는 공개 자료로 확인할 수 없어 아직 남아 있습니다.',
          '소유주께서 등기사항증명서를 확인하시거나, 열람 동의를 주시면 저희가 확인해 드립니다.',
          '공동소유나 상속 정리가 남아 있으면 이것부터 끝나야 나머지가 진행됩니다.',
        ],
    blocked: false,
    tone: legalOpen ? 'muted' : 'deep',
  })

  const canAct = verdict !== 'blocked'

  items.push({
    key: 'sell',
    title: PATH_TITLE.sell,
    lines: canAct
      ? [
          price > 0 && price <= 400_000_000
            ? '공시가격이 4억원 이하여서 2027년 1월 1일 취득분부터 세컨드홈 특례 대상입니다. 수도권 1주택자가 사더라도 다주택으로 보지 않습니다.'
            : '세컨드홈 특례 요건은 공시가격 기준으로 따로 확인이 필요합니다.',
          ...(legalOpen ? [] : ['다만 등기 확인이 끝난 뒤에 진행하실 수 있습니다.']),
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
            ? `${zone}입니다. 거주 목적 사용을 막는 규제는 확인되지 않았습니다.`
            : '용도지역을 확인하지 못했습니다.',
          '사람이 살 수 있는 상태로 만들려면 어디를 손봐야 하는지는 현장 확인에서 정리해 드립니다.',
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
      '수리에 드는 금액은 확인하지 않았습니다. 이 진단서에서는 계산해 드리지 않습니다.',
    ],
    blocked: false,
    tone: 'muted',
  })

  items.push({
    key: 'hold',
    title: PATH_TITLE.hold,
    // 법명 정정 2026-09-06 — 「빈 건축물 정비 특별법」은 존재하지 않는 법이었다.
    // 국가법령정보센터에서 확인된 것은 법명과 시행일뿐이다.
    // 소유주 관리의무·이행강제금의 유무는 조문을 못 봤으므로 문장에서 뺐다.
    // laws.json 의 확인일이 채워지면 다시 넣는다.
    lines: [
      '그대로 두셔도 됩니다. 다만 재산세는 매년 나갑니다.',
      '빈집 관련 제도는 정비되는 중입니다. 읍·면 지역은 「농어촌 빈집 정비 및 관리에 관한 특별법」이 2027년 6월 17일 시행되고, 동 지역은 「빈집 및 소규모주택 정비에 관한 특례법」이 이미 시행 중입니다.',
    ],
    blocked: false,
    tone: 'muted',
  })

  // 철거 — 소유주가 돈을 받는 구조가 아니다. 국토부 사업비 단가를 오적용하지 않는다.
  items.push({
    key: 'demolish',
    title: PATH_TITLE.demolish,
    lines: [
      '포항시 빈집 정비는 두 계통입니다.',
      '시 사업은 철거비를 부담하지만 보상은 없고, 지상권 등기(읍·면 5년)와 공익용도 유지 의무가 따릅니다.',
      '구 사업은 보조금 최대 200만원에 자부담 10%가 있습니다.',
      '지붕이 슬레이트인 경우 석면 처리 절차가 따로 있습니다.',
    ],
    blocked: false,
    tone: 'earth',
  })

  // 정렬 — 1순위 권리관계(막혔을 때), 2순위 걱정거리가 지목한 경로, 그다음 나머지, 맨 아래 막힌 것
  const wanted = concern ? CONCERN_TO_PATH[concern] : undefined
  const rank = (p: PathItem) => {
    if (p.blocked) return 100
    if (p.key === 'rights' && !legalOpen) return 0
    if (wanted && p.key === wanted) return 1
    return 10
  }
  return items.map((p, i) => ({ p, i })).sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i).map((x) => x.p)
}
