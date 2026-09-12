'use client'

import { useState } from 'react'
import Link from 'next/link'
import { REVIEW_STATES, adminDate, filterApplications, type ApplicationSummary, type ReviewStatus } from '../../src/admin-workflow'
import styles from './admin.module.css'

export function StatusBadge({ status }: { status: ReviewStatus }) {
  return <span className={styles.badge} data-status={status}>{REVIEW_STATES.find(item => item.id === status)?.label}</span>
}

export function ApplicationList({ rows, demo = false, onSelect }: { rows: ApplicationSummary[]; demo?: boolean; onSelect?: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ReviewStatus | 'all'>('all')
  const [photosOnly, setPhotosOnly] = useState(false)
  const filtered = filterApplications(rows, query, status, photosOnly)
  const reset = () => { setQuery(''); setStatus('all'); setPhotosOnly(false) }
  return <>
    <div className={styles.stats} aria-label="접수 상태별 건수">{REVIEW_STATES.map(state => <button key={state.id} className={styles.stat} aria-pressed={status === state.id} onClick={() => setStatus(status === state.id ? 'all' : state.id)}><span>{state.label}</span><strong>{rows.filter(row => row.reviewStatus === state.id).length}<small>건</small></strong></button>)}</div>
    <section className={styles.panel} aria-labelledby="applications-title"><h2 id="applications-title">신청 목록</h2>
      <div className={styles.tools}>
        <label className={styles.search}>주소·고민 검색<input type="search" className={styles.input} value={query} onChange={event => setQuery(event.target.value)} placeholder="주소 또는 철거, 매도 등의 고민" maxLength={300} /></label>
        <label>처리 상태<select className={styles.select} value={status} onChange={event => setStatus(event.target.value as ReviewStatus | 'all')}><option value="all">전체 상태</option>{REVIEW_STATES.map(state => <option key={state.id} value={state.id}>{state.label}</option>)}</select></label>
        <label className={styles.checkbox}><input type="checkbox" checked={photosOnly} onChange={event => setPhotosOnly(event.target.checked)} />사진 있는 신청만</label>
      </div>
      <div className={styles.meta}><span role="status">{filtered.length}건 표시 · {demo ? '가상 신청' : '최근 접수 최대 100건'} 기준</span>{(query || status !== 'all' || photosOnly) && <button onClick={reset}>필터 초기화</button>}</div>
      {filtered.length ? <ul className={styles.list}>{filtered.map(row => {
        const content = <><StatusBadge status={row.reviewStatus} /><div><strong className={styles.address}>{row.resolved_address || row.address}</strong><div className={styles.subline}><span>{row.concern || '고민 미입력'}</span><span>{row.photo_count === undefined ? '사진 수 미확인' : `사진 ${row.photo_count}장`}</span><span>{row.reportStatus === 'issued' ? '진단서 공개 승인됨' : row.reportStatus === 'failed' ? '초안 생성 실패' : row.reportStatus === 'draft' ? '진단서 초안 있음' : '진단서 초안 없음'}</span></div></div><div className={styles.itemEnd}><strong>{row.nextCheck}</strong><time dateTime={row.created_at}>{adminDate(row.created_at)}</time></div><span className={styles.chevron} aria-hidden="true">→</span></>
        return <li key={row.id} className={styles.item}>{demo ? <button className={styles.itemLink} onClick={() => onSelect?.(row.id)}>{content}</button> : <Link className={styles.itemLink} href={'/admin/' + row.id}>{content}</Link>}</li>
      })}</ul> : <div className={styles.empty}><strong>{rows.length ? '조건에 맞는 신청이 없어요.' : '아직 추가 확인 신청이 없어요.'}</strong><p>{rows.length ? '검색어나 필터를 바꿔보세요.' : '고객이 사진·연락처와 함께 추가 확인을 신청하면 여기에 표시됩니다.'}</p></div>}
    </section>
    <p className={styles.hint} style={{ marginTop: 18 }}>즉시 진단만 조회한 방문자는 이 목록에 저장되지 않습니다. 처리 완료와 진단서 공개 승인은 별도로 관리합니다. 접수 시각은 한국 시간 기준입니다.</p>
  </>
}
