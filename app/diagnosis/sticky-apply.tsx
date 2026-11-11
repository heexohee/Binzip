'use client'

import Image from 'next/image'
import { useEffect, useState, type MouseEvent } from 'react'
import s from '../landing.module.css'
import d from './diagnosis.module.css'

const WATCHED = ['hero-cta', 'apply']

/** 첫 화면 신청 버튼과 신청 칸이 모두 안 보일 때만 휴대폰 하단에 신청 버튼을 띄운다. */
export function StickyApply() {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    const targets = WATCHED.map(id => document.getElementById(id)).filter((el): el is HTMLElement => el !== null)
    if (targets.length === 0 || !('IntersectionObserver' in window)) return
    const shown = new Map<Element, boolean>(targets.map(el => [el, true]))
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) shown.set(entry.target, entry.isIntersecting)
      setIsVisible(![...shown.values()].some(Boolean))
    })
    targets.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  function goToApply(event: MouseEvent<HTMLAnchorElement>) {
    const input = document.getElementById('apply-start')
    if (!input) return
    event.preventDefault()
    document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    input.focus({ preventScroll: true })
  }

  if (!isVisible) return null
  return <div className={d.sticky}>
    <Image className={d.stickyBini} src="/mascot/binzip-rabbit-report-transparent-v4.png" alt="" width={52} height={52} />
    <a className={s.button} href="#apply" onClick={goToApply}>무료 진단 신청하기 ↓</a>
  </div>
}
