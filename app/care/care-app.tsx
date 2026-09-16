'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Brand } from '../home-ui'
import s from './care.module.css'

type Role = '고객' | '현장 담당자'
type Check = '확인 전' | '관리 완료' | '추가 확인' | '접근 불가'
type Report = { checks: Check[]; memo: string; photos: string[]; missing: string }
type Job = { title: string; cost: number; reason: string; status: '승인 대기' | '승인 완료' | '보류' | '작업 완료' }
const items = ['환기·실내 습기', '배수구·누수 흔적', '마당·잡초', '창문·출입문 잠금', '외벽·지붕 육안 확인']
const initialMessages: { role: Role; text: string }[] = [{role:'고객', text:'이번 방문에 뒷마당 배수구도 한 번 확인해 주세요.'}]
export default function CareApp() {
 const [role, setRole] = useState<Role>('고객')
 const [tab,setTab] = useState('홈')
 const [started,start] = useState(false)
 const [checks,setChecks] = useState<Check[]>(items.map(()=> '확인 전'))
 const [memo,setMemo] = useState('')
 const [photos,setPhotos] = useState<string[]>([])
 const [missing,setMissing] = useState('')
 const [report,setReport] = useState<Report | null>(null)
 const [job,setJob] = useState<Job | null>(null)
 const [title,setTitle] = useState('뒷마당 배수구 정리')
 const [cost,setCost] = useState('30000')
 const [reason,setReason] = useState('')
 const [messages,setMessages] = useState(initialMessages)
 const [message,setMessage] = useState('')
 const [notice,setNotice] = useState('')
 const [uploading,setUploading] = useState(false)
 const [read,setRead] = useState(false)
 const tabs = ['홈','방문 기록','문의','최초 진단']
 function changeRole(r:Role) { setRole(r);setTab('홈');setNotice('') }
 async function upload(files: FileList | null) {
  if(!files)return
  if(files.length+photos.length>4){setNotice('사진은 최대 4장까지 첨부해 주세요.');return}
  const selected=Array.from(files)
  if(selected.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>5*1024*1024)){setNotice('JPG·PNG·WebP 사진을 장당 5MB 이하로 선택해 주세요.');return}
  setUploading(true)
  try {const result=await Promise.all(selected.map(f=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error());reader.readAsDataURL(f)})));setPhotos(p=>[...p,...result]);setNotice('사진을 첨부했어요.')}
  catch{setNotice('사진을 읽지 못했어요. 다시 선택해 주세요.')}
  finally{setUploading(false)}
 }
 function submitReport() {
  if(checks.includes('확인 전')){setNotice('모든 점검 항목에 결과를 선택해 주세요.');return}
  if(!memo.trim()){setNotice('현장 메모를 입력해 주세요. 추가 확인·접근 불가 항목은 이유도 적어 주세요.');return}
  if(!photos.length&&!missing.trim()){setNotice('사진을 첨부하거나 사진이 없는 이유를 적어 주세요.');return}
  setReport({checks:[...checks],memo:memo.trim(),photos:[...photos],missing:missing.trim()});setNotice('방문 보고가 등록됐어요. 고객 화면에서도 확인할 수 있어요.')
 }
 function reset(){if(!window.confirm('입력한 방문 보고와 문의를 지우고 처음부터 시연할까요?'))return;start(false);setChecks(items.map(()=> '확인 전'));setMemo('');setPhotos([]);setMissing('');setReport(null);setJob(null);setMessages(initialMessages);setRead(false);setNotice('시연을 초기화했어요.');setTab('홈')}
 const status = report ? '방문 완료' : started ? '점검 중' : '방문 예정'
 return <div className={s.app}>
  <div className={s.demo}><span>체험용 앱 · 가상 주택과 방문 일정입니다. 입력 내용은 새로고침하면 사라져요.</span><button onClick={reset}>처음부터</button></div>
  <header className={s.header}><Brand/><div className={s.roles} aria-label="화면 역할 선택">{(['고객','현장 담당자'] as Role[]).map(r=><button key={r} aria-pressed={role===r} onClick={()=>changeRole(r)}>{r}</button>)}</div></header>
  <div className={s.layout}>
   <aside className={s.sidebar}><p className={s.eyebrow}>집토끼 돌봄</p><h2>{role==='고객'?'내 집 관리':'현장 관리'}</h2><nav aria-label="관리 메뉴">{tabs.map((t,i)=><button key={t} className={tab===t?s.active:''} aria-current={tab===t?'page':undefined} onClick={()=>{setTab(t);setNotice('')}}><span aria-hidden="true">{['⌂','▤','◌','▧'][i]}</span>{t}</button>)}</nav><div className={s.sideNote}>멀리 있어도,<br/>집의 안부는 가까이.</div><Link href="/">서비스 홈으로 ↗</Link></aside>
   <main className={s.main}>
    <div className={s.heading}><div><p className={s.eyebrow}>{role==='고객'?'우리 집의 안부':'오늘의 방문 업무'} / 포항 · 호미곶</p><h1>{tab==='홈'?(role==='고객'?'집을 살피는 일, 함께해요.':'오늘도 꼼꼼히 살펴주세요.'):tab}</h1></div><span className={s.date}>2026년 9월 14일 · 월요일</span></div>
    <div role="status" aria-live="polite" className={notice?s.notice:s.silent}>{notice}</div>
    {tab==='홈'&&<>
     <section className={s.hero}><div><span className={s.pill}>{status}</span><h2>대보리 우리 집</h2><p>경북 포항시 남구 호미곶면 대보리 126-6</p><div className={s.heroFacts}><div><small>이번 방문</small><strong>9월 14일 · 오전 10시</strong></div><div><small>방문 담당자</small><strong>김관리 매니저</strong></div></div></div><img src="/mascot/binzip-rabbit-v1.png" alt="집을 안고 있는 집토끼"/></section>
     <div className={s.grid}>
      <section className={s.card}><div className={s.cardHeading}><h2>{role==='고객'?'이번 방문은 여기까지':'방문 진행'}</h2><span className={s.pill}>{status}</span></div><ol className={s.steps}>{['방문 예약','현장 점검','보고서 전달'].map((x,i)=><li key={x} className={(i===0||i===1&&started||i===2&&report)?s.done:''}><span>{i+1}</span>{x}</li>)}</ol>{role==='고객'?<><p>{report?'담당자가 남긴 점검 결과와 사진을 확인해 주세요.':started?'담당자가 현장 점검을 시작했어요. 보고가 등록되면 여기에서 확인할 수 있어요.':'환기, 배수, 잡초와 출입문 상태를 살필 예정이에요.'}</p>{report&&<button className={s.primary} onClick={()=>setTab('방문 기록')}>이번 방문 보고 보기 →</button>}</>:<><p>도착 후 방문을 시작하고, 확인한 항목만 기록해 주세요.</p><button className={s.primary} onClick={()=>{start(true);setTab('방문 기록')}}>{report?'등록한 보고 보기':started?'점검 이어서 작성':'방문 시작하기 →'}</button></>}</section>
      <section className={s.card}><div className={s.cardHeading}><h2>관리 약속</h2><span className={s.tag}>정기 방문</span></div><p className={s.large}>월 1회, 집의 변화를 기록해요.</p><p>육안 점검과 기본 관리, 사진 보고를 포함해요. 수리·제초 같은 추가 작업은 먼저 비용을 안내하고 승인을 받아요.</p><div className={s.rule}>다음 정기 방문 <strong>10월 14일</strong></div></section>
     </div>
     <section className={s.card}><div className={s.cardHeading}><h2>{role==='고객'?'결정이 필요한 추가 작업':'추가 작업 요청'}</h2><span className={s.tag}>{job?.status??'등록된 작업 없음'}</span></div>{job?<><div className={s.job}><div><h3>{job.title}</h3><p>{job.reason}</p></div><strong>{job.cost.toLocaleString()}원</strong></div><p>이 작업만의 총 제안 금액이에요. 승인이 결제나 실제 업체 발주로 이어지지는 않아요.</p>{role==='고객'&&job.status==='승인 대기'&&<div className={s.actions}><button className={s.primary} onClick={()=>{setJob({...job,status:'승인 완료'});setNotice('추가 작업을 승인했어요. 현장 담당자 화면에 반영됐어요.')}}>추가 작업 승인</button><button className={s.secondary} onClick={()=>setJob({...job,status:'보류'})}>지금은 보류</button></div>}{role==='현장 담당자'&&job.status==='승인 완료'&&<button className={s.primary} onClick={()=>{setJob({...job,status:'작업 완료'});setNotice('추가 작업 완료를 기록했어요.')}}>추가 작업 완료 기록</button>}</>:role==='고객'?<p>지금은 승인할 작업이 없어요. 현장에서 추가 관리가 필요하면 이유와 비용을 먼저 알려드려요.</p>:<form onSubmit={e=>{e.preventDefault();const amount=Number(cost);if(!title.trim()||!reason.trim()||!Number.isSafeInteger(amount)||amount<=0||amount>10000000){setNotice('작업명·이유와 1원~1,000만 원 사이 정수 금액을 확인해 주세요.');return}setJob({title:title.trim(),reason:reason.trim(),cost:amount,status:'승인 대기'});setNotice('고객에게 추가 작업 승인 요청을 등록했어요.')}}><div className={s.formGrid}><label>작업명<input value={title} maxLength={80} onChange={e=>setTitle(e.target.value)} required/></label><label>총 제안 금액 (원)<input type="number" min="1" max="10000000" step="1" value={cost} onChange={e=>setCost(e.target.value)} required/></label></div><label>필요한 이유<textarea value={reason} maxLength={1000} onChange={e=>setReason(e.target.value)} placeholder="관찰한 상태와 필요한 작업을 설명해 주세요." required/></label><button className={s.primary}>고객에게 승인 요청</button></form>}</section>
     <button className={s.contact} onClick={()=>setTab('문의')}><span>담당자와 함께 확인할 내용이 있나요?<small>요청과 답변이 이 집의 기록으로 남아요.</small></span><strong>문의 열기 →</strong></button>
    </>}
    {tab==='방문 기록'&&<section className={s.card}><div className={s.cardHeading}><h2>9월 14일 정기 방문</h2><span className={s.pill}>{status}</span></div>{role==='현장 담당자'&&!report?<><p>이전 기록: 최초 확인에서 뒷마당 배수구 주변 낙엽을 확인했어요.</p>{!started?<button className={s.primary} onClick={()=>start(true)}>방문 시작하기</button>:<><div className={s.checklist}>{items.map((x,i)=><label key={x}><span>{x}</span><select aria-label={x} value={checks[i]} onChange={e=>setChecks(c=>c.map((v,n)=>n===i?e.target.value as Check:v))}>{(['확인 전','관리 완료','추가 확인','접근 불가'] as Check[]).map(v=><option key={v}>{v}</option>)}</select></label>)}</div><label>현장 메모 (필수)<textarea value={memo} onChange={e=>setMemo(e.target.value)} maxLength={2000} placeholder="실제로 확인한 내용과 진행한 작업을 적어 주세요. 접근하지 못한 곳은 이유를 남겨주세요."/></label><label>현장 사진 · 최대 4장<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading||photos.length>=4} onChange={e=>{void upload(e.target.files);e.target.value=''}}/></label><div className={s.photos}>{photos.map((p,i)=><figure key={i}><img src={p} alt={`첨부한 현장 사진 ${i+1}`}/><button onClick={()=>setPhotos(v=>v.filter((_,n)=>n!==i))}>사진 {i+1} 삭제</button></figure>)}</div>{!photos.length&&<label>사진이 없는 경우, 이유<textarea value={missing} maxLength={300} onChange={e=>setMissing(e.target.value)} placeholder="예: 소유자가 실내 촬영을 원하지 않음"/></label>}<button disabled={uploading} className={s.primary} onClick={submitReport}>{uploading?'사진을 읽는 중…':'방문 보고 등록하기'}</button></>}</>:report?<><p className={s.large}>김관리 담당자가 방문 기록을 남겼어요.</p><div className={s.results}>{items.map((x,i)=><div key={x}><span>{x}</span><strong className={report.checks[i]==='관리 완료'?s.good:s.warning}>{report.checks[i]}</strong></div>)}</div><h3>현장 메모</h3><p className={s.pre}>{report.memo}</p><div className={s.photos}>{report.photos.map((p,i)=><img key={i} src={p} alt={`9월 14일 방문 사진 ${i+1}`}/>)}</div>{!report.photos.length&&<p>사진 미첨부 사유: {report.missing}</p>}{role==='고객'&&<button className={s.primary} disabled={read} onClick={()=>{setRead(true);setNotice('보고서 확인을 담당자에게 표시했어요.')}}>{read?'확인했어요 ✓':'보고서 확인했어요'}</button>}{role==='현장 담당자'&&<p className={s.tag}>{read?'고객 확인 완료':'고객 확인 대기'}</p>}</>:<div className={s.empty}><h3>첫 방문 보고를 기다리고 있어요.</h3><p>현장 담당자가 점검 결과를 등록하면 이곳에 쌓여요.</p><button className={s.secondary} onClick={()=>changeRole('현장 담당자')}>현장 담당자로 체험하기</button></div>}</section>}
    {tab==='문의'&&<section className={s.card}><h2>우리 집 이야기</h2><p>현재 페이지에서 역할을 바꿔 서로의 메시지를 확인할 수 있어요.</p><div className={s.messages}>{messages.map((m,i)=><div key={i} className={m.role===role?s.myMessage:s.theirMessage}><small>{m.role}</small><p>{m.text}</p></div>)}</div><form onSubmit={e=>{e.preventDefault();if(!message.trim())return;setMessages(v=>[...v,{role,text:message.trim()}]);setMessage('');setNotice('메시지를 등록했어요.')}}><label>{role}의 메시지<textarea value={message} maxLength={1000} onChange={e=>setMessage(e.target.value)} placeholder="집에 대해 확인하고 싶은 내용을 남겨주세요." required/></label><button className={s.primary}>메시지 등록</button></form></section>}
    {tab==='최초 진단'&&<section className={s.card}><span className={s.eyebrow}>우리 집 기록의 시작 · 2026. 9. 7.</span><h2>처음 확인한 집의 상태</h2><p>정기 방문에서 무엇이 달라졌는지 비교하는 기준이에요.</p><div className={s.results}><div><span>주택</span><strong>단층 단독주택 · 62㎡</strong></div><div><span>비어 있던 기간</span><strong>약 2년 · 소유자 입력</strong></div><div><span>처음 확인할 부분</span><strong>실내 습기·배수구·출입문</strong></div></div><h3>다음 방문에 이어서 살펴요</h3><p>뒷마당 배수구 주변의 낙엽과 실내 벽면 얼룩을 기록했어요. 배수 상태와 얼룩의 변화는 다음 현장 방문에서 확인해요.</p><p>사진과 육안 확인 기록이며, 건물의 구조 안전을 판정한 결과는 아니에요.</p><Link className={s.secondary} href="/example-report">기존 진단서 예시 보기 ↗</Link></section>}
    <aside className={s.footer} aria-label="시제품 이용 안내"><strong>빈집진단서 · 집토끼 돌봄</strong><details><summary>시제품 구현 범위</summary><p>방문 보고·추가 작업 승인·문의는 현재 페이지 메모리에서 연결됩니다. 실제 로그인, 결제, 서버 저장, 알림 전송, AI 호출은 연결하지 않았습니다. 사진은 서버로 전송하지 않습니다. 고객·현장 역할 전환은 인증 기능이 아닙니다.</p></details></aside>
   </main>
  </div>
 </div>
}
