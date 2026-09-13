'use client'

import { useEffect, useState } from 'react'
import styles from './home.module.css'

const CARDS = [
  { title: '부모님이 살던 시골집, 비워 둔 지 오래됐어요.', lines: ['철거하자니 비용이 부담돼요.', '어떤 지원사업이 있는 지도 잘 모르겠어요.'] },
  { title: '비워 둔 시골집, 팔고 싶은데 맡길 곳이 없어요.', lines: ['매수자를 찾기 어렵고 중개보수가 적다고', '중개사무소에서도 맡기를 꺼려해요.', '매도를 도와줄 공인중개사를 찾고 싶어요.'] },
  { title: '은퇴 후 시골집에 살고 싶어요. 빈집을 대신 살펴봐 줄 사람이 필요해요.', lines: ['멀리 살아서 매번 시골집 상태를 확인하기는 어려워요.', '믿을 수 있는 사람에게 관리를 맡기고 싶어요.'] },
]

export function ConcernCarousel() {
  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(true)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const rotating = !hovered && !focused && !reducedMotion
  useEffect(() => {
    if (!rotating) return
    const timer = window.setInterval(() => setActive(value => (value + 1) % CARDS.length), 6500)
    return () => window.clearInterval(timer)
  }, [rotating, active])

  return <div role="region" aria-roledescription="캐러셀" aria-label="빈집 소유자의 고민 예시"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>
    <div className={styles.concernSlides} aria-live={rotating ? 'off' : 'polite'}>
      {CARDS.map((card, index) => <div key={card.title} className={styles.ownerConcern}
        role="group" aria-roledescription="슬라이드" aria-label={`${index + 1} / ${CARDS.length}`}
        aria-hidden={index !== active}>
        <h3>&quot;{card.title}&quot;</h3>
        {card.lines.map(line => <p key={line}>{line}</p>)}
      </div>)}
    </div>
    <div className={styles.carouselControls}>
      {CARDS.map((_, index) => <button type="button" key={index} aria-label={`${index + 1}번 고민 보기`} aria-pressed={active === index} onClick={() => setActive(index)}><span className={styles.carouselDot} /></button>)}
    </div>
  </div>
}
