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
      <body>{children}</body>
    </html>
  )
}
