import Image from 'next/image'
import Link from 'next/link'
import { Arrow, HomeHeader } from '../home-ui'
import { ShareButton } from '../share-button'
import { Gets, type Item, PHONE, Steps } from '../landing-parts'
import home from '../home.module.css'
import s from '../landing.module.css'

export const metadata = { title: '빈집 관리 | 빈집진단서' }

const PLANS: Item[] = [
  { title: '정기 방문', text: '한 달에 한 번 집 안팎을 둘러봐요. 창문을 열어 환기하고, 곰팡이나 물이 새는 곳이 없는지도 확인해요.' },
  { title: '사진과 메모', text: '다녀온 뒤 사진과 메모로 집 상태를 알려드려요.' },
  { title: '필요한 작업 확인', text: '제초나 수리가 필요하면 범위와 비용을 알려드려요. (작업비는 따로 발생해요.)' },
]

const REPORT_SKETCH: Item[] = [
  { title: '다녀온 날', text: '방문 날짜와 머문 시간' },
  { title: '바깥 상태 사진', text: '지붕·담장·마당·대문을 같은 자리에서 찍어 지난번과 비교' },
  { title: '집 안 상태', text: '“환기했어요 · 곰팡이·누수는 보이지 않았어요” 같은 확인 결과' },
  { title: '눈에 띈 점', text: '“마당 풀이 무릎 높이까지 자랐어요” 같은 짧은 메모' },
  { title: '필요해 보이는 일', text: '제초·배수로 정리처럼 맡길지 고를 수 있는 작업과 예상 범위' },
]

const STEPS: Item[] = [
  { title: '필요한 관리와 희망 가격을 골라요', text: '집이 있는 시·군만 알려주시면 돼요. 정확한 번지는 필요 없어요.' },
  { title: '전화번호를 남겨요', text: '담당자가 응답을 확인하고 연락드리기 위해 필요해요.' },
  { title: '담당자가 연락드려요', text: '남겨주신 내용을 확인하고, 궁금한 점이 있으면 전화로 설명드려요.' },
  { title: '일부 분과는 인터뷰나 시범 방문을 해요', text: '20분 통화 인터뷰에 참여하시면 소정의 감사 선물을 드려요. 포항·경주에서는 일부 분의 집에 실제로 방문해 관리를 시범으로 해 봐요. 인원이 정해져 있어 연락드린 분과 진행해요.' },
]

export default function Management() {
  return <div className={home.site}><div className={home.sheet}><HomeHeader />
    <main className={`${s.service} ${s.management}`}>
      <Link className={s.back} href="/">← 처음으로</Link>
      <div className={s.chips}><span className={s.chip}>빈집 관리</span><span className={`${s.status} ${s.statusPending}`}>서비스 준비 중 · 의견 조사</span></div>
      <div className={s.serviceHead}>
        <div><p className={s.quote}>“계속 갖고 있을 건데, 멀어서 직접 챙기기 어려워요.”</p>
        <h1>지금 팔지 않아도,<br />집을 돌볼 방법은 있어요</h1></div>
        <Image className={s.serviceRabbit} src="/mascot/binzip-rabbit-v1.png" alt="" width={160} height={160} sizes="(max-width: 600px) 96px, 160px" priority />
      </div>
      <p className={s.lead}>멀리 사는 소유자를 위한 빈집 관리를 준비하고 있어요. 어떤 관리가 필요한지, 적당한 금액은 얼마인지 의견을 듣고 있어요. 일부 분과는 인터뷰나 시범 방문도 해요.</p>
      <div className={s.heroActions}>
        <Link className={s.button} href="/interest">관리 서비스 의견 남기기<Arrow /></Link>
      </div>

      <div className={s.block}>
        <h2 className={s.blockTitle}><span className={s.blockMark} aria-hidden="true">🛠️</span>준비 중인 관리</h2>
        <Gets items={PLANS} planned />
        <p className={s.notice}>위 내용은 검토 중인 관리 예시예요. 지금은 정기 관리를 제공하지 않고, 방문 범위·요금·지역도 정해지지 않았어요. 시범 방문은 포항·경주부터 해요.</p>
      </div>

      <div className={s.block}>
        <h2 className={s.blockTitle}><span className={s.blockMark} aria-hidden="true">📮</span>방문 후 받게 될 소식 (예시)</h2>
        <p className={s.blockLead}>다녀온 뒤 이런 내용을 보내드리려고 해요. 의견을 듣고 바꿀 수 있어요.</p>
        <dl className={`${s.facts} ${s.sketch}`}>{REPORT_SKETCH.map(item => <div key={item.title}><dt>{item.title}</dt><dd>{item.text}</dd></div>)}</dl>
      </div>

      <div className={s.block}>
        <h2 className={s.blockTitle}><span className={s.blockMark} aria-hidden="true">💬</span>의견을 남기면</h2>
        <Steps items={STEPS} />
      </div>

      <div className={s.cta}>
        <Link className={s.button} href="/interest">관리 서비스 의견 남기기<Arrow /></Link>
        <p className={s.ctaNote}>몇 가지 질문에 답하고 연락처를 남기는 설문이에요. 신청·결제·계약이 아니고, 방문이 예약되지도 않아요.</p>
        <div className={s.contact}><a href={`tel:${PHONE.replaceAll('-', '')}`}>전화로 물어보기 · {PHONE}</a></div>
      </div>

      <aside className={s.closing} aria-label="다른 서비스와 공유">
        <Link className={s.tile} href="/diagnosis"><span className={s.tileIcon} aria-hidden="true">📋</span><small>팔지, 고칠지 아직 정하지 못했다면</small><strong>빈집 진단 알아보기 →</strong></Link>
        <ShareButton lead="가족과 같이 정하고 있다면" />
      </aside>
    </main>
  </div></div>
}
