import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '빈집이력서',
  description:
    '포항에 비어 있는 집, 주소만 넣으시면 지금 어떤 방법으로 쓸 수 있는지 한 장으로 알려드립니다.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* 디자인가이드 §3 — 두 계열만 쓴다. 추후 next/font 셀프호스팅으로 교체 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
