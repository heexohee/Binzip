import { sbSelect } from '../../../../../src/supabase'
import { photoResponse } from '../../../../../src/photos'
import { UUID_PATTERN } from '../../../../../src/photo-limits'
import { requireAdmin } from '../../../../../src/admin-auth'

export const dynamic = 'force-dynamic'

/** Protected by /admin middleware. Never expose these images through the public report. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  try { await requireAdmin() } catch { return new Response(null, { status: 404 }) }
  const { id, photoId } = await params
  if (!UUID_PATTERN.test(id) || !UUID_PATTERN.test(photoId)) return new Response(null, { status: 404 })
  const rows = await sbSelect<{ expires_at: string }>('applications?select=expires_at&id=eq.' + id)
  const expires = Date.parse(rows[0]?.expires_at ?? '')
  if (!Number.isFinite(expires) || expires <= Date.now()) return new Response(null, { status: 404 })
  return photoResponse(id, photoId)
}
