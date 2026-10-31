import Image from 'next/image'
import Link from 'next/link'
import { HomeHeader } from '../home-ui'
import { calculateDisposal, EXAMPLE_DISPOSAL, formatWon } from '../../src/disposal'
import { EXAMPLE_CASE } from '../../src/example-report-data'
import { EXAMPLE_TRANSACTIONS } from '../../src/example-demolition'
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
    resultLabel: '그대로 팔 때 손에 남는 돈', resultManwon: netOf(keepAsIs),
    lines: [
      { label: '예상 매도가', manwon: manwon(keepAsIs.sale) },
      { label: '대출 상환', manwon: -manwon(keepAsIs.debt) },
      { label: '세금·중개 수수료', manwon: -manwon(keepAsIs.taxAndFees) },
      { label: '남은 짐 정리', manwon: -manwon(keepAsIs.clearance) },
    ],
    extra: `철거 후 땅으로 팔면 약 ${won(netOf(demolishFirst))}이 남아요. 철거비 ${won(manwon(demolishFirst.clearance))}을 먼저 들여야 해서 차이는 크지 않아요.`,
    compare: { money: `약 ${won(netOf(keepAsIs))} 남음`, time: '3~6개월 (거래 상황에 따라)', house: '내 집이 아니게 돼요', burden: '매수자 찾기·서류' },
    checks: [`주변 주택 거래 ${houses.length}건 · ${Math.min(...houses).toLocaleString('ko-KR')}만~${won(Math.max(...houses))}`, '집과 땅 소유자, 상속 정리 여부'],
    tax: ['상속받은 집이라 상속 당시 평가액이 취득가액이 돼요.', '다른 집이 있는지에 따라 세금이 크게 달라져요.', '상속 후 지난 기간에 따라 적용되는 특례가 달라질 수 있어요.'],
    note: '주변 거래만으로 이 집의 매도가를 정하지 않아요. 세금 금액은 계산해 드리지 않으니, 최종 세액은 세무사에게 확인해요.',
  },
  {
    id: 'repair', tone: styles.toneRepair, name: '고치기', when: '다시 살거나 쓸 계획이 있을 때',
    resultLabel: '예상 수리비', resultManwon: 900,
    lines: [{ label: '지붕 보수', manwon: -500 }, { label: '실내 마감', manwon: -300 }, { label: '외벽 보수', manwon: -100 }],
    compare: { money: '약 900만 원 듦', time: '견적부터 공사까지 2~4개월', house: '살 수 있는 집이 돼요', burden: '견적 비교·공사 확인' },
    checks: ['시공업체 현장 견적과 공사 범위', '기울어짐·균열이 있으면 건축사·구조기술사 확인'],
    note: '사진만으로는 수리 가능성이나 안전을 확정하지 않아요. 전문가가 현장을 확인하면 그 결과와 확인한 사람·날짜를 진단서에 함께 적어요.',
  },
  {
    id: 'keep', tone: styles.toneKeep, name: '돌보기', when: '당장은 팔지 않고 갖고 있을 때',
    resultLabel: '직접 챙길 때 드는 돈 · 1년', resultManwon: 70,
    lines: [{ label: '재산세 등 세금', manwon: -15 }, { label: '전기·수도 기본요금', manwon: -15 }, { label: '방문 교통비 (분기 1회)', manwon: -40 }],
    compare: { money: '해마다 약 70만 원 듦', time: '정해진 끝이 없어요', house: '그대로 남아요', burden: '정기 방문·상태 확인' },
    checks: ['방문 주기와 확인할 범위', '비·태풍 뒤 상태 확인 방법'],
    note: '관리 서비스는 준비 중이라 요금이 정해지지 않았어요.',
    link: { href: '/interest?source=example-report', text: '빈집 관리 의견 남기기 →' },
  },
]

const COMPARE_ROWS: { key: keyof Choice['compare']; label: string }[] = [
  { key: 'money', label: '돈' }, { key: 'time', label: '걸리는 시간' }, { key: 'house', label: '집은' }, { key: 'burden', label: '내가 할 일' },
]

const signed = (value: number) => (value < 0 ? '−' : '') + won(Math.abs(value))

export function DecisionExampleReport() {
  return <main className={styles.report} data-report><HomeHeader />
    <section className={`${styles.section} ${styles.hero}`}>
      <div className={styles.heroText}>
        <p className={styles.case}>진단서 예시 · 가상 사례예요. <Link href="/diagnosis#apply">참여 신청하기 →</Link></p>
        <h1>팔지, 고칠지, 돌볼지<br />한눈에 비교해요</h1>
        <p className={styles.lead}>{EXAMPLE_CASE.shortAddress} · {EXAMPLE_CASE.building.structure} {EXAMPLE_CASE.building.purpose} {EXAMPLE_CASE.building.area}㎡ · {EXAMPLE_CASE.owner.vacantSince}부터 빈집</p>
      </div>
      <Image className={styles.rabbit} src="/mascot/binzip-rabbit-report-transparent-v4.png" alt="" width={132} height={168} sizes="(max-width: 620px) 88px, 132px" priority />
      <p className={styles.disclaimer}>실제 집을 조사한 결과가 아니에요. 아래 금액·기간은 모두 설명을 위한 가정이며, 감정평가·실제 견적·지원금 확정액이 아니에요.</p>
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
        <div className={styles.choiceResult}><span>{c.resultLabel} · 가정</span><strong>약 {won(c.resultManwon)}</strong></div>
        <dl className={styles.choiceLines}>{c.lines.map(l => <div key={l.label}><dt>{l.label}</dt><dd>{signed(l.manwon)}</dd></div>)}</dl>
        {c.extra && <p className={styles.choiceExtra}>{c.extra}</p>}
        <h3>먼저 확인할 것</h3>
        <ul>{c.checks.map(check => <li key={check}>{check}</li>)}</ul>
        {c.tax && <div className={styles.taxBox}><h3>양도세가 달라지는 조건</h3><ul>{c.tax.map(item => <li key={item}>{item}</li>)}</ul><p>홈택스의 양도소득세 모의계산으로 직접 넣어 볼 수 있어요. 팔기 전에 이 세 가지를 들고 세무사에게 확인해 보세요.</p><a href="https://www.hometax.go.kr" target="_blank" rel="noopener noreferrer">홈택스 열기 ↗<span className={styles.srOnly}> (새 창)</span></a></div>}
        <p className={styles.note}>{c.note}</p>
        {c.link && <Link className={styles.choiceLink} href={c.link.href}>{c.link.text}</Link>}
      </article>)}</div>
      <p className={styles.note}>지원사업은 사업마다 대상과 본인 부담이 달라서 위 계산에 넣지 않았어요. <Link href="/resources">공식 지원·정보 보기 →</Link></p>
    </section>

    <section className={styles.section}><h2>담당자 의견</h2><p>다른 지역에 사셔서 자주 가 보기 어렵고, 다시 사실 계획은 없다고 하셨어요. 그러면 돌보기는 해마다 비용과 방문 부담이 이어지고, 고치기는 쓰실 계획이 없어 맞지 않아요.</p><p>그래서 <strong>팔기를 먼저 검토하시길 권해요.</strong> 다만 그대로 팔 때와 철거 후 팔 때 남는 돈 차이가 {won(netOf(demolishFirst) - netOf(keepAsIs))} 정도라, 철거비 {won(manwon(demolishFirst.clearance))}을 먼저 들이기 전에 중개사무소에 그대로 팔 수 있는지부터 물어보세요.</p></section>
    <section id="consultation" className={styles.section}><h2>우리 집도 확인해 보고 싶으신가요?</h2><p>실제 진단은 참여 신청 후 담당자가 자료를 확인해 진행해요.</p><p className={styles.note}>실제 진단서에서는 확인하지 못한 항목에 ‘미확인’을 표시하고, 근거 자료와 확인 날짜를 함께 적어요.</p><Link href="/diagnosis#apply">빈집 진단 참여 신청하기 →</Link></section>
  </main>
}
