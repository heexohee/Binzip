import { MANAGEMENT_SOURCE } from './management'
import { receiptCode } from './operator-email'

/** Row shape of care_interests; `answers` is absent until the 20261031 migration is applied. */
export type InterestRow = {
  id: string; region: string; location: string | null; residence: string; intent: string; budget: string
  services: string[]; contact: string; email: string | null; source: string; phone_explanation: boolean
  status: string; created_at: string; consent_version: string; answers?: Record<string, unknown> | null
}
export type InterestKind = 'management' | 'survey'
/** Must match the care_interests status check (supabase/migrations/20261119_care_interest_subscription_status.sql). */
export const INTEREST_STATUS_IDS = ['new', 'contacted', 'scheduled', 'subscribed', 'closed'] as const
export type InterestStatus = (typeof INTEREST_STATUS_IDS)[number]
export const INTEREST_STATUSES: { id: InterestStatus; label: string; managementLabel: string }[] = [
  { id: 'new', label: '미연락', managementLabel: '새 신청 · 연락 전' },
  { id: 'contacted', label: '연락함', managementLabel: '상담 중' },
  { id: 'scheduled', label: '방문 예정', managementLabel: '집 확인·계약 예정' },
  { id: 'subscribed', label: '이용 중', managementLabel: '구독 중' },
  { id: 'closed', label: '종료', managementLabel: '해지·종료' },
]

export type InterestCard = {
  id: string; kind: InterestKind; status: InterestStatus; receipt: string; region: string; contact: string
  createdAt: string; homeType: string | null; applicant: string | null; plan: string | null; details: string[]
}

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null)
const asStatus = (value: string): InterestStatus => ((INTEREST_STATUS_IDS as readonly string[]).includes(value) ? value as InterestStatus : 'new')

export function toInterestCard(row: InterestRow): InterestCard {
  const answers = row.answers ?? {}
  const kind: InterestKind = row.source === MANAGEMENT_SOURCE ? 'management' : 'survey'
  const homeType = text(answers.home_type)
  return {
    id: row.id, kind, status: asStatus(row.status), receipt: receiptCode(row.id), region: row.region,
    contact: row.contact, createdAt: row.created_at,
    homeType: homeType === 'apt' ? '아파트·빌라' : homeType === 'house' ? '단독주택·시골집' : null,
    applicant: text(answers.applicant), plan: text(answers.plan) ?? (kind === 'management' ? text(row.budget) : null),
    details: kind === 'management' ? [] : [
      `${row.intent} · ${row.residence}`,
      `가격 의견: ${row.budget}`,
      `필요한 관리: ${row.services.join(', ') || '미선택'}`,
      `전화 설명 요청: ${row.phone_explanation ? '예' : '아니오'} · 유입: ${row.source}`,
      ...(row.location ? [`위치: ${row.location}`] : []),
    ],
  }
}

/** Search matches the receipt code, phone digits or region text; nothing else is indexed. */
export function filterInterests(cards: InterestCard[], kind: InterestKind, status: InterestStatus | 'all', query: string) {
  const q = query.trim().toLowerCase(), digits = q.replace(/\D/g, '')
  return cards.filter(card => card.kind === kind && (status === 'all' || card.status === status) && (!q
    || card.receipt.toLowerCase().includes(q)
    || card.region.toLowerCase().includes(q)
    || (digits.length >= 3 && card.contact.replace(/\D/g, '').includes(digits))))
}

export function countInterests(cards: InterestCard[], kind: InterestKind) {
  const scoped = cards.filter(card => card.kind === kind)
  return Object.fromEntries(INTEREST_STATUSES.map(s => [s.id, scoped.filter(card => card.status === s.id).length])) as Record<InterestStatus, number>
}
