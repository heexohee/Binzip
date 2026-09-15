'use client'
import { useEffect, useState } from 'react'
import { createConsultation, updateConsultation, type Consultation, type Action, type Kind, type Role } from '@/src/consultations'
const prefix = 'binzip-consultation-v1:'
const changed = 'binzip-consultation-changed'
function readAll(): Consultation[] {
  const rows: Consultation[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(prefix)) continue
    const row = JSON.parse(localStorage.getItem(key) || 'null') as Consultation | null
    if (!row || row.version !== 1 || key !== prefix + row.id || !Array.isArray(row.entries) || !Number.isInteger(row.stage) || row.stage < 0 || row.stage > 6) throw new Error('저장된 상담 기록을 불러올 수 없어요.')
    rows.push(row)
  }
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
function save(row: Consultation) {
  localStorage.setItem(prefix + row.id, JSON.stringify(row))
  window.dispatchEvent(new Event(changed))
}
export function requestConsultation(kind: Kind, inquiry: string) {
  const row = createConsultation(crypto.randomUUID(), kind, inquiry, new Date().toISOString())
  save(row)
  return row.id
}
export async function actOnConsultation(id: string, role: Role, action: Action) {
  const commit = () => {
    const current = readAll().find(row => row.id === id)
    if (!current) throw new Error('상담 기록을 찾을 수 없어요.')
    save(updateConsultation(current, role, action, new Date().toISOString()))
  }
  // Serialize changes made from separate customer and expert tabs.
  if (navigator.locks) await navigator.locks.request(prefix + id, commit)
  else commit()
}
export function useConsultations() {
  const [rows, setRows] = useState<Consultation[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const refresh = () => {
      try { setRows(readAll()); setError('') }
      catch { setError('상담 기록을 불러오지 못했어요. 브라우저의 저장소 설정을 확인해 주세요.') }
      finally { setReady(true) }
    }
    refresh()
    window.addEventListener('storage', refresh)
    window.addEventListener(changed, refresh)
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener(changed, refresh) }
  }, [])
  return { rows, ready, error }
}
