import Image from 'next/image'
import Link from 'next/link'
import s from './connection.module.css'
export function ConnectionHeader({ expert = false }: { expert?: boolean }) {
  return <header className={s.header}><Link className={s.brand} href="/"><Image src="/brand/binzip-house-logo-b-3d-v2.png" alt="" width={42} height={42}/>빈집진단서</Link><Link href={expert ? '/experts' : '/example-report#consultation'}>{expert ? '상담 업무 목록' : '진단서·상담 요청'}</Link></header>
}
export function PropertyCard() {
  return <section className={s.property}><span className={s.house} aria-hidden="true">⌂</span><div><strong>호미곶 시골집</strong><p>포항시 남구 호미곶면 · 주택 66㎡</p></div><Link href="/example-report">진단서 보기 ↗</Link></section>
}
