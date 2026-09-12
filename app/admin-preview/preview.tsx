'use client'

import { useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { AdminFrame, AdminTitle } from '../admin/admin-frame'
import { ApplicationList, StatusBadge } from '../admin/application-list'
import { Icon } from '../home-ui'
import { REVIEW_STATES, parseWorkflow, summarizeApplication, type AdminApplication, type ReviewStatus } from '../../src/admin-workflow'
import { DEMO_APPLICATIONS } from './demo-data'
import styles from '../admin/admin.module.css'

export function AdminPreview() {
  const [rows, setRows] = useState(DEMO_APPLICATIONS)
  const [selected, setSelected] = useState<string | null>(null)
  const view = useRef<HTMLDivElement>(null)
  const app = rows.find(row => row.id === selected)
  function navigate(id: string | null) {
    setSelected(id)
    requestAnimationFrame(() => { view.current?.querySelector('h1')?.focus({ preventScroll: true }); window.scrollTo(0, 0) })
  }
  function save(id: string, status: ReviewStatus, note: string) {
    setRows(current => current.map(row => row.id === id ? { ...row, review_status: status, internal_note: note } : row))
  }
  return <AdminFrame demo navigation={<Link href="/admin/login">실제 관리자 로그인</Link>}>
    <div className={styles.notice}><strong>관리자 화면 미리보기 · 가상 신청 6건</strong>실제 고객 정보가 아닙니다. 검색·신청 상세·처리 기록을 체험할 수 있고, 변경 내용은 새로고침하면 초기화됩니다.</div>
    <div ref={view}>{app ? <><button className={styles.back} onClick={() => navigate(null)}>← 신청 목록으로</button><DemoDetail key={app.id} app={app} onSave={save} /></> : <><AdminTitle /><ApplicationList rows={rows.map(summarizeApplication)} demo onSelect={navigate} /></>}</div>
  </AdminFrame>
}

function DemoDetail({ app, onSave }: { app: AdminApplication; onSave: (id: string, status: ReviewStatus, note: string) => void }) {
  const [status, setStatus] = useState<ReviewStatus>(app.review_status ?? 'received')
  const [note, setNote] = useState(app.internal_note ?? '')
  const [message, setMessage] = useState('')
  function submit(event: FormEvent) {
    event.preventDefault()
    const value = parseWorkflow(status, note)
    if (!value) { setMessage('처리 상태와 메모를 확인해 주세요.'); return }
    onSave(app.id, value.status, value.note)
    setMessage('미리보기에 반영했어요. 실제 저장·고객 알림은 실행되지 않았습니다.')
  }
  return <>
    <div className={styles.titleRow}><div><p className={styles.eyebrow}>추가 확인 신청 · 가상 데이터</p><h1 tabIndex={-1} className={styles.title}>{app.address}</h1><p className={styles.description}>{app.concern}</p></div><StatusBadge status={app.review_status ?? 'received'} /></div>
    <section className={styles.panel}><h2>처리 상태와 내부 메모</h2><p className={styles.description}>다음에 확인할 일과 고객에게 요청한 내용을 기록하세요. 고객 진단서에는 표시되지 않습니다.</p><form onSubmit={submit}>
      <div className={styles.workflow}><label className={styles.field}>처리 상태<select className={styles.select} value={status} onChange={event => { setStatus(event.target.value as ReviewStatus); setMessage('') }}>{REVIEW_STATES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select><span className={styles.hint}>진단서 공개 승인·고객 발송과 별개입니다.</span></label><label className={styles.field}>내부 메모<textarea className={styles.textarea} rows={4} value={note} onChange={event => { setNote(event.target.value); setMessage('') }} maxLength={5000} placeholder="다음에 확인할 일이나 고객에게 요청한 내용을 적으세요." /><span className={styles.hint}>내부 업무 기록 · 최대 5,000자</span></label></div><div className={styles.actions}><button className={styles.button}>처리 기록 저장</button><span className={styles.hint}>체험용 · 이 화면에서만 반영</span></div><p className={styles.message} role="status">{message}</p>
    </form></section>
    <div className={styles.detailGrid}><section className={styles.panel}><h2>고객이 알려준 내용</h2><p><strong>집 상태</strong><br />{app.condition}</p><p><strong>취득 경위</strong><br />{app.acquisition}</p><p><strong>소유관계</strong><br />{app.ownership}</p><p><strong>연락 정보</strong><br />미리보기에는 실제 연락처가 없습니다.</p></section><section className={styles.panel}><h2>첨부 사진 · {app.photo_count}장 예시</h2><div className={styles.photoPlaceholder}><Icon name="house" /><strong>{app.photo_count ? '고객이 보낸 사진을 확인하는 공간' : '사진 없이 신청한 경우'}</strong><span className={styles.hint}>미리보기에는 실제 사진을 넣지 않았어요.</span></div><p className={styles.hint}>실제 접수 사진은 로그인한 관리자만 열 수 있습니다. 사진 관찰과 현장 확인을 구분해 기록합니다.</p></section></div>
    <section className={styles.panel}><h2>추가 검토 진단서</h2><p className={styles.description}>{summarizeApplication(app).nextCheck}. 실제 관리자 화면에서는 자동 초안의 근거를 살펴보고, 고객에게 공개할 내용을 검토합니다.</p><div className={styles.actions}><Link href="/example-report" className={styles.secondary}>고객 진단서 예시 보기 →</Link><span className={styles.hint}>이 가상 신청을 분석한 결과가 아닌 공통 예시입니다.</span></div></section>
  </>
}
