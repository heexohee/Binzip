import type { NextConfig } from 'next'

const config: NextConfig = {
  // Keep 127.0.0.1/localhost and the deployed host stable across admin redirects.
  skipMiddlewareUrlNormalize: true,
  // 공공 API 호출은 전부 서버에서만 한다 (CORS 및 키 노출 방지)
  serverExternalPackages: ['exceljs'],
  // Six processed images <= 3 MiB; leave room for multipart and ordinary fields.
  experimental: { serverActions: { bodySizeLimit: '4mb' } },
}

export default config
