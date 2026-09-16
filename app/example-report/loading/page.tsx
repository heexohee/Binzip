import type { Metadata } from 'next'
import { ReportLoading } from './report-loading'

export const metadata: Metadata = {
  title: '집토끼가 진단서를 준비하고 있어요 — 빈집진단서',
  robots: { index: false, follow: false },
}

export default function ReportLoadingPage() {
  return <ReportLoading />
}
