import type { Metadata } from 'next'
import CaseView from '../../connect/case-view'
export const metadata: Metadata = { title: '전문가 상담 업무 | 빈집진단서', robots: { index: false, follow: false } }
export default async function Page({ params }: { params: Promise<{id:string}> }) {
  const {id} = await params
  return <CaseView id={id} role="expert"/>
}

