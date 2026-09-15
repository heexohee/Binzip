import type { Metadata } from 'next'
import CaseView from '../case-view'
export const metadata: Metadata = { title: '내 상담 진행 현황 | 빈집진단서', robots: { index: false, follow: false } }
export default async function Page({ params }: { params: Promise<{id:string}> }) {
  const {id} = await params
  return <CaseView id={id} role="customer"/>
}

