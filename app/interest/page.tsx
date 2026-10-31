import Link from 'next/link'
import { HomeHeader } from '../home-ui'
import InterestForm from './interest-form'
import s from './interest.module.css'
export const metadata = { title: '빈집 의견 남기기 | 빈집진단서' }
/** `?source=other-region` comes from the diagnosis pages: same survey, intro framed as a regional waitlist. */
function Intro({ otherRegion }: { otherRegion: boolean }) {
  if (otherRegion) return <><Link href="/diagnosis">← 빈집 진단 소개로</Link><p>빈집 진단 · 다른 지역 소식 받기</p><h1>우리 지역에서도 진단이 열리면<br/>알려드릴게요</h1><p>진단 시범은 포항부터 하고 있어요. 빈집이 있는 지역과 지금의 고민을 남겨 주시면, 진단을 넓힐 지역을 정할 때 참고하고, 담당자가 연락드려요. 다른 지역 진단 일정은 아직 정해지지 않았어요.</p></>
  return <><Link href="/management">← 빈집 관리 소개로</Link><p>빈집 관리 서비스 · 준비 중이라 의견을 듣고 있어요</p><h1>당장 팔지 않을 집,<br/>대신 살펴봐 줄 사람이 필요하신가요?</h1><p>은퇴 후 살 집이나 가족의 집을 계속 보유하고 싶은 분들의 이야기를 듣고 있어요. 아직 결정하지 못하셨어도 괜찮아요. 필요한 관리와 희망 요금을 남겨 주세요. 일부 분과는 인터뷰하거나 시범 방문을 해요.</p></>
}
export default async function Page({ searchParams }: { searchParams: Promise<{ source?: string | string[] }> }) {
  const { source } = await searchParams
  return <div className={s.page}><HomeHeader/><main><Intro otherRegion={source === 'other-region'}/><aside className={s.notice}><strong>전국 어디서든 의견을 남길 수 있어요.</strong><p>시범 방문은 포항부터 해요. 의견을 남겨도 비용이 들지 않고, 신청·결제·계약·방문 예약이 되지 않아요.</p></aside><InterestForm/><a href="tel:01074282624">입력이 어려우면 전화로 물어보기 · 010-7428-2624</a></main></div>
}
