import Image from 'next/image'
import Link from 'next/link'
import { Brand } from '../home-ui'
import { PHONE } from '../landing-parts'
import { OPTIONS, PLANS, won } from '../../src/management'
import { SITE_URL } from '../../src/seo'
import { ApplyForm } from './apply-form'
import { ManagementTabs } from './management-tabs'
import m from './management.module.css'

const FLOW = [
  { step: '신청', note: '1분이면 돼요' },
  { step: '전화 상담', note: '상품을 같이 골라요' },
  { step: '집 확인', note: '함께 보고 사진 기록' },
  { step: '계약·열쇠', note: '계약 후 열쇠 인계' },
  { step: '관리·보고', note: '다녀온 날 사진 보고' },
]

const AUDIENCE = ['부모님이 살던 시골집', '세컨하우스와 별장', '유학이나 해외 근무로 비운 집', '장기 여행 중인 집']

const VISIT = [
  { title: '집 안팎 확인', text: '대문·담장·지붕·마당·방 천장', image: '/management/house-gate.jpg' },
  { title: '실내 환기', text: '창문과 방문을 열어 30분', image: '/management/ventilation.jpg' },
  { title: '물 자국·설비 확인', text: '천장·창틀, 차단기·보일러·계량기', image: '/management/ceiling-leak.jpg' },
  { title: '우편물 수거', text: '사진으로 알리고, 원하시면 발송', image: '/management/mailbox.jpg' },
]

/** The fixed scope of a visit. Reports cover these items only; keep in sync with the contract. */
const CHECKS = [
  { group: '집 밖', items: ['대문·현관문 잠김', '담장·축대 (정해 둔 지점)', '지붕 (땅에서 보이는 면)', '외벽·창문', '마당 풀·쓰레기', '우편함', '이웃 쪽으로 넘어간 나뭇가지', '배수로·홈통 막힘', '억지로 연 흔적', '벌집 (4~10월)'] },
  { group: '집 안', items: ['방 천장 물 자국 (정해 둔 방)', '창틀·벽 아래 물 자국', '부엌·화장실 바닥 물 고임', '가스 냄새'] },
  { group: '설비 (만지지 않고 눈으로만)', items: ['차단기', '보일러 표시창·연료 눈금', '수도 계량기 숫자', '가스 밸브'] },
  { group: '하고 오는 일', items: ['환기 30분', '문단속'] },
]

const SEASONS = [
  { season: '봄', text: '담장·축대 금, 마당 잡초' },
  { season: '여름', text: '배수로·곰팡이, 말벌집' },
  { season: '가을', text: '태풍 전 지붕·낙엽' },
  { season: '겨울', text: '한파 전 수도 동파' },
]

const NOT_INCLUDED = [
  { title: '수리 공사', note: '동네 업체를 알려 드리고, 계약은 직접 해요' },
  { title: '말벌집 제거', note: '업체를 알려 드려요' },
  { title: '긴급 출동', note: '' },
  { title: '귀중품 보관', note: '관리 시작 전에 옮겨 주세요' },
]

const GUIDE = [
  <>계약 전에 집 상태를 함께 확인하고, <strong>무료 진단서</strong>로 정리해 드려요.</>,
  <>방문 전날 톡방으로 방문 시간을 알려 드려요.</>,
  <>정해진 확인 항목만 보고, 본 사실만 알려 드려요. 구조 안전이나 고장 원인은 판단하지 않아요.</>,
  <>열쇠 보관, 책임 범위, 보상 한도는 계약서에 적어요. (법률 확인 중)</>,
  <>포항·경주 시범 운영 중이며, 대표가 직접 방문해요.</>,
]

export const MANAGEMENT_FAQ = [
  { q: '열쇠는 어떻게 맡기나요?', a: '계약 확정 뒤 직접 받거나 등기로 받아요. 보관 방법은 계약서에 적어 드려요.' },
  { q: '한 번만 맡겨도 되나요?', a: '네. 1회성 방문은 77,000원이에요. 정기 관리는 월 1회, 월 2회, 2개월 1회 중에 고를 수 있어요.' },
  { q: '언제든 그만둘 수 있나요?', a: '다음 방문 전에 말씀해 주시면 그다음부터 멈추고 열쇠를 돌려드려요. 환불 기준은 계약서에서 알려 드려요.' },
  { q: '수리도 해 주나요?', a: '수리 공사는 직접 하지 않아요. 상의한 뒤 동네 업체를 알려 드리고, 공사 계약과 비용은 직접 정하시면 돼요.' },
  { q: '가족이 대신 신청해도 되나요?', a: '네. 다만 계약할 때 집 주인의 동의를 확인해요. 필요한 서류는 상담 때 알려 드려요.' },
  { q: '전기·수도는 끊어야 하나요?', a: '집마다 달라요. 계약 전에 집을 확인할 때 전기·수도·가스 상태를 같이 보고 정해요. 요금은 집 주인이 내요. 겨울에는 수도가 얼지 않게 물을 빼 두는 방법도 알려 드려요.' },
  { q: '맡지 않는 집도 있나요?', a: '네. 무너질 위험이 있거나 시·군에서 철거나 정비 명령을 받은 집은 안전하게 관리하기 어려워 맡지 않아요. 이런 집은 무료 진단서로 철거·수리 지원사업을 먼저 알려 드려요.' },
  { q: '다른 지역은 언제 되나요?', a: '아직 정해지지 않았어요. 알림을 신청해 주시면 지역을 넓힐 때 참고해요.' },
]

const REPORT_ROWS = [
  { tone: 'ok', label: '지난번과 같음', text: '대문, 담장, 지붕(땅에서 보이는 면)' },
  { tone: 'warn', label: '달라짐', text: '마당 풀이 발목에서 무릎 높이로 자랐어요. 제초 업체를 알려 드릴까요?' },
  { tone: 'ok', label: '지난번과 같음', text: '안방·작은방 천장, 창틀, 부엌·화장실 바닥' },
  { tone: 'ok', label: '환기', text: '방 3곳 창문을 열어 30분 환기했어요.' },
  { tone: 'ok', label: '우편물', text: '2통 모아 두었어요. (사진 첨부)' },
  { tone: 'warn', label: '다음 알림', text: '첫 한파 예보가 나오면 수도 동파 점검을 알려 드릴게요.' },
] as const

const HISTORY = [{ month: '11월 방문', status: '달라짐 1', warn: true }, { month: '10월 방문', status: '지난번과 같음' }, { month: '9월 방문', status: '지난번과 같음' }]

/** Only facts shown on the page: pilot prices, area, what is and is not included. */
export const MANAGEMENT_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Service',
      '@id': `${SITE_URL}/management#service`,
      name: '빈집 관리 대행',
      serviceType: '비어 있는 주택 방문 점검과 사진 보고',
      description: '정해진 항목대로 집 안팎을 눈으로 확인하고, 실내 환기, 물 자국과 설비 상태 확인, 우편물 수거를 하고 사진 보고서를 우리 집 전용 톡방으로 보내요. 계절과 날씨에 맞춰 살펴볼 곳도 미리 알려 드려요. 수리 공사와 긴급 출동은 하지 않아요.',
      url: `${SITE_URL}/management`,
      provider: { '@id': `${SITE_URL}/#organization` },
      areaServed: [{ '@type': 'City', name: '포항시' }, { '@type': 'City', name: '경주시' }],
      audience: { '@type': 'Audience', audienceType: '집을 비워 둔 소유자와 가족' },
      offers: PLANS.map(plan => ({ '@type': 'Offer', name: plan.name, price: String(plan.price), priceCurrency: 'KRW', description: `${plan.note} (${plan.unit})` })),
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/management#faq`,
      mainEntity: MANAGEMENT_FAQ.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
    },
  ],
}

function ServicePanel() {
  return <>
    <h2>서비스 및 요금안내</h2>
    <p className={m.sub}>사람이 없는 집은 작은 문제가 큰 사고로 커져요. 대신 가서 보고 사진으로 알려 드려요. 한 번만 맡기셔도, 정기적으로 맡기셔도 돼요.</p>
    <p className={m.included} aria-label="이런 집을 맡아요">{AUDIENCE.map(a => <span key={a}>{a}</span>)}</p>

    <h3><span className={m.num}>1</span>방문하면 해 드리는 일</h3>
    <ul className={m.visit}>{VISIT.map(item => <li key={item.title}>
      <Image src={item.image} alt="" width={360} height={192} sizes="(max-width: 720px) 50vw, 340px" />
      <div><strong>{item.title}</strong><span>{item.text}</span></div>
    </li>)}</ul>
    <p className={m.scope}>확인 항목을 미리 정해 두고, 그 항목만 확인해서 보고해요.</p>
    <div className={m.faq}><details>
      <summary>확인 항목 20가지 보기</summary>
      <dl className={m.checks}>{CHECKS.map(c => <div key={c.group}><dt>{c.group}</dt><dd>{c.items.join(' · ')}</dd></div>)}</dl>
    </details></div>

    <h3><span className={m.num}>2</span>받아 보시는 것</h3>
    <div className={m.get}>
      <div className={m.getHead}>
        <Image src="/management/phone-report.jpg" alt="" width={144} height={112} sizes="72px" />
        <div><strong>우리 집 전용 톡방</strong><span>다녀온 날 사진 보고서를 받아요. 바퀴벌레·하수구 막힘처럼 손볼 일이 생기면 톡방에 말씀해 주세요. 동네 업체를 알려 드려요. 업체와의 계약과 작업 내용은 직접 정하시고, 톡방으로 요청하시면 약속한 시간에 문을 열어 드리고 작업 전후 사진을 남겨요.</span></div>
      </div>
    </div>
    <div className={m.get}>
      <div className={m.getHead}>
        <span className={m.getIcon} aria-hidden="true">🌦️</span>
        <div><em className={m.specialTag}>빈집진단서만의 서비스</em><strong>계절·날씨 맞춤 알림</strong><span>그때 살펴봐야 할 곳을 빈집진단서만의 예방 알림으로 미리 알려 드려요!</span></div>
      </div>
      <div className={m.alert} aria-label="알림 예시">
        <div className={m.alertTop}><span>📲 빈집진단서</span><small>알림 예시</small></div>
        <p><strong>송라면 집, 이번 주 금요일 영하 9도 예보예요.</strong><br />수도관이 얼지 않게 확인을 요청해 볼까요?</p>
      </div>
      <ul className={m.seasons}>{SEASONS.map(s => <li key={s.season}><strong>{s.season}</strong>{s.text}</li>)}</ul>
    </div>

    <h3><span className={m.num}>3</span>요금</h3>
    <p className={m.lead3}>모든 상품에 아래가 똑같이 들어가요.</p>
    <p className={m.included}><span>✓ 방문 4가지</span><span>✓ 전용 톡방 보고</span><span>✓ 계절·날씨 알림</span></p>
    <table className={m.price}>
      <thead><tr><th scope="col">상품</th><th scope="col">비용</th></tr></thead>
      <tbody>{PLANS.map(plan => <tr key={plan.name} className={plan.base ? m.base : undefined}><th scope="row">{plan.name}<small>{plan.note}</small></th><td>{won(plan.price)}<small>{plan.unit}</small></td></tr>)}</tbody>
    </table>

    <h3>필요할 때 추가 (옵션)</h3>
    <table className={m.price}>
      <tbody>{OPTIONS.map(o => <tr key={o.name}><th scope="row">{o.name}<small>{o.note}</small></th><td>{o.price === null ? '견적' : won(o.price)}<small>{o.unit}</small></td></tr>)}</tbody>
    </table>

    <h3>해 드리지 않는 일</h3>
    <ul className={m.nots}>{NOT_INCLUDED.map(n => <li key={n.title}><div>{n.title}{n.note && <small>{n.note}</small>}</div></li>)}</ul>

    <h3>이용 안내</h3>
    <ul className={m.remarks}>{GUIDE.map((g, i) => <li key={i}>{g}</li>)}</ul>

    <h3>자주 묻는 질문</h3>
    <div className={m.faq}>{MANAGEMENT_FAQ.map(item => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div>
  </>
}

function ReportPanel() {
  return <>
    <h2>관리보고</h2>
    <p className={m.sub}>다녀온 날마다 이런 보고를 우리 집 전용 톡방으로 받아요. 정해진 확인 항목마다 지난번과 같은지, 달라졌는지를 사진과 함께 알려 드려요.</p>
    <div className={m.report}>
      <div className={m.reportHead}><span>보고 예시</span><strong>경북 ○○군 단독주택</strong><small>11월 방문 · 머문 시간 30분</small></div>
      <div className={m.shots}>
        <figure><Image src="/management/house-gate.jpg" alt="" width={350} height={196} sizes="50vw" /><figcaption>대문·담장</figcaption></figure>
        <figure><Image src="/management/yard.jpg" alt="" width={350} height={196} sizes="50vw" style={{ objectPosition: '75% 50%' }} /><figcaption>마당</figcaption></figure>
      </div>
      <ul className={m.rows}>{REPORT_ROWS.map(row => <li key={row.text}><span className={row.tone === 'warn' ? m.warn : m.ok}>● {row.label}</span>{row.text}</li>)}</ul>
    </div>
    <h3>지난 보고</h3>
    <ul className={m.history}>{HISTORY.map(h => <li key={h.month}>{h.month}<span className={h.warn ? m.historyWarn : m.historyOk}>{h.status}</span></li>)}</ul>
    <p className={m.demoNote}>이해를 돕기 위한 예시 화면이에요.</p>
  </>
}

function ApplyPanel() {
  return <>
    <h2>신청하기</h2>
    <p className={m.sub}>신청만으로 결제되지 않아요. 전화로 상담하고 집을 함께 확인한 뒤 계약서를 작성해요. 그다음부터는 다시 신청하지 않아도 우리 집 전용 톡방에서 담당자와 바로 이야기할 수 있어요.</p>
    <ol className={m.flow}>{FLOW.map((f, i) => <li key={f.step}><span>{i + 1}</span><strong>{f.step}</strong><small>{f.note}</small></li>)}</ol>
    <div className={m.formBox}><ApplyForm /></div>
    <a className={m.call} href={`tel:${PHONE.replaceAll('-', '')}`}>전화로 신청하기 · {PHONE}</a>
    <p className={m.other}>포항·경주가 아닌가요? <Link href="/interest?source=other-region">우리 지역이 열리면 알림 받기 →</Link></p>
    <p className={m.partner}>🏡 <strong>동네 관리인을 찾고 있어요.</strong> 이장님처럼 마을 집을 잘 아는 분이라면 <a href={`tel:${PHONE.replaceAll('-', '')}`}>{PHONE}</a>로 연락 주세요.</p>
  </>
}

export function ManagementView() {
  return <div className={m.page}>
    <header className={m.top}>
      <div className={m.topIn}>
        <div className={m.brandRow}><Brand /><span>포항·경주 시범</span></div>
        <div className={m.titleRow}>
          <div><h1>빈집 관리</h1><p>비워 둔 집, 대신 가서 보고<br />날씨에 맞춰 미리 알려 드려요</p></div>
          <Image src="/mascot/binzip-rabbit-report-transparent-v4.png" alt="" width={120} height={120} sizes="96px" priority />
        </div>
      </div>
    </header>
    <main className={m.main}>
      <ManagementTabs panels={{ service: <ServicePanel />, report: <ReportPanel />, apply: <ApplyPanel /> }} />
    </main>
  </div>
}
