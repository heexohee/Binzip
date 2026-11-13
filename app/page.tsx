import Image from 'next/image'
import Link from 'next/link'
import { Arrow, HomeHeader } from './home-ui'
import type { Item } from './landing-parts'
import { ShareButton } from './share-button'
import home from './home.module.css'
import s from './landing.module.css'
import { pageMetadata, SITE_DESCRIPTION } from '../src/seo'

export const metadata = pageMetadata({
  path: '/',
  title: '빈집진단서 — 시골 빈집 관리 대행, 방문 점검·사진 보고',
  description: SITE_DESCRIPTION,
})

export const maxDuration = 60

const BEFORE_DECIDING: Item[] = [
  { title: '집과 땅의 주인', text: '집과 땅의 주인이나 상속 정리 상태에 따라 팔기·고치기·철거 전에 확인할 일이 달라져요. 등기 절차는 법무사에게, 다툼이나 권리 판단은 변호사에게 물어보세요.' },
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
              <p className={s.eyebrow}>빈집 관리 대행</p>
              <h1 id="hero-title">멀리 있는 시골집,<br />대신 가서 보고 알려 드려요.</h1>
            </div>
            <Image src="/mascot/binzip-rabbit-v1.png" alt="" width={256} height={256} className={s.heroRabbit} priority />
          </div>
          <p className={s.heroAudience}>열쇠를 맡기면 집 안팎을 점검하고 사진 보고서를 보내 드려요. 계절과 날씨에 맞춰 살펴볼 곳도 미리 알려 드려요.</p>
          <h2 className={s.chooseTitle} id="choose-title">지금 어떤 고민이세요?</h2>
          <ul className={s.paths} aria-labelledby="choose-title">
            <li><Link className={s.path} href="/management">
              <span className={s.status}>포항·경주 시범 · 월 1회 55,000원</span>
              <p className={s.pathQuote}>“멀어서 자주 못 가요. 누가 대신 봐 주면 좋겠어요.”</p>
              <span className={s.pathName}>빈집 관리 서비스·요금 보기<Arrow /></span>
              <p className={s.pathDesc}>집 안팎 점검, 환기, 누수 확인, 우편물 수거, 사진 보고서.</p>
            </Link></li>
            <li><Link className={s.path} href="/apply">
              <span className={`${s.status} ${s.statusPending}`}>무료 · 전국</span>
              <p className={s.pathQuote}>“이 집을 어떻게 해야 할지 모르겠어요.”</p>
              <span className={s.pathName}>무료 진단 신청하기<Arrow /></span>
              <p className={s.pathDesc}>팔기·고치기·그대로 두기의 비용과 조건을 진단서로 정리해 드려요.</p>
            </Link></li>
          </ul>
          <p className={s.pathsNote}>어느 쪽이든 남겨 주신 내용은 담당자가 직접 읽고 전화로 연락드려요. 신청만으로 결제되지 않아요.</p>
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
