/**
 * Supabase REST 최소 클라이언트.
 * SDK 를 들이지 않는다 — 우리가 쓰는 건 insert 와 select 뿐이다.
 *
 * service_role 키는 RLS 를 우회하므로 서버에서만 쓴다.
 * 스키마에 정책을 하나도 만들지 않았기 때문에 anon 키로는 아무것도 되지 않는다.
 */
function conn() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return { base: url.replace(/\/+$/, ''), key }
}

export function supabaseConfigured(): boolean {
  return conn() !== null
}

/** 한 행을 넣고 생성된 행을 돌려준다. 설정이 없으면 null. */
export async function sbInsert<T = Record<string, unknown>>(
  table: string,
  row: Record<string, unknown>,
): Promise<T | null> {
  const c = conn()
  if (!c) return null

  const res = await fetch(c.base + '/rest/v1/' + table, {
    method: 'POST',
    headers: {
      apikey: c.key,
      Authorization: 'Bearer ' + c.key,
      'Content-Type': 'application/json',
      // id 를 받아야 진단서를 신청에 연결할 수 있다
      Prefer: 'return=representation',
    },
    body: JSON.stringify([row]),
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(table + ' insert ' + res.status + ' ' + (await res.text()).slice(0, 300))
  }
  const rows = (await res.json()) as T[]
  return rows[0] ?? null
}

/** PostgREST 질의. path 예: "applications?select=*&order=created_at.desc" */
export async function sbSelect<T = Record<string, unknown>>(path: string): Promise<T[]> {
  const c = conn()
  if (!c) return []
  const res = await fetch(c.base + '/rest/v1/' + path, {
    headers: { apikey: c.key, Authorization: 'Bearer ' + c.key },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error('select ' + res.status + ' ' + (await res.text()).slice(0, 300))
  }
  return (await res.json()) as T[]
}

/** filter 예: "id=eq.<uuid>" */
export async function sbUpdate<T = Record<string, unknown>>(
  table: string,
  filter: string,
  patch: Record<string, unknown>,
): Promise<T | null> {
  const c = conn()
  if (!c) return null
  const res = await fetch(c.base + '/rest/v1/' + table + '?' + filter, {
    method: 'PATCH',
    headers: {
      apikey: c.key,
      Authorization: 'Bearer ' + c.key,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(patch),
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(table + ' update ' + res.status + ' ' + (await res.text()).slice(0, 300))
  }
  const rows = (await res.json()) as T[]
  return rows[0] ?? null
}
