import { ApplyForm } from './apply-form'

/** (c) 이런 상태 아니신가요 — 큰따옴표를 쓰지 않는다. 실제 인터뷰가 아니므로 인용처럼 보이면 안 된다 */
const STATES = [
  ['물려받은 집에 명절에만 내려가 풀을 베고 옵니다.', '팔 수 있는 집인지 아직 모릅니다.'],
  ['안 팔린다는 말은 들었지만, 왜 안 되는지는 듣지 못했습니다.'],
  ['형제들끼리 상속 정리가 아직 끝나지 않았습니다.', '이 상태로 무엇을 할 수 있는지 모릅니다.'],
  ['세금은 매년 나갑니다.', '그냥 두는 것이 맞는지 판단이 서지 않습니다.'],
]

/** (d) 판정 3등급 — 신호등을 쓰지 않는다. 한 계열의 명도만 쓴다 */
const VERDICTS = [
  { dots: '●●●', label: '지금 처분 가능', tone: 'text-deep', lines: ['서류와 현장에서 걸리는 것이 없습니다.', '바로 다음 단계로 가면 됩니다.'] },
  { dots: '●●○', label: '조건부', tone: 'text-mid', lines: ['먼저 정리할 것이 한두 가지 있습니다.', '무엇인지 적어 드립니다.'] },
  { dots: '●○○', label: '지금은 불가', tone: 'text-muted', lines: ['지금 상태로는 어렵습니다.', '그래도 다음에 할 일은 남아 있습니다.'] },
]

const EVIDENCE = [
  { item: '소유 관계', detail: ['미확인 — 소유주 확인이 필요합니다.'], source: '미확인', unverified: true },
  { item: '건물 상태', detail: ['지붕 일부 파손, 구조는 유지'], source: '현장 방문 2026.09.05 확인' },
  { item: '진입로', detail: ['폭 3m 사도, 일부 타인 토지'], source: '지적도 2026.09.03 확인' },
  { item: '용도지역', detail: ['제1종일반주거지역'], source: '토지이용계획 2026.09.03 확인' },
  { item: '철거 시 유의', detail: ['슬레이트 지붕입니다.', '석면 처리 절차가 따로 있습니다.'], source: '현장 방문 2026.09.05 확인', earth: true },
  { item: '경계 측량', detail: ['확인하지 못했습니다.', '측량이 필요합니다.'], source: '미확인', unverified: true },
]

const PAPERS = [
  '등기사항증명서 — 소유자와 권리 관계',
  '건축물대장 — 준공 연도와 구조, 위반 사항',
  '토지이용계획확인원 — 용도지역과 제한',
  '지적도 — 진입로와 인접 토지',
]

const FIELDWORK = [
  '차가 실제로 들어가는지, 어디까지 들어가는지',
  '지붕과 벽, 물이 새는 흔적',
  '상하수도와 전기가 살아 있는지',
  '주변에 사람이 사는 집이 남아 있는지',
]

const STEPS = [
  { n: '1', title: '주소를 입력합니다.', lines: ['아래 칸에 빈집 주소와 연락처만 남겨주세요.', '다른 서류는 필요하지 않습니다.'], when: '1분이면 됩니다' },
  { n: '2', title: '서류를 확인하고 방문합니다.', lines: ['서류를 확인하고 정리한 뒤, 직접 빈집에 방문합니다.', '소유주가 함께 가지 않아도 됩니다.'], when: '신청하신 날부터 5일 안에 방문합니다.' },
  { n: '3', title: '진단서를 보내드립니다', lines: ['문자나 이메일을 통해 진단서를 보내드립니다.', '진단서를 받으신 후 전화로 물어보셔도 됩니다.'], when: '다녀온 날부터 3일 안에 보냅니다' },
]

const LIMITS = [
  ['집을 대신 팔아 드리지 않습니다.', '진단서는 거래를 알선하는 서류가 아닙니다.'],
  ['얼마를 받을 수 있는지 금액으로 적지 않습니다.'],
  ['공사 비용을 계산해 드리지 않습니다.', '철거는 별도 절차가 필요하다는 사실만 알려드립니다.'],
  ['세금과 상속 문제의 결론을 내려 드리지 않습니다.', '세무사나 변호사를 만나야 하는 지점만 표시해 드립니다.'],
]

const H2 = 'text-[clamp(24px,2.6vw,32px)] leading-[1.3]'
const SECTION = 'px-6 py-[clamp(48px,6vw,80px)]'

function Lines({ items, className }: { items: string[]; className?: string }) {
  return (
    <span className={'flex flex-col gap-2 ' + (className ?? '')}>
      {items.map((t) => (
        <span key={t}>{t}</span>
      ))}
    </span>
  )
}

export default function Home() {
  return (
    <>
      {/* (a) 헤더 — 네비게이션을 넣지 않는다. CTA는 하나다 */}
      <header className="flex flex-wrap items-baseline gap-[14px] border-b border-line bg-paper px-6 py-[18px]">
        <p className="font-serif text-[19px] font-semibold tracking-[-0.01em] text-ink">빈집이력서</p>
        <p className="text-[13px] text-muted">포항에 있는 빈집을 진단합니다.</p>
      </header>

      {/* (b) Hero */}
      <section className={SECTION + ' grid items-start gap-[clamp(36px,5vw,64px)] bg-paper [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]'}>
        <div className="max-w-[34rem]">
          <h1 className="flex flex-col text-[32px] md:text-[52px]">
            <span>그 집,</span>
            <span>이제 정리합시다</span>
          </h1>
          <Lines
            className="mt-6 max-w-[36ch]"
            items={[
              '포항에 비어 있는 집이 있으신가요?',
              '주소만 남겨 주시면 그 집을 지금 팔 수 있는지, 빌려줄 수 있는지, 무엇부터 정리해야 하는지를 진단해 드립니다.',
            ]}
          />
          <a
            href="#apply"
            className="mt-8 inline-block rounded-[6px] bg-deep px-7 py-4 text-[17px] font-semibold leading-[1.2] text-paper hover:bg-ink"
          >
            무료로 진단 신청하기
          </a>
          <Lines className="mt-4 gap-1 text-[13px] leading-[1.6] text-muted" items={['집 앞까지 직접 가서 확인합니다.', '비용은 받지 않습니다.']} />
        </div>

        {/* 오른쪽 — 진단서 실물 미리보기. 큰 숫자나 통계 카드를 쓰지 않는다 */}
        <div className="doc-preview max-w-[420px] rounded-[4px] border border-line bg-paper px-[26px] pb-[22px] pt-[26px]">
          <div className="flex items-baseline justify-between gap-3 border-b border-ink pb-3">
            <p className="font-serif text-[18px] font-semibold text-ink">빈집 진단서</p>
            <p className="text-[12px] text-muted">제2026-0141호</p>
          </div>
          <p className="mt-4 text-[15px] leading-[1.6] text-body">경북 포항시 남구 ○○동 1○○-○ 단독주택</p>
          <div className="mt-4 flex items-center gap-3">
            <p className="font-serif text-[22px] font-semibold text-deep">지금 처분 가능</p>
            <span className="text-[13px] tracking-[0.18em] text-mid">●●●</span>
          </div>
          <div className="mt-3 flex flex-col gap-1 text-[13px] text-muted">
            <span>6항목 확인</span>
            <span>확인일: 2026. 9. 5.</span>
          </div>
          <div className="mt-4 flex flex-col gap-1 border-t border-dashed border-dash pt-3 text-[12px] leading-[1.6] text-muted">
            <span>점선으로 적힌 항목은 아직 확인하지 못한 것입니다.</span>
            <span>2026.09.05 현장 방문하여 작성</span>
          </div>
        </div>
      </section>

      {/* (c) 이런 상태 아니신가요 */}
      <section className={SECTION + ' border-y border-line bg-wash'}>
        <h2 className={H2}>이런 상태 아니신가요?</h2>
        <div className="mt-8 grid max-w-[900px] gap-[clamp(24px,3vw,40px)] [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
          {STATES.map((lines) => (
            <div key={lines[0]} className="border-l-2 border-mid pl-5">
              <Lines className="text-[17px] leading-[1.75]" items={lines} />
            </div>
          ))}
        </div>
        <Lines
          className="mt-10 max-w-[52ch] text-[17px]"
          items={['먼저 필요한 것은 결정이 아닙니다.', '지금 그 집이 어떤 상태인지 적힌 종이 한 장입니다.']}
        />
      </section>

      {/* (d) 진단서에 무엇이 작성되나요 */}
      <section className={SECTION + ' bg-paper'}>
        <h2 className={H2}>진단서에 무엇이 작성되나요?</h2>
        <Lines className="mt-5 max-w-[56ch]" items={['세 가지 중 하나로 판정됩니다.', '그리고 판정의 근거를 항목마다 따로 작성합니다.']} />

        <div className="mt-9 max-w-[720px] border-t border-line">
          {VERDICTS.map((v) => (
            <div key={v.label} className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-b border-line py-5">
              <span className="w-[52px] flex-none text-[14px] tracking-[0.2em] text-mid">{v.dots}</span>
              <p className={'font-serif text-[clamp(20px,2vw,24px)] font-semibold ' + v.tone}>{v.label}</p>
              <Lines className="w-full gap-1 text-[15px] leading-[1.7] text-muted" items={v.lines} />
            </div>
          ))}
        </div>

        {/* 근거 표 — 모바일에서는 가로 스크롤 컨테이너로 감싼다 (본문에 가로 스크롤이 생기지 않게) */}
        <div className="mt-10 max-w-[820px] overflow-x-auto rounded-[4px] border border-line">
          <div className="min-w-[640px]">
            <div className="grid bg-pale [grid-template-columns:1.1fr_1.6fr_1fr]">
              {['항목', '확인 내용', '출처와 확인일'].map((h) => (
                <div key={h} className="px-4 py-3 text-[13px] font-semibold text-ink">{h}</div>
              ))}
            </div>
            {EVIDENCE.map((row) => (
              <div
                key={row.item}
                className={
                  'grid [grid-template-columns:1.1fr_1.6fr_1fr] border-t ' +
                  (row.unverified ? 'border-dashed border-dash bg-paper text-muted' : 'border-line')
                }
              >
                <div className="p-4 text-[15px]">{row.item}</div>
                <div className={'p-4 text-[15px] ' + (row.earth ? 'text-earth' : '')}>
                  <Lines className="gap-1" items={row.detail} />
                </div>
                <div className="p-4 text-[13px] text-muted">{row.source}</div>
              </div>
            ))}
          </div>
        </div>
        <Lines
          className="mt-4 max-w-[68ch] gap-1 text-[13px] leading-[1.6] text-muted"
          items={[
            '실선으로 적힌 것은 확인한 항목이고, 점선으로 적힌 것은 확인하지 못한 항목입니다.',
            '확인하지 못한 것을 확인한 것처럼 적지 않습니다.',
          ]}
        />
      </section>

      {/* (e) 어떻게 확인하나요 — 다크 반전 */}
      <section className={SECTION + ' bg-ink'}>
        <h2 className={H2 + ' text-paper'}>어떻게 확인하나요?</h2>
        <Lines
          className="mt-5 max-w-[52ch] text-pale"
          items={['공개된 서류를 확인하고, 직접 해당 빈집에 방문합니다.', '이후 진단서를 발급합니다.']}
        />
        <div className="mt-9 grid max-w-[960px] gap-[clamp(24px,3vw,44px)] [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
          {[
            { label: '서류에서 무엇을 보나요?', items: PAPERS },
            { label: '현장에서 무엇을 보나요?', items: FIELDWORK },
          ].map((col) => (
            <div key={col.label}>
              <p className="text-[13px] font-semibold text-pale">{col.label}</p>
              <div className="mt-3">
                {col.items.map((t) => (
                  <p key={t} className="border-t border-mid py-[14px] text-[16px] leading-[1.6] text-paper">{t}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-[56ch] rounded-[4px] border border-dashed border-mid px-5 py-4 text-[14px] leading-[1.7] text-pale">
          항목마다 꼼꼼히 확인한 뒤 판단해 드립니다.
        </p>
      </section>

      {/* (f) 신청하면 어떻게 되나요 */}
      <section className={SECTION + ' bg-paper'}>
        <h2 className={H2}>신청하면 어떻게 되나요?</h2>
        <div className="mt-9 grid max-w-[1000px] gap-[clamp(28px,3vw,48px)] [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
          {STEPS.map((s) => (
            <div key={s.n} className="border-t-2 border-ink pt-[18px]">
              <p className="font-serif text-[28px] font-semibold text-deep">{s.n}</p>
              <p className="mt-2 text-[20px] font-semibold text-ink">{s.title}</p>
              <Lines className="mt-3 text-[16px] leading-[1.75]" items={s.lines} />
              <p className="mt-3 text-[13px] text-muted">{s.when}</p>
            </div>
          ))}
        </div>
      </section>

      {/* (g) 할 수 있는 일과 할 수 없는 일 */}
      <section className={SECTION + ' border-y border-line bg-wash'}>
        <h2 className={H2}>이 진단서로 어떤 일을 할 수 있고, 어떤 일은 할 수 없나요?</h2>
        <div className="mt-8 grid max-w-[900px] gap-4 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
          {LIMITS.map((lines) => (
            <div key={lines[0]} className="rounded-[4px] border border-line px-5 py-[18px]">
              <Lines className="text-[16px] leading-[1.7] text-body" items={lines} />
            </div>
          ))}
        </div>
      </section>

      {/* (h) 진단 신청 */}
      <section
        id="apply"
        className="grid items-start gap-[clamp(32px,5vw,64px)] bg-ink px-6 pb-[clamp(56px,6vw,88px)] pt-[clamp(48px,6vw,80px)] [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]"
      >
        <div className="max-w-[30rem]">
          <h2 className={H2 + ' text-paper'}>진단 신청</h2>
          <Lines
            className="mt-6 text-[17px] leading-[1.75] text-pale"
            items={['주소 하나만 있으면 신청됩니다.', '나머지는 모르셔도 괜찮습니다.', '비용은 받지 않습니다.']}
          />
          <Lines
            className="mt-6 gap-1 text-[14px] leading-[1.75] text-dash"
            items={['전화가 편하시면 010-7428-2624로 주셔도 됩니다.', '평일 9시부터 18시까지 받습니다.']}
          />
        </div>
        <ApplyForm />
      </section>

      {/* (i) 푸터 */}
      <footer className="flex flex-col gap-[18px] border-t border-deep bg-ink px-6 pb-11 pt-9">
        <p className="font-serif text-[17px] font-semibold text-pale">빈집이력서</p>
        <Lines
          className="max-w-[64ch] gap-1 text-[14px] leading-[1.75] text-dash"
          items={[
            '본 서비스는 공개된 공적 자료와 현장 확인을 근거로 빈집의 처분 가능성을 정리해 제공합니다.',
            '중개대상물의 표시·광고나 거래 알선을 하지 않습니다.',
          ]}
        />
        <Lines
          className="gap-1 text-[13px] leading-[1.7] text-dash"
          items={['정소희', '010-7428-2624 (평일 9시 - 18시)', 'rsoy2918@gmail.com', '경북 포항시 남구']}
        />
      </footer>

      {/* (j) 모바일 고정 CTA — 768px 미만에서만. 페이지에서 그림자를 쓰는 유일한 요소 */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-6px_24px_rgba(8,48,43,0.14)] md:hidden">
        <a
          href="#apply"
          className="block rounded-[6px] bg-deep px-6 py-4 text-center text-[17px] font-semibold leading-[1.2] text-paper hover:bg-ink"
        >
          무료로 진단 신청하기
        </a>
      </div>
      <div className="h-24 md:hidden" aria-hidden="true" />
    </>
  )
}
