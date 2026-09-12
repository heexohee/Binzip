'use client'

import { useActionState, useEffect } from 'react'
import { loginAdmin } from './actions'
import styles from '../admin.module.css'

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, { message: '' })
  useEffect(() => { if (state.ok) window.location.assign('/admin') }, [state.ok])
  return <form action={action}><label className={styles.field}>관리자 접근 키<input className={styles.input} name="token" type="password" autoComplete="current-password" required maxLength={1024} /></label><div className={styles.actions}><button disabled={pending} className={styles.button}>{pending ? '확인 중…' : '로그인'}</button></div><p className={styles.message} role="status">{state.message}</p></form>
}
