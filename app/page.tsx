import Image from 'next/image'
import Link from 'next/link'
import { HomeHeader } from './home-ui'
import { AddressStartForm } from './address-start-form'
import styles from './home.module.css'
export const maxDuration = 60
export default function Home() {
 const channel = process.env.KAKAO_CHANNEL_URL
 const kakao = channel && /^https:\/\/pf\.kakao\.com\/[A-Za-z0-9_/-]+$/.test(channel) ? channel : null
 return <div className={styles.site}><a className={styles.skipLink} href="#address-search">주소 입력으로 건너뛰기</a><div className={styles.sheet}><HomeHeader/><main>
 <section className={styles.brandHero}><div><p>빈집진단서</p><h1>지금 팔지 않아도,<br/>집을 돌볼 방법은 있어요.</h1></div><Image src="/mascot/binzip-rabbit-v1.png" alt="작은 집을 안고 있는 집토끼" width={256} height={256} className={styles.brandRabbit} priority/></section>
 <section className={styles.addressSection} id="address-search"><h2>우리 집, 어떻게 하고 싶으세요?</h2><p className={styles.intakeDescription}>계속 보유할지, 고쳐 쓸지, 정리할지.<br/>집의 상태와 먼저 확인할 일을 함께 정리해요.</p>
 <div className={styles.careChoices}><Link href="/interest"><strong>보유하며 관리 맡기기</strong><span>월 방문·사진 기록 등 관리 서비스 관심 등록</span></Link><a href="#diagnosis"><strong>내 빈집 진단 신청하기</strong><span>주소를 확인하고 담당자 검토 요청</span></a><Link href="/example-report"><strong>진단서 예시 보기</strong><span>보유·수리·매각·철거를 어떻게 비교하는지 보기</span></Link></div>
 <p className={styles.careNotice}>현재 진단은 포항부터 제공해요. 타 지역은 관심 등록으로 수요를 모으고 있어요.</p>
 <div id="diagnosis"><h3>포항에 있는 집의 주소를 확인해 주세요</h3><p>도로명이나 지번으로 검색해요. 등기 서류나 재산세 고지서에 적힌 주소를 참고하셔도 좋아요.</p><AddressStartForm/></div>
 <Link className={styles.reportExampleLink} href="/interest?source=unknown-address">주소를 정확히 몰라요 · 대략적인 위치로 문의하기</Link>
 <a className={styles.reportExampleLink} href="tel:01074282624">전화로 물어보기 · 010-7428-2624</a>
 <>{kakao && <a className={styles.reportExampleLink} href={kakao} target="_blank" rel="noopener noreferrer">카카오톡 채널로 문의하기</a>}</><p className={styles.careNotice}>운영자 정소희 · 포항에서 활동합니다. 현장 확인은 신청 내용을 살핀 뒤 범위와 일정을 협의해요.</p></section>
 <section className={styles.reportContentsSection} id="management"><h2>은퇴 후 살 집, 가족의 추억이 있는 집.<br/>계속 보유할 계획도 중요해요.</h2><p className={styles.intakeDescription}>멀리 있어 자주 가기 어렵다면, 어떤 관리가 필요한지 알려주세요.</p><div className={styles.careChoices}><article><h3>정기 방문과 사진</h3><p>집 바깥 상태를 살피고 사진·메모로 변화를 기록하는 서비스를 준비해요.</p></article><article><h3>필요한 작업 확인</h3><p>잡초 정리나 수리가 필요할 때, 작업 범위와 별도 비용을 먼저 확인하는 방향을 검토해요.</p></article><article><h3>내 계획에 맞는 관리</h3><p>계속 보유할지, 나중에 입주할지에 따라 필요한 방문과 관리는 달라져요.</p></article></div><p className={styles.careNotice}>현재 수요조사 단계예요. 월 이용료와 방문 범위는 미정이며, 관심 등록으로 결제·계약·방문 예약이 발생하지 않아요. 구조 안전 진단과 긴급 출동을 보장하지 않아요.</p><Link href="/interest" className={styles.primary}>빈집 관리 관심 등록하기</Link></section>
 <section className={styles.empathySection}><h2>이런 고민을 듣고 있어요</h2><div className={styles.careChoices}><article><h3>나중에 살 집이라 팔고 싶지는 않아요.</h3><p>멀리서도 집 상태를 알고, 필요한 관리만 맡기고 싶어요.</p></article><article><h3>정리하려니 무엇부터 할지 모르겠어요.</h3><p>서류와 집 상태, 비용을 확인하고 선택지를 비교하고 싶어요.</p></article><article><h3>철거 지원만 보고 결정해도 될까요?</h3><p>지원 조건과 철거 후 토지 관리까지 함께 알아보고 싶어요.</p></article></div><p>소유주가 겪을 수 있는 상황을 설명한 예시이며 고객 후기는 아니에요.</p></section>
 <section className={styles.concernsSection}><h2>결정하기 전에, 이 세 가지를 확인해요</h2><div className={styles.careChoices}><article><h3>철거 후의 세금</h3><p>철거 전후 재산세가 어떻게 달라지는지 소재지 세무 부서에 확인해요. 이 화면에서는 증가 여부나 세액을 확정하지 않아요.</p></article><article><h3>지원의 조건과 남는 비용</h3><p>지원액뿐 아니라 본인 부담, 철거 후 부지 사용 조건, 신청 가능 여부를 해당 사업의 최신 공고로 확인해요.</p></article><article><h3>집과 땅의 권리관계</h3><p>등기부 등 소유권 서류와 건물 기록을 살펴요. 소유자가 다르거나 상속 정리가 끝나지 않았다면 전문가 확인이 먼저예요.</p></article></div><Link className={styles.reportExampleLink} href="/resources">공식 지원·정보 확인하기</Link></section>
 <section className={styles.reportContentsSection}><h2>신청 후에는 이렇게 진행해요</h2><ol className={styles.reportContentsList}><li><div><h3>1. 집과 고민을 알려주세요</h3><p>진단 신청 또는 보유·관리 관심 등록 중 필요한 경로를 선택해요.</p></div></li><li><div><h3>2. 담당자가 확인해요</h3><p>자료로 확인한 내용과 추가 확인할 항목을 구분해요. 현장 방문이 필요하면 범위·일정·비용을 먼저 안내해요.</p></div></li><li><div><h3>3. 다음 행동을 함께 정리해요</h3><p>법률·세무·구조 안전의 최종 판단이나 거래·공사 견적을 대신하지 않아요. 전문가 확인이 필요한 내용은 따로 적어요.</p></div></li></ol></section>
 </main></div><div className={styles.mobileContact}><a href="tel:01074282624">전화로 물어보기</a><Link href="/interest">관리 관심 등록</Link></div></div>
}
