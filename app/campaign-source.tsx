'use client'
import {useEffect} from 'react'
/** Only the campaign category is remembered in this tab, never the query string or personal inputs. */
export function CampaignSource() {
 useEffect(()=> {try {if(new URLSearchParams(location.search).get('utm_source')==='instagram') sessionStorage.setItem('binzip-campaign','instagram')}catch{}},[])
 return null
}
