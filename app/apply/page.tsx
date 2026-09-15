import type { Metadata } from 'next'
import { IntakePreview } from './intake-preview'
import { HomeFooter, HomeHeader, HomeLink } from '../home-ui'
import styles from '../home.module.css'

export const maxDuration = 60
export const metadata: Metadata = { title: '상세 정보 입력 — 빈집진단서', robots: { index: false, follow: false }, referrer: 'no-referrer' }

export default async function ApplyPage({ searchParams }: { searchParams: Promise<{ address?: string | string[] }> }) {
  const params = await searchParams
  const address = typeof params.address === 'string' ? params.address.trim().slice(0, 300) : ''
  return (
    <div className={styles.site}><div className={styles.sheet}>
      <HomeHeader />
      <main>
        <div className={styles.subpageIntro}>
          <HomeLink />
          <p className={styles.eyebrow}>빈집진단서 신청</p>
          <h1>집 이야기를<br />조금만 더 들려주세요.</h1>
          <p>궁금한 내용을 고르면 필요한 질문만 안내해 드려요.</p>
        </div>
        <div className={styles.application}><IntakePreview initialAddress={address} /></div>
      </main>
      <HomeFooter />
    </div></div>
  )
}
