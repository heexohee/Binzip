import Image from 'next/image'
import Link from 'next/link'
import { Arrow, HomeHeader } from '../home-ui'
import { AddressStartForm } from '../address-start-form'
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
  { title: '주소 조회 후 신청해 주세요', text: '이 페이지 아래에서 주소로 집을 찾은 뒤, 집 상태와 고민, 연락처를 남겨 주세요.' },
  { title: '진행 여부를 알려드려요', text: '신청 내용을 살펴본 뒤, 진단을 진행할 수 있는지와 예상 시기를 7일 안에 문자나 메일로 알려드려요.' },
  { title: '일부 분과는 인터뷰하고 집에 가 봐요', text: '인터뷰·방문 연락에 동의하신 분 중 일부께 20분 전화 인터뷰를 요청하고, 마친 분께 모바일 상품권을 드려요. 포항·경주에서는 그중 몇 분께 따로 연락드려 집을 직접 방문해 무료로 진단해 드려요. 신청만으로 인터뷰·방문이 정해지지는 않아요.' },
  { title: '진단서를 받아요', text: '담당자가 직접 검토한 결과를 보내드려요. 받아보신 뒤 소감을 들려주세요.' },
]

const FACTS: Item[] = [
  { title: '누가 참여할 수 있나요', text: '빈집이 있는 소유자와 가족이라면 전국 어디든 신청할 수 있어요. 지금 사는 곳도 상관없어요.' },
  { title: '담당자가 살펴보고 보내드려요', text: '건물·땅 자료와 주변 거래는 시스템으로 바로 찾아요. 그다음 담당자가 보내주신 사진과 함께 살펴보고 진단서를 써요. 그래서 며칠 걸릴 수 있어요.' },
  { title: '비용', text: '진단서와 시범 방문 모두 무료예요. 방문은 인원이 정해져 있어 연락드린 분과만 진행해요.' },
  { title: '지역에 따라 다른 점', text: '건축물·토지 정보와 선택지 비교는 어느 지역이든 같아요. 지원사업은 포항부터 정리하고 있어서 다른 지역은 확인할 곳을 안내해 드려요.' },
  { title: '진단서로 할 수 있는 것과 없는 것', text: '진단서는 공공자료와 보내주신 사진으로 선택지를 비교하고, 누구에게 무엇을 물어볼지 정리해 드려요. 법률·세금·건물 안전을 판단하거나 실제 팔릴 가격과 공사비를 확정해 드리지는 않아요. 진단서에 적힌 예상 금액을 바탕으로 전문가에게 확인해 주세요.' },
]

export default function Diagnosis() {
  const kakao = kakaoChannel()
  return <div className={home.site}><div className={home.sheet}><HomeHeader />
    <main className={`${s.service} ${s.diagnosis}`}>
      <Link className={s.back} href="/">← 처음으로</Link>
      <div className={s.chips}><span className={s.chip}>빈집 진단</span><span className={s.status}>무료 시범 진단 · 전국 신청</span></div>
      <div className={s.serviceHead}>
        <div><p className={s.quote}>“계속 갖고 있을지, 고칠지, 팔거나 철거할지 모르겠어요.”</p>
        <h1>우리 집 상황과 선택지를<br />한 번에 정리해 드려요</h1></div>
        <Image className={s.serviceRabbit} src="/mascot/binzip-rabbit-report-transparent-v4.png" alt="" width={160} height={160} sizes="(max-width: 600px) 96px, 160px" priority />
      </div>
      <p className={s.lead}>팔지, 고칠지, 계속 갖고 있을지 진단서로 정리해 드려요. 지금은 무료 시범 진단이에요. 신청하시면 7일 안에 진행 여부를 문자나 메일로 알려드려요.</p>
      <div className={s.heroActions}>
        <a className={s.button} href="#apply">참여 신청하기<Arrow /></a>
        <Link className={s.textLink} href="/example-report">진단서 예시 먼저 보기 →</Link>
      </div>

      <div className={s.block}>
        <h2 className={s.blockTitle}><span className={s.blockMark} aria-hidden="true">📋</span>진단서에 담기는 내용</h2>
        <Gets items={GETS} />
      </div>

      <div className={s.block}>
        <h2 className={s.blockTitle}><span className={s.blockMark} aria-hidden="true">🧭</span>참여는 이렇게 진행돼요</h2>
        <Steps items={STEPS} />
      </div>

      <div className={s.block}>
        <h2 className={s.blockTitle}><span className={s.blockMark} aria-hidden="true">💡</span>미리 알아두세요</h2>
        <Facts items={FACTS} />
      </div>

      <section className={s.apply} id="apply" aria-labelledby="apply-title">
        <h2 id="apply-title">참여 신청하기</h2>
        <p className={s.applyNow}><b>1</b>주소로 집 찾기<span>· 3단계 중 첫 단계</span></p>
        <AddressStartForm />
        <div className={s.contact}>
          <a href={`tel:${PHONE.replaceAll('-', '')}`}>주소를 모르면 전화로 물어보기 · <span className={s.nowrap}>{PHONE}</span></a>
          {kakao && <a href={kakao} target="_blank" rel="noopener noreferrer">카카오톡 채널로 문의하기</a>}
        </div>
      </section>

      <aside className={s.closing} aria-label="다른 서비스와 공유">
        <Link className={s.tile} href="/management"><span className={s.tileIcon} aria-hidden="true">🏡</span><small>팔 생각은 없고 관리가 고민이라면</small><strong>빈집 관리 알아보기 →</strong></Link>
        <ShareButton lead="가족과 같이 정하고 있다면" />
      </aside>
    </main>
  </div></div>
}
