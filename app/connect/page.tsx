import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: '지역 전문가 상담 요청 | 빈집진단서', robots: { index: false, follow: false } }
export default function Page() { redirect('/example-report#consultation') }
