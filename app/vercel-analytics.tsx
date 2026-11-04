'use client'
import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next'
import { vercelSafeUrl } from '../src/web-analytics'

/** Counts every visit without cookies, so it needs no consent banner; personal pages are dropped before sending. */
function publicOnly(event: BeforeSendEvent): BeforeSendEvent | null {
  const url = vercelSafeUrl(event.url)
  return url ? { ...event, url } : null
}

export function VercelAnalytics() {
  return <Analytics beforeSend={publicOnly} />
}
