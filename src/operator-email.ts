/**
 * Operator alert mail through Resend (same env as the diagnosis alert).
 * Returns false when mail is not configured; throws when Resend rejects it.
 */
export async function sendOperatorEmail(subject: string, lines: string[]): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  const to = process.env.NOTIFY_EMAIL
  const from = process.env.NOTIFY_FROM
  if (!key || !to || !from) return false
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text: lines.join('\n') }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })
  // The response body echoes the recipient address, so only the status is surfaced.
  if (!res.ok) throw new Error('resend ' + res.status)
  return true
}

/** Short code shown to the applicant and in the alert so a Kakao chat can be matched to the record. */
export function receiptCode(id: string): string {
  return id.replace(/-/g, '').slice(0, 4).toUpperCase()
}
