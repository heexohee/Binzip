import type { Metadata } from 'next'
import { DecisionExampleReport } from './decision-example-report'

export const revalidate = 86400
export const metadata: Metadata = {
  title: '진단서 예시 | 빈집진단서',
  description: '포항의 시골집을 가정해 보유·수리·매각·철거 선택지를 비교한 진단서 예시예요.',
  robots: { index: false, follow: false },
}

export default function ExampleReportPage() {
  return <DecisionExampleReport />
}
