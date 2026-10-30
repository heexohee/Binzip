'use client'
import {useEffect} from 'react'
/** Only the campaign category is remembered in this tab, never the query string or personal inputs. */
export function CampaignSource() {
 useEffect(()=> {try {const s=new URLSearchParams(location.search).get('utm_source'); if(s==='instagram'||s==='family-share') sessionStorage.setItem('binzip-campaign',s)}catch{}},[])
 return null
}
