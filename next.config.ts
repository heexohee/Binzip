import type { NextConfig } from 'next'

const config: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  // Keep 127.0.0.1/localhost and the deployed host stable across admin redirects.
  skipMiddlewareUrlNormalize: true,
  // 공공 API 호출은 전부 서버에서만 한다 (CORS 및 키 노출 방지)
  serverExternalPackages: ['exceljs'],
  // Six processed images <= 3 MiB; leave room for multipart and ordinary fields.
  experimental: { serverActions: { bodySizeLimit: '4mb' } },
  // 다른 사이트가 신청 화면을 틀에 넣어 가로채지 못하게 한다.
  // 스크립트 출처까지 묶는 CSP는 카카오 지도·글꼴·방문 통계를 함께 정리할 때 넣는다.
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
      ],
    }]
  },
}

export default config
