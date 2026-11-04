/** Only public, fixed paths and campaign labels may reach analytics. */
export const MEASUREMENT_ID = 'G-0Y04DMX5Y0'
export const CONSENT_KEY = 'binzip-analytics-consent-v1'
export const PUBLIC_PATHS = ['/', '/diagnosis', '/management', '/interest', '/apply', '/participate', '/resources', '/privacy', '/example-report', '/example-report/easy']
export function safePage(path: string) { return PUBLIC_PATHS.includes(path) ? `https://www.binzipcare.kr${path}` : null }
export function safeCampaign(search: string) {
 const q = new URLSearchParams(search)
 const result: Record<string,string> = {}
 const allowed: Record<string,RegExp> = { utm_source: /^(instagram|facebook|meta|moast)$/, utm_medium: /^(paid_social|social)$/, utm_campaign: /^binzip_(diagnosis|care)_202611$/, utm_content: /^(image_[a-z0-9_]{1,30}|[0-9]{5,30})$/ }
 for (const [key, pattern] of Object.entries(allowed)) { const value=q.get(key); if(value && pattern.test(value)) result[key]=value }
 return result
}
declare global { interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[])=>void } }
export function trackForm(event: 'form_start'|'generate_lead', kind: 'diagnosis'|'care') {
 if(typeof window==='undefined' || !safePage(location.pathname)) return
 try { if(localStorage.getItem(CONSENT_KEY)!=='granted') return } catch { return }
 window.gtag?.('event',event,{send_to:MEASUREMENT_ID,form_id:kind,page_location:safePage(location.pathname),page_title:location.pathname,page_referrer:''})
}
