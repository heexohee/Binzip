'use client'
import {useEffect} from 'react'
import {safeUtmContent} from '../src/web-analytics'
/** Only the campaign category and the ad creative label are remembered in this tab, never the query string or personal inputs. */
export function CampaignSource() {
 useEffect(()=> {try {
  const q=new URLSearchParams(location.search)
  const s=q.get('utm_source'); if(s && ['instagram','facebook','meta','moast','family-share'].includes(s)) sessionStorage.setItem('binzip-campaign',s)
  const c=safeUtmContent(q.get('utm_content')); if(c) sessionStorage.setItem('binzip-campaign-content',c)
 }catch{}},[])
 return null
}
