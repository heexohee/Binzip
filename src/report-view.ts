import type { Axes, Finding } from '../app/admin/types'

export type Item = {
  no: string
  label: string
  lines: string[]
  source: string | null
  /** 확인하지 못한 항목. 화면에서 점선으로 그린다 */
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

/** 진단서 1페이지 — 판정 근거 6항목 */
export function buildItems(
  axes: Axes | null,
  facts: Record<string, unknown>,
  note: string | null,
): Item[] {
  const checked = axes?.checkedAt ? dot(axes.checkedAt) : null
  const src = (name: string) => (checked ? `${name} ${checked} 확인` : name)

  const building: string[] = []
  if (facts.useApprovalDate) building.push(`사용승인 ${dot(facts.useApprovalDate)}`)
  const spec = [facts.mainPurpose, facts.structure, facts.floors && `지상 ${facts.floors}층`]
    .filter(Boolean)
    .join(' · ')
  if (spec) building.push(spec)
  if (facts.buildingArea) building.push(`연면적 ${facts.buildingArea}㎡`)

  const price = won(facts.housePrice)
  const regulation = [facts.zone1, ...(Array.isArray(facts.zones) ? facts.zones.slice(1) : [])]
    .filter(Boolean)
    .join(' · ')

  const road = findingsBy(axes, ['진입로', '지형'])
  const legalUnknown = findingsBy(axes, ['등기', '공동소유', '상속', '위반건축물'])

  return [
    {
      no: '①',
      label: '건축물 정보',
      lines: building.length ? building : ['확인하지 못했습니다.'],
      source: building.length ? src('건축물대장') : null,
      unverified: building.length === 0,
    },
    {
      no: '②',
      label: '공시가격',
      lines: price ? [price] : ['확인하지 못했습니다.'],
      source: price ? `개별주택가격 ${facts.housePriceYear ?? ''}년 공시`.trim() : null,
      unverified: !price,
    },
    {
      no: '③',
      label: '진입로',
      lines: road.length ? road.map((f) => f.reason ?? '') : ['확인하지 못했습니다.'],
      source: road.length ? src('토지특성') : null,
      unverified: road.length === 0 || road.some((f) => f.verdict === 'unknown'),
    },
    {
      no: '④',
      label: '규제',
      lines: regulation ? [regulation] : ['확인하지 못했습니다.'],
      source: regulation ? src('토지이용규제') : null,
      unverified: !regulation,
    },
    {
      no: '⑤',
      label: '건물 상태',
      // 자동으로는 알 수 없다. 사람이 다녀와야 채워진다.
      lines: note ? note.split('\n').filter(Boolean) : ['현장 확인이 필요합니다.'],
      source: note ? src('현장 방문') : null,
      unverified: !note,
    },
    {
      no: '⑥',
      label: '등기',
      lines: legalUnknown.length
        ? legalUnknown.map((f) => f.reason ?? '')
        : ['확인하지 못했습니다.'],
      // 등기부는 공개 API 가 없다. 자동으로는 끝까지 미확인이다.
      source: null,
      unverified: true,
    },
  ]
}

/** 진단서 2페이지 — 이 집으로 할 수 있는 것 */
export function buildPaths(
  verdict: string | null,
  axes: Axes | null,
  facts: Record<string, unknown>,
  concern: string | null,
): PathItem[] {
  const legal = axes?.diagnosis?.axes?.find((a) => a.axis === 'legal')
  const legalOpen = legal?.verdict === 'clear'
  const price = Number(facts.housePrice) || 0
  const age = Number(facts.buildingAge) || 0
  const zone = String(facts.zone1 ?? '')

  const items: PathItem[] = []

  // ①이 막혔거나 미확인이면 권리관계 선행이 1순위다. 예외 없다 —
  // 등기가 안 풀리면 매각도 임대도 못 한다.
  items.push({
    key: 'rights',
    title: PATH_TITLE.rights,
    lines: legalOpen
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
    lines: [
      '그대로 두셔도 됩니다. 다만 재산세는 매년 나갑니다.',
      '「빈 건축물 정비 특별법」이 소유주 관리의무와 이행강제금을 도입하면 방치 비용이 생깁니다.',
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
