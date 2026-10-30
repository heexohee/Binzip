import Link from 'next/link'
import { Arrow, HomeHeader } from '../home-ui'
import { ShareButton } from '../share-button'
import { Facts, Gets, type Item, kakaoChannel, PHONE, Steps } from '../landing-parts'
import home from '../home.module.css'
import s from '../landing.module.css'

export const metadata = { title: '빈집 진단 | 빈집진단서' }

const GETS: Item[] = [
  { title: '집 정보', text: '건축물·토지 자료로 확인한 내용과, 아직 확인하지 못한 내용을 나눠 적어요.' },
  { title: '선택지별 비용과 조건', text: '계속 갖고 있을 때, 고칠 때, 팔거나 철거할 때 드는 비용과 조건을 비교해요.' },
  { title: '다음 할 일', text: '먼저 챙길 서류와 전문가에게 물어볼 내용을 정리해요.' },
]

const STEPS: Item[] = [
  { title: '참여 안내를 읽고 신청해요', text: '주소로 집을 찾은 뒤, 집 상태와 고민, 연락처를 남겨요.' },
  { title: '담당자가 연락드려요', text: '자료를 살펴보고 진행할 수 있는지, 결과는 언제 받는지 알려드려요.' },
  { title: '진단서를 받아요', text: '담당자가 직접 검토한 결과를 보내드려요. 받아보신 뒤 소감을 들려주세요.' },
]

const FACTS: Item[] = [
  { title: '누가 참여할 수 있나요', text: '빈집이 있는 소유자와 가족이라면 전국 어디든 신청할 수 있어요. 지금 사는 곳도 상관없어요.' },
  { title: '비용', text: '기본 자료 진단은 무료예요. 현장 방문이 필요하면 따로 상의해요.' },
  { title: '지역에 따라 다른 점', text: '건축물·토지 정보와 선택지 비교는 어느 지역이든 같아요. 현장 방문은 포항·경주권만 가능하고, 지원사업은 포항부터 정리하고 있어서 다른 지역은 확인할 곳을 안내해 드려요.' },
  { title: '언제 연락드리나요', text: '신청 순서대로 연락드려요. 신청이 많으면 시간이 걸릴 수 있어요.' },
  { title: '진단서가 대신하지 않는 것', text: '법률·세무·구조 안전 판단, 실제 거래 가격과 공사 견적은 전문가 확인이 필요해요.' },
]

export default function Diagnosis() {
  const kakao = kakaoChannel()
  return <div className={home.site}><div className={home.sheet}><HomeHeader />
    <main className={`${s.service} ${s.diagnosis}`}>
      <Link className={s.back} href="/">← 처음으로</Link>
      <div className={s.chips}><span className={s.chip}>빈집 진단</span><span className={s.status}>시범 참여 모집 · 무료 · 전국</span></div>
      <p className={s.quote}>“계속 갖고 있을지, 고칠지, 팔거나 철거할지 모르겠어요.”</p>
      <h1>우리 집 상황과 선택지를<br />한 번에 정리해 드려요</h1>
      <p className={s.lead}>집 정보를 확인하고, 선택지마다 드는 비용과 조건, 먼저 알아볼 일을 진단서로 정리해요. 자동으로 만들어지는 결과가 아니라 담당자가 자료를 직접 살펴보고 보내드려요.</p>
      <div className={s.heroActions}>
        <Link className={s.button} href="/participate">진단 참여 안내 보기<Arrow /></Link>
        <Link className={s.textLink} href="/example-report">진단서 예시 먼저 보기 →</Link>
      </div>

      <div className={s.block}>
        <h2 className={s.blockTitle}>진단서에 담기는 내용</h2>
        <Gets items={GETS} />
        <Link className={s.textLink} href="/example-report">진단서 예시 보기 →</Link>
        <p className={s.textLinkNote}>가정한 집으로 만든 예시예요. 실제 조사 결과는 아니에요.</p>
      </div>

      <div className={s.block}>
        <h2 className={s.blockTitle}>참여는 이렇게 진행돼요</h2>
        <Steps items={STEPS} />
      </div>

      <div className={s.block}>
        <h2 className={s.blockTitle}>미리 알아두세요</h2>
        <Facts items={FACTS} />
      </div>

      <div className={s.cta}>
        <Link className={s.button} href="/participate">진단 참여 안내 보기<Arrow /></Link>
        <p className={s.ctaNote}>다음 화면에서 참여 조건을 확인하고, 주소로 집을 찾아 신청해요.</p>
        <div className={s.contact}>
          <a href={`tel:${PHONE.replaceAll('-', '')}`}>전화로 물어보기 · {PHONE}</a>
          {kakao && <a href={kakao} target="_blank" rel="noopener noreferrer">카카오톡 채널로 문의하기</a>}
          <p>포항에 사는 정소희가 직접 운영해요.</p>
        </div>
      </div>

      <p className={s.crossLink}>팔 생각은 없고 관리가 고민이라면 <Link href="/management">빈집 관리 알아보기 →</Link></p>
      <ShareButton />
    </main>
  </div></div>
}
