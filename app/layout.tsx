import type { Metadata } from 'next'
import './globals.css'
import { InstantFlowProvider } from './instant-flow'

export const metadata: Metadata = {
  title: '빈집진단서',
  icons: { icon: { url: '/brand/binzip-house-logo-b-3d-v2.png', type: 'image/png' } },
  description:
    '포항의 시골 빈집을 팔지, 철거할지, 보유할지 고민된다면. 집의 기록, 매도·철거 비용 비교, 공적 지원과 다음 할 일을 한곳에 정리해 드립니다.',
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
      <body><InstantFlowProvider>{children}</InstantFlowProvider></body>
    </html>
  )
}
