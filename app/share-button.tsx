'use client'
import { useState } from 'react'
import s from './landing.module.css'

const SHARE_SOURCE = 'family-share'

/** Siblings often decide on an inherited house together, so sharing is aimed at family. The link carries only a source tag. */
export function ShareButton({ lead }: { lead?: string }) {
  const [status, setStatus] = useState('')
  async function share() {
    const url = new URL(location.pathname, location.origin)
    url.searchParams.set('utm_source', SHARE_SOURCE)
    const data = { title: document.title, text: '우리 빈집 어떻게 할지 같이 보자', url: url.toString() }
    try {
      if (navigator.share) { await navigator.share(data); return }
      await navigator.clipboard.writeText(data.url)
      setStatus('링크를 복사했어요. 가족 단톡방에 붙여 넣어 주세요.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setStatus('링크를 복사하지 못했어요. 주소창의 주소를 복사해 보내 주세요.')
    }
  }
  return <div className={s.share}>{lead && <p>{lead}</p>}<button type="button" onClick={share}>가족에게 이 페이지 보내기</button><span role="status">{status}</span></div>
}
