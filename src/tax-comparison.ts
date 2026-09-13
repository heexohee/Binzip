/** All money inputs are in KRW 10,000. This is a conditional scenario, not a tax determination. */
export type TaxInput = {
  acquisition: string; acquired: string; otherHome: string; apartmentAcquired: string;
  sellDate: string; purchase: string; sale: string; expenses: string;
  eligible: boolean; ordinary: boolean; noException: boolean; priority: string;
}
export const EMPTY_TAX: TaxInput = { acquisition: '', acquired: '', otherHome: '', apartmentAcquired: '', sellDate: '', purchase: '', sale: '', expenses: '', eligible: false, ordinary: false, noException: false, priority: '' }
export const PURCHASE_EXAMPLE: TaxInput = { acquisition: '매입', acquired: '2012-06-01', otherHome: '있음', apartmentAcquired: '2016-06-01', sellDate: '2026-10-01', purchase: '40000', sale: '80000', expenses: '2000', eligible: true, ordinary: true, noException: true, priority: '아직 고민 중' }
export const INHERITED_EXAMPLE: TaxInput = { ...PURCHASE_EXAMPLE, acquisition: '상속', acquired: '2018-06-01', noException: false }
export function basicTax(base: number) {
  const bands: [number, number, number][] = [[14000000,.06,0],[50000000,.15,1260000],[88000000,.24,5760000],[150000000,.35,15440000],[300000000,.38,19940000],[500000000,.4,25940000],[1000000000,.42,35940000],[Infinity,.45,65940000]]
  const [,rate,deduction] = bands.find(([limit]) => base <= limit)!
  return Math.max(0, Math.round(base * rate - deduction))
}
function date(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const parsed = new Date(value + 'T00:00:00Z')
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10) === value ? parsed : null
}
export function compareTax(input: TaxInput) {
  const missing: string[] = []
  const bought = date(input.apartmentAcquired), sold = date(input.sellDate), rural = date(input.acquired)
  if (!['매입', '상속'].includes(input.acquisition)) missing.push('빈집 취득 방법 (증여·가족 소유 등은 별도 세무 검토)')
  if (!rural) missing.push('빈집 취득·상속일')
  if (input.otherHome !== '있음') missing.push('비교할 다른 주택 보유 정보')
  if (!bought || !sold || (bought && sold && sold <= bought)) missing.push('다른 주택의 취득일과 그 이후 매도 예정일')
  if (rural && sold && rural >= sold) missing.push('매도 예정일 이전의 빈집 취득일')
  const amount = (v: string) => /^\d+(\.\d{1,2})?$/.test(v) ? Number(v) * 10000 : NaN
  const amounts: [number, number, number] = [amount(input.purchase), amount(input.sale), amount(input.expenses)]
  if (amounts.some(v => !Number.isFinite(v) || v < 0 || v > 1e12) || amounts[0] === 0 || amounts[1] === 0) missing.push('취득가·예상 매도가·필요경비 (없으면 0 입력)')
  const years = bought && sold ? sold.getUTCFullYear() - bought.getUTCFullYear() - (sold.toISOString().slice(5,10) < bought.toISOString().slice(5,10) ? 1 : 0) : 0
  if (sold && sold.getUTCFullYear() !== 2026) missing.push('2026년 외 매도는 해당 연도 세법 확인 필요')
  if (years < 2) missing.push('2년 이상 보유 여부 (단기 보유 계산은 별도 검토)')
  if (!input.ordinary) missing.push('기본세율·일반 장기보유공제 적용 조건')
  if (!input.eligible) missing.push('빈집 처분 후 1세대 1주택 비과세 요건')
  if (amounts[1] > 1200000000) missing.push('12억 원 초과 고가주택 계산은 세무 검토 필요')
  const inherited = input.acquisition === '상속' && rural && bought && bought < rural
  if (!input.noException) missing.push(inherited ? '상속주택 특례 적용 여부' : '농어촌주택 등 비과세 특례 적용 여부')
  if (missing.length) return { kind: 'review' as const, missing, inherited: !!inherited }
  const gain = Math.max(0, amounts[1] - amounts[0] - amounts[2])
  const deduction = Math.round(gain * (years >= 3 ? Math.min(years * .02, .3) : 0))
  const base = Math.max(0, gain - deduction - 2500000)
  const national = basicTax(base), local = Math.round(national * .1)
  return { kind: 'comparison' as const, first: national + local, after: 0, gain, deduction, base, national, local, years }
}
export function taxNote(input: TaxInput) {
  return `처분 순서 비교 입력\n빈집: ${input.acquisition || '미확인'} / ${input.acquired || '취득일 미확인'}\n다른 주택: ${input.otherHome || '미확인'} / 취득 ${input.apartmentAcquired || '미확인'} / 매도 예정 ${input.sellDate || '미확인'}\n취득가 ${input.purchase || '미확인'}만 원 / 매도가 ${input.sale || '미확인'}만 원 / 필요경비 ${input.expenses || '미확인'}만 원\n희망 순서: ${input.priority || '미정'}\n계산 가정(고객 선택): 일반세율 ${input.ordinary ? '선택' : '미확인'}, 처분 후 비과세 ${input.eligible ? '선택' : '미확인'}, 특례 없음 ${input.noException ? '선택' : '미확인'}\n확정 세무 판단이 아닌 상담 검토용 입력입니다.`
}

/** Homepage-only high-value scenario: KRW, 10 years held and 2 years lived in. */
export const HIGH_VALUE_EXAMPLE = (() => {
  const gain = 2000000000 - 400000000 - 20000000
  const firstBase = gain * .8 - 2500000
  const eligibleGain = gain * (2000000000 - 1200000000) / 2000000000
  const afterBase = eligibleGain * (1 - .48) - 2500000
  const firstNational = basicTax(firstBase), afterNational = basicTax(afterBase)
  return { first: firstNational + Math.round(firstNational * .1), after: afterNational + Math.round(afterNational * .1) }
})()
