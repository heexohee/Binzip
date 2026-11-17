import Image from 'next/image'
import Link from 'next/link'
import { HomeHeader } from '../home-ui'
import { calculateDisposal, EXAMPLE_DISPOSAL, formatWon } from '../../src/disposal'
import { EXAMPLE_CASE } from '../../src/example-report-data'
import { EXAMPLE_TRANSACTIONS } from '../../src/example-demolition'
import { resourceById } from '../../src/official-resources'
import { buildSupports } from '../../src/supports'
import styles from './decision-example.module.css'

type Line = { label: string; manwon: number }
type Choice = {
  id: string; tone: string | undefined; name: string; when: string
  resultLabel: string; resultManwon: number; lines: Line[]; extra?: string
  compare: { money: string; time: string; house: string; burden: string }
  checks: string[]; tax?: string[]; note: string; link?: { href: string; text: string }
}

const manwon = (value: string) => Number(value)
const [keepAsIs, demolishFirst] = EXAMPLE_DISPOSAL
const houses = EXAMPLE_TRANSACTIONS.filter(t => t.kind === '단독주택').map(t => t.price)
const netOf = (input: typeof keepAsIs) => (calculateDisposal(input).net ?? 0) / 10_000
const won = (value: number) => formatWon(value * 10_000)

/** All amounts are fictional teaching values in 만 원; the page says so next to every number. */
const CHOICES: Choice[] = [
  {
    id: 'sell', tone: styles.toneSell, name: '팔기', when: '앞으로 쓸 계획이 없을 때',
    resultLabel: '가정한 매도가에서 비용을 뺀 금액', resultManwon: netOf(keepAsIs),
    lines: [
      { label: '가정한 매도가', manwon: manwon(keepAsIs.sale) },
      { label: '대출 상환', manwon: -manwon(keepAsIs.debt) },
      { label: '세금·중개보수 (임의 가정)', manwon: -manwon(keepAsIs.taxAndFees) },
      { label: '남은 짐 정리', manwon: -manwon(keepAsIs.clearance) },
    ],
    extra: `같은 방식으로 철거 후 땅으로 판다고 가정하면 약 ${won(netOf(demolishFirst))}으로 계산돼요. 이 예시에서는 철거비 ${won(manwon(demolishFirst.clearance))}을 먼저 들인다고 가정했어요.`,
    compare: { money: `약 ${won(netOf(keepAsIs))} 남음 (가정)`, time: '3~6개월 (거래 상황에 따라)', house: '내 집이 아니게 돼요', burden: '매수자 찾기·서류' },
    checks: [`설명용 가상 거래 ${houses.length}건 · ${Math.min(...houses).toLocaleString('ko-KR')}만~${won(Math.max(...houses))}`, '집과 땅 소유자, 상속 정리 여부'],
    tax: ['상속받은 집의 취득가액과 양도소득세는 상속 당시 자료, 다른 집 보유 여부, 취득·양도 시점에 따라 달라져요.', '이 진단서는 세액이나 특례를 판단하지 않아요.'],
    note: `위 세금·중개보수 ${won(manwon(keepAsIs.taxAndFees))}은 계산 방법을 설명하려고 임의로 넣은 숫자예요. 세금이나 중개보수를 산정한 금액이 아니에요. 거래 사례도 이 집의 예상 매도가가 아니에요.`,
  },
  {
    id: 'repair', tone: styles.toneRepair, name: '고치기', when: '다시 살거나 쓸 계획이 있을 때',
    resultLabel: '예상 수리비', resultManwon: 900,
    lines: [{ label: '지붕 보수', manwon: -500 }, { label: '실내 마감', manwon: -300 }, { label: '외벽 보수', manwon: -100 }],
    compare: { money: '약 900만 원 듦 (가정)', time: '견적부터 공사까지 2~4개월', house: '수리·안전 확인 후 사용 검토', burden: '견적 비교·공사 확인' },
    checks: ['시공업체 현장 견적과 공사 범위', '기울어짐·균열이 있으면 건축사·구조기술사 확인'],
    note: '사진만으로는 수리 가능성이나 안전을 확정하지 않아요. 전문가가 현장을 확인하면 그 결과와 확인한 사람·날짜를 진단서에 함께 적어요.',
  },
  {
    id: 'keep', tone: styles.toneKeep, name: '돌보기', when: '당장은 팔지 않고 갖고 있을 때',
    resultLabel: '직접 챙길 때 드는 돈 · 1년', resultManwon: 70,
    lines: [{ label: '재산세 등 세금', manwon: -15 }, { label: '전기·수도 기본요금', manwon: -15 }, { label: '방문 교통비 (분기 1회)', manwon: -40 }],
    compare: { money: '해마다 약 70만 원 듦 (가정)', time: '정해진 끝이 없어요', house: '그대로 남아요', burden: '정기 방문·상태 확인' },
    checks: ['방문 주기와 확인할 범위', '비·태풍 뒤 상태 확인 방법'],
    note: '관리 서비스는 준비 중이라 요금이 정해지지 않았어요.',
    link: { href: '/interest?source=example-report', text: '빈집 관리 의견 남기기 →' },
  },
]

const COMPARE_ROWS: { key: keyof Choice['compare']; label: string }[] = [
  { key: 'money', label: '돈' }, { key: 'time', label: '걸리는 시간' }, { key: 'house', label: '집은' }, { key: 'burden', label: '내가 할 일' },
]

type SupportExample = { id: string; fits: string; title: string; summary: string; checks: string[]; link?: { href: string; text: string } }

const demolitionNotice = buildSupports({})[0]!.source
/** Kinds of public programs to look into. Names, amounts and periods differ by city and year. */
const SUPPORT_EXAMPLES: SupportExample[] = [
  {
    id: 'demolition', fits: '철거', title: '빈집 철거 지원 (빈집정비사업)',
    summary: '시·군·구에서 빈집 철거비 일부를 지원하는 사업이에요. 지원 한도와 본인 부담은 지역과 해마다 달라요.',
    checks: ['지금 접수 중인지, 예산이 남았는지', '내가 낼 금액과 지원에서 빠지는 비용 (짐 정리 등)', '철거 후 땅을 일정 기간 주차장·텃밭 같은 공공 용도로 쓰는 조건이 있는지', '공동 소유라면 다른 소유자의 동의가 필요한지', '공사 계약 전에 먼저 신청해야 하는지'],
    link: { href: demolitionNotice.url, text: '예: 포항시 2026년 빈집정비사업 공고' },
  },
  {
    id: 'slate', fits: '철거 · 고치기', title: '슬레이트 지붕 철거·개량 지원',
    summary: '지붕이 슬레이트라면 철거비와 별도로 슬레이트 처리비를 지원받을 수 있는지 알아볼 수 있어요.',
    checks: ['슬레이트인지는 사진만으로 확정하지 않아요. 지붕에 직접 올라가지 마세요', '집 전체 철거와 함께 신청할 수 있는지', '새 지붕 공사도 지원 범위에 들어가는지'],
  },
  {
    id: 'repair', fits: '고치기', title: '빈집 수리·활용 지원',
    summary: '일부 지역에서는 빈집을 고쳐 일정 기간 빌려주는 조건으로 수리비를 지원해요.',
    checks: ['우리 지역에 이런 사업이 있는지', '빌려줘야 하는 기간과 임대료 조건'],
  },
  {
    id: 'listing', fits: '팔기', title: '공공 빈집 매물 창구',
    summary: '농촌 빈집은행처럼 빈집 매물을 알리는 공공 창구가 있어요.',
    checks: ['우리 지역이 참여하는지', '등록 절차와 필요한 서류'],
    link: { href: resourceById('greendaero').href, text: '그린대로 · 농촌 빈집은행' },
  },
]

const signed = (value: number) => (value < 0 ? '−' : '') + won(Math.abs(value))

/** What a real report covers; must stay in line with the apply page and the actual service. */
function Scope() {
  return <div className={styles.scope}>
    <div><h2>실제 진단서에 담는 것</h2><ul><li>신청자가 알려 주신 내용과 공적 자료로 확인한 사실을 나눠 적어요</li><li>참고한 거래 사례·견적의 출처, 날짜, 조건</li><li>담당자 의견과 전문가에게 물어볼 질문</li></ul></div>
    <div><h2>실제 진단서에서 하지 않는 것</h2><ul><li>이 집의 매도가나 실수령액 산정</li><li>세액 계산이나 세금 특례 판단</li><li>매수자 연결이나 거래 중개</li></ul></div>
  </div>
}

export function DecisionExampleReport() {
  return <main className={styles.report} data-report><HomeHeader />
    <section className={`${styles.section} ${styles.hero}`}>
      <div className={styles.heroText}>
        <p className={styles.case}>진단서 예시 · 가상 사례예요. <Link href="/apply">참여 신청하기 →</Link></p>
        <h1>팔지, 고칠지, 돌볼지<br />한눈에 비교해요</h1>
        <p className={styles.lead}>가상의 시골집 A · {EXAMPLE_CASE.building.structure} {EXAMPLE_CASE.building.purpose} {EXAMPLE_CASE.building.area}㎡ · {EXAMPLE_CASE.owner.vacantSince}부터 빈집</p>
      </div>
      <Image className={styles.rabbit} src="/mascot/binzip-rabbit-report-transparent-v4.png" alt="" width={132} height={168} sizes="(max-width: 620px) 88px, 132px" priority />
      <p className={styles.disclaimer}>실제 집을 조사한 결과가 아니에요. 아래 금액·기간은 계산 방법을 보여 주려고 만든 가정이에요. 감정평가, 실제 견적, 세액, 지원금 확정액이 아니에요.</p>
      <Scope />
    </section>

    <section className={styles.section} aria-labelledby="compare-title">
      <h2 id="compare-title">한눈에 비교</h2>
      <div className={styles.compareWrap} tabIndex={0} role="region" aria-label="세 가지 선택지 비교표">
        <table className={styles.compare}>
          <thead><tr><th scope="col"><span className={styles.srOnly}>항목</span></th>{CHOICES.map((c, i) => <th key={c.id} scope="col" className={c.tone}><a href={`#${c.id}`}><span>{i + 1}</span>{c.name}</a></th>)}</tr></thead>
          <tbody>{COMPARE_ROWS.map(row => <tr key={row.key}><th scope="row">{row.label}</th>{CHOICES.map(c => <td key={c.id}>{c.compare[row.key]}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <p className={styles.note}>모두 가정한 값이에요. 이 집의 실제 상황에 따라 순서가 달라질 수 있어요.</p>
    </section>

    <section className={styles.section} aria-labelledby="choices-title">
      <h2 id="choices-title">선택지별로 자세히</h2>
      <div className={styles.choiceGrid}>{CHOICES.map((c, i) => <article key={c.id} id={c.id} className={`${styles.choiceCard} ${c.tone}`}>
        <p className={styles.choiceTag}><span>{i + 1}</span>{c.name}</p>
        <p className={styles.choiceWhen}>{c.when}</p>
        <div className={styles.choiceResult}><span>{c.resultLabel} · 계산 설명용 가정</span><strong>약 {won(c.resultManwon)}</strong></div>
        <dl className={styles.choiceLines}>{c.lines.map(l => <div key={l.label}><dt>{l.label}</dt><dd>{signed(l.manwon)}</dd></div>)}</dl>
        {c.extra && <p className={styles.choiceExtra}>{c.extra}</p>}
        {c.id === 'sell' && <details><summary>철거 후 매각 계산 내역 · 모두 가정</summary><dl className={styles.choiceLines}><div><dt>가정한 토지 매도대금</dt><dd>{won(manwon(demolishFirst.sale))}</dd></div><div><dt>대출 상환</dt><dd>−{won(manwon(demolishFirst.debt))}</dd></div><div><dt>세금·거래비용 (임의 가정)</dt><dd>−{won(manwon(demolishFirst.taxAndFees))}</dd></div><div><dt>철거·정리 비용</dt><dd>−{won(manwon(demolishFirst.clearance))}</dd></div><div><dt>계산상 남는 금액</dt><dd>{won(netOf(demolishFirst))}</dd></div></dl><p className={styles.note}>세율이나 실제 견적을 적용한 결과가 아닌 계산 구조 설명이에요. 실제 비용이 미확인이면 잔액도 확정하지 않아요.</p></details>}
        <h3>먼저 확인할 것</h3>
        <ul>{c.checks.map(check => <li key={check}>{check}</li>)}</ul>
        {c.tax && <div className={styles.taxBox}><h3>양도세가 달라지는 조건</h3><ul>{c.tax.map(item => <li key={item}>{item}</li>)}</ul><p>관련 자료를 준비해 세무사에게 확인해 주세요. 홈택스 양도소득세 모의계산으로 직접 넣어 볼 수도 있어요.</p><a href="https://www.hometax.go.kr" target="_blank" rel="noopener noreferrer">홈택스 열기 ↗<span className={styles.srOnly}> (새 창)</span></a></div>}
        <p className={styles.note}>{c.note}</p>
        {c.link && <Link className={styles.choiceLink} href={c.link.href}>{c.link.text}</Link>}
      </article>)}</div>
      <p className={styles.note}>지원사업은 사업마다 대상과 본인 부담이 달라서 위 계산에 넣지 않았어요. <Link href="/resources">공식 지원·정보 보기 →</Link></p>
    </section>

    <section className={styles.section} aria-labelledby="supports-title">
      <h2 id="supports-title">알아볼 만한 지원사업 · 예시</h2>
      <p>사업 이름과 대상, 금액, 신청 기간은 시·군마다, 해마다 달라요. 실제 진단서에서는 집이 있는 지역의 최신 공고를 찾아 확인할 것과 문의처를 적어 드려요. 지원을 받을 수 있는지는 담당 부서가 정해요.</p>
      <div className={styles.supportList}>{SUPPORT_EXAMPLES.map(item => <article key={item.id}>
        <p className={styles.supportFits}>{item.fits}</p>
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
        <ul>{item.checks.map(check => <li key={check}>{check}</li>)}</ul>
        {item.link && <a href={item.link.href} target="_blank" rel="noopener noreferrer">{item.link.text} ↗<span className={styles.srOnly}> (새 창)</span></a>}
      </article>)}</div>
      <p className={styles.note}>철거 지원은 보통 공사 전에 신청해야 해요. 철거업체와 계약하기 전에 시·군청이나 읍·면·동 행정복지센터에 먼저 물어보세요.</p>
    </section>

    <section className={styles.section}><h2>담당자 의견 · 가상 상황에 대한 작성 예시</h2><p>다른 지역에 사셔서 자주 가 보기 어렵고, 다시 사실 계획은 없다고 하셨어요. 그러면 돌보기는 해마다 비용과 방문 부담이 이어지고, 고치기는 쓰실 계획이 없어 맞지 않아요.</p><p>그래서 <strong>팔기를 포함해 비교해 보실 만해요.</strong> 다만 매도가·세금·권리관계·철거비는 확인되지 않았으니 이 결과만으로 정하지 마세요.</p><p>이 예시에서는 가정한 두 금액의 차이가 {won(netOf(demolishFirst) - netOf(keepAsIs))}이에요. 실제로는 매도가와 철거비 등에 따라 결과가 달라질 수 있어요. 철거 여부를 정하기 전에 등록된 중개사무소와 철거업체에 각각 확인해 보세요. 세금은 세무사에게 확인해 주세요.</p></section>
    <section id="consultation" className={styles.section}><h2>우리 집도 확인해 보고 싶으신가요?</h2><p>실제 진단은 참여 신청 후 담당자가 자료를 확인해 진행해요.</p><p className={styles.note}>실제 진단서에서는 확인하지 못한 항목에 ‘미확인’을 표시하고, 근거 자료와 확인 날짜를 함께 적어요. 이 집의 매도가나 실수령액을 정하거나 세액을 계산하지는 않아요.</p><Link href="/apply">빈집 진단 참여 신청하기 →</Link></section>
  </main>
}
