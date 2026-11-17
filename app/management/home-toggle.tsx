'use client'
import { usePathname, useRouter } from 'next/navigation'
import { HOME_TYPES, type HomeType } from '../../src/management'
import m from './management.module.css'

/** Picks which house type the page describes. The choice lives in the URL (?home=apt) so ads can link straight to it. */
export function HomeToggle({ home }: { home: HomeType }) {
  const router = useRouter()
  const pathname = usePathname()
  const hrefFor = (id: HomeType) => (id === 'house' ? pathname : `${pathname}?home=${id}`)
  return <div className={m.homeToggle} role="group" aria-labelledby="home-toggle-label">
    <p id="home-toggle-label">어떤 집인가요?</p>
    <div>{HOME_TYPES.map(t => <a key={t.id} href={hrefFor(t.id)} aria-current={home === t.id ? 'true' : undefined}
      onClick={e => { e.preventDefault(); router.replace(`${hrefFor(t.id)}${location.hash}`, { scroll: false }) }}>
      <strong>{t.label}</strong><small>{t.note}</small>
    </a>)}</div>
  </div>
}
