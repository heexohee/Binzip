import type { Metadata } from 'next'
import CareApp from './care-app'
export const metadata: Metadata = { title: '우리 집 관리 | 빈집진단서', robots: { index: false, follow: false } }
export default function Page() { return <CareApp /> }
