import { NextResponse } from 'next/server'
import { currentProvider, resolveAddress } from '../../../src/address'
import { geocodeParcel } from '../../../src/sources/geocode'

export const dynamic = 'force-dynamic'

/**
 * 주소 확인 (0단계를 화면에서 미리 돌린다).
 *
 * strict:false 로 부른다 — 애매한 결과(fuzzy)를 조용히 버리는 대신 사람에게 확인받는다.
 * 엉뚱한 필지로 진단서를 만드는 것이 결과가 없는 것보다 나쁘다는 원칙은 그대로이고,
 * 여기서는 그 판단을 소유주 본인이 한다.
 *
 * 키는 서버에만 남는다 (next.config.ts 원칙).
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim()
  if (!q) {
    return NextResponse.json({ found: false, reason: 'EMPTY_QUERY' }, { status: 400 })
  }

  try {
    const r = await resolveAddress(q, { strict: false })
    if (!r) {
      return NextResponse.json({ found: false, provider: currentProvider() })
    }
    // juso 는 좌표를 주지 않는다. 지도 이미지를 띄우려면 별도 지오코딩이 필요하다.
    const coords =
      r.x != null && r.y != null
        ? { x: r.x, y: r.y }
        : await geocodeParcel(r.jibunAddress).catch(() => null)

    return NextResponse.json({
      found: true,
      pnu: r.pnu,
      jibunAddress: r.jibunAddress,
      roadAddress: r.roadAddress,
      matchQuality: r.matchQuality,
      provider: r.provider,
      x: coords?.x ?? null,
      y: coords?.y ?? null,
    })
  } catch (e) {
    console.error('[api/address] 조회 실패', e)
    return NextResponse.json({ found: false, reason: 'LOOKUP_FAILED' }, { status: 502 })
  }
}
