'use client'
import { forwardRef, useEffect, useState } from 'react'
import { KAKAO_CHAT_URL } from '../contact'
import m from './management.module.css'

/** Seconds before phones hop to the Kakao chat; long enough to read the receipt code. */
const REDIRECT_SECONDS = 6

function isTouchPhone() {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
}

export const ApplySuccess = forwardRef<HTMLDivElement, { message: string; receipt?: string }>(function ApplySuccess({ message, receipt }, ref) {
  const [left, setLeft] = useState<number | null>(null)
  useEffect(() => { if (isTouchPhone()) setLeft(REDIRECT_SECONDS) }, [])
  useEffect(() => {
    if (left === null) return
    if (left <= 0) { window.location.href = KAKAO_CHAT_URL; return }
    const timer = setTimeout(() => setLeft(left - 1), 1000)
    return () => clearTimeout(timer)
  }, [left])

  return <div className={m.success} ref={ref} tabIndex={-1} role="status">
    <strong>신청을 접수했어요</strong>
    <p>{message}</p>
    {receipt && <div className={m.receipt}><span>접수번호</span><b>{receipt}</b></div>}
    <p className={m.successNext}>카카오톡 채팅방에 접수번호를 보내 주시면 담당자가 신청 내용을 바로 확인하고 대화를 이어 갈게요.</p>
    <a className={m.kakao} href={KAKAO_CHAT_URL} target="_blank" rel="noopener noreferrer">카카오톡으로 이어서 상담하기</a>
    {left !== null && <p className={m.redirect}>{left}초 뒤 카카오톡 채팅방으로 이동해요. <button type="button" onClick={() => setLeft(null)}>이동하지 않기</button></p>}
  </div>
})
