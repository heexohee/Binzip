import { NextResponse, type NextRequest } from 'next/server'

/**
 * /admin 접근 제어.
 *
 * 운영자 접근 키로 로그인한 httpOnly 쿠키를 확인한다.
 * 서버 액션도 별도로 인증한다. 인증 없는 POST는 로그인 HTML로 넘기지 않는다.
 *
 * ⚠️ 이 토큰이 새면 모든 신청자의 주소와 연락처가 열린다.
 */
const COOKIE = 'binzip_admin'

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === '/admin/login') return NextResponse.next()
  const token = process.env.ADMIN_TOKEN
  if (token && req.cookies.get(COOKIE)?.value === token) {
    const res = NextResponse.next()
    res.headers.set('Cache-Control', 'private, no-store')
    res.headers.set('Referrer-Policy', 'no-referrer')
    return res
  }
  if (req.method === 'GET' && !req.nextUrl.pathname.includes('/photos/')) {
    const login = req.nextUrl.clone()
    login.pathname = '/admin/login'
    login.search = ''
    // Next may normalize the local URL to localhost; keep the browser's actual host.
    if (req.headers.get('host')) login.host = req.headers.get('host')!
    const response = NextResponse.redirect(login)
    response.headers.set('Cache-Control', 'no-store')
    return response
  }
  return new NextResponse('찾을 수 없습니다.', { status: 404 })
}

export const config = { matcher: '/admin/:path*' }
