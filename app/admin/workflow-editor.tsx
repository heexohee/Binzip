'use client'

import { useActionState, useEffect, useState } from 'react'
import { REVIEW_STATES, adminDate, type ReviewStatus } from '../../src/admin-workflow'
import { saveWorkflow } from './workflow-actions'
import styles from './admin.module.css'

export function WorkflowEditor({ id, status, note, updatedAt, available }: { id: string; status: ReviewStatus; note: string; updatedAt?: string | null; available: boolean }) {
  const [state, action, pending] = useActionState(saveWorkflow.bind(null, id), { ok: false, message: '' })
  const [ready, setReady] = useState(false)
  // Keep early edits from being overwritten when the streamed form hydrates.
  useEffect(() => setReady(true), [])
  return <section className={styles.panel} aria-labelledby="workflow-title"><h2 id="workflow-title">처리 상태와 내부 메모</h2><p className={styles.description}>다음에 확인할 일과 고객에게 요청한 내용을 남겨두세요. 이 메모는 고객 진단서에 표시되지 않습니다.</p>
    {!available && <p className={styles.notice} style={{ marginTop: 16 }}>신청 조회는 가능하지만, 상태·메모 저장은 데이터베이스 업데이트 후 사용할 수 있어요.</p>}
    <form action={action}><fieldset disabled={!available || pending || !ready}>
      <legend className="sr-only">신청 처리 기록</legend>
      <div className={styles.workflow}><label className={styles.field}>처리 상태<select name="reviewStatus" className={styles.select} defaultValue={status}>{REVIEW_STATES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select><span className={styles.hint}>상태 변경은 진단서 공개 승인이나 고객 발송을 실행하지 않습니다.</span></label>
        <label className={styles.field}>내부 메모<textarea name="internalNote" className={styles.textarea} rows={4} defaultValue={note} maxLength={5000} placeholder="예: 철거 범위 확인이 필요함. 고객에게 본채와 별채 사진을 추가 요청할 예정." /><span className={styles.hint}>내부 업무 기록 · 최대 5,000자</span></label></div>
      <div className={styles.actions}><button className={styles.button} disabled={!available || pending || !ready}>{!ready ? '양식 준비 중…' : pending ? '저장 중…' : '처리 기록 저장'}</button>{updatedAt && <span className={styles.hint}>마지막 기록 {adminDate(updatedAt)}</span>}</div>
    </fieldset><p role="status" className={styles.message} data-error={!state.ok}>{state.message}</p></form>
  </section>
}
