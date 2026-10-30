import Image from 'next/image'
import Link from 'next/link'
import { Arrow, HomeHeader } from './home-ui'
import type { Item } from './landing-parts'
import { ShareButton } from './share-button'
import home from './home.module.css'
import s from './landing.module.css'

export const maxDuration = 60

const BEFORE_DECIDING: Item[] = [
  { title: '철거 후 세금', text: '철거 전후 재산세가 어떻게 달라지는지 소재지 세무 부서에 확인해요.' },
  { title: '지원 조건과 남는 비용', text: '지원액만이 아니라 본인 부담과 철거 후 땅 사용 조건을 최신 공고로 확인해요.' },
  { title: '집과 땅의 소유 관계', text: '소유자가 다르거나 상속 정리가 끝나지 않았다면 전문가 확인이 먼저예요.' },
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
              <span className={s.status}>무료 시범 참여 모집 · 전국</span>
              <p className={s.pathQuote}>“이 집을 어떻게 해야 할지 모르겠어요.”</p>
              <span className={s.pathName}>빈집 진단 알아보기<Arrow /></span>
              <p className={s.pathDesc}>선택지별 비용과 조건을 진단서로 정리해 드려요.</p>
            </Link></li>
            <li><Link className={s.path} href="/management">
              <span className={`${s.status} ${s.statusPending}`}>서비스 준비 중</span>
              <p className={s.pathQuote}>“계속 갖고 있을 건데, 누가 돌봐주죠?”</p>
              <span className={s.pathName}>빈집 관리 알아보기<Arrow /></span>
              <p className={s.pathDesc}>전국 어디서든 어떤 관리가 필요한지 의견을 들려주세요.</p>
            </Link></li>
          </ul>
          <ShareButton />
        </section>

        <section className={s.reference} aria-labelledby="reference-title">
          <h2 id="reference-title">어떤 선택이든, 결정 전에 확인할 것</h2>
          <ul>{BEFORE_DECIDING.map(item => <li key={item.title}><strong>{item.title}</strong><span>{item.text}</span></li>)}</ul>
          <Link className={s.textLink} href="/resources">공식 지원·정보 모음 보기 →</Link>
        </section>
      </main>
    </div>
  </div>
}
