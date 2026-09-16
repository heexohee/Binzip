import Link from 'next/link'
import { HomeHeader } from '../home-ui'
import s from './connection.module.css'
export function ConnectionHeader({ expert = false }: { expert?: boolean }) {
  return <HomeHeader>{expert && <Link href="/experts">상담 업무 목록</Link>}</HomeHeader>
}
export function PropertyCard() {
  return <section className={s.property}><span className={s.house} aria-hidden="true">⌂</span><div><strong>호미곶 시골집</strong><p>포항시 남구 호미곶면 · 주택 66㎡</p></div><Link href="/example-report">진단서 보기 ↗</Link></section>
}
