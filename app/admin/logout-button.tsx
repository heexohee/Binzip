'use client'

import { useState } from 'react'
import { logoutAdmin } from './login/actions'

export function LogoutButton() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function logout() {
    setPending(true)
    try { await logoutAdmin(); window.location.assign('/admin/login') }
    catch { setError('로그아웃하지 못했어요. 다시 시도해 주세요.'); setPending(false) }
  }
  return <span><button onClick={logout} disabled={pending}>{pending ? '로그아웃 중…' : '로그아웃'}</button><span role="status">{error}</span></span>
}
