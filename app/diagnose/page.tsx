import type { Metadata } from 'next'
import { InstantDiagnosis } from './instant-diagnosis'

export const metadata: Metadata = {
  title: '1차 진단서 바로 보기 — 빈집진단서',
  robots: { index: false, follow: false }, referrer: 'no-referrer',
}
export const maxDuration = 30
export default function DiagnosePage() { return <InstantDiagnosis /> }
