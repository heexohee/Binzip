import { composePnu, pad4 } from './pnu'
import type { ResolvedAddress } from './types'

/**
 * 주소 문자열 → PNU 및 건축물대장 조회 키 (0단계).
 *
 * 두 창구를 지원한다. .env 의 ADDRESS_PROVIDER 로 고른다.
 *   juso  (기본) 행정안전부 도로명주소 API — 지번 구성요소를 명시적으로 준다
 *   kakao        카카오 로컬 — 좌표를 함께 주지만 앱에서 카카오맵 제품 활성화가 필요
 *
 * 매칭 실패는 예외가 아니라 null 이다. 사용자 오타가 정상 경로이기 때문.
 */
const PROVIDER = (process.env.ADDRESS_PROVIDER ?? 'juso') as 'juso' | 'kakao'

export async function resolveAddress(query: string): Promise<ResolvedAddress | null> {
  return PROVIDER === 'kakao' ? viaKakao(query) : viaJuso(query)
}

export function currentProvider() {
  return PROVIDER
}

/* ── 행정안전부 도로명주소 API ─────────────────────────────── */

const JUSO_URL = 'https://business.juso.go.kr/addrlink/addrLinkApi.do'

/** juso 오류코드 → 사람이 읽을 수 있는 원인 */
const JUSO_HINTS: Record<string, string> = {
  E0013: '승인되지 않은 승인키입니다 — .env 의 JUSO_CONFM_KEY 확인',
  E0005: '검색어를 입력해 주세요',
  E0009: '검색어에 특수문자가 들어 있습니다',
  E0010: '검색어가 숫자로만 되어 있습니다',
  E0012: '검색어에 사용할 수 없는 문자가 있습니다',
}

type JusoItem = {
  roadAddr: string
  jibunAddr: string
  admCd: string      // 법정동코드 10자리
  lnbrMnnm: string   // 지번 본번
  lnbrSlno: string   // 지번 부번
  mtYn: '0' | '1'    // 산 여부 (0=대지, 1=산)
}

async function viaJuso(query: string): Promise<ResolvedAddress | null> {
  const key = process.env.JUSO_CONFM_KEY
  if (!key) throw new Error('JUSO_CONFM_KEY 가 설정되지 않았습니다 (.env 확인)')

  const url = new URL(JUSO_URL)
  url.searchParams.set('confmKey', key)
  url.searchParams.set('keyword', query)
  url.searchParams.set('currentPage', '1')
  url.searchParams.set('countPerPage', '1')
  url.searchParams.set('resultType', 'json')

  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  const text = await res.text()

  let json: any
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`도로명주소 API 응답 파싱 실패 (HTTP ${res.status}): ${text.slice(0, 200)}`)
  }

  const common = json?.results?.common
  const code = String(common?.errorCode ?? '')
  if (code && code !== '0') {
    const hint = JUSO_HINTS[code]
    throw new Error(`[${code}] ${common?.errorMessage ?? ''}${hint ? ` — ${hint}` : ''}`)
  }

  const it: JusoItem | undefined = json?.results?.juso?.[0]
  if (!it) return null

  const isMountain = it.mtYn === '1'

  return {
    pnu: composePnu(it.admCd, it.lnbrMnnm, it.lnbrSlno, isMountain),
    bcode: it.admCd,
    sigunguCd: it.admCd.slice(0, 5),
    bjdongCd: it.admCd.slice(5, 10),
    platGbCd: isMountain ? '1' : '0',
    bun: pad4(it.lnbrMnnm),
    ji: pad4(it.lnbrSlno),
    isMountain,
    x: null, // 좌표는 별도 API. 5단계 정사영상에서만 필요하다
    y: null,
    jibunAddress: it.jibunAddr,
    roadAddress: it.roadAddr || null,
    provider: 'juso',
  }
}

/* ── 카카오 로컬 (예비) ────────────────────────────────────── */

const KAKAO_URL = 'https://dapi.kakao.com/v2/local/search/address.json'

type KakaoDoc = {
  x: string
  y: string
  address?: {
    address_name: string
    b_code: string
    main_address_no: string
    sub_address_no: string
    mountain_yn: 'Y' | 'N'
  }
  road_address?: { address_name: string } | null
}

async function viaKakao(query: string): Promise<ResolvedAddress | null> {
  const key = process.env.KAKAO_REST_KEY
  if (!key) throw new Error('KAKAO_REST_KEY 가 설정되지 않았습니다 (.env 확인)')

  const url = new URL(KAKAO_URL)
  url.searchParams.set('query', query)
  url.searchParams.set('size', '1')

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${key}` },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) {
    throw new Error(`카카오 주소검색 실패 ${res.status}: ${(await res.text()).slice(0, 200)}`)
  }

  const payload = (await res.json()) as { documents?: KakaoDoc[] }
  const doc = payload.documents?.[0]
  const a = doc?.address
  if (!doc || !a) return null

  const isMountain = a.mountain_yn === 'Y'

  return {
    pnu: composePnu(a.b_code, a.main_address_no, a.sub_address_no, isMountain),
    bcode: a.b_code,
    sigunguCd: a.b_code.slice(0, 5),
    bjdongCd: a.b_code.slice(5, 10),
    platGbCd: isMountain ? '1' : '0',
    bun: pad4(a.main_address_no),
    ji: pad4(a.sub_address_no),
    isMountain,
    x: Number(doc.x),
    y: Number(doc.y),
    jibunAddress: a.address_name,
    roadAddress: doc.road_address?.address_name ?? null,
    provider: 'kakao',
  }
}
