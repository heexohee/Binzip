import { NextResponse, type NextRequest } from 'next/server'

/**
 * /admin 접근 제어.
 *
 * 계정·로그인 화면을 만들지 않는다 — 운영자 한 명이고 신청은 몇 건이다.
 * 대신 토큰 하나로 막고, 맞으면 httpOnly 쿠키를 심어 주소창에서 토큰을 지운다.
 *
 * 틀리면 401 이 아니라 404 로 돌려준다. 401 은 '여기 뭔가 있다'는 신호가 된다.
 *
 * ⚠️ 이 토큰이 새면 모든 신청자의 주소와 연락처가 열린다.
 */
const COOKIE = 'binzip_admin'

export function middleware(req: NextRequest) {
  const token = process.env.ADMIN_TOKEN
  if (!token) {
    return new NextResponse('ADMIN_TOKEN 이 설정되지 않았습니다.', { status: 503 })
  }

  const given = req.nextUrl.searchParams.get('k')
  if (given && given === token) {
    const url = req.nextUrl.clone()
    url.searchParams.delete('k')
    const res = NextResponse.redirect(url)
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/admin',
      maxAge: 60 * 60 * 12,
    })
    return res
  }

  if (req.cookies.get(COOKIE)?.value === token) return NextResponse.next()
  return new NextResponse('찾을 수 없습니다.', { status: 404 })
}

export const config = { matcher: '/admin/:path*' }
