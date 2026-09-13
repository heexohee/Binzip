/** A lookup candidate becomes selected only after the user confirms it. */
export type AddressCandidate = {
  query: string
  address: string
  roadAddress: string | null
  pnu: string
  quality: 'exact' | 'road' | 'fuzzy'
  x: number | null
  y: number | null
}

export function parseAddressCandidate(raw: unknown, query: string): AddressCandidate | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Record<string, unknown>
  if (data.found !== true || typeof data.pnu !== 'string' || !/^\d{19}$/.test(data.pnu)) return null
  const address = typeof data.jibunAddress === 'string' && data.jibunAddress.trim()
    ? data.jibunAddress.trim() : typeof data.roadAddress === 'string' ? data.roadAddress.trim() : ''
  if (!address || !['exact', 'road', 'fuzzy'].includes(String(data.matchQuality))) return null
  const hasCoordinates = typeof data.x === 'number' && Number.isFinite(data.x) && data.x >= 124 && data.x <= 132
    && typeof data.y === 'number' && Number.isFinite(data.y) && data.y >= 33 && data.y <= 39
  return {
    query, address, pnu: data.pnu, quality: data.matchQuality as AddressCandidate['quality'],
    roadAddress: typeof data.roadAddress === 'string' ? data.roadAddress : null,
    x: hasCoordinates ? data.x as number : null, y: hasCoordinates ? data.y as number : null,
  }
}
