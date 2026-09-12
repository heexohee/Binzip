'use client'
import Link from 'next/link'

export default function AdminError({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-[700px] px-6 py-16"><h1 className="text-[length:var(--type-page)]">관리 화면을 불러오지 못했어요</h1><p className="mt-4 text-muted">로그인이나 데이터 연결 상태를 확인한 뒤 다시 시도해 주세요. 오류 상세에는 고객 정보가 포함될 수 있어 표시하지 않습니다.</p><div className="mt-6 flex flex-wrap gap-4"><button onClick={reset} className="rounded border border-line px-5 py-3">다시 시도</button><Link href="/admin/login" className="rounded border border-line px-5 py-3">로그인 화면</Link></div></main>
}
