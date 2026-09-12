/** 검토 화면이 읽는 모양. Supabase 컬럼은 snake_case 다. */
export type ApplicationRow = {
  id: string
  address: string
  resolved_address: string | null
  pnu: string | null
  match_quality: string | null
  condition: string | null
  acquisition: string | null
  ownership: string | null
  concern: string | null
  speed: string | null
  channel: string | null
  contact: string
  email: string
  created_at: string
  expires_at: string
  /** Absent on records predating the optional photo migration. */
  photo_count?: number
  /** Optional until the admin workflow migration is applied. Never included in customer reports. */
  review_status?: 'received' | 'reviewing' | 'waiting' | 'completed'
  internal_note?: string | null
  review_updated_at?: string | null
}

export type Finding = {
  label?: string
  reason?: string
  /** 그래서 무엇을 하면 되는가. 룰이 만들고 진단서가 그대로 보여준다 */
  nextStep?: string
  verdict?: string
  source?: string
}
export type AxisSummary = { axis: string; verdict: string; findings?: Finding[] }

/** reports.axes 에 판정 전문이 그대로 들어 있다 */
export type Axes = {
  status?: 'ok' | 'out_of_scope' | 'address_not_found'
  reason?: string
  gateId?: string
  observations?: string[]
  sourceErrors?: string[]
  checkedAt?: string
  error?: string
  diagnosis?: {
    grade?: string
    decidedBy?: string | null
    headline?: string
    fieldVerified?: boolean
    axes?: AxisSummary[]
  }
}

export type ReportRow = {
  id: string
  application_id: string
  version: number
  status: 'draft' | 'issued' | 'failed'
  verdict: string | null
  axes: Axes | null
  note: string | null
  /** ⑥ 등기 — 사람이 등기소에서 확인해 적는다 */
  registry_note: string | null
  registry_checked_at: string | null
  issued_at: string | null
  created_at: string
}

export const AXIS_LABEL: Record<string, string> = {
  legal: '① 법적',
  physical: '② 물리적',
  regulatory: '③ 규제',
}

export const VERDICT_LABEL: Record<string, string> = {
  possible: '지금 처분 가능',
  conditional: '조건부',
  blocked: '지금은 불가',
}

/** 판정 표기는 신호등을 쓰지 않는다. 같은 청록의 명도 3단이다. */
export const VERDICT_DOTS: Record<string, string> = {
  possible: '●●●',
  conditional: '●●○',
  blocked: '●○○',
}
