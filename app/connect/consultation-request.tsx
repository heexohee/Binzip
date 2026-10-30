import Link from 'next/link'
import s from './consultation-request.module.css'
export default function ConsultationRequest() {return <div className={s.request}><h3>이 화면은 가상 진단서 예시예요</h3><p>실제 업체와 연결되거나 견적·계약이 접수되지 않아요. 집 정보와 문의 내용을 업체에 전송하지 않아요.</p><p>내 집에 대해 궁금하면 담당자에게 문의해 주세요. 보유·관리 서비스는 별도로 관심을 받고 있어요.</p><Link className={s.primary} href="/interest?source=example-report">내 집의 관리·고민 문의하기</Link><a href="tel:01074282624">담당자에게 전화하기 · 010-7428-2624</a></div>}
