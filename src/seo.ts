import type { Metadata } from 'next'

/** The one host search engines should index; binzipcare.kr redirects here. */
export const SITE_URL = 'https://www.binzipcare.kr'
export const SITE_NAME = '빈집진단서'
export const SITE_DESCRIPTION =
  '멀리 있는 시골 빈집, 대신 가서 보고 사진으로 알려 드려요. 열쇠를 맡기면 집 안팎 점검·환기·누수 확인·우편물 수거를 하고, 계절과 날씨에 맞춰 살펴볼 곳을 미리 알려 드려요. 포항·경주 시범 운영.'

export const OG_IMAGE = { url: '/diagnosis/rural-house.jpg', width: 752, height: 480, alt: '오래 비어 있는 시골 기와집' }

/** Pages that should appear in search. Private or form-only routes stay out (see app/robots.ts). */
export const INDEXED_PATHS = ['/', '/management', '/resources', '/interest', '/privacy'] as const

/** Routes crawlers should not fetch: operator screens, personal reports and the application form. */
export const DISALLOWED_PATHS = [
  '/admin', '/admin-preview', '/api', '/apply', '/connect', '/care', '/experts', '/report', '/status', '/decision-report',
]

type PageSeo = { title: string; description: string; path: (typeof INDEXED_PATHS)[number] }

/**
 * Next merges metadata shallowly, so a page that sets openGraph loses the root image.
 * Build every public page's metadata here so canonical, OG and Twitter stay in step.
 */
export function pageMetadata({ title, description, path }: PageSeo): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', locale: 'ko_KR', siteName: SITE_NAME, url: path, title, description, images: [OG_IMAGE] },
    twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE.url] },
  }
}

/** Verification codes come from env so they can be added without a code change. Empty values are skipped. */
export function verificationMetadata(): Metadata['verification'] {
  const google = process.env.GOOGLE_SITE_VERIFICATION?.trim()
  const naver = process.env.NAVER_SITE_VERIFICATION?.trim()
  const other: Record<string, string> = naver ? { 'naver-site-verification': naver } : {}
  return { ...(google ? { google } : {}), other }
}

/** Serialize JSON-LD safely for a <script> tag: `<` would let page text close the tag early. */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') }
}
