import { timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

export const ADMIN_COOKIE = 'binzip_admin'

export function matchesAdminToken(given: string | undefined, expected = process.env.ADMIN_TOKEN): boolean {
  if (!given || !expected) return false
  const left = Buffer.from(given)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

/** Server actions must authenticate independently of the route middleware. */
export async function requireAdmin(): Promise<void> {
  if (!matchesAdminToken((await cookies()).get(ADMIN_COOKIE)?.value)) throw new Error('ADMIN_UNAUTHORIZED')
}
