import Image from 'next/image'
import Link from 'next/link'
import { Arrow, HomeHeader, HomeFooter, Icon } from './home-ui'
import styles from './home.module.css'
import { AddressStartForm } from './address-start-form'
import { HOME_CONCERNS, HOME_CONCERNS_CHECKED_AT } from '../src/home-concerns'

export const maxDuration = 60

const PREPARATION = [
  ['집의 기록', '우리 집에서 무엇을 확인해야 할까요?', '건물·토지의 공적 기록을 모으고, 소유관계와 현장 상태 등 더 확인할 부분을 정리해요.', 'house'],
  ['철거 지원', '공적 지원을 받을 수 있을까요?', '포항시 빈집정비·슬레이트 지원사업의 조건과 신청처를 안내해요. 선정 여부와 본인 부담은 담당 기관에 확인해야 해요.', 'check'],
  ['비용과 순서', '견적을 받을 때 무엇을 물어봐야 할까요?', '철거·폐기물·행정 비용의 포함 범위와 다음 할 일을 알려드려요. 현장 견적을 받기 전에 준비할 수 있어요.', 'document'],
] as const
const FAQ = [
  ['빈집은 반드시 철거해야 하나요?', '아니요. 집의 상태와 소유관계, 활용 가능성, 비용에 따라 선택이 달라져요. 팔기·철거하기·당분간 두기 중 어느 쪽을 고민하든, 확인할 자료와 다음 할 일을 안내해요.'],
  ['주소 외에 서류를 준비해야 하나요?', '먼저 주소만 입력해 주세요. 조회된 주소와 위성 지도에서 위치를 확인하면 다음 페이지에서 집 상태·소유관계와 연락처를 입력할 수 있어요. 아는 내용만 적어 주시면 돼요.'],
  ['사진도 보낼 수 있나요?', '주소를 확인한 다음, 상세 정보 입력 페이지에서 사진을 보낼 수 있어요. 사진은 최대 6장까지 접수하며 담당자가 참고해요. 사진만으로 건물 안전성·석면·철거비를 확정하지 않고, 공개 진단서에 사진을 게시하지 않아요.'],
  ['철거 지원금도 확인해 주나요?', '포항시 빈집정비와 슬레이트 지원사업의 공식 근거, 확인할 조건, 신청처를 정리해요. 지원 자격과 접수·예산 잔액은 담당 기관의 확인이 필요하며, 신청이나 지급이 보장되는 것은 아니에요.'],
  ['비용과 진행 방식이 궁금해요.', '현재 진단 신청은 무료예요. 주소 확인 뒤 상세 정보와 사진을 보내 신청해 주세요. 담당자가 확인 범위와 일정을 안내하고, 검토한 진단서를 이메일로 보내드려요.'],
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
              <h1 className={styles.introTitle}>시골 빈집,<br /><strong>그냥 두는 게<br />가장 쌀까요?</strong></h1>
            </div>
            <Image src="/mascot/binzip-rabbit-v1.png" alt="작은 집을 안고 있는 대표 캐릭터 집토끼" width={256} height={256} sizes="(max-width: 360px) 131px, (max-width: 540px) 155px, 216px" className={styles.homeRabbit} priority />
            <div className={styles.introNote}>
              <p>당장은 지출이 적어 보여도, 시간이 지나며 관리와 정비 부담이 커질 수 있습니다.</p>
              <p><strong>빈집진단서로 내 집의 상태와 지원 조건을 확인하고,<br className={styles.desktopBreak} /> 정리에 필요한 비용과 다음 순서를 알아보세요.</strong></p>
            </div>
            <section id="address-search" className={styles.introIntake} aria-label="무료 진단 신청">
              <nav className={styles.folderNav} aria-label="빈집진단서 이용하기">
                <a href="#address-search" aria-current="page"><Icon name="house" />내 빈집 확인</a>
                <Link href="/example-report"><Icon name="document" />진단서 예시</Link>
              </nav>
              <AddressStartForm />
            </section>
          </div>
          <section className={styles.concernsSection} aria-labelledby="concerns-title">
            <p className={styles.eyebrow}>오래 비워둔 집, 지금 살펴야 하는 이유</p>
            <h2 id="concerns-title">빈집을 그대로<br />방치하고 계시진 않으신가요?</h2>
            <ol className={styles.concernsList}>{HOME_CONCERNS.map((concern, index) => <li key={concern.id}>
              <span className={styles.concernNumber} aria-hidden="true">0{index + 1}</span>
              <div><p className={styles.concernLabel}>{concern.label}</p><h3>{concern.title}</h3><p className={styles.concernDescription}>{concern.description}</p>
                <details className={styles.concernSource}>
                  <summary>{concern.label} 근거 보기<span aria-hidden="true">＋</span></summary>
                  <div>
                    <p>{concern.evidence}</p>
                    <a href={concern.sourceUrl} target="_blank" rel="noopener noreferrer">{concern.sourceLabel} ↗<span className="sr-only"> (새 창)</span></a>
                    {'additionalSource' in concern && <a href={concern.additionalSource.url} target="_blank" rel="noopener noreferrer">{concern.additionalSource.label} ↗<span className="sr-only"> (새 창)</span></a>}
                    <p className={styles.concernDate}>내용 확인 {HOME_CONCERNS_CHECKED_AT}</p>
                  </div>
                </details>
              </div>
            </li>)}</ol>
            <p className={styles.concernClosing}>우리 집에 해당하는지부터 확인하세요.<br />빈집이라는 이유만으로 철거가 필요한 것은 아니에요.</p>
          </section>
          <section className={styles.preparationSection} aria-labelledby="preparation-title">
            <p className={styles.eyebrow}>빈집진단서가 빈집 처분의 의사결정을 도와드려요.</p>
            <h2 id="preparation-title">철거를 생각한다면,<br />비용과 순서부터 확인하세요.</h2>
            <div className={styles.questionList}>{PREPARATION.map(([label, title, detail, icon]) => <div className={styles.question} key={label}><div className={styles.iconTile}><Icon name={icon} /></div><div><p className={styles.questionLabel}>{label}</p><h3>{title}</h3><p>{detail}</p></div></div>)}</div>
            <p className={styles.preparationNote}>아직 방향을 정하지 않아도 괜찮아요. 진단서에서 매도·철거·보유에 따라 확인할 내용을 살펴볼 수 있어요.</p>
          </section>
          <section className={styles.previewSection} aria-labelledby="preview-title">
            <div className={styles.sectionTop}>
              <div><p className={styles.eyebrow}>신청 전에 먼저 둘러보세요</p><h2 id="preview-title">어떤 정보를<br />진단해 드리나요?</h2></div>
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
          <section className={styles.stepsSection} aria-labelledby="steps-title">
            <p className={styles.eyebrow}>주소를 입력한 뒤에는</p><h2 id="steps-title">차근차근, 세 단계로.</h2>
            <ol className={styles.steps}>
              <li><span>01</span><div><h3>주소와 위치를 확인해요</h3><p>주소를 입력하고 위성 지도에서 내 집이 맞는지 살펴요.</p></div></li>
              <li><span>02</span><div><h3>다음 페이지에서 집 이야기를 적어요</h3><p>집 상태·소유관계·고민과 사진을 남겨 주세요.</p></div></li>
              <li><span>03</span><div><h3>확인한 내용과 다음 할 일을 받아요</h3><p>담당자가 확인 범위와 일정을 안내하고 검토한 진단서를 보내드려요.</p></div></li>
            </ol>
          </section>
          <section className={styles.faqSection} aria-labelledby="faq-title">
            <p className={styles.eyebrow}>궁금한 점이 있나요?</p><h2 id="faq-title">신청 전에 알아두세요.</h2>
            <div className={styles.faqList}>{FAQ.map(([q, a]) => <details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div>
          </section>
          <section className={styles.bottomCta}>
            <Icon name="house" /><h2>무료로 빈집 진단을<br />받아보세요.</h2><a href="#address-search" className={styles.primary}>내 빈집 무료로 확인하기<Arrow /></a>
          </section>
        </main>
        <HomeFooter />
      </div>
    </div>
  )
}
