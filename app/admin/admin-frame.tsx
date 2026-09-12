import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Brand } from '../home-ui'
import styles from './admin.module.css'

export function AdminFrame({ children, demo = false, navigation }: { children: ReactNode; demo?: boolean; navigation?: ReactNode }) {
  return <div className={styles.shell}>
    <header className={styles.header}>
      <Brand href={demo ? '/admin-preview' : '/admin'} admin />
      <nav aria-label="관리자 메뉴" className={styles.nav}><Link href="/">서비스 홈</Link>{navigation}</nav>
    </header>
    <main className={styles.main}>{children}</main>
  </div>
}

export function AdminTitle() {
  return <div className={styles.titleRow}><div><p className={styles.eyebrow}>한 집씩, 다음 결정을 함께</p><h1 tabIndex={-1} className={styles.title}>추가 확인 신청 관리</h1><p className={styles.description}>고객이 보내준 내용과 사진을 살펴보고, 지금 확인할 일부터 처리하세요.</p></div><Image className={styles.rabbit} src="/mascot/binzip-rabbit-report-transparent-v4.png" alt="" width={88} height={104} /></div>
}
