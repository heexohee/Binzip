/** Only public, fixed paths and campaign labels may reach analytics. */
export const MEASUREMENT_ID = 'G-0Y04DMX5Y0'
export const CONSENT_KEY = 'binzip-analytics-consent-v1'
export const PUBLIC_PATHS = ['/', '/diagnosis', '/management', '/interest', '/apply', '/participate', '/resources', '/privacy', '/example-report', '/example-report/easy']
export function safePage(path: string) { return PUBLIC_PATHS.includes(path) ? `https://www.binzipcare.kr${path}` : null }
/** Ad creative label: `image_<name>` or a numeric Meta ad id. Shared by analytics and the application record. */
export const UTM_CONTENT_PATTERN = /^(image_[a-z0-9_]{1,30}|[0-9]{5,30})$/
export function safeUtmContent(value: string | null | undefined): string | null { return value && UTM_CONTENT_PATTERN.test(value) ? value : null }
export function safeCampaign(search: string) {
 const q = new URLSearchParams(search)
 const result: Record<string,string> = {}
 const allowed: Record<string,RegExp> = { utm_source: /^(instagram|facebook|meta|moast)$/, utm_medium: /^(paid_social|social)$/, utm_campaign: /^binzip_(diagnosis|care)_202611$/, utm_content: UTM_CONTENT_PATTERN }
 for (const [key, pattern] of Object.entries(allowed)) { const value=q.get(key); if(value && pattern.test(value)) result[key]=value }
 return result
}
/** Cookieless Vercel page counts: same public paths as GA, plus only the allowed campaign labels. */
export function vercelSafeUrl(raw: string): string | null {
 let url: URL
 try { url = new URL(raw) } catch { return null }
 if (!PUBLIC_PATHS.includes(url.pathname)) return null
 const campaign = new URLSearchParams(safeCampaign(url.search)).toString()
 return url.origin + url.pathname + (campaign ? '?' + campaign : '')
}
declare global { interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[])=>void } }
/** Event names and parameter values are fixed labels only — never addresses, contacts or free-text answers. */
type EventParams = Record<string, string | number>
export function trackEvent(event: 'form_start'|'generate_lead'|'contact_click', params: EventParams = {}) {
 if(typeof window==='undefined' || !safePage(location.pathname)) return
 try { if(localStorage.getItem(CONSENT_KEY)!=='granted') return } catch { return }
 window.gtag?.('event',event,{...params,send_to:MEASUREMENT_ID,page_location:safePage(location.pathname),page_title:location.pathname,page_referrer:''})
}
export function trackForm(event: 'form_start'|'generate_lead', kind: 'diagnosis'|'care') {
 trackEvent(event, {form_id: kind})
}
/** Contact links are matched by scheme/host so server-rendered pages need no client wrapper. */
export function contactMethod(href: string): 'phone'|'kakao'|null {
 if(href.startsWith('tel:')) return 'phone'
 try { return new URL(href).hostname==='pf.kakao.com' ? 'kakao' : null } catch { return null }
}
