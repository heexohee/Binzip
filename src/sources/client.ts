/**
 * ⚠️ 현재 파이프라인에서 사용하지 않는다.
 *
 * 개별주택가격·토지이용규제는 VWorld NED(src/sources/ned.ts)로 옮겼다.
 * 같은 국가공간정보 데이터를 data.go.kr 과 VWorld 가 각자 제공하는데,
 * VWorld 키 하나로 2·3·4·5단계가 전부 해결되어 창구를 통일했다.
 *
 * 이 파일을 남겨두는 이유는 '단독/다가구 매매 실거래가' 때문이다.
 * 그 API 는 data.go.kr 에만 있고 VWorld 에는 없다. 착수하면 여기를 쓴다.
 * serviceKey 이중 인코딩·XML 오류응답·CORS 세 함정 처리가 들어 있어
 * 지우고 다시 쓰기보다 남겨두는 편이 싸다.
 */
import { XMLParser } from 'fast-xml-parser'

const xml = new XMLParser({ ignoreAttributes: false, parseTagValue: true })

export class DataGoKrError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'DataGoKrError'
    this.code = code
  }
}

/** 공공데이터포털 응답에서 자주 보는 오류코드 → 사람이 읽을 수 있는 원인 */
const KNOWN_CODES: Record<string, string> = {
  '01': '애플리케이션 에러',
  '10': '잘못된 요청 파라미터',
  '12': '해당 오픈API가 없거나 폐기됨',
  '20': '서비스 접근 거부 — 활용신청 승인 여부 확인',
  '22': '일일 트래픽 초과',
  '30': '등록되지 않은 서비스키 — .env 에 "디코딩" 키를 넣었는지 확인',
  '31': '기한만료된 서비스키',
  '32': '등록되지 않은 도메인/IP',
}

export type CallOptions = {
  /** 초 단위. 같은 파라미터 재호출을 이 시간만큼 메모리에 캐싱한다 */
  cacheSeconds?: number
  timeoutMs?: number
}

const memo = new Map<string, { at: number; value: unknown }>()

/**
 * 공공데이터포털 오픈API 호출.
 *
 * 함정 3가지를 여기서 전부 흡수한다.
 *  1) serviceKey 이중 인코딩 — .env 에는 '디코딩' 키를 넣고 여기서 딱 한 번 인코딩한다.
 *     URLSearchParams 에 넣으면 '%2B' 가 '%252B' 가 되어 코드 30 이 난다.
 *  2) _type=json 을 줘도 오류일 때는 XML 로 온다 — 첫 글자로 분기한다.
 *  3) CORS — 브라우저에서 직접 부르면 막힌다. 반드시 서버에서만 호출할 것.
 */
export async function callDataGoKr<T = unknown>(
  endpoint: string,
  params: Record<string, string>,
  opts: CallOptions = {},
): Promise<T> {
  const key = process.env.DATA_GO_KR_KEY
  if (!key) throw new Error('DATA_GO_KR_KEY 가 설정되지 않았습니다 (.env 확인)')

  const { cacheSeconds = 86_400, timeoutMs = 10_000 } = opts

  const qs = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')
  // serviceKey 는 직접 조립한다. URLSearchParams 를 쓰지 않는 이유가 함정 1.
  const url = `${endpoint}?serviceKey=${encodeURIComponent(key)}&${qs}`

  const cacheKey = `${endpoint}?${qs}`
  const hit = memo.get(cacheKey)
  if (hit && Date.now() - hit.at < cacheSeconds * 1000) return hit.value as T

  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
  const text = await res.text()

  const body = parseResponse(text, res.status)
  memo.set(cacheKey, { at: Date.now(), value: body })
  return body as T
}

function parseResponse(text: string, status: number): unknown {
  const head = text.trimStart()

  // 함정 2 — 오류는 _type=json 을 줘도 XML 로 돌아온다
  if (head.startsWith('<')) {
    const parsed = xml.parse(text) as Record<string, any>
    const header =
      parsed?.response?.header ??
      parsed?.OpenAPI_ServiceResponse?.cmmMsgHeader ??
      null

    const code = String(header?.resultCode ?? header?.returnReasonCode ?? '')
    const msg = String(header?.resultMsg ?? header?.returnAuthMsg ?? header?.errMsg ?? '')

    if (code && code !== '00' && code !== '0') {
      throw new DataGoKrError(code, `[${code}] ${msg}${KNOWN_CODES[code] ? ` — ${KNOWN_CODES[code]}` : ''}`)
    }
    if (!header) {
      throw new DataGoKrError('PARSE', `예상 못 한 XML 응답 (HTTP ${status}): ${head.slice(0, 200)}`)
    }
    return parsed?.response?.body ?? null
  }

  let json: any
  try {
    json = JSON.parse(text)
  } catch {
    throw new DataGoKrError('PARSE', `JSON 파싱 실패 (HTTP ${status}): ${head.slice(0, 200)}`)
  }

  const header = json?.response?.header
  const code = String(header?.resultCode ?? '')
  if (code && code !== '00' && code !== '0') {
    throw new DataGoKrError(code, `[${code}] ${header?.resultMsg ?? ''}${KNOWN_CODES[code] ? ` — ${KNOWN_CODES[code]}` : ''}`)
  }
  return json?.response?.body ?? json
}

/** items.item 이 단건이면 객체, 다건이면 배열로 오는 공공API 관행을 흡수한다. */
export function toArray<T>(v: T | T[] | null | undefined): T[] {
  if (v == null) return []
  return Array.isArray(v) ? v : [v]
}
