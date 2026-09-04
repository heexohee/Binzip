/**
 * VWorld(디지털트윈국토) 국가공간정보 개방데이터 클라이언트.
 *
 * data.go.kr 과 규약이 다르다.
 *  - 인증 파라미터가 serviceKey 가 아니라 `key`
 *  - 발급 시 등록한 서비스 URL 을 `domain` 으로 함께 보내야 하는 경우가 있다
 *  - 오류가 HTTP 200 + JSON 본문으로 온다 (status: "ERROR")
 */

export class VWorldError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'VWorldError'
    this.code = code
  }
}

const HINTS: Record<string, string> = {
  INVALID_KEY: '인증키가 잘못됐습니다 — .env 의 VWORLD_KEY 확인',
  NOT_APPROVED: '승인되지 않은 키입니다 — VWorld 마이페이지에서 상태 확인',
  UNREGISTERED_DOMAIN:
    '등록되지 않은 도메인입니다 — 키 발급 시 등록한 서비스 URL 과 VWORLD_DOMAIN 이 일치해야 합니다',
  OVER_QUERY_LIMIT: '일일 호출 한도를 초과했습니다',
}

export type VWorldOptions = { cacheSeconds?: number; timeoutMs?: number }

const memo = new Map<string, { at: number; value: unknown }>()

export async function callVWorld<T = unknown>(
  endpoint: string,
  params: Record<string, string>,
  opts: VWorldOptions = {},
): Promise<T> {
  const key = process.env.VWORLD_KEY
  if (!key) throw new Error('VWORLD_KEY 가 설정되지 않았습니다 (.env 확인)')

  const { cacheSeconds = 86_400, timeoutMs = 10_000 } = opts

  const url = new URL(endpoint)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  url.searchParams.set('key', key)
  // 등록 도메인 검증에 걸리는 배포본이 있어 함께 보낸다
  const domain = process.env.VWORLD_DOMAIN
  if (domain) url.searchParams.set('domain', domain)

  const cacheKey = url.toString().replace(key, '***')
  const hit = memo.get(cacheKey)
  if (hit && Date.now() - hit.at < cacheSeconds * 1000) return hit.value as T

  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
  const text = await res.text()
  const body = parse(text, res.status)

  memo.set(cacheKey, { at: Date.now(), value: body })
  return body as T
}

function parse(text: string, status: number): unknown {
  const head = text.trimStart()

  if (head.startsWith('<')) {
    // XML 로 왔다면 대개 오류거나 format 파라미터가 안 먹은 것
    const code = /<code>([^<]*)<\/code>/i.exec(text)?.[1] ?? 'XML'
    const msg = /<text>([^<]*)<\/text>/i.exec(text)?.[1] ?? head.slice(0, 200)
    throw new VWorldError(code, `[${code}] ${msg}${HINTS[code] ? ` — ${HINTS[code]}` : ''}`)
  }

  let json: any
  try {
    json = JSON.parse(text)
  } catch {
    throw new VWorldError('PARSE', `JSON 파싱 실패 (HTTP ${status}): ${head.slice(0, 200)}`)
  }

  // VWorld 는 오류도 HTTP 200 으로 돌려준다
  const r = json?.response ?? json
  const st = String(r?.status ?? '').toUpperCase()
  if (st === 'ERROR' || st === 'FAIL') {
    const code = String(r?.error?.code ?? r?.error?.level ?? 'ERROR')
    const msg = String(r?.error?.text ?? r?.error?.message ?? '알 수 없는 오류')
    throw new VWorldError(code, `[${code}] ${msg}${HINTS[code] ? ` — ${HINTS[code]}` : ''}`)
  }

  return json
}

/** 배열/단건이 뒤섞여 오는 관행을 흡수한다. */
export function toArray<T>(v: T | T[] | null | undefined): T[] {
  if (v == null) return []
  return Array.isArray(v) ? v : [v]
}
