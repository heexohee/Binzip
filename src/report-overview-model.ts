import type { ApplicationRow, ReportRow } from '../app/admin/types'
import { buildAxisBlocks } from './report-view'
import { buildSupports } from './supports'

/** Presentation adapter only. No financial defaults or new diagnosis rules. */
export function buildReportOverview(rep: ReportRow, app: ApplicationRow) {
  const axes = rep.axes
  const facts = (axes as unknown as { facts?: Record<string, unknown> } | null)?.facts ?? {}
  const blocks = buildAxisBlocks(axes, facts, rep.note, { note: rep.registry_note, checkedAt: rep.registry_checked_at })
    .map(block => ({ ...block, items: block.items.map(item => item.label === '현장 상태'
      ? { ...item, label: '담당자 확인 메모', source: rep.note ? (axes?.diagnosis?.fieldVerified ? '담당자 기록 · 현장 확인' : '담당자 기록 · 현장 방문 여부 미확인') : null }
      : item) }))
  const attention: string[] = []
  if (axes?.status && axes.status !== 'ok') attention.push(axes.reason || '주소 또는 진단 대상 범위를 다시 확인해야 해요.')
  if (axes?.error || axes?.sourceErrors?.length) attention.push('일부 자료를 조회하지 못했어요. 조회되지 않은 내용을 문제가 없는 것으로 판단하지 않아요.')
  const restricted = axes?.diagnosis?.axes?.flatMap(axis => (axis.findings ?? []).filter(finding => finding.verdict === 'blocked' || finding.verdict === 'precondition').map(finding => finding.reason || finding.label || '진행 전 확인할 조건이 있어요.')) ?? []
  attention.push(...restricted)
  if (!restricted.length && ['blocked', 'precondition'].includes(rep.verdict ?? '')) attention.push(axes?.diagnosis?.headline || '진행 전에 해결할 조건이 있어요. 아래 권리·건물·토지 근거를 먼저 확인해 주세요.')
  const date = new Date(rep.issued_at ?? rep.created_at)
  const dateLabel = Number.isNaN(date.getTime()) ? '작성일 미확인' : `${date.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' })} 작성`
  const value = (key: string, unit = '') => {
    const raw = facts[key]
    return (typeof raw === 'string' && raw.trim()) || (typeof raw === 'number' && Number.isFinite(raw)) ? `${raw}${unit}` : '미확인'
  }
  return {
    address: app.resolved_address || app.address,
    dateLabel,
    documentLabel: `리포트 ${rep.id.slice(0, 8)} · v${rep.version}`,
    blocks,
    supports: buildSupports({ facts, address: app.resolved_address || app.address, pnu: typeof facts.pnu === 'string' ? facts.pnu : null }),
    records: [
      { label: '건축물대장 용도', value: value('mainPurpose') },
      { label: '대장상 구조', value: value('structure') },
      { label: '사용승인일', value: value('useApprovalDate') },
      { label: '건축면적', value: value('buildingArea', '㎡') },
      { label: '토지면적', value: value('landArea', '㎡') },
      { label: '자료 확인일', value: axes?.checkedAt || '미확인' },
    ],
    attention: [...new Set(attention)],
    ownerCondition: app.condition,
    photoCount: app.photo_count ?? 0,
    fieldVerified: axes?.diagnosis?.fieldVerified === true,
  }
}
