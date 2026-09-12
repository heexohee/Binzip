/** A cash-flow worksheet, not a valuation, tax estimate, or demolition quote. */
export const MONEY_FIELDS = [
  { key: 'sale', label: '예상 매도대금' },
  { key: 'debt', label: '상환할 채무' },
  { key: 'taxAndFees', label: '세금·거래비용' },
  { key: 'clearance', label: '본인 부담 정리비용' },
] as const

export type MoneyKey = (typeof MONEY_FIELDS)[number]['key']
export type DisposalInput = Record<MoneyKey, string>
export type MoneyValue = { kind: 'known'; won: number } | { kind: 'missing' | 'invalid' }

/** Read amounts entered in 만원; keep arithmetic in integer 원. Empty is never zero. */
export function parseManwon(raw: string): MoneyValue {
  const value = raw.trim()
  if (!value) return { kind: 'missing' }
  if (!/^\d+(?:\.\d{1,4})?$/.test(value)) return { kind: 'invalid' }
  const [whole, fraction = ''] = value.split('.')
  const won = Number(whole) * 10_000 + Number(fraction.padEnd(4, '0'))
  return Number.isSafeInteger(won) && won <= 1_000_000_000_000
    ? { kind: 'known', won }
    : { kind: 'invalid' }
}

export function calculateDisposal(input: DisposalInput) {
  const values = Object.fromEntries(MONEY_FIELDS.map(f => [f.key, parseManwon(input[f.key])])) as Record<MoneyKey, MoneyValue>
  const missing = MONEY_FIELDS.filter(f => values[f.key].kind === 'missing').map(f => f.key)
  const invalid = MONEY_FIELDS.filter(f => values[f.key].kind === 'invalid').map(f => f.key)
  if (missing.length || invalid.length) return { net: null, deductions: null, values, missing, invalid }
  const amount = (key: MoneyKey) => (values[key] as { kind: 'known'; won: number }).won
  const deductions = amount('debt') + amount('taxAndFees') + amount('clearance')
  return { net: amount('sale') - deductions, deductions, values, missing, invalid }
}

export function formatWon(won: number) {
  return (won / 10_000).toLocaleString('ko-KR', { maximumFractionDigits: 4 }) + '만 원'
}

export const emptyDisposal = (): DisposalInput => ({ sale: '', debt: '', taxAndFees: '', clearance: '' })

/** Entirely fictional teaching amounts. Never use these as customer report defaults. */
export const EXAMPLE_DISPOSAL: [DisposalInput, DisposalInput] = [
  { sale: '3000', debt: '500', taxAndFees: '200', clearance: '100' },
  { sale: '4200', debt: '500', taxAndFees: '250', clearance: '1200' },
]

export function initialDisposal(example = false): [DisposalInput, DisposalInput] {
  return example ? [{ ...EXAMPLE_DISPOSAL[0] }, { ...EXAMPLE_DISPOSAL[1] }] : [emptyDisposal(), emptyDisposal()]
}
