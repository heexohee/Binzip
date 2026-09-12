'use server'

import { createHash, randomBytes } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import { ADMIN_COOKIE, matchesAdminToken } from '../../../src/admin-auth'

const attempts = new Map<string, { count: number; until: number }>()
const salt = randomBytes(16).toString('hex')

export async function loginAdmin(_state: { message: string; ok?: boolean }, formData: FormData): Promise<{ message: string; ok?: boolean }> {
  if (!process.env.ADMIN_TOKEN) return { message: '관리자 접근 키가 아직 설정되지 않았어요.' }
  const h = await headers()
  const now = Date.now()
  for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key)
  const ipHash = createHash('sha256').update(salt + (h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local')).digest('hex')
  let bucket = attempts.get(ipHash)
  if (!bucket) {
    if (attempts.size >= 1000) return { message: '잠시 후 다시 시도해 주세요.' }
    bucket = { count: 0, until: now + 15 * 60_000 }
    attempts.set(ipHash, bucket)
    const entry = bucket
    setTimeout(() => { if (attempts.get(ipHash) === entry) attempts.delete(ipHash) }, 15 * 60_000).unref()
  }
  if (++bucket.count > 10) return { message: '로그인 시도가 많아요. 15분 후 다시 시도해 주세요.' }
  const token = formData.get('token')
  if (typeof token !== 'string' || token.length > 1024 || !matchesAdminToken(token)) return { message: '접근 키가 일치하지 않습니다.' }
  attempts.delete(ipHash)
  const host = h.get('host')?.split(':')[0]
  ;(await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' && host !== 'localhost' && host !== '127.0.0.1', path: '/admin', maxAge: 60 * 60 * 12,
  })
  return { ok: true, message: '로그인했어요. 관리 화면으로 이동합니다.' }
}

export async function logoutAdmin(): Promise<void> {
  ;(await cookies()).set(ADMIN_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/admin', maxAge: 0 })
}
