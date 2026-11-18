'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { CONSENT_KEY, MEASUREMENT_ID, contactMethod, safeCampaign, safePage, trackEvent } from '../src/web-analytics'
import s from './site-analytics.module.css'
export function SiteAnalytics() {
 const path=usePathname()
 const [consent,setConsent]=useState<string|null>(null)
 const [loaded,setLoaded]=useState(false)
 const last=useRef('')
 const initialized=useRef(false)
 const eligible=Boolean(safePage(path))
 useEffect(()=>{ try {setConsent(localStorage.getItem(CONSENT_KEY))} catch {} },[])
 useEffect(()=>{
  const flags=window as unknown as Record<string,unknown>
  flags[`ga-disable-${MEASUREMENT_ID}`]=!eligible || consent!=='granted'
  if(!eligible || consent!=='granted' || initialized.current) return
  initialized.current=true
  window.dataLayer=window.dataLayer||[]
  window.gtag=window.gtag||function(){window.dataLayer!.push(arguments)}
  window.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'})
  window.gtag('js',new Date())
  window.gtag('config',MEASUREMENT_ID,{send_page_view:false,page_location:safePage(path),page_referrer:'',page_title:path,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_expires:60*60*24*60,cookie_update:false})
  const script=document.createElement('script'); script.src=`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`; script.async=true
  script.onload=()=>setLoaded(true); document.head.appendChild(script)
 // Initialize once per consent choice; page changes are handled below.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[consent,eligible])
 useEffect(()=>{
  if(!loaded || consent!=='granted' || !eligible || last.current===path) return
  last.current=path
  const campaign=safeCampaign(location.search)
  const query=new URLSearchParams(campaign).toString()
  const url=safePage(path)+(query?`?${query}`:'')
  window.gtag?.('set',{page_location:url,page_title:path,page_referrer:''})
  window.gtag?.('event','page_view',{send_to:MEASUREMENT_ID,page_location:url,page_title:path,page_referrer:''})
 },[loaded,consent,eligible,path])
 // Delegated listeners: contact links live in server components, and only fixed labels are sent.
 useEffect(()=>{
  if(!loaded || consent!=='granted') return
  let addressStarted=false
  const onClick=(e:MouseEvent)=>{
   const link=(e.target as Element|null)?.closest?.('a[href]')
   const method=link ? contactMethod(link.getAttribute('href') ?? '') : null
   if(method) trackEvent('contact_click',{method})
  }
  const onInput=(e:Event)=>{
   if(addressStarted || (e.target as HTMLElement|null)?.id!=='home-address') return
   addressStarted=true
   trackEvent('address_start',{form_id:'diagnosis'})
  }
  document.addEventListener('click',onClick,true)
  document.addEventListener('input',onInput,true)
  return ()=>{document.removeEventListener('click',onClick,true);document.removeEventListener('input',onInput,true)}
 },[loaded,consent])
 function choose(value:string){try{localStorage.setItem(CONSENT_KEY,value)}catch{} setConsent(value)}
 function reset(){
  try{localStorage.removeItem(CONSENT_KEY)}catch{}
  // Stop GA first; otherwise it rewrites its session cookie between the delete and the reload.
  ;(window as unknown as Record<string,unknown>)[`ga-disable-${MEASUREMENT_ID}`]=true
  window.gtag?.('consent','update',{analytics_storage:'denied'})
  for(const item of document.cookie.split(';')) {const name=item.split('=')[0]?.trim(); if(!name?.startsWith('_ga'))continue; for(const domain of ['',`; domain=${location.hostname}`,'; domain=.binzipcare.kr'])document.cookie=`${name}=; Max-Age=0; path=/${domain}`}
  location.reload()
 }
 if(!eligible)return null
 return <>{consent===null && <aside className={s.banner} aria-label="방문 통계 선택"><strong>방문 통계 수집에 동의하시나요?</strong><p><span className={s.detail}>동의하면 Google Analytics가 쿠키로 방문·신청 완료를 측정해요. 주소·연락처·답변·사진은 보내지 않아요. </span>거절해도 신청할 수 있어요. <a href="/privacy#privacy-6">수집 항목·국외 처리 안내</a></p><div><button onClick={()=>choose('denied')}>동의하지 않음</button><button onClick={()=>choose('granted')}>분석에 동의</button></div></aside>}{consent!==null && <div className={s.settings}><button onClick={reset}>방문 통계 동의 변경</button></div>}</>
}
