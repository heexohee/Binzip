import Image from 'next/image'
import Link from 'next/link'
import styles from './home.module.css'
import ui from './ui.module.css'

export function Arrow() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export function Icon({ name }: { name: 'house' | 'document' | 'pin' | 'search' | 'check' }) {
  const paths = {
    house: 'M3 11 12 3l9 8M5 10v10h5v-6h4v6h5V10',
    document: 'M7 3h7l5 5v13H5V3h2m7 0v6h5M8 13h8m-8 4h6',
    pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    search: 'M16.5 16.5 21 21M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0',
    check: 'm5 12 4 4L19 6',
  }
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={paths[name]} stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export function LogoMark() {
  return <Image src="/brand/binzip-house-logo-b-3d-v2.png" alt="" width={40} height={40} sizes="40px" className={styles.brandMark} />
}

export function Brand({ href = '/', admin = false }: { href?: string; admin?: boolean }) {
  return <Link href={href} className={ui.brand}><LogoMark />빈집진단서{admin && <small>관리자</small>}</Link>
}

export function HomeHeader() {
  return <header className={styles.header}><Brand /></header>
}

export function HomeLink() {
  return <Link href="/" className={styles.returnHome}><Arrow />홈으로</Link>
}

export function HomeFooter() {
  return <footer className={styles.footer}><Link href="/" className={styles.footerBrand}>빈집진단서</Link><p>빈집을 진단하고 다음 결정을 도와요.</p><p className={styles.disclaimer}>공적 자료와 확인 내용을 정리하는 참고 자료예요. 구조 안전, 세금·법률의 최종 판단이나 거래·공사 견적을 보증하지 않아요.</p><div className={styles.footerLinks}><Link href="/resources">빈집 지원·정보 모음</Link><Link href="/privacy">개인정보 처리방침</Link><a href="tel:01074282624">전화 문의</a><a href="mailto:rsoy2918@gmail.com">이메일 문의</a></div><p className={styles.operator}>정소희 · 경북 포항시 남구<br />010-7428-2624 · 평일 09:00–18:00</p></footer>
}
