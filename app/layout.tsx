import type { Metadata } from 'next'
import './globals.css'
import { InstantFlowProvider } from './instant-flow'
import { CampaignSource } from './campaign-source'
import { HomeFooter } from './home-ui'
import { SiteAnalytics } from './site-analytics'
import { VercelAnalytics } from './vercel-analytics'
import { PHONE } from './landing-parts'
import { jsonLd, OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL, verificationMetadata } from '../src/seo'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  applicationName: SITE_NAME,
  icons: { icon: { url: '/brand/binzip-house-logo-b-3d-v2.png', type: 'image/png' } },
  description: SITE_DESCRIPTION,
  // No site-wide canonical here: Next would copy it onto every child page. Each public page sets its own.
  openGraph: { type: 'website', locale: 'ko_KR', siteName: SITE_NAME, title: SITE_NAME, description: SITE_DESCRIPTION, images: [OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: SITE_NAME, description: SITE_DESCRIPTION, images: [OG_IMAGE.url] },
  verification: verificationMetadata(),
}

const SITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/brand/binzip-house-logo-b-3d-v2.png`,
      description: SITE_DESCRIPTION,
      contactPoint: { '@type': 'ContactPoint', telephone: `+82-${PHONE.slice(1)}`, contactType: 'customer support', areaServed: 'KR', availableLanguage: 'Korean' },
    },
    { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, inLanguage: 'ko-KR', publisher: { '@id': `${SITE_URL}/#organization` } },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* Family name matches --font-sans; system fonts remain the offline fallback. */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(SITE_JSON_LD)} />
      </head>
      <body><CampaignSource/><InstantFlowProvider><div className="site-content">{children}</div></InstantFlowProvider><HomeFooter /><SiteAnalytics /><VercelAnalytics /></body>
    </html>
  )
}
