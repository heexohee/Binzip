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
  return <footer className={styles.footer}>
    <div className={styles.footerHeader}>
      <Link href="/" className={styles.footerBrand}>빈집진단서</Link>
      <nav className={styles.footerLinks} aria-label="하단 서비스 메뉴">
        <Link href="/#address-search">무료 진단 신청</Link>
        <Link href="/example-report">진단서 보기</Link>
        <Link href="/resources">빈집 지원·정보 모음</Link>
        <Link href="/privacy">개인정보 처리방침</Link>
      </nav>
    </div>
    <div className={styles.footerSection}>
      <h2>운영자 정보</h2>
      <dl className={styles.operatorDetails}>
        <div><dt>서비스명</dt><dd>빈집진단서</dd></div>
        <div><dt>운영자</dt><dd>정소희</dd></div>
        <div><dt>활동 지역</dt><dd>경북 포항시 남구</dd></div>
        <div><dt>전화 문의</dt><dd><a href="tel:01074282624">010-7428-2624</a></dd></div>
        <div><dt>이메일 문의</dt><dd><a href="mailto:rsoy2918@gmail.com">rsoy2918@gmail.com</a></dd></div>
        <div><dt>문의 시간</dt><dd>평일 09:00–18:00</dd></div>
      </dl>
    </div>
    <div className={styles.footerSection}>
      <h2>진단서 이용 안내</h2>
      <p>현재 진단 신청은 무료입니다. 주소와 위치를 확인한 뒤 집 상태·소유관계와 사진을 보내주시면, 담당자가 확인 범위와 일정을 안내하고 검토한 진단서를 이메일로 보내드립니다. 사진은 선택 사항입니다.</p>
      <p className={styles.disclaimer}>진단서는 공적 자료와 확인 내용을 정리한 참고 자료입니다. 구조 안전, 세금·법률의 최종 판단이나 거래·공사 견적을 보증하지 않습니다. 지원사업의 선정 여부와 본인 부담은 담당 기관에 확인해야 합니다.</p>
    </div>
    <p className={styles.copyright}>© {new Date().getFullYear()} 빈집진단서</p>
  </footer>
}
