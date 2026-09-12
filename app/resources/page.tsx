import type { Metadata } from 'next'
import Link from 'next/link'
import { HomeFooter, HomeHeader, HomeLink, Arrow } from '../home-ui'
import { OFFICIAL_RESOURCES, RESOURCE_CHECKED_AT, RESOURCE_GROUPS } from '../../src/official-resources'
import home from '../home.module.css'
import styles from './resources.module.css'

export const metadata: Metadata = { title: '빈집 지원·정보 모음 — 빈집진단서', description: '빈집애, 그린대로, 포항시 지원 공고와 서류·법령을 필요한 일에 맞춰 찾아보세요.' }

export default function ResourcesPage() {
  return <div className={home.site}><div className={home.sheet}><HomeHeader /><main className={styles.main}>
    <HomeLink />
    <p className={home.eyebrow}>필요한 정보를, 필요한 순간에</p><h1>빈집 지원·정보 모음</h1><p className={styles.intro}>빈집을 팔거나 철거하기 전, 어디에 무엇을 물어봐야 할까요?<br />공식 사이트와 확인할 내용을 함께 모았어요.</p>
    <p className={styles.notice}>빈집진단서가 정리한 공식 사이트 안내예요. 각 기관과의 제휴·대행 서비스는 아니며, 신청 자격과 접수 상태는 해당 기관에서 확인해 주세요.</p>
    <nav className={styles.nav} aria-label="공식 정보 분류">{RESOURCE_GROUPS.map(group => <a key={group.id} href={`#${group.id}`}>{group.label}</a>)}</nav>
    {RESOURCE_GROUPS.map(group => <section key={group.id} id={group.id} className={styles.group} aria-labelledby={`${group.id}-title`}><h2 id={`${group.id}-title`}>{group.label}</h2><p className={styles.groupIntro}>{group.description}</p><div className={styles.cards}>{OFFICIAL_RESOURCES.filter(resource => resource.group === group.id).map(resource => <article key={resource.id} id={resource.id} className={styles.card}>
      <p className={styles.provider}>{resource.name} · {resource.operator}</p><h3>{resource.title}</h3><p>{resource.description}</p>
      <details><summary>가기 전에 알아두세요</summary><p>{resource.before}</p></details>
      <a className={styles.external} href={resource.href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{resource.linkLabel}<span aria-hidden="true">↗</span><span className="sr-only"> (새 창)</span></a>
    </article>)}</div>{group.id === 'pohang' && <Link className={styles.supportLink} href="/example-report#support-title">지원 조건이 보고서에 어떻게 나오는지 보기<Arrow /></Link>}</section>)}
    <p className={styles.checked}>사이트와 안내 내용 확인: {RESOURCE_CHECKED_AT}<br />실시간 공고 수집 결과는 아니에요. 신청·계약 전에는 공식 페이지의 최신 공고를 확인해 주세요.</p>
    <aside className={styles.bottom}><h2>내 집에서는 무엇부터 확인할까요?</h2><p>주소와 알고 있는 내용을 남기면, 집의 기록과 다음 할 일을 정리해요.</p><Link href="/#address-search" className={home.primary}>내 빈집 진단 시작하기<Arrow /></Link></aside>
  </main><HomeFooter /></div></div>
}
