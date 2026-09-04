import type { NextConfig } from 'next'

const config: NextConfig = {
  // 공공 API 호출은 전부 서버에서만 한다 (CORS 및 키 노출 방지)
  serverExternalPackages: ['exceljs'],
}

export default config
