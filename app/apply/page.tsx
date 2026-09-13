import type { Metadata } from 'next'
import { ApplyForm } from '../apply-form'
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
          <p className={styles.eyebrow}>2 · 상세 정보 입력</p>
          <h1>집 이야기를<br />조금만 더 들려주세요.</h1>
          <p>집 상태와 소유관계, 사진을 아는 만큼 남겨 주세요.<br />확인 범위와 일정을 안내할 연락처·이메일은 꼭 필요해요. 현재 신청은 무료예요.</p>
        </div>
        <div className={styles.application}><ApplyForm initialAddress={address} /></div>
      </main>
      <HomeFooter />
    </div></div>
  )
}
