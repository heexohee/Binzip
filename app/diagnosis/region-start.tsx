import Link from 'next/link'
import { PROVINCES } from '../../src/regions'
import d from './diagnosis.module.css'

/** First question of the application, answered with one tap here; the form opens with the 시·도 already chosen. */
export function RegionStart() {
  return <nav className={d.regionStart} aria-labelledby="region-start-title">
    <p id="region-start-title" className={d.regionQuestion}>집이 있는 시·도를 눌러 주세요</p>
    <ul className={d.regionGrid}>
      {PROVINCES.map((province, i) => <li key={province}>
        <Link id={i === 0 ? 'apply-start' : undefined} href={`/apply?sido=${encodeURIComponent(province)}`}>{province}</Link>
      </li>)}
    </ul>
  </nav>
}
