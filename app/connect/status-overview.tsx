import Link from 'next/link'
import { formatVisit, type Consultation, type Role } from '@/src/consultations'
import s from './status-overview.module.css'

type StatusCopy = { title: string; description: string; action: string }

function statusFor(row: Consultation, role: Role): StatusCopy {
  const visit = row.visit
  const work = row.kind === '철거' ? '철거' : '매도'
  if (row.stage === 0) return { title: '상담 요청이 접수됐어요', description: `${row.provider}에서 요청 내용을 확인하고 있어요.`, action: role === 'expert' ? '요청 내용을 확인하고 상담을 시작해 주세요.' : '담당자가 확인하면 이곳에서 바로 안내해 드려요.' }
  if (row.stage === 1 && visit?.status === 'proposed') return { title: '방문 일정 조율 중이에요', description: role === 'customer' ? '담당자가 제안한 날짜 중 가능한 시간을 선택해 주세요.' : '고객이 가능한 방문 시간을 고르고 있어요.', action: role === 'customer' ? '방문 날짜 선택하기' : '고객의 날짜 선택을 기다리고 있어요.' }
  if (row.stage === 1 && visit?.status === 'selected') return { title: '방문 일정 확정 중이에요', description: role === 'expert' ? '고객이 선택한 날짜를 확인해 주세요.' : '선택한 날짜를 담당자가 확인하고 있어요.', action: role === 'expert' ? '방문 일정 확정하기' : '담당자 확정을 기다리고 있어요.' }
  if (row.stage === 1 && visit?.status === 'confirmed') return { title: '현장 방문 준비 중이에요', description: `${formatVisit(visit.selected!)}에 현장 확인이 예정되어 있어요.`, action: role === 'expert' ? '방문 전 확인사항을 남겨 주세요.' : '방문 전 궁금한 내용을 남겨 주세요.' }
  if (row.stage === 1 && visit?.status === 'change-requested') return { title: '새 방문 일정을 조율 중이에요', description: role === 'expert' ? '고객이 다른 날짜를 요청했어요.' : '담당자가 새 방문 시간을 제안할 예정이에요.', action: role === 'expert' ? '새 방문 일정 제안하기' : '새 일정 제안을 기다리고 있어요.' }
  if (row.stage === 1) return { title: '상담 중이에요', description: '집 상태와 필요한 확인사항을 담당자와 나누고 있어요.', action: role === 'expert' ? '현장 확인 일정이나 견적을 준비해 주세요.' : '궁금한 내용을 담당자에게 남겨 주세요.' }
  if (row.stage === 2) return { title: `${work} 견적을 확인 중이에요`, description: row.quote ? `${row.provider}에서 ${row.quote.amount.toLocaleString()}만 원 제안을 보냈어요.` : '담당자가 제안을 정리하고 있어요.', action: role === 'customer' ? '견적의 포함·제외 항목 확인하기' : '고객의 견적 확인을 기다리고 있어요.' }
  if (row.stage === 3) return { title: '계약 조건 협의 중이에요', description: '업무 범위·금액·일정을 확인하고 있어요.', action: role === 'customer' ? '계약 조건 확인하기' : '고객과 계약 조건을 조율해 주세요.' }
  if (row.stage === 4) return { title: `${work} 진행 중이에요`, description: '담당자가 진행 상황을 이곳에 남겨드려요.', action: role === 'customer' ? '진행 내용 확인하기' : '진행 상황을 고객에게 공유해 주세요.' }
  if (row.stage === 5) return { title: `${work} 완료 확인 중이에요`, description: '담당자가 남긴 완료 내용을 확인해 주세요.', action: role === 'customer' ? '완료 내용 확인하기' : '고객의 최종 확인을 기다리고 있어요.' }
  return { title: `${work}이 완료됐어요`, description: '상담과 작업 기록은 계속 확인할 수 있어요.', action: '완료 기록 확인하기' }
}

export default function StatusOverview({ row, role }: { row: Consultation; role: Role }) {
  const status = statusFor(row, role)
  return <section className={s.overview} aria-label="공유 진행 현황">
    <div className={s.property}><div><span>함께 보는 집</span><strong>호미곶 시골집</strong><p>포항시 남구 호미곶면 · 주택 66㎡</p></div><Link href="/example-report">진단서 보기 ↗</Link></div>
    <section className={s.current} aria-label="현재 상태"><span>현재 상태</span><h2>{status.title}</h2><p>{status.description}</p><a href="#case-conversation">{status.action} ↓</a></section>
    <p className={s.updated}>최근 업데이트 <time dateTime={row.updatedAt}>{new Date(row.updatedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time></p>
  </section>
}
