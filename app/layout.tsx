import type { Metadata } from 'next'
import './globals.css'
import { InstantFlowProvider } from './instant-flow'
import { CampaignSource } from './campaign-source'
import { HomeFooter } from './home-ui'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: '빈집진단서',
  icons: { icon: { url: '/brand/binzip-house-logo-b-3d-v2.png', type: 'image/png' } },
  description:
    '상속받은 시골 빈집을 팔지, 고칠지, 계속 갖고 있을지 고민된다면. 집 정보와 선택지별 비용·조건, 다음 할 일을 진단서로 정리해 드려요. 전국 어디서든 무료 시범 참여할 수 있어요.',
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
      </head>
      <body><CampaignSource/><InstantFlowProvider><div className="site-content">{children}</div></InstantFlowProvider><HomeFooter /><Analytics /></body>
    </html>
  )
}
