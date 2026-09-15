'use client'
import Link from 'next/link'
import { useState } from 'react'
import { stages } from '@/src/consultations'
import { useConsultations } from '../connect/consultation-store'
import { ConnectionHeader } from '../connect/shared'
import s from '../connect/connection.module.css'
export default function ExpertDashboard() {
  const {rows,ready,error} = useConsultations()
  const [filter,setFilter] = useState('전체')
  const filtered = rows.filter(row=>filter==='전체'||(filter==='새 요청'?row.stage===0:filter==='진행 중'?row.stage>0&&row.stage<6:row.stage===6))
  return <main className={s.page}><ConnectionHeader expert/>
    <div className={s.top}><div><p className={s.eyebrow}>전문가 업무</p><h1>요청받은 상담을 확인하세요.</h1></div></div>
    <section className={s.card}><div className={s.filters} aria-label="상담 상태 필터">{['전체','새 요청','진행 중','완료'].map(item=><button key={item} aria-pressed={filter===item} onClick={()=>setFilter(item)}>{item}</button>)}</div>
      {!ready ? <p role="status">상담을 불러오고 있어요.</p> : error ? <p role="alert">{error}</p> : filtered.length===0 ? <p>해당하는 상담이 아직 없어요.</p> : <div className={s.caseList}>{filtered.map(row=><Link key={row.id} href={'/experts/'+row.id}><div><span className={s.badge}>{stages[row.stage]}</span><h2>호미곶 시골집 · {row.kind} 상담</h2><p>{row.provider}</p><small>{new Date(row.createdAt).toLocaleDateString('ko-KR')} 접수</small></div><span>상담 열기 →</span></Link>)}</div>}
    </section>
  </main>
}

