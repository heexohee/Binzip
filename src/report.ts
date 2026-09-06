import { diagnose } from './pipeline'
import { sbInsert, sbSelect, supabaseConfigured } from './supabase'
import type { Grade } from './verdict'

/**
 * 화면 등급 → DB 값. '대상 아님'은 셋 중 어디에도 없으므로 null 로 둔다.
 * 승인 시 재판정하는 app/admin/actions.ts 도 같은 맵을 쓴다 —
 * 두 벌로 만들면 갈라진다.
 */
export const VERDICT: Record<Grade, string> = {
  가능: 'possible',
  조건부: 'conditional',
  불가: 'blocked',
}

/** 공공 API 를 5~6개 부르므로 상한을 둔다. 넘으면 failed 로 남기고 나중에 재실행한다. */
const TIMEOUT_MS = 20_000

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms)),
  ])
}

/**
 * 신청이 저장된 직후 자동 판정을 돌려 진단서 초안을 만든다.
 *
 * 이 초안은 그대로 나가지 않는다 — 사람이 검토 화면에서 확인하고 승인해야
 * status 가 issued 로 바뀐다. 자동 판정만으로는 '가능'이 나오지 않도록
 * combine(fieldVerified=false) 가 이미 막고 있다.
 *
 * 판정이 실패해도 신청은 이미 저장돼 있다. 실패를 조용히 넘기지 않고
 * status: failed 로 남겨 검토 화면에서 다시 돌릴 수 있게 한다.
 */
export async function createDraftReport(applicationId: string, query: string): Promise<void> {
  if (!supabaseConfigured()) return

  // 재판정은 기존 진단서를 덮지 않고 새 버전으로 쌓는다.
  // 무엇이 어떻게 바뀌었는지 남아야 하고, unique(application_id, version) 제약도 있다.
  const version = await nextVersion(applicationId)

  try {
    const result = await withTimeout(diagnose(query), TIMEOUT_MS)

    const verdict =
      result.status === 'ok' ? (VERDICT[result.diagnosis.grade] ?? null) : null

    await sbInsert('reports', {
      application_id: applicationId,
      version,
      status: 'draft',
      verdict,
      // 판정 전문을 그대로 담는다. 진단서 6항목·6경로는 여기서 만들어낸다.
      axes: result,
      paths: null,
    })
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e)
    console.error('[report] 자동 판정 실패', { applicationId, reason })
    try {
      await sbInsert('reports', {
        application_id: applicationId,
        version,
        status: 'failed',
        verdict: null,
        axes: { error: reason },
        paths: null,
      })
    } catch (inner) {
      console.error('[report] failed 기록마저 실패', inner)
    }
  }
}

async function nextVersion(applicationId: string): Promise<number> {
  try {
    const rows = await sbSelect<{ version: number }>(
      'reports?select=version&application_id=eq.' + applicationId + '&order=version.desc&limit=1',
    )
    return (rows[0]?.version ?? 0) + 1
  } catch {
    return 1
  }
}
