import Image from 'next/image'
import Link from 'next/link'
import { Brand } from '../home-ui'
import { PHONE } from '../landing-parts'
import { OPTIONS, PLANS, won } from '../../src/management'
import { SITE_URL } from '../../src/seo'
import { ApplyForm } from './apply-form'
import { ManagementTabs } from './management-tabs'
import m from './management.module.css'

const FLOW = ['신청', '전화 상담', '계약 확정', '열쇠 인계', '관리비 입금', '관리 진행', '관리 보고']

const ITEMS = [
  { title: '집 안팎 점검', text: '지붕·담장·대문·마당·방·부엌·화장실을 눈으로 살펴봐요.', image: '/management/house-gate.jpg' },
  { title: '실내 환기', text: '창문과 방문을 열어 30분 정도 바람을 통하게 해요.', icon: '🪟' },
  { title: '누수·누전 점검', text: '천장·보일러·수도·가스 주변 물 샌 자국과 차단기 상태를 눈으로 확인해요.', image: '/management/ceiling-leak.jpg' },
  { title: '우편물 수거', text: '우편물을 모아 사진으로 알려 드리고, 원하시면 보내 드려요(우편비 별도).', icon: '📮' },
  { title: '사진 보고서', text: '다녀온 날 문자로 보내요. 가족 여러 명이 같이 받을 수 있어요.', icon: '📲' },
]

const SEASONS = [
  { season: '봄', text: '얼었다 녹은 담장·축대 금' },
  { season: '여름', text: '장마 전 배수로·곰팡이' },
  { season: '가을', text: '태풍 전 지붕·낙엽 막힘' },
  { season: '겨울', text: '한파 전 수도 동파' },
]

const REMARKS = [
  <>첫 방문 때 <strong>무료 진단서</strong>를 함께 드려요.</>,
  <>수리가 필요하면 상의한 뒤 동네 업체를 알려 드려요. 공사 계약과 비용은 직접 정하세요.</>,
  <>열쇠 보관 방법과 책임 범위는 계약서에 적어 드려요. (계약서 문구는 법률 확인 중이에요.)</>,
  <>긴급 출동은 하지 않아요.</>,
  <>지금은 포항·경주에서 시범으로 운영해요. 시범 기간에는 대표가 직접 방문해요.</>,
]

export const MANAGEMENT_FAQ = [
  { q: '열쇠는 어떻게 맡기나요?', a: '계약 확정 뒤 직접 받거나 등기로 받아요. 보관 방법은 계약서에 적어 드려요.' },
  { q: '한 번만 맡겨도 되나요?', a: '네. 1회성 방문은 77,000원이에요. 정기 관리는 월 1회, 월 2회, 2개월 1회 중에 고를 수 있어요.' },
  { q: '언제든 그만둘 수 있나요?', a: '다음 방문 전에 말씀해 주시면 그다음부터 멈추고 열쇠를 돌려드려요. 환불 기준은 계약서에서 알려 드려요.' },
  { q: '수리도 해 주나요?', a: '수리 공사는 직접 하지 않아요. 상의한 뒤 동네 업체를 알려 드리고, 공사 계약과 비용은 직접 정하시면 돼요.' },
  { q: '다른 지역은 언제 되나요?', a: '아직 정해지지 않았어요. 알림을 신청해 주시면 지역을 넓힐 때 참고해요.' },
]

const REPORT_ROWS = [
  { tone: 'ok', label: '괜찮음', text: '지붕·대문은 지난달과 같아요.' },
  { tone: 'warn', label: '살펴볼 곳', text: '마당 풀이 무릎 높이까지 자랐어요. 제초 업체를 알려 드릴까요?' },
  { tone: 'ok', label: '괜찮음', text: '방 3곳 30분 환기했어요. 천장·보일러 주변에 물 자국은 없어요.' },
  { tone: 'ok', label: '우편물', text: '2통 모아 두었어요. (사진 첨부)' },
  { tone: 'warn', label: '다음 알림', text: '첫 한파 예보가 나오면 수도 동파 점검을 알려 드릴게요.' },
] as const

const HISTORY = [{ month: '11월 방문', status: '살펴볼 곳 1', warn: true }, { month: '10월 방문', status: '괜찮음' }, { month: '9월 방문', status: '괜찮음' }]

/** Only facts shown on the page: pilot prices, area, what is and is not included. */
export const MANAGEMENT_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Service',
      '@id': `${SITE_URL}/management#service`,
      name: '빈집 관리 대행',
      serviceType: '비어 있는 주택 방문 점검과 사진 보고',
      description: '열쇠를 맡기면 집 안팎 점검, 실내 환기, 누수·누전 눈 점검, 우편물 수거를 하고 사진 보고서를 문자로 보내요. 계절과 날씨에 맞춰 살펴볼 곳을 미리 알려 드려요. 수리 공사와 긴급 출동은 하지 않아요.',
      url: `${SITE_URL}/management`,
      provider: { '@id': `${SITE_URL}/#organization` },
      areaServed: [{ '@type': 'City', name: '포항시' }, { '@type': 'City', name: '경주시' }],
      audience: { '@type': 'Audience', audienceType: '빈집이 있는 소유자와 가족' },
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
    <p className={m.sub}>열쇠를 맡겨 주시면 집 안팎을 둘러보고 사진 보고서를 보내 드려요. 한 번만 맡기셔도, 정기로 맡기셔도 돼요.</p>

    <div className={m.special}>
      <p className={m.specialTag}>빈집진단서만의 서비스</p>
      <h3>계절·날씨 맞춤 점검 알림</h3>
      <p className={m.specialLead}>방문하는 날만 보는 게 아니에요. 계절과 날씨에 맞춰 <strong>그때 살펴봐야 할 곳</strong>을 미리 문자로 알려 드려요.</p>
      <div className={m.alert} aria-label="알림 예시">
        <div className={m.alertTop}><span>📲 빈집진단서</span><small>알림 예시</small></div>
        <p><strong>송라면 집, 이번 주 금요일 영하 9도 예보예요.</strong><br />수도관이 얼지 않게 물빼기를 확인해 볼까요?</p>
        <div className={m.alertButtons} aria-hidden="true"><span>방문 요청하기</span><span>괜찮아요</span></div>
      </div>
      <ul className={m.seasons}>{SEASONS.map(s => <li key={s.season}><strong>{s.season}</strong>{s.text}</li>)}</ul>
      <p className={m.specialNote}>알림은 모든 상품에 들어가요. 알림을 보고 방문을 요청하시면 옵션 요금으로 다녀와요.</p>
    </div>

    <h3>진행 순서</h3>
    <ol className={m.flow}>{FLOW.map((step, i) => <li key={step}><span>{i + 1}</span>{step}</li>)}</ol>

    <h3>관리 내역</h3>
    <ul className={m.items}>{ITEMS.map(item => <li key={item.title}>
      {item.image ? <Image src={item.image} alt="" width={184} height={144} sizes="92px" /> : <span className={m.itemIcon} aria-hidden="true">{item.icon}</span>}
      <div><strong>{item.title}</strong><span>{item.text}</span></div>
    </li>)}</ul>

    <h3>주택 요금안내</h3>
    <table className={m.price}>
      <thead><tr><th scope="col">상품</th><th scope="col">비용</th></tr></thead>
      <tbody>{PLANS.map(plan => <tr key={plan.name} className={plan.base ? m.base : undefined}><th scope="row">{plan.name}<small>{plan.note}</small></th><td>{won(plan.price)}<small>{plan.unit}</small></td></tr>)}</tbody>
    </table>
    <p className={m.priceNote}>모든 상품에 위 <strong>관리 내역 5가지</strong>가 똑같이 들어가요. 시범 기간 요금이에요.</p>

    <h3>옵션 서비스</h3>
    <table className={m.price}>
      <thead><tr><th scope="col">옵션</th><th scope="col">비용</th></tr></thead>
      <tbody>{OPTIONS.map(o => <tr key={o.name}><th scope="row">{o.name}<small>{o.note}</small></th><td>{o.price === null ? '견적' : won(o.price)}<small>{o.unit}</small></td></tr>)}</tbody>
    </table>

    <h3>비고</h3>
    <ul className={m.remarks}>{REMARKS.map((r, i) => <li key={i}>{r}</li>)}</ul>

    <h3>자주 묻는 질문</h3>
    <div className={m.faq}>{MANAGEMENT_FAQ.map(item => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div>
  </>
}

function ReportPanel() {
  return <>
    <h2>관리보고</h2>
    <p className={m.sub}>다녀온 날마다 이런 보고를 문자로 받아요.</p>
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
    <p className={m.sub}>신청만으로 결제되지 않아요. 전화 상담 후 계약을 확정해요.</p>
    <div className={m.formBox}><ApplyForm /></div>
    <a className={m.call} href={`tel:${PHONE.replaceAll('-', '')}`}>전화로 신청하기 · {PHONE}</a>
    <p className={m.other}>포항·경주가 아닌가요? <Link href="/interest?source=other-region">우리 지역이 열리면 알림 받기 →</Link></p>
    <h3>신청 후 진행</h3>
    <ol className={m.steps}>
      <li><span>1</span><div><strong>전화 상담</strong>집 위치와 크기, 바라는 점을 여쭤보고 상품을 같이 골라요.</div></li>
      <li><span>2</span><div><strong>계약 확정 · 열쇠 인계</strong>계약서를 보내 드리고, 열쇠는 직접 받거나 등기로 받아요.</div></li>
      <li><span>3</span><div><strong>관리비 입금</strong>입금이 확인되면 첫 방문 날짜를 알려 드려요.</div></li>
      <li><span>4</span><div><strong>관리 진행 · 보고</strong>정해진 날 다녀와서 사진 보고서를 보내요. 첫 방문 때는 무료 진단서도 함께 드려요.</div></li>
    </ol>
    <p className={m.partner}>🏡 <strong>동네 관리인을 찾고 있어요.</strong> 이장님처럼 마을 집을 잘 아는 분이라면 <a href={`tel:${PHONE.replaceAll('-', '')}`}>{PHONE}</a>로 연락 주세요.</p>
  </>
}

export function ManagementView() {
  return <div className={m.page}>
    <header className={m.top}>
      <div className={m.topIn}>
        <div className={m.brandRow}><Brand /><span>포항·경주 시범</span></div>
        <div className={m.titleRow}>
          <div><h1>빈집 관리</h1><p>멀리 있는 시골집, 대신 가서 보고<br />날씨에 맞춰 미리 알려 드려요</p></div>
          <Image src="/mascot/binzip-rabbit-report-transparent-v4.png" alt="" width={120} height={120} sizes="96px" priority />
        </div>
      </div>
    </header>
    <main className={m.main}>
      <ManagementTabs panels={{ service: <ServicePanel />, report: <ReportPanel />, apply: <ApplyPanel /> }} />
    </main>
  </div>
}
