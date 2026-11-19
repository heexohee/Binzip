'use client'
import { useState } from 'react'
import { INTEREST_STATUSES, countInterests, filterInterests, type InterestCard, type InterestKind, type InterestStatus } from '../../../src/admin-interests'
import { adminDate } from '../../../src/admin-workflow'
import { deleteInterest, updateInterest } from './actions'
import styles from '../admin.module.css'
import s from './interests.module.css'

const KINDS: { id: InterestKind; label: string }[] = [
  { id: 'management', label: '관리 신청' },
  { id: 'survey', label: '의견 조사·관심 등록' },
]
const phone = (value: string) => value.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3')

export function InterestList({ cards }: { cards: InterestCard[] }) {
  const [kind, setKind] = useState<InterestKind>('management')
  const [status, setStatus] = useState<InterestStatus | 'all'>('all')
  const [query, setQuery] = useState('')
  const counts = countInterests(cards, kind)
  const shown = filterInterests(cards, kind, status, query)
  const label = (id: InterestStatus) => INTEREST_STATUSES.find(item => item.id === id)![kind === 'management' ? 'managementLabel' : 'label']

  return <>
    <div className={s.kinds} role="tablist" aria-label="목록 종류">{KINDS.map(item => <button key={item.id} role="tab" aria-selected={kind === item.id} className={s.kind} onClick={() => { setKind(item.id); setStatus('all') }}>{item.label}<span>{cards.filter(card => card.kind === item.id).length}</span></button>)}</div>
    <div className={`${styles.stats} ${s.statusStats}`} aria-label="상태별 건수">{INTEREST_STATUSES.map(item => <button key={item.id} className={styles.stat} aria-pressed={status === item.id} onClick={() => setStatus(status === item.id ? 'all' : item.id)}><span>{label(item.id)}</span><strong>{counts[item.id]}<small>건</small></strong></button>)}</div>
    <section className={styles.panel} aria-labelledby="interest-title">
      <h2 id="interest-title">{kind === 'management' ? '관리 신청 목록' : '의견 조사·관심 등록 목록'}</h2>
      <div className={styles.tools}><label className={styles.search}>접수번호·전화번호·지역 검색<input type="search" className={styles.input} value={query} onChange={event => setQuery(event.target.value)} placeholder="예: F9F5, 1234, 흥해" maxLength={60} /></label></div>
      <div className={styles.meta}><span role="status">{shown.length}건 표시{status !== 'all' ? ` · ${label(status)}만` : ''}</span>{(query || status !== 'all') && <button onClick={() => { setQuery(''); setStatus('all') }}>필터 초기화</button>}</div>
      {shown.length ? <ul className={styles.list}>{shown.map(card => <li key={card.id} className={s.card}>
        <div className={s.head}>
          <span className={s.status} data-status={card.status}>{label(card.status)}</span>
          {kind === 'management' && <span className={s.receipt}>접수번호 <b>{card.receipt}</b></span>}
          <time className={s.time} dateTime={card.createdAt}>{adminDate(card.createdAt)}</time>
        </div>
        <strong className={s.region}>{card.region}</strong>
        {kind === 'management'
          ? <div className={s.chips}>{[card.homeType ?? '집 종류 미기록', card.applicant ?? '신청하는 분 미기록', card.plan ?? '상품 미기록'].map(chip => <span key={chip}>{chip}</span>)}</div>
          : <ul className={s.details}>{card.details.map(line => <li key={line}>{line}</li>)}</ul>}
        <div className={s.actions}>
          <a className={styles.button} href={'tel:' + card.contact}>전화 {phone(card.contact)}</a>
          <form action={updateInterest} className={s.statusForm}>
            <input type="hidden" name="id" value={card.id} />
            <label>진행 상태<select name="status" className={styles.select} defaultValue={card.status} onChange={event => event.currentTarget.form?.requestSubmit()}>{INTEREST_STATUSES.map(item => <option key={item.id} value={item.id}>{label(item.id)}</option>)}</select></label>
          </form>
        </div>
        <details className={s.danger}><summary>삭제</summary><form action={deleteInterest}><input type="hidden" name="id" value={card.id} /><label className={styles.checkbox}><input type="checkbox" name="confirmDelete" required />이 기록을 영구 삭제하는 것을 확인했어요</label><button type="submit" className={styles.secondary}>영구 삭제</button></form></details>
      </li>)}</ul> : <div className={styles.empty}><strong>{cards.some(card => card.kind === kind) ? '조건에 맞는 기록이 없어요.' : kind === 'management' ? '아직 관리 신청이 없어요.' : '아직 의견 조사 응답이 없어요.'}</strong><p>{cards.some(card => card.kind === kind) ? '검색어나 상태를 바꿔 보세요.' : '접수되면 여기에 표시돼요.'}</p></div>}
    </section>
    <p className={styles.hint} style={{ marginTop: 18 }}>손님이 카카오톡 채널 채팅에 보낸 접수번호로 신청을 찾을 수 있어요. 의견 조사의 가격 응답은 결제·계약 실적이 아니에요. 접수 시각은 한국 시간 기준이에요.</p>
  </>
}
