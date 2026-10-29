import { HomeHeader } from '../home-ui'
import InterestForm from './interest-form'
import s from './interest.module.css'
export const metadata = { title: '빈집 보유·관리 관심 등록 | 빈집진단서' }
export default function Page() { return <div className={s.page}><HomeHeader/><main><p>빈집 관리 서비스 · 수요조사 중</p><h1>당장 팔지 않을 집,<br/>대신 살펴봐 줄 사람이 필요하신가요?</h1><p>은퇴 후 살 집이나 가족의 집을 계속 보유하고 싶은 분들의 이야기를 듣고 있어요. 아직 결정하지 못하셨어도 괜찮아요.</p><aside className={s.notice}><strong>포항부터 준비하고 있어요.</strong><p>다른 지역도 관심을 남길 수 있어요. 관심 등록은 무료이며, 구독 결제·계약·방문 예약이 아니에요. 실제 제공 가능 여부와 비용은 담당자가 따로 안내해요.</p></aside><InterestForm/><a href="tel:01074282624">입력이 어려우면 전화로 물어보기 · 010-7428-2624</a></main></div> }
