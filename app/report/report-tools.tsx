'use client'

import { useEffect, useState } from 'react'
import styles from './report.module.css'

export function CopyQuestion({ text }: { text: string }) {
  const [status, setStatus] = useState('')
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setStatus('질문을 복사했어요.') }
    catch { setStatus('자동 복사가 안 돼요. 위 질문을 선택해서 복사해 주세요.') }
  }
  return <div className={styles.copyRow}><button type="button" onClick={copy}>질문 복사</button><span role="status">{status}</span></div>
}

export function ReportTools() {
  useEffect(() => {
    let closed: HTMLDetailsElement[] = []
    const expand = () => {
      if (closed.length) return
      closed = Array.from(document.querySelectorAll<HTMLDetailsElement>('[data-report] details:not([open])'))
      closed.forEach(detail => { detail.open = true })
    }
    const restore = () => { closed.forEach(detail => { detail.open = false }); closed = [] }
    window.addEventListener('beforeprint', expand)
    window.addEventListener('afterprint', restore)
    return () => { restore(); window.removeEventListener('beforeprint', expand); window.removeEventListener('afterprint', restore) }
  }, [])
  return <button type="button" className={styles.printButton} onClick={() => window.print()}>인쇄 / PDF</button>
}
