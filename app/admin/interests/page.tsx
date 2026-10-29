import Link from 'next/link'
import { requireAdmin } from '../../../src/admin-auth'
import { sbSelect, supabaseConfigured } from '../../../src/supabase'
import { updateInterest } from './actions'
import s from '../../interest/interest.module.css'
export const dynamic = 'force-dynamic'
export const metadata = {title:'보유·관리 관심 등록 관리', robots:{index:false,follow:false},referrer:'no-referrer' as const}
type Interest = {id:string;region:string;location:string|null;residence:string;intent:string;budget:string;services:string[];contact:string;email:string|null;source:string;phone_explanation:boolean;status:string;created_at:string;consent_version:string}
export default async function Page() {
 await requireAdmin()
 let rows:Interest[] = [], error = ''
 try { if (!supabaseConfigured()) throw new Error(); rows = await sbSelect<Interest>('care_interests?select=*&expires_at=gt.' + encodeURIComponent(new Date().toISOString()) + '&order=created_at.desc&limit=500') } catch {error='관심 등록을 불러올 수 없습니다. Supabase 연결과 care-interests.sql 적용 여부를 확인하세요.'}
 return <main className={s.page}><Link href="/admin">← 진단 신청 관리</Link><h1>보유·관리 관심 등록</h1><p>최근 500건 이내의 유효한 응답입니다. 관심과 가격 응답은 결제·계약 실적이 아닙니다.</p>{error ? <p role="alert">{error}</p> : <><p>응답 {rows.length}건 · 보유·관리 {rows.filter(r=>r.intent==='보유하며 관리').length}건 · 미연락 {rows.filter(r=>r.status==='new').length}건</p>{rows.length===0 && <p>아직 접수된 관심 등록이 없습니다.</p>}{rows.map(r=><article className={s.notice} key={r.id} style={{marginBottom:24}}><h2>{r.region} · {r.intent}</h2><p>{r.location || '상세 위치 미입력'} / {r.residence}</p><p>가격 응답: {r.budget}</p><p>필요한 관리: {r.services.join(', ') || '미선택'}</p><p><a href={'tel:'+r.contact}>{r.contact}</a> {r.email && <a href={'mailto:'+r.email}>{r.email}</a>}</p><p>전화 설명 요청: {r.phone_explanation?'예':'아니오'} · 유입: {r.source}</p><p>접수: {new Date(r.created_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})} · 동의 버전: {r.consent_version}</p><form action={updateInterest}><input type="hidden" name="id" value={r.id}/><label>연락 상태 <select name="status" defaultValue={r.status}><option value="new">미연락</option><option value="contacted">연락함</option><option value="closed">종료</option></select></label> <button type="submit">상태 저장</button></form></article>)}</>}</main>
}
