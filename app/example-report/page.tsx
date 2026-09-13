import type { Metadata } from 'next'
import { DecisionExampleReport } from './decision-example-report'

export const revalidate = 86400
export const metadata: Metadata = {
  title: '집 상태부터 다음 행동까지 — 빈집진단서',
  description: '집의 현재 상태, 보수·매도·철거 선택지, 예상 비용과 다음 행동을 한눈에 살펴보세요.',
  robots: { index: false, follow: false },
}

export default function ExampleReportPage() {
  return <DecisionExampleReport />
}
