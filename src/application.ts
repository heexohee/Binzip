import { sbInsert } from './supabase'

/** 진단 신청 레코드. 개인정보는 주소와 연락처 둘뿐이다 — 이름·주민번호는 받지 않는다. */
export type Application = {
  address: string
  condition: string | null
  channel: string | null
  /** 항상 필수. 발송이 실패해도 닿을 수단이 하나는 있어야 한다 */
  contact: string
  /** 이메일로 받겠다고 고른 경우에만 채워진다 */
  email: string | null
  acquisition: string | null
  ownership: string | null
  /** 진단서에서 어느 경로를 맨 위에 놓을지 정한다 */
  concern: string | null
  speed: string | null
  /** ISO 8601 */
  createdAt: string
  /** 파기 예정 시각. 보관 정책을 레코드에 못 박아 실제 만료가 가능하게 한다. */
  expiresAt: string
  /** 화면에서 주소를 확인했을 때만 채워진다. 판정 파이프라인의 입력이 된다. */
  pnu: string | null
  resolvedAddress: string | null
  matchQuality: 'exact' | 'road' | 'fuzzy' | null
}

/**
 * 보관 기간 — 진단서 발송 후 6개월.
 * 개인정보보호법 제21조(보유기간 경과·목적 달성 시 지체 없는 파기) 취지에 맞춰
 * 화면에 약속한 6개월을 레코드에 기록한다.
 * 그 전에 정보주체가 삭제를 요구하면(같은 법 제36조) 즉시 삭제한다 — 푸터의 전화·이메일이 그 창구다.
 */
export const RETENTION_MONTHS = 6

export function expiryFrom(base: Date): string {
  const d = new Date(base)
  d.setMonth(d.getMonth() + RETENTION_MONTHS)
  return d.toISOString()
}

/** Server Action 반환 상태. 필드 오류는 필드명 → 문구. */
export type ApplyState = {
  ok: boolean
  errors: Record<string, string>
  message: string | null
}

/**
 * 신청을 저장한다. 설정된 경로 전부에 쓰고, 하나도 성공하지 못하면 던진다.
 * 서버리스는 파일 쓰기가 불가하므로 로컬 폴백을 두지 않는다 (docs/설계.md).
 * 의존성을 늘리지 않기 위해 SDK 없이 REST 로 호출한다.
 */
export async function saveApplication(
  app: Application,
): Promise<{ stored: string[]; applicationId: string | null }> {
  const stored: string[] = []
  const failures: string[] = []
  let applicationId: string | null = null

  const [sb, mail] = await Promise.allSettled([saveToSupabase(app), notifyByEmail(app)])

  if (sb.status === 'fulfilled') {
    if (sb.value) {
      stored.push('supabase')
      applicationId = sb.value
    }
  } else {
    failures.push(describe(sb.reason))
  }

  if (mail.status === 'fulfilled') {
    if (mail.value) stored.push(mail.value)
  } else {
    failures.push(describe(mail.reason))
  }

  // 부분 실패도 반드시 남긴다. 한쪽이 성공하면 다른 쪽 실패가 묻혀서,
  // 화면에는 '접수됐습니다'가 뜨는데 DB 에는 아무것도 없는 상태가 된다.
  if (failures.length > 0) {
    console.error('[application] 일부 저장 경로 실패', { stored, failures })
  }
  if (stored.length === 0) {
    // 신청 유실은 되돌릴 수 없으므로 조용히 넘기지 않는다.
    console.error('[application] 저장 경로가 하나도 동작하지 않았다', failures)
    throw new Error('NO_STORAGE_CONFIGURED')
  }
  return { stored, applicationId }
}

/** 생성된 신청 id 를 돌려준다. 진단서를 여기에 붙여야 한다. */
async function saveToSupabase(app: Application): Promise<string | null> {
  const row = await sbInsert<{ id: string }>('applications', toRow(app))
  return row?.id ?? null
}

async function notifyByEmail(app: Application): Promise<string | null> {
  const key = process.env.RESEND_API_KEY
  const to = process.env.NOTIFY_EMAIL
  const from = process.env.NOTIFY_FROM
  if (!key || !to || !from) return null

  const or = (v: string | null) => v ?? '(적지 않음)'
  const lines = [
    '빈집 주소: ' + app.address,
    '확인된 주소: ' + or(app.resolvedAddress) + (app.matchQuality ? ' [' + app.matchQuality + ']' : ''),
    'PNU: ' + or(app.pnu),
    '',
    '집 상태: ' + or(app.condition),
    '취득 경위: ' + or(app.acquisition),
    '소유 관계: ' + or(app.ownership),
    '가장 걱정되는 것: ' + or(app.concern),
    '희망 소요: ' + or(app.speed),
    '',
    '받을 방법: ' + or(app.channel),
    '전화번호: ' + app.contact,
    '이메일: ' + or(app.email),
    '신청 시각: ' + app.createdAt,
  ]

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: '[빈집이력서] 진단 신청 — ' + app.address,
      text: lines.join('\n'),
    }),
    cache: 'no-store',
    // 다른 외부 호출과 같은 상한을 둔다. 없으면 Resend 가 느려질 때
    // allSettled 가 그만큼 기다리고 사용자 제출 응답이 늦어진다.
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) {
    // 응답 본문에 수신 주소가 담겨 나온다. 로그에 이메일을 남기지 않는다.
    throw new Error('resend ' + res.status)
  }
  return 'resend'
}

/**
 * 코드는 camelCase, 테이블 컬럼은 snake_case 다.
 * 그대로 보내면 PostgREST 가 '없는 컬럼'이라며 통째로 거부한다.
 */
function toRow(app: Application) {
  return {
    address: app.address,
    resolved_address: app.resolvedAddress,
    pnu: app.pnu,
    match_quality: app.matchQuality,
    condition: app.condition,
    acquisition: app.acquisition,
    ownership: app.ownership,
    concern: app.concern,
    speed: app.speed,
    channel: app.channel,
    contact: app.contact,
    email: app.email,
    created_at: app.createdAt,
    expires_at: app.expiresAt,
  }
}

function describe(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}
