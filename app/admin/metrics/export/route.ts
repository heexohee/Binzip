import { requireAdmin } from '../../../../src/admin-auth'
import { demandCsv } from '../../../../src/demand-metrics'
import { loadDemandMetrics } from '../load'

export const dynamic = 'force-dynamic'

export async function GET() {
  try { await requireAdmin() } catch { return new Response('Unauthorized', { status: 401 }) }
  const { summary, error } = await loadDemandMetrics()
  if (!summary) return new Response(error, { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  const now = new Date()
  const stamp = now.toISOString().slice(0, 10)
  return new Response(demandCsv(summary, now.toISOString()), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="binzip-metrics-${stamp}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
