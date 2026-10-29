import Link from 'next/link'
export default function Layout({children}:{children:React.ReactNode}) { return <><aside style={{padding:24,background:'#fff0c7',color:'#46350d',fontSize:18}}><strong>가상 데이터로 보는 시연 화면입니다.</strong><p>여기서 입력한 문의·작업·일정은 실제 신청이나 업체 연락으로 이어지지 않아요. 개인정보를 입력하지 마세요.</p><Link href="/interest">실제 보유·관리 관심 등록하기 →</Link></aside>{children}</> }
