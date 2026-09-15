import type { Metadata } from 'next'
import { RenewedExampleReport } from '../renewed-report'

export const revalidate = 86400
export const metadata: Metadata = {
  title: '우리 집 철거 준비 진단서 — 빈집진단서',
  description: '집의 기록과 주변 거래, 철거 예산·준비사항을 살펴보고 상담과 진행 현황을 확인하세요.',
  robots: { index: false, follow: false },
}

export default function EasyExampleReportPage() {
  return <RenewedExampleReport />
}
