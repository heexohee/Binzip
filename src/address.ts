import { composePnu, pad4, extractJibun } from './pnu'
import type { ResolvedAddress } from './types'

/**
 * 주소 문자열 → PNU 및 건축물대장 조회 키 (0단계).
 *
 * 창구는 .env 의 ADDRESS_PROVIDER 로 고른다.
 *   juso  (기본) 행정안전부 도로명주소 API — 지번 구성요소를 명시적으로 준다
 *   kakao        카카오 로컬 — 좌표를 함께 주지만 앱에서 카카오맵 제품 활성화 필요
 *
 * ⚠️ 검색 API 는 유사 검색을 한다. "문덕리 1" 을 넣으면 "문덕리 301-1" 이 돌아온다.
 *    엉뚱한 필지로 진단서를 만드는 건 결과가 없는 것보다 훨씬 나쁘므로,
 *    입력 지번과 응답 지번을 대조해 다르면 strict 모드에서 버린다.
 */
const PROVIDER = (process.env.ADDRESS_PROVIDER ?? 'juso') as 'juso' | 'kakao'

export function currentProvider() {
  return PROVIDER
}

export type ResolveOptions = {
  /** true(기본) 면 지번이 어긋난 결과(fuzzy)를 null 로 버린다 */
  strict?: boolean
}

export async function resolveAddress(
  query: string,
  opts: ResolveOptions = {},
): Promise<ResolvedAddress | null> {
  const { strict = true } = opts
  const r = PROVIDER === 'kakao' ? await viaKakao(query) : await viaJuso(query)
  if (!r) return null
  if (strict && r.matchQuality === 'fuzzy') return null
  return r
}

/** 응답 지번이 입력 지번과 같은지 판정한다. */
function judge(
  query: string,
  got: { bun: number; ji: number; isMountain: boolean },
): 'exact' | 'road' | 'fuzzy' {
  const want = extractJibun(query)
  if (!want) return 'road'
  return want.bun === got.bun && want.ji === got.ji && want.isMountain === got.isMountain
    ? 'exact'
    : 'fuzzy'
}

/* ── 행정안전부 도로명주소 API ─────────────────────────────── */

const JUSO_URL = 'https://business.juso.go.kr/addrlink/addrLinkApi.do'

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
  mtYn: '0' | '1'    // 산 여부
}

async function viaJuso(query: string): Promise<ResolvedAddress | null> {
  const key = process.env.JUSO_CONFM_KEY
  if (!key) throw new Error('JUSO_CONFM_KEY 가 설정되지 않았습니다 (.env 확인)')

  const url = new URL(JUSO_URL)
  url.searchParams.set('confmKey', key)
  url.searchParams.set('keyword', query)
  url.searchParams.set('currentPage', '1')
  // 여러 건을 받아 그중에서 지번이 맞는 것을 고른다. 1건만 받으면 유사 결과에 걸린다.
  url.searchParams.set('countPerPage', '20')
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

  const items: JusoItem[] = json?.results?.juso ?? []
  if (!items.length) return null

  const want = extractJibun(query)
  const pick =
    (want &&
      items.find(
        it =>
          Number(it.lnbrMnnm) === want.bun &&
          Number(it.lnbrSlno) === want.ji &&
          (it.mtYn === '1') === want.isMountain,
      )) ||
    items[0]!

  return toResolved(pick, query)
}

function toResolved(it: JusoItem, query: string): ResolvedAddress {
  const isMountain = it.mtYn === '1'
  const got = { bun: Number(it.lnbrMnnm), ji: Number(it.lnbrSlno), isMountain }

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
    matchQuality: judge(query, got),
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
  url.searchParams.set('size', '10')

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${key}` },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) {
    throw new Error(`카카오 주소검색 실패 ${res.status}: ${(await res.text()).slice(0, 200)}`)
  }

  const docs = ((await res.json()) as { documents?: KakaoDoc[] }).documents ?? []
  const withAddr = docs.filter(d => d.address)
  if (!withAddr.length) return null

  const want = extractJibun(query)
  const doc =
    (want &&
      withAddr.find(
        d =>
          Number(d.address!.main_address_no) === want.bun &&
          Number(d.address!.sub_address_no) === want.ji &&
          (d.address!.mountain_yn === 'Y') === want.isMountain,
      )) ||
    withAddr[0]!

  const a = doc.address!
  const isMountain = a.mountain_yn === 'Y'
  const got = {
    bun: Number(a.main_address_no),
    ji: Number(a.sub_address_no),
    isMountain,
  }

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
    matchQuality: judge(query, got),
  }
}
