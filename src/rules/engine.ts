import rulesJson from './rules.json' with { type: 'json' }
import type { AxisVerdict } from '../types'

/** 룰이 평가할 수 있는 납작한 값들. 파이프라인이 만들어 넘긴다. */
export type Context = Record<string, string | number | boolean | string[] | null | undefined>

type Cond = {
  op: string
  field?: string
  value?: unknown
}

export type Rule = {
  id: string
  axis: 'rights' | 'tax' | 'property' | 'market'
  when: Cond
  verdict: AxisVerdict
  label: string
  reason: string
  nextStep?: string
  source: string
}

export type Gate = { id: string; when: Cond; reason: string }

export type Finding = {
  ruleId: string
  axis: Rule['axis']
  verdict: AxisVerdict
  label: string
  reason: string
  nextStep?: string
  source: string
}

const RULES = rulesJson as unknown as {
  version: string
  gates: Gate[]
  rules: Rule[]
}

export const rulesVersion = RULES.version

/** 조건 평가. matched 는 contains-any 로 걸린 항목들을 담아 문구에 쓴다. */
function test(c: Cond, ctx: Context): { hit: boolean; matched?: string[] } {
  if (c.op === 'always') return { hit: true }

  const v = c.field ? ctx[c.field] : undefined

  switch (c.op) {
    case 'exists':
      return { hit: v != null && (!Array.isArray(v) || v.length > 0) }
    case 'missing':
      return { hit: v == null || (Array.isArray(v) && v.length === 0) }
    case 'eq':
      return { hit: v === c.value }
    case 'ne':
      return { hit: v !== c.value }
    case 'gt':
      return { hit: typeof v === 'number' && v > (c.value as number) }
    case 'gte':
      return { hit: typeof v === 'number' && v >= (c.value as number) }
    case 'lt':
      return { hit: typeof v === 'number' && v < (c.value as number) }
    case 'in':
      return { hit: (c.value as unknown[]).includes(v as unknown) }
    case 'not-in':
      return { hit: v != null && !(c.value as unknown[]).includes(v as unknown) }
    case 'matches':
      return { hit: v != null && new RegExp(String(c.value)).test(String(v)) }
    case 'not-matches':
      return { hit: v != null && !new RegExp(String(c.value)).test(String(v)) }
    case 'contains-any': {
      if (!Array.isArray(v)) return { hit: false }
      const needles = c.value as string[]
      const matched = v.filter(item => needles.some(n => String(item).includes(n)))
      return { hit: matched.length > 0, matched }
    }
    default:
      throw new Error(`알 수 없는 연산자: ${c.op}`)
  }
}

/** "{field}" 를 실제 값으로 치환한다 */
function fill(tpl: string, ctx: Context, matched?: string[]): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => {
    if (k === 'matched') return (matched ?? []).join('·')
    const v = ctx[k]
    if (v == null) return '확인 안 됨'
    return Array.isArray(v) ? v.join('·') : String(v)
  })
}

/** 제외 대상인지 본다. 걸리면 사유를 돌려준다. */
export function checkGates(ctx: Context): { id: string; reason: string } | null {
  for (const g of RULES.gates) {
    const { hit, matched } = test(g.when, ctx)
    if (hit) return { id: g.id, reason: fill(g.reason, ctx, matched) }
  }
  return null
}

/** 걸린 룰을 전부 모은다 */
export function evaluate(ctx: Context): Finding[] {
  const out: Finding[] = []
  for (const r of RULES.rules) {
    const { hit, matched } = test(r.when, ctx)
    if (!hit) continue
    out.push({
      ruleId: r.id,
      axis: r.axis,
      verdict: r.verdict,
      label: r.label,
      reason: fill(r.reason, ctx, matched),
      nextStep: r.nextStep ? fill(r.nextStep, ctx, matched) : undefined,
      source: r.source,
    })
  }
  return out
}
