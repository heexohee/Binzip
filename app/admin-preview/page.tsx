import { AdminPreview } from './preview'

export const metadata = { title: '관리자 화면 미리보기 — 빈집진단서', robots: { index: false, follow: false }, referrer: 'no-referrer' as const }

export default function PreviewPage() { return <AdminPreview /> }
