import { DECISIONS, type Decision } from './decision-actions'
import type { AxisBlock } from './report-view'
import { buildSupports, type Support } from './supports'

export type InstantInput = { address: string; decision: Decision; confirmedPnu?: string }
export type RecordStatus = 'known' | 'empty' | 'error'
export type InstantRecord = { label: string; value: string; source: string; status: RecordStatus }
export type InstantReport = {
  address: string
  addressVerified: boolean
  decision: Decision
  checkedAt: string
  records: InstantRecord[]
  supports: Support[]
  attention: string[]
}
export type InstantResult =
  | { kind: 'invalid' | 'not_found' | 'unavailable' | 'busy'; message: string }
  | { kind: 'confirm'; address: string; roadAddress: string | null; pnu: string; similar: boolean }
  | { kind: 'report'; report: InstantReport }

export function parseInstantInput(raw: unknown): InstantInput | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>
  if (typeof value.address !== 'string' || typeof value.decision !== 'string') return null
  const address = value.address.trim()
  if (address.length < 3 || address.length > 300 || /[\x00-\x1f\x7f]/.test(address)) return null
  if (!DECISIONS.some(item => item.id === value.decision)) return null
  if (value.confirmedPnu !== undefined && (typeof value.confirmedPnu !== 'string' || !/^\d{19}$/.test(value.confirmedPnu))) return null
  return { address, decision: value.decision as Decision, confirmedPnu: value.confirmedPnu as string | undefined }
}

export function guidanceOnly(input: InstantInput, now = new Date()): InstantReport {
  return {
    address: input.address, addressVerified: false, decision: input.decision,
    checkedAt: now.toISOString(), records: [], supports: [],
    attention: ['주소와 공적 기록을 확인하지 못했어요. 아래 내용은 입력한 고민에 따른 확인 순서이며, 이 집의 진단이 완료된 것은 아니에요.'],
  }
}

export function instantOverview(report: InstantReport) {
  const blocks: AxisBlock[] = [{
    axis: 'public-records', label: '조회한 공적 기록', badge: '출처와 확인 상태',
    items: report.records.map(record => ({
      label: record.label, lines: [record.value], source: record.source,
      unverified: record.status !== 'known',
    })),
  }, {
    axis: 'remaining', label: '별도로 확인할 내용', badge: '추가 확인 필요',
    items: [
      { label: '소유관계·채무·세금', lines: ['등기자료, 실제 상환액과 개인의 세금 조건은 확인하지 않았어요.'], source: null, unverified: true },
      { label: '현장 상태·철거 견적', lines: ['건물 안전, 지붕 자재, 내부 잔존물과 실제 공사비는 현장·업체 확인이 필요해요.'], source: null, unverified: true },
      { label: '지원 대상·현재 접수', lines: ['지원사업 선정 여부, 현재 예산과 본인 부담은 관할 기관에 확인해야 해요.'], source: null, unverified: true },
    ],
  }]
  return {
    address: report.address,
    dateLabel: `${new Date(report.checkedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} 조회`,
    documentLabel: report.addressVerified ? '1차 진단서 · 공적 기록과 확인 순서' : '조회 미완료 · 확인 순서 안내',
    records: report.records.map(({ label, value }) => ({ label, value })),
    blocks, supports: report.supports, attention: report.attention,
    initialDecision: report.decision,
  }
}

export function supportsForConfirmedAddress(address: string, pnu: string, hasBuilding: boolean | null) {
  return buildSupports({ address, pnu, facts: { hasBuilding } })
}
