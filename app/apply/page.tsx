import type { Metadata } from 'next'
import Image from 'next/image'
import { IntakePreview } from './intake-preview'
import { HomeHeader, HomeLink } from '../home-ui'
import styles from '../home.module.css'
import intro from './page.module.css'

export const maxDuration = 60
export const metadata: Metadata = { title: '신청서 작성 — 빈집진단서', robots: { index: false, follow: false }, referrer: 'no-referrer' }

export default async function ApplyPage({ searchParams }: { searchParams: Promise<{ address?: string | string[] }> }) {
  const params = await searchParams
  const address = typeof params.address === 'string' ? params.address.trim().slice(0, 300) : ''
  return (
    <div className={styles.site}><div className={styles.sheet}>
      <HomeHeader />
      <main>
        <div className={styles.subpageIntro}>
          <HomeLink />
          <p className={styles.eyebrow}>빈집진단서 신청서 작성</p>
          <div className={intro.hero}>
            <h1>집에 대한 정보를<br />조금 더 알려주세요.</h1>
            <p className={intro.note}>아는 만큼만 알려주세요.<br />궁금한 내용에 맞춰 필요한 질문을 안내해 드려요.</p>
            <Image src="/mascot/binzip-rabbit-report-transparent-v4.png" alt="" width={168} height={202} sizes="(max-width: 600px) 104px, 168px" priority className={intro.rabbit} />
          </div>
        </div>
        <div className={styles.application}><IntakePreview initialAddress={address} /></div>
      </main>

    </div></div>
  )
}
