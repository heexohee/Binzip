import Link from 'next/link'
import { HomeHeader } from '../home-ui'
import { AddressStartForm } from '../address-start-form'
import home from '../home.module.css'
import s from '../landing.module.css'

export const metadata = { title: '빈집 진단 참여 안내 | 빈집진단서' }

const BEFORE_APPLYING = [
  { title: '누가 참여할 수 있나요', text: '빈집이 있는 소유자와 가족이라면 전국 어디든 신청할 수 있어요. 지금 사는 곳도 상관없어요.' },
  { title: '지역에 따라 다른 점', text: '건축물·토지 정보와 선택지 비교는 어느 지역이든 같아요. 현장 방문은 포항·경주권만 가능하고, 지원사업은 포항부터 정리하고 있어서 다른 지역은 확인할 곳을 안내해 드려요.' },
  { title: '무엇을 받나요', text: '자료로 확인한 집 정보, 계속 갖고 있을 때·고칠 때·팔거나 철거할 때의 비용과 조건, 다음 할 일을 정리한 진단서예요. 확인하지 못한 내용은 따로 표시해요.' },
  { title: '언제 받나요', text: '신청 후 담당자가 내용을 살펴보고 연락드려요. 그때 진행할 수 있는지와 결과를 보내드릴 일정을 알려드려요. 바로 나오는 자동 결과는 아니에요. 신청 순서대로 연락드리며, 신청이 많으면 시간이 걸릴 수 있어요.' },
  { title: '비용과 방문', text: '기본 자료 진단은 무료예요. 현장 방문은 자동으로 잡히지 않고, 필요할 때 따로 상의해요.' },
  { title: '진단서가 대신하지 않는 것', text: '법률·세무·구조 안전 판단, 실제 거래 가격과 공사 견적은 전문가 확인이 필요해요.' },
]

export default function Participate() {
  return <div className={home.site}><div className={home.sheet}><HomeHeader />
    <main className={s.page}>
      <Link className={s.back} href="/diagnosis">← 빈집 진단 소개로</Link>
      <div className={s.chips}><span className={s.chip}>빈집 진단</span><span className={s.status}>시범 참여 모집 · 무료 · 전국</span></div>
      <h1>우리 집을 어떻게 할지,<br />함께 정리해 볼까요?</h1>
      <p className={s.lead}>빈집이 있는 분들과 진단 서비스를 시범 운영하고 있어요. 진단서를 받아보신 뒤 도움이 된 점과 아쉬운 점을 들려주세요.</p>

      <div className={s.block}>
        <h2 className={s.blockTitle}>신청 전에 확인해 주세요</h2>
        <dl className={s.facts}>{BEFORE_APPLYING.map(item => <div key={item.title}><dt>{item.title}</dt><dd>{item.text}</dd></div>)}</dl>
        <Link className={s.textLink} href="/example-report">진단서 예시 먼저 보기 →</Link>
      </div>

      <section className={s.apply} id="diagnosis" aria-labelledby="apply-title">
        <h2 id="apply-title">참여 신청하기</h2>
        <ol className={s.applySteps} aria-label="신청 순서">
          <li aria-current="step"><b>1</b>주소로 집 찾기 (지금 단계)</li>
          <li><b>2</b>집 상태·고민·연락처 입력</li>
          <li><b>3</b>신청 완료 → 담당자 연락</li>
        </ol>
        <p>진단할 집을 정확히 찾고 건축물·토지 자료를 확인하려면 주소가 필요해요. 검색만으로는 신청되지 않으니, 지도에서 집을 확인한 뒤 다음 단계로 넘어가 주세요.</p>
        <AddressStartForm />
        <div className={s.contact}><a href="tel:01074282624">주소를 모르면 전화로 물어보기 · 010-7428-2624</a></div>
      </section>
    </main>
  </div></div>
}
