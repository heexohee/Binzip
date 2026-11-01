import Image from 'next/image'
import Link from 'next/link'
import { Arrow, HomeHeader } from './home-ui'
import type { Item } from './landing-parts'
import { ShareButton } from './share-button'
import home from './home.module.css'
import s from './landing.module.css'

export const maxDuration = 60

const BEFORE_DECIDING: Item[] = [
  { title: '집과 땅의 주인', text: '집과 땅 주인이 다르거나 상속 정리가 끝나지 않았다면, 팔기·고치기·철거 모두 이것부터 정리해야 해요. 법무사에게 물어보세요.' },
  { title: '달라지는 세금', text: '팔면 양도소득세, 철거하면 재산세가 달라질 수 있어요. 정하기 전에 세무사나 소재지 세무 부서에 확인해요.' },
  { title: '지원사업 조건', text: '수리·철거 지원금은 본인 부담금과 지켜야 할 조건이 있어요. 금액만 보지 말고 최신 공고를 확인해요.' },
]

export default function Home() {
  return <div className={home.site}>
    <a className={s.skipLink} href="#choose-title">서비스 고르기로 건너뛰기</a>
    <div className={home.sheet}>
      <HomeHeader />
      <main className={s.main}>
        <section className={s.hero} aria-labelledby="hero-title">
          <div className={s.heroTop}>
            <div>
              <p className={s.eyebrow}>상속받은 시골 빈집</p>
              <h1 id="hero-title">팔지, 고칠지, 돌볼지.<br />우리 집에 맞는 방법을 찾아보세요.</h1>
            </div>
            <Image src="/mascot/binzip-rabbit-v1.png" alt="" width={256} height={256} className={s.heroRabbit} priority />
          </div>
          <p className={s.heroAudience}>빈집을 물려받았거나 가족의 빈집을 챙기고 있다면, 전국 어디든 함께 정리해 드려요.</p>
          <h2 className={s.chooseTitle} id="choose-title">지금 어떤 고민이세요?</h2>
          <ul className={s.paths} aria-labelledby="choose-title">
            <li><Link className={s.path} href="/diagnosis">
              <span className={s.status}>무료 시범 진단 · 전국</span>
              <p className={s.pathQuote}>“이 집을 어떻게 해야 할지 모르겠어요.”</p>
              <span className={s.pathName}>빈집 진단 알아보기<Arrow /></span>
              <p className={s.pathDesc}>선택지별 비용과 조건을 진단서로 정리해 드려요.</p>
            </Link></li>
            <li><Link className={s.path} href="/management">
              <span className={`${s.status} ${s.statusPending}`}>준비 중 · 의견 받는 중</span>
              <p className={s.pathQuote}>“계속 갖고 있을 건데, 누가 돌봐주죠?”</p>
              <span className={s.pathName}>빈집 관리 알아보기<Arrow /></span>
              <p className={s.pathDesc}>필요한 관리와 적당한 금액을 들려주세요.</p>
            </Link></li>
          </ul>
          <p className={s.pathsNote}>어느 쪽이든 남겨 주신 내용은 담당자가 직접 읽고 연락드려요. 일부 분께는 전화 인터뷰를, 포항·경주에 빈집이 있는 분께는 방문을 따로 여쭤봐요.</p>
        </section>

        <section className={s.reference} aria-labelledby="reference-title">
          <h2 id="reference-title">어떤 선택이든, 결정 전에 확인할 것</h2>
          <ul>{BEFORE_DECIDING.map(item => <li key={item.title}><strong>{item.title}</strong><span>{item.text}</span></li>)}</ul>
          <Link className={s.textLink} href="/resources">공식 지원·정보 모음 보기 →</Link>
        </section>

        <aside className={s.closing} aria-label="가족에게 공유"><ShareButton lead="가족과 같이 정하고 있다면" /></aside>
      </main>
    </div>
  </div>
}
