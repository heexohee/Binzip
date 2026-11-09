import Image from 'next/image'
import Link from 'next/link'
import { HomeHeader } from '../home-ui'
import { AddressStartForm } from '../address-start-form'
import { ShareButton } from '../share-button'
import { Facts, type Item, kakaoChannel, PHONE, Steps } from '../landing-parts'
import home from '../home.module.css'
import s from '../landing.module.css'
import d from './diagnosis.module.css'
import { StickyApply } from './sticky-apply'

export const metadata = { title: '빈집 진단 | 빈집진단서' }

const WORRIES = [
  '철거하면 비용이 얼마나 들지 모르겠어요.',
  '고쳐서 쓸 수 있는 집인지 궁금해요.',
  '팔고 싶은데 어디부터 알아봐야 할지 모르겠어요.',
  '받을 수 있는 지원사업이 있는지 알고 싶어요.',
]

const OPTIONS = [
  { icon: '⚖️', title: '선택지 비교', text: '팔기·고치기·철거·그대로 두기의 비용과 할 일을 한눈에 비교해요' },
  { icon: '🏛️', title: '지역 지원사업', text: '집이 있는 지역에서 알아볼 만한 사업과 문의처를 정리해요' },
  { icon: '✍️', title: '담당자 의견', text: '보내 주신 사진과 자료를 담당자가 직접 보고 적어요' },
]

// 예시 카드의 상대 비교(3칸 중 몇 칸). 실제 금액은 예시 진단서 페이지에서 보여 준다.
const SAMPLE: [string, number, number][] = [['팔기', 2, 3], ['고치기', 3, 2], ['철거', 2, 1]]
const LEVEL = ['', '적음', '보통', '많음']
const dots = (n: number) => '●'.repeat(n) + '○'.repeat(3 - n)

const STEPS: Item[] = [
  { title: '주소 확인 뒤 신청서 4단계', text: '집 상태 · 궁금한 내용 · 연락처를 남기고 확인한 뒤 제출해요.' },
  { title: '7일 안에 진행 여부를 알려드려요', text: '신청 내용을 살펴본 뒤, 진단을 진행할 수 있는지와 예상 시기를 문자나 메일로 알려드려요.' },
  { title: '일부 분과는 인터뷰하고 집에 가 봐요', text: '인터뷰·방문 연락에 동의하신 분 중 일부께 20분 전화 인터뷰를 요청하고, 마친 분께 모바일 상품권을 드려요. 포항·경주에서는 그중 몇 분께 따로 연락드려 집을 직접 방문해 무료로 진단해 드려요. 신청만으로 인터뷰·방문이 정해지지는 않아요.' },
  { title: '진단서를 받아요', text: '담당자가 직접 검토한 결과를 보내드려요. 받아보신 뒤 소감을 들려주세요.' },
]

const FACTS: Item[] = [
  { title: '누가 참여할 수 있나요', text: '빈집이 있는 소유자와 가족이라면 전국 어디든 신청할 수 있어요. 지금 사는 곳도 상관없어요.' },
  { title: '담당자가 살펴보고 보내드려요', text: '건물·땅 자료와 주변 거래는 시스템으로 바로 찾아요. 그다음 담당자가 보내주신 사진과 함께 살펴보고 진단서를 써요. 그래서 며칠 걸릴 수 있어요.' },
  { title: '비용', text: '진단서와 시범 방문 모두 무료예요. 방문은 인원이 정해져 있어 연락드린 분과만 진행해요.' },
  { title: '지역에 따라 다른 점', text: '건축물·토지 정보와 선택지 비교는 어느 지역이든 같아요. 지원사업은 포항부터 정리하고 있어서 다른 지역은 확인할 곳을 안내해 드려요.' },
  { title: '진단서로 할 수 있는 것과 없는 것', text: '진단서는 공공자료와 보내주신 사진으로 선택지를 비교하고, 누구에게 무엇을 물어볼지 정리해 드려요. 법률·세금·건물 안전을 판단하거나 실제 팔릴 가격과 공사비를 확정해 드리지는 않아요. 진단서에 적힌 예상 금액을 바탕으로 전문가에게 확인해 주세요.' },
]

const BINI = '/mascot/binzip-rabbit-report-transparent-v4.png'

export default function Diagnosis() {
  const kakao = kakaoChannel()
  return <div className={home.site}><div className={home.sheet}><HomeHeader />
    <main className={`${s.service} ${s.diagnosis}`}>
      <div className={d.hero}>
        <Image className={d.photo} src="/diagnosis/rural-house.jpg" alt="오래 비어 있는 시골 기와집" width={752} height={480} sizes="(max-width: 760px) 100vw, 720px" priority />
        <span className={d.bubble} aria-hidden="true">같이 정리해 봐요!</span>
        <Image className={d.bini} src={BINI} alt="" width={120} height={120} priority />
      </div>

      <h1 className={d.title}>상속받은 시골집,<br />계속 비워 두고 계신가요?</h1>
      <p className={d.lead}>팔지, 고칠지, 철거할지. <strong>우리 집에 맞는 선택지를 진단서로 정리해 드려요.</strong> 지금은 무료 시범 진단이에요.</p>
      <a id="hero-cta" className={`${s.button} ${d.cta}`} href="#apply">무료 진단 신청하기 ↓</a>
      <p className={d.who}>부모님 집을 대신 알아보는 자녀분도 신청할 수 있어요</p>

      <section className={d.section} aria-labelledby="worries-title">
        <p className={d.kicker}>① 이런 고민</p>
        <h2 id="worries-title">이런 고민이 있으신가요?</h2>
        <ul className={d.worries}>{WORRIES.map(text => <li key={text}><span className={d.check} aria-hidden="true">✓</span>{text}</li>)}</ul>
      </section>

      <section className={d.section} aria-labelledby="options-title">
        <p className={d.kicker}>② 해결 방법</p>
        <h2 id="options-title">진단서에 이렇게 정리돼요</h2>
        <ul className={d.options}>{OPTIONS.map(item => <li key={item.title}><span className={d.icon} aria-hidden="true">{item.icon}</span><div><strong>{item.title}</strong><span>{item.text}</span></div></li>)}</ul>
      </section>

      <section className={d.section} aria-labelledby="sample-title">
        <p className={d.kicker}>③ 진단 예시</p>
        <h2 id="sample-title">예시 진단서를 미리 볼 수 있어요</h2>
        <div className={d.sample}>
          <span className={d.sampleTag}>예시 진단서</span>
          <h3>경북 ○○군 단독주택</h3>
          <table>
            <thead><tr><td /><th scope="col">드는 돈</th><th scope="col">걸리는 시간</th></tr></thead>
            <tbody>{SAMPLE.map(([name, cost, time]) => <tr key={name}><th scope="row">{name}</th><td aria-label={LEVEL[cost]}>{dots(cost)}</td><td aria-label={LEVEL[time]}>{dots(time)}</td></tr>)}</tbody>
          </table>
          <p className={d.memo}>✍️ 담당자 의견: “지붕 상태를 먼저 확인해 보시고, 군청 빈집 정비 사업도 알아볼 만해요.”</p>
          <Image className={d.sampleBini} src={BINI} alt="" width={84} height={84} />
        </div>
        <Link className={d.more} href="/example-report">예시 진단서 전체 보기 →</Link>
      </section>

      <section className={`${s.apply} ${d.section}`} id="apply" aria-labelledby="apply-title">
        <p className={d.kicker}>④ 무료 진단 신청</p>
        <h2 id="apply-title">집 주소로 시작해요</h2>
        <p>지번이나 도로명 주소, 아는 만큼만 넣어 주세요.</p>
        <AddressStartForm />
        <div className={s.contact}>
          <a href={`tel:${PHONE.replaceAll('-', '')}`}>주소를 모르면 전화로 물어보기 · <span className={s.nowrap}>{PHONE}</span></a>
          {kakao && <a href={kakao} target="_blank" rel="noopener noreferrer">카카오톡 채널로 문의하기</a>}
        </div>
      </section>

      <div className={s.block}>
        <h2 className={s.blockTitle}><span className={s.blockMark} aria-hidden="true">🧭</span>신청하면 이렇게 진행돼요</h2>
        <Steps items={STEPS} />
      </div>

      <div className={s.block}>
        <h2 className={s.blockTitle}><span className={s.blockMark} aria-hidden="true">💡</span>미리 알아두세요</h2>
        <Facts items={FACTS} />
      </div>

      <aside className={s.closing} aria-label="다른 서비스와 공유">
        <Link className={s.tile} href="/management"><span className={s.tileIcon} aria-hidden="true">🏡</span><small>팔 생각은 없고 관리가 고민이라면</small><strong>빈집 관리 알아보기 →</strong></Link>
        <ShareButton lead="가족과 같이 정하고 있다면" />
      </aside>
      <div className={d.spacer} aria-hidden="true" />
    </main>
    <StickyApply />
  </div></div>
}
