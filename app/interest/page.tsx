import Link from 'next/link'
import { HomeHeader } from '../home-ui'
import InterestForm from './interest-form'
import s from './interest.module.css'
import { pageMetadata } from '../../src/seo'
export const metadata = pageMetadata({
  path: '/interest',
  title: '빈집 관리 의견 남기기 | 빈집진단서',
  description: '필요한 빈집 관리와 희망 요금을 4단계로 여쭤보는 무료 의견 조사예요. 전국 소유자·가족이 참여할 수 있고, 구독·결제·방문 예약은 발생하지 않아요.',
})
/** `?source=other-region` comes from the diagnosis pages: same survey, intro framed as a regional waitlist. */
function Intro({ otherRegion }: { otherRegion: boolean }) {
  if (otherRegion) return <><Link href="/diagnosis">← 빈집 진단 소개로</Link><p>빈집 진단 · 다른 지역 소식 받기</p><h1>우리 지역에서도 진단이 열리면<br/>알려드릴게요</h1><p>진단 시범은 포항부터 하고 있어요. 빈집이 있는 지역과 지금의 고민을 남겨 주시면, 진단을 넓힐 지역을 정할 때 참고하고, 담당자가 연락드려요. 다른 지역 진단 일정은 아직 정해지지 않았어요.</p></>
  return <><Link href="/management">← 빈집 관리 소개로</Link><h1>빈집 관리에 대한<br/>의견을 들려주세요</h1><p>필요한 관리와 희망 요금을 여쭤봐요. 총 4단계이며, 마지막에 응답 확인을 위한 연락처를 받아요.</p></>
}
export default async function Page({ searchParams }: { searchParams: Promise<{ source?: string | string[] }> }) {
  const { source } = await searchParams
  return <div className={s.page}><HomeHeader/><main><Intro otherRegion={source === 'other-region'}/><aside className={s.notice}><strong>전국 소유자·가족이 참여할 수 있어요.</strong><p>무료 의견 조사예요. 구독·결제·방문 예약은 발생하지 않아요.</p></aside><InterestForm/><a href="tel:01074282624">입력이 어려우면 전화로 물어보기 · 010-7428-2624</a></main></div>
}
