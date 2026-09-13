'use client'
import Link from 'next/link'
import { useState } from 'react'
import { compareTax, HIGH_VALUE_EXAMPLE, INHERITED_EXAMPLE, PURCHASE_EXAMPLE, taxNote, type TaxInput } from '../src/tax-comparison'
import { useInstantFlow } from './instant-flow'
import styles from './tax-comparison.module.css'
const money = (n: number) => `${(n / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}만 원`
function Basis() {
  return <details><summary>계산 조건과 근거 보기</summary><p className={styles.small}>2026년 세율 기준 · 단독명의 거주자 · 등록임대·미등기·증여 이월과세 등 별도 특례 없음 · 해당 연도 다른 과세대상 양도 없음. 기본공제 250만 원, 일반 장기보유특별공제(3년부터 연 2%, 최대 30%)와 지방소득세를 반영해요. 실제 계약 전 취득·거주·세대 정보를 세무사와 확인해 주세요.</p><p className={styles.small}><a href="https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7711&mi=2312" target="_blank" rel="noreferrer">국세청 세율 (새 창)</a> · <a href="https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7710&mi=2311" target="_blank" rel="noreferrer">장기보유공제 (새 창)</a> · <a href="https://www.law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1032216561" target="_blank" rel="noreferrer">상속주택 특례 (새 창)</a> · <a href="https://www.law.go.kr/LSW/lsLinkCommonInfo.do?lsJoLnkSeq=1033511281" target="_blank" rel="noreferrer">농어촌주택 특례 (새 창)</a></p></details>
}
export function TaxTeaser() {
  const difference = HIGH_VALUE_EXAMPLE.first - HIGH_VALUE_EXAMPLE.after
  return <div className={`${styles.section} ${styles.embedded}`}>
    <h3>시골 빈집 때문에 나도 다주택자에 양도소득세 폭탄?</h3>
    <div className={styles.taxDifference}>
      <p>20억 아파트 매도 시 예상 세금 비교 · 가상 사례</p>
      <strong>약 {Math.floor(difference / 100000000)}억 {Math.round(difference % 100000000 / 10000).toLocaleString('ko-KR')}만 원 <span>차이</span></strong>
      <p>어떤 집부터 파느냐에 따라 예상 세금이 달라져요.</p>
    </div>
    <div className={styles.grid}>
      <div className={styles.card}><h4>아파트부터 매도</h4><p>예상 양도세·지방소득세</p><strong>약 {Math.floor(HIGH_VALUE_EXAMPLE.first / 100000000)}억 {Math.round(HIGH_VALUE_EXAMPLE.first % 100000000 / 10000).toLocaleString()}만 원</strong></div>
      <div className={styles.card}><h4>빈집 매도 후 아파트 매도</h4><p>예상 양도세·지방소득세</p><strong>약 {Math.floor(HIGH_VALUE_EXAMPLE.after / 100000000)}억 {Math.round(HIGH_VALUE_EXAMPLE.after % 100000000 / 10000).toLocaleString()}만 원</strong></div>
    </div>
    <p className={styles.taxPrompt}>내 집도 팔기 전에, 처분 순서별 예상 세금을 확인하세요.</p>
    <p className={styles.small}>가상 사례 · 취득가 4억 / 매도가 20억 · 10년 보유·2년 거주 · 빈집 매도 세금과 비용 별도</p>
  </div>
}
export function TaxPlanner({ example = false, application = false }: { example?: boolean; application?: boolean }) {
  const flow = useInstantFlow()
  const [sample, setSample] = useState<TaxInput>(INHERITED_EXAMPLE)
  const input = example ? sample : flow.taxInput
  const setInput = example ? setSample : flow.setTaxInput
  const set = <K extends keyof TaxInput>(key: K, value: TaxInput[K]) => setInput({ ...input, [key]: value })
  const result = compareTax(input)
  const field = (key: keyof TaxInput, title: string, type = 'text') => <label key={key}>{title}<input type={type} value={String(input[key])} onChange={e => set(key, e.target.value)} {...(type === 'number' ? { min: 0, max: 100000000, step: .01, inputMode: 'decimal' as const } : {})} /></label>
  const select = (key: keyof TaxInput, title: string, options: string[]) => <label>{title}<select value={String(input[key])} onChange={e => set(key, e.target.value)}><option value="">선택해 주세요</option>{options.map(o => <option key={o}>{o}</option>)}</select></label>
  return <section id="tax-order" className={styles.section} aria-labelledby="tax-order-title"><h2 id="tax-order-title">어떤 집부터 정리하면 좋을까요?</h2><p>취득·상속 시점과 보유 주택을 바탕으로, 처분 순서에 따른 예상 세금을 비교해요.</p>{example && <><p className={styles.small}>이 진단서의 2018년 상속 사례로 시작해요. 아래 버튼으로 별도의 매입 사례도 비교할 수 있어요.</p><div className={styles.grid}><button type="button" onClick={() => setSample(INHERITED_EXAMPLE)}>상속 사례 보기</button><button type="button" onClick={() => setSample(PURCHASE_EXAMPLE)}>매입 사례 보기</button></div></>}
    <details open={application}><summary>{application ? '취득·보유 정보 입력 (선택)' : '입력 조건 확인·수정'}</summary><p className={styles.small}>아는 내용만 입력하세요. 빈칸은 0원으로 계산하지 않아요. 입력값은 현재 탭의 페이지 이동 동안 유지되며 새로고침하면 초기화돼요.</p><div className={styles.fields}>{select('acquisition','빈집 취득 방법',['매입','상속','증여','가족 소유','기타','잘 모르겠어요'])}{field('acquired','빈집 취득·상속일','date')}{select('otherHome','세대에서 다른 집도 보유하나요?',['없음','있음','잘 모르겠어요'])}{select('priority','어떤 선택을 검토하고 있나요?',['빈집 먼저 매도','다른 집 먼저 매도','철거 검토','아직 고민 중'])}</div>
    {input.otherHome === '있음' && <><p>현재 계산은 빈집 외 주택이 한 채인 경우에 한해 제공해요. 두 채 이상이면 세무 검토가 필요해요.</p><div className={styles.fields}>{field('apartmentAcquired','다른 집 취득일','date')}{field('sellDate','다른 집 매도 예정일','date')}{field('purchase','다른 집 취득가 (만 원)','number')}{field('sale','다른 집 예상 매도가 (만 원)','number')}{field('expenses','인정되는 필요경비 (만 원)','number')}</div><p><strong>비교에 적용할 가정</strong></p><p className={styles.small}>확인되지 않았다면 선택하지 않아도 돼요. 아래 선택은 특례 판정을 대신하지 않아요.</p>{([['ordinary','매도 주택은 비조정대상지역이며, 단독명의·일반세율 적용 등 아래 계산 조건을 충족한다고 가정'],['eligible','빈집 매도 후 세대에 다른 주택·입주권·분양권이 없고, 매도 주택은 보유·거주 등 1세대 1주택 비과세 요건을 충족한다고 가정'],['noException','두 집을 함께 보유할 때는 상속·농어촌주택 등 비과세 특례가 적용되지 않는다고 가정']] as const).map(([key,label]) => <label key={key} className={styles.check}><input type="checkbox" checked={input[key]} onChange={e => set(key,e.target.checked)} />{label}</label>)}</>}
    </details>
    {application && <><input type="hidden" name="acquisition" value={input.acquisition} /><input type="hidden" name="taxNote" value={taxNote(input)} /></>}
    {result.kind === 'comparison' ? <><p><strong>입력한 가정에서는 빈집을 먼저 매도하는 순서를 비교해 보세요.</strong></p><div className={styles.grid}><div className={styles.card}><h3>다른 집부터 매도</h3><p>해당 주택 예상 양도세·지방소득세</p><strong>{money(result.first)}</strong></div><div className={styles.card}><h3>빈집 매도 후 다른 집 매도</h3><p>비과세 요건 충족 가정</p><strong>0원</strong></div></div><p>해당 주택의 예상 세금 차이 <strong>{money(result.first)}</strong></p><p className={styles.small}>빈집 자체의 매도 세금·중개보수·정리비와 대기 비용은 포함하지 않았어요. 두 집 처분 후 순회수액은 해당 비용까지 확인한 뒤 비교해야 해요.</p><details><summary>계산 내역 보기</summary><p>양도차익 {money(result.gain)} − 장기보유공제 {money(result.deduction)} − 기본공제 250만 원 → 과세표준 {money(result.base)}. 양도소득세 {money(result.national)} + 지방소득세 {money(result.local)}.</p></details></> : <div className={styles.card}><h3>{result.inherited ? '상속주택 특례부터 확인해 보세요.' : '확인할 정보를 먼저 정리했어요.'}</h3>{result.inherited && <p>아파트 취득 후 빈집을 상속받은 경우예요. 상속주택 특례와 아파트 비과세 요건을 충족하면 빈집을 보유한 채 아파트를 매도해도 세금이 0원일 수 있어요.</p>}<p>아래 조건을 확인하기 전에는 예상 세금을 확정하지 않아요.</p><ul>{result.missing.map(item => <li key={item}>{item}</li>)}</ul></div>}
    <Basis /><div className={styles.card}><h3>다음에는 이렇게 준비하세요.</h3><ol><li>{result.kind === 'review' && result.inherited ? '상속 당시 세대 관계와 상속재산 내역, 아파트 취득 서류를 준비하세요.' : '두 집의 취득 계약서·등기자료와 필요경비 증빙을 준비하세요.'}</li><li>매도 계약 전에 세무사에게 비과세 특례와 처분 순서를 확인하세요.</li><li>{input.priority === '철거 검토' ? '지원 대상과 현장 견적을 확인한 뒤 철거 비용까지 비교하세요.' : '공인중개사 상담에서 빈집의 예상 매도가와 매도 기간을 확인하세요.'}</li></ol><Link href={input.priority === '철거 검토' ? '/resources' : '/apply'}>{input.priority === '철거 검토' ? '지원 조건·담당 창구 확인하기' : '자료 확인 상담 신청하기'}</Link><p className={styles.small}>상담은 운영자에게 접수돼요. 세무사·공인중개사 자동 매칭이나 세금 확정 서비스는 아니에요.</p></div>
    {application && <Link className={styles.cta} href="/decision-report">입력한 내용으로 비교 진단서 보기</Link>}
  </section>
}
