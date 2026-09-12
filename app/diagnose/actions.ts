'use server'

import { createHash, randomBytes } from 'node:crypto'
import { headers } from 'next/headers'
import { resolveAddress } from '../../src/address'
import { getBuilding } from '../../src/sources/building'
import { getLandChar } from '../../src/sources/landChar'
import { getHousePrice } from '../../src/sources/housePrice'
import { runInstantLookup } from '../../src/instant-lookup'
import { parseInstantInput, type InstantResult } from '../../src/instant-report'

const salt = randomBytes(16).toString('hex')
const requests = new Map<string, { count: number; until: number }>()
let active = 0

export async function lookupInstantReport(raw: unknown): Promise<InstantResult> {
  const input = parseInstantInput(raw)
  if (!input) return { kind: 'invalid', message: '주소와 고민하는 방향을 다시 확인해 주세요.' }
  const requestHeaders = await headers()
  const client = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const bucket = createHash('sha256').update(salt + client).digest('hex')
  const now = Date.now()
  for (const [key, value] of requests) if (value.until <= now) requests.delete(key)
  const hit = requests.get(bucket)
  if (active >= 8 || (hit && hit.count >= 20) || (!hit && requests.size >= 1000)) {
    return { kind: 'busy', message: '잠시 요청이 많아요. 1분 뒤 다시 조회해 주세요.' }
  }
  const until = hit?.until ?? now + 60_000
  requests.set(bucket, { count: (hit?.count ?? 0) + 1, until })
  if (!hit) setTimeout(() => {
    if (requests.get(bucket)?.until === until) requests.delete(bucket)
  }, 60_000).unref()
  active++
  try {
    return await runInstantLookup(input, {
      resolve: query => resolveAddress(query, { strict: false }),
      building: getBuilding, land: getLandChar, price: getHousePrice,
    })
  } finally { active-- }
}
