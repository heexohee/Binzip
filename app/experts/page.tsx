import type { Metadata } from 'next'
import ExpertDashboard from './expert-dashboard'
export const metadata: Metadata = { title: '전문가 업무 목록 | 빈집진단서', robots: { index: false, follow: false } }
export default function Page() { return <ExpertDashboard/> }

