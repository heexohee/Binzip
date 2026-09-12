import Image from 'next/image'
import Link from 'next/link'
import { Arrow, HomeHeader, HomeFooter, Icon } from './home-ui'
import styles from './home.module.css'
import { InstantStartForm } from './instant-start-form'

export const maxDuration = 60

const QUESTIONS = [
  ['집과 땅의 기록', '서류에는 어떤 집으로 남아 있을까요?', '건축물·토지의 공적 자료를 모아 확인해요.', 'house'],
  ['보유와 처분', '그대로 두거나 정리하기 전에 뭘 봐야 할까요?', '내 상황에서 비교할 항목과 확인 순서를 정리해요.', 'document'],
  ['공적 지원', '철거비나 지붕 처리 지원을 받을 수 있을까요?', '공식 사업 안내와 내 집의 확인할 조건·신청처를 모아요.', 'check'],
  ['아직 모르는 부분', '서류만으로 알 수 없는 건 무엇일까요?', '권리관계와 현장 상태 등 추가 확인할 부분을 남겨요.', 'search'],
] as const
const FAQ = [
  ['아직 팔거나 철거할 생각이 없어도 되나요?', '네. 무엇을 할지 정하지 않으셔도 돼요. 지금 확인되는 자료와 아직 모르는 부분부터 정리할 수 있어요.'],
  ['주소 외에 서류를 준비해야 하나요?', '주소와 고민하는 방향만 입력하면 돼요. 조회된 주소를 확인한 뒤 공적 기록과 다음 할 일을 바로 볼 수 있어요. 연락처와 이메일은 추가 확인을 신청할 때 받아요.'],
  ['사진도 보낼 수 있나요?', '1차 진단서를 본 뒤 사진·추가 정보를 보내 확인을 신청할 수 있어요. 사진은 최대 6장까지 접수하며 담당자가 참고해요. 사진만으로 건물 안전성·석면·철거비를 확정하지 않고, 공개 진단서에 사진을 게시하지 않아요.'],
  ['철거 지원금도 확인해 주나요?', '포항시 빈집정비와 슬레이트 지원사업의 공식 근거, 확인할 조건, 신청처를 정리해요. 지원 자격과 접수·예산 잔액은 담당 기관의 확인이 필요하며, 신청이나 지급이 보장되는 것은 아니에요.'],
  ['비용과 진행 방식이 궁금해요.', '1차 진단서는 무료로 바로 볼 수 있어요. 조회되지 않은 항목은 미확인으로 표시해요. 더 알아보고 싶다면 추가 확인을 신청해 주세요. 담당자가 확인 범위와 일정을 안내하고, 검토한 진단서를 이메일로 보내드려요.'],
]

export default function Home() {
  return (
    <div className={styles.site}>
      <a className={styles.skipLink} href="#address-search">주소 입력으로 건너뛰기</a>
      <div className={styles.sheet}>
        <HomeHeader />
        <main>
          <div className={styles.intro}>
            <div className={styles.introHeading}>
              <p className={styles.eyebrow}>포항의 시골 빈집을 위한 진단</p>
              <h1 className={styles.introTitle}>시골 빈집,<br /><strong>팔까, 철거할까,<br />당분간 둘까?</strong></h1>
            </div>
            <Image src="/mascot/binzip-rabbit-v1.png" alt="작은 집을 안고 있는 대표 캐릭터 집토끼" width={256} height={256} sizes="(max-width: 360px) 131px, (max-width: 540px) 155px, 216px" className={styles.homeRabbit} priority />
            <p className={styles.introNote}>빈집진단서는 오래 비어 있는 단독주택을 어떻게 정리할지 결정하도록 돕는 서비스예요.</p>
          </div>
          <section id="address-search" className={styles.intake} aria-labelledby="start-title">
            <nav className={styles.folderNav} aria-label="빈집진단서 이용하기">
              <a href="#address-search" aria-current="page"><Icon name="house" />내 빈집 확인</a>
              <Link href="/example-report"><Icon name="document" />진단서 예시</Link>
            </nav>
            <div className={styles.intakeBody}>
              <h2 id="start-title">어느 집을 확인할까요?</h2>
              <InstantStartForm />
            </div>
          </section>
          <section className={styles.previewSection} aria-labelledby="preview-title">
            <div className={styles.sectionTop}>
              <div><p className={styles.eyebrow}>신청 전에 먼저 둘러보세요</p><h2 id="preview-title">복잡한 집 이야기,<br />이렇게 정리해요.</h2></div>
              <span className={styles.outlineBadge}>진단서 구성 예시</span>
            </div>
            <Link href="/example-report" className={styles.reportPreview} aria-label="빈집진단서 진단서 구성 예시 전체 보기">
              <div className={styles.reportTop}><span><Icon name="document" />빈집진단서</span><span className={styles.smallCaps}>SAMPLE REPORT</span></div>
              <div className={styles.reportHeadline}><h3>남는 돈과 드는 돈,<br />그리고 다음 할 일.</h3><span className={styles.reportStamp}>내 집의<br />다음</span></div>
              <div className={styles.previewRow}><span>그대로 매도·철거 후 매도</span><span className={styles.statusNeutral}>비용 비교</span></div>
              <div className={styles.previewRow}><span>매도·철거·보유 중 나의 방향</span><span className={styles.statusNeutral}>다른 다음 행동</span></div>
              <div className={styles.previewRow}><span>철거·슬레이트 공적 지원</span><span className={styles.statusUnknown}>조건 확인 필요</span></div>
              <div className={styles.previewRow}><span>건물·토지 기록과 실제 상태</span><span className={styles.statusUnknown}>근거·미확인 구분</span></div>
              <div className={styles.previewBottom}><span>실제 매물의 진단 결과가 아닌 구성 예시예요.</span><Arrow /></div>
            </Link>
          </section>
          <section className={styles.questionsSection} aria-labelledby="questions-title">
            <p className={styles.eyebrow}>혼자 알아보기 막막했다면</p>
            <h2 id="questions-title">이런 질문부터<br />같이 확인해요.</h2>
            <div className={styles.questionList}>
              {QUESTIONS.map(([label, title, detail, icon]) => (
                <div className={styles.question} key={label}><div className={styles.iconTile}><Icon name={icon} /></div><div><p className={styles.questionLabel}>{label}</p><h3>{title}</h3><p>{detail}</p></div></div>
              ))}
            </div>
            <div className={styles.note}><Icon name="check" /><p>확인되지 않은 내용에는<br /><strong>‘추가 확인 필요’라고 분명하게 적어요.</strong></p></div>
          </section>
          <section className={styles.stepsSection} aria-labelledby="steps-title">
            <p className={styles.eyebrow}>주소를 입력한 뒤에는</p><h2 id="steps-title">차근차근, 세 단계로.</h2>
            <ol className={styles.steps}>
              <li><span>01</span><div><h3>주소와 고민하는 방향을 입력해요</h3><p>조회된 주소가 내 집인지 먼저 확인해 주세요.</p></div></li>
              <li><span>02</span><div><h3>1차 진단서를 바로 확인해요</h3><p>조회된 기록과 다음 할 일, 미확인 항목을 살펴요.</p></div></li>
              <li><span>03</span><div><h3>더 필요한 부분만 확인을 신청해요</h3><p>사진과 아는 내용을 보내면 확인 범위와 일정을 안내해요.</p></div></li>
            </ol>
          </section>
          <aside className={styles.resourcesSection} aria-label="빈집 공식 지원·정보 안내">
            <Link href="/resources" className={styles.resourcesBanner}><div><strong>빈집 지원·정보 모음</strong><p>빈집애·그린대로·포항시 공고와 서류·법령을 찾아보세요.</p></div><Arrow /></Link>
          </aside>
          <section className={styles.faqSection} aria-labelledby="faq-title">
            <p className={styles.eyebrow}>궁금한 점이 있나요?</p><h2 id="faq-title">신청 전에 알아두세요.</h2>
            <div className={styles.faqList}>{FAQ.map(([q, a]) => <details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div>
          </section>
          <section className={styles.bottomCta}>
            <Icon name="house" /><h2>무엇을 할지는,<br />알아본 뒤에 정해도 괜찮아요.</h2><a href="#address-search" className={styles.primary}>내 빈집부터 확인하기<Arrow /></a>
          </section>
        </main>
        <HomeFooter />
      </div>
    </div>
  )
}
