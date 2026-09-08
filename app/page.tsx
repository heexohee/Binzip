import { ApplyForm } from './apply-form'

// 공공 API 를 5~6개 부르는 자동 판정이 제출 요청 안에서 돈다.
// 기본 10초로는 모자란다.
export const maxDuration = 60

/** (c) 이런 상태 아니신가요 — 큰따옴표를 쓰지 않는다. 실제 인터뷰가 아니므로 인용처럼 보이면 안 된다 */
const STATES = [
  ['멀리 있어 일 년에 몇 번 못 가봅니다.', '지금 어떤 상태인지 모릅니다.'],
  ['세금이 얼마나 나가는지 정확히 모릅니다.', '그냥 두는 것이 맞는지 판단이 서지 않습니다.'],
  ['형제들끼리 상속 정리가 아직 끝나지 않았습니다.', '이 상태로 무엇을 할 수 있는지 모릅니다.'],
  ['규제가 걸려 있다고 들었는데, 무엇이 어떻게 걸리는지는 듣지 못했습니다.'],
]

/** (d) 판정 4등급 — 신호등을 쓰지 않는다. 한 계열의 명도만 쓴다 */
const VERDICTS = [
  { dots: '●●●●', label: '지금 처분 가능', tone: 'text-deep', lines: ['서류와 현장에서 걸리는 것이 없습니다.', '바로 다음 단계로 가면 됩니다.'] },
  { dots: '●●●○', label: '조건부', tone: 'text-mid', lines: ['먼저 확인할 것이 한두 가지 있습니다.', '무엇인지 적어 드립니다.'] },
  { dots: '●●○○', label: '먼저 정리할 것이 있음', tone: 'text-mid', lines: ['절차 하나를 밟으시면 나머지가 열립니다.', '무엇부터 해야 하는지 적어 드립니다.'] },
  { dots: '●○○○', label: '지금은 불가', tone: 'text-muted', lines: ['지금 상태로는 어렵습니다.', '그래도 다음에 할 일은 남아 있습니다.'] },
]

/** 진단서와 같은 4축으로 보여준다. 랜딩과 실물이 다르면 신뢰를 잃는다 */
const EVIDENCE = [
  { axis: '① 권리', item: '등기', detail: ['확인하지 못했습니다.', '등기소에서 확인이 필요합니다.'], source: '미확인', unverified: true },
  { axis: '① 권리', item: '토지 소유', detail: ['소유구분 개인 · 소유권 변동 원인 상속'], source: '토지소유정보 2026.09.03 확인' },
  { axis: '② 세금', item: '보유세', detail: ['재산세는 1주택 기준 연 약 1.6만원,', '다른 집이 있으시면 약 4.4만원 수준입니다 (추정).'], source: '지방세법 §111·§111의2' },
  { axis: '② 세금', item: '처분세', detail: ['다른 주택 보유 여부에 따라 갈려 계산하지 않습니다.', '어느 특례를 보셔야 하는지까지만 적어 드립니다.'], source: '미확인', unverified: true },
  { axis: '③ 건물·토지', item: '건축물', detail: ['단독주택 · 사용승인 1999. 04. 26. · 지상 1층'], source: '건축물대장 2026.09.03 확인' },
  { axis: '③ 건물·토지', item: '진입로', detail: ['도로접면 세로한면(가) — 진입로가 확보되어 있습니다.'], source: '토지특성 2026.09.03 확인' },
  { axis: '③ 건물·토지', item: '현장 상태', detail: ['확인하지 못했습니다.', '현장 방문이 필요합니다.'], source: '미확인', unverified: true },
  { axis: '④ 시장·관리', item: '주변 거래', detail: ['최근 12개월간 같은 리에서 조건이 비슷한 거래 10건.', '단가는 5,621~227,409원/㎡ 로 폭이 넓습니다.'], source: '국토교통부 실거래가 2026.09.03 확인' },
  { axis: '④ 시장·관리', item: '관리 부담', detail: ['비워두시더라도 최소한의 관리는 필요합니다.', '조치명령을 이행하지 않으면 이행강제금이 부과됩니다.'], source: '농어촌빈집특별법 §3·§45', earth: true },
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
  { n: '1', title: '주소를 입력합니다.', lines: ['아래 칸에 주소와 연락처만 남겨주세요.', '다른 서류는 필요하지 않습니다.'], when: '1분이면 됩니다' },
  { n: '2', title: '서류를 확인하고 방문합니다.', lines: ['공개된 서류를 확인하고 정리한 뒤, 직접 현장에 방문합니다.', '소유주가 함께 가지 않아도 됩니다.'], when: '신청하신 날부터 5일 안에 방문합니다.' },
  { n: '3', title: '진단서를 보내드립니다', lines: ['문자나 이메일을 통해 진단서를 보내드립니다.', '진단서를 받으신 후 전화로 물어보셔도 됩니다.'], when: '다녀온 날부터 3일 안에 보냅니다' },
]

const LIMITS = [
  ['집을 대신 팔아 드리지 않습니다.', '진단서는 거래를 알선하는 서류가 아닙니다.'],
  ['얼마를 받을 수 있는지 금액으로 적지 않습니다.', '주변 거래는 참고 자료일 뿐 감정평가가 아닙니다.'],
  ['공사 비용을 계산해 드리지 않습니다.', '철거는 별도 절차가 필요하다는 사실만 알려드립니다.'],
  ['세금과 상속 문제의 결론을 내려 드리지 않습니다.', '세무사나 변호사를 만나야 하는 지점만 표시해 드립니다.'],
]

const H2 = 'text-[clamp(24px,2.6vw,32px)] leading-[1.3]'

/**
 * 공통 컨테이너.
 * 배경은 바깥 section 이 전체 폭으로 깔고, 내용만 이 안에 넣는다.
 * 섹션마다 max-w 를 따로 두면 왼쪽은 고정인데 오른쪽 끝이 들쭉날쭉해진다.
 */
const SHELL = 'mx-auto w-full max-w-[1040px] px-6 md:px-10 lg:px-14'
const PAD = 'py-[clamp(48px,6vw,80px)]'

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
      <header className="border-b border-line bg-paper">
        <div className={SHELL + ' flex flex-wrap items-baseline gap-[14px] py-[18px]'}>
          <p className="font-serif text-[19px] font-semibold tracking-[-0.01em] text-ink">빈집이력서</p>
          <p className="text-[13px] text-muted">경북에 있는 땅과 집을 진단합니다.</p>
        </div>
      </header>

      {/* (b) Hero */}
      <section className="bg-paper">
        <div className={SHELL + ' ' + PAD + ' grid items-start gap-[clamp(36px,5vw,64px)] [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]'}>
        <div className="max-w-[34rem]">
          <h1 className="flex flex-col text-[32px] md:text-[52px]">
            <span>그 땅과 집,</span>
            <span>지금 어떤 상태인가요</span>
          </h1>
          <Lines
            className="mt-6 max-w-[36ch]"
            items={[
              '경북에 자주 못 가보는 땅이나 집이 있으신가요?',
              '주소만 남겨 주시면 지금 세금이 얼마나 나가고 있는지, 어떤 규제가 걸려 있는지, 무엇부터 확인해야 하는지를 정리해 드립니다.',
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
            <p className="font-serif text-[18px] font-semibold text-ink">부동산 진단서</p>
            <p className="text-[12px] text-muted">제2026-0141호</p>
          </div>
          <p className="mt-4 text-[15px] leading-[1.6] text-body">경북 ○○시 ○○읍 ○○리 2○-○ 단독주택</p>
          <div className="mt-4 flex items-center gap-3">
            <p className="font-serif text-[22px] font-semibold text-deep">조건부</p>
            <span className="text-[13px] tracking-[0.18em] text-mid">●●●○</span>
          </div>
          <div className="mt-3 flex flex-col gap-1 text-[13px] text-muted">
            <span>4개 축 · 재산세 연 1.6만원 (추정)</span>
            <span>확인일: 2026. 9. 5.</span>
          </div>
          <div className="mt-4 flex flex-col gap-1 border-t border-dashed border-dash pt-3 text-[12px] leading-[1.6] text-muted">
            <span>바탕이 흐린 항목은 아직 확인하지 못한 것입니다.</span>
            <span>공개 자료 확인 후 현장 방문하여 작성</span>
          </div>
        </div>
        </div>
      </section>

      {/* (c) 이런 상태 아니신가요 */}
      <section className="border-y border-line bg-wash">
        <div className={SHELL + ' ' + PAD}>
        <h2 className={H2}>이런 상태 아니신가요?</h2>
        <div className="mt-8 grid gap-[clamp(24px,3vw,40px)] [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
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
        </div>
      </section>

      {/* (d) 진단서에 무엇이 작성되나요 */}
      <section className="bg-paper">
        <div className={SHELL + ' ' + PAD}>
        <h2 className={H2}>진단서에 무엇이 작성되나요?</h2>
        <Lines className="mt-5 max-w-[56ch]" items={['네 가지 중 하나로 판정됩니다.', '그리고 판정의 근거를 항목마다 따로 작성합니다.']} />

        <div className="mt-9 border-t border-line">
          {VERDICTS.map((v) => (
            <div key={v.label} className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-b border-line py-5">
              <span className="w-[52px] flex-none text-[14px] tracking-[0.2em] text-mid">{v.dots}</span>
              <p className={'font-serif text-[clamp(20px,2vw,24px)] font-semibold ' + v.tone}>{v.label}</p>
              <Lines className="w-full gap-1 text-[15px] leading-[1.7] text-muted" items={v.lines} />
            </div>
          ))}
        </div>

        {/* 근거 표 — 모바일에서는 가로 스크롤 컨테이너로 감싼다 (본문에 가로 스크롤이 생기지 않게) */}
        <div className="mt-10 overflow-x-auto rounded-[4px] border border-line">
          <div className="min-w-[640px]">
            <div className="grid bg-pale [grid-template-columns:1.1fr_1.6fr_1fr]">
              {['항목', '확인 내용', '출처와 확인일'].map((h) => (
                <div key={h} className="px-4 py-3 text-[13px] font-semibold text-ink">{h}</div>
              ))}
            </div>
            {EVIDENCE.map((row, i) => (
              <div key={row.axis + row.item} className="contents">
                {/* 축이 바뀔 때만 헤더를 낸다. 진단서와 같은 계층이다 */}
                {(i === 0 || EVIDENCE[i - 1]!.axis !== row.axis) && (
                  <div className="col-span-3 border-t border-line bg-wash px-4 py-2 font-serif text-[14px] font-semibold text-ink">
                    {row.axis}
                  </div>
                )}
              <div
                className={
                  'col-span-3 grid [grid-template-columns:1.1fr_1.6fr_1fr] border-t border-l-[3px] ' +
                  // 진단서와 같은 언어를 쓴다 — 선 모양이 아니라 면과 바 굵기로 가른다
                  (row.unverified
                    ? 'border-t-line border-l-dash bg-wash text-muted'
                    : 'border-t-line border-l-mid bg-paper')
                }
              >
                <div className="p-4 text-[15px]">{row.item}</div>
                <div className={'p-4 text-[15px] ' + (row.earth ? 'text-earth' : '')}>
                  <Lines className="gap-1" items={row.detail} />
                </div>
                <div className="flex flex-col gap-2 p-4 text-[13px] text-muted">
                  {row.unverified ? (
                    <span className="self-start rounded-[3px] bg-pale px-2 py-[2px] text-[12px] font-semibold text-ink">
                      아직 확인하지 못함
                    </span>
                  ) : (
                    <span>{row.source}</span>
                  )}
                </div>
              </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 max-w-[68ch] text-[13px] leading-[1.7] text-muted">
          왼쪽에 진한 선이 그어진 항목은 확인한 것이고, 회색 바탕에{' '}
          <span className="rounded-[3px] bg-pale px-[6px] py-[1px] text-[12px] font-semibold text-ink">
            아직 확인하지 못함
          </span>{' '}
          이 붙은 항목은 확인하지 못한 것입니다. 확인하지 못한 것을 확인한 것처럼 적지 않습니다.
        </p>
        </div>
      </section>

      {/* (e) 어떻게 확인하나요 — 다크 반전 */}
      <section className="bg-ink">
        <div className={SHELL + ' ' + PAD}>
        <h2 className={H2 + ' text-paper'}>어떻게 확인하나요?</h2>
        <Lines
          className="mt-5 max-w-[52ch] text-pale"
          items={['공개된 서류를 확인하고, 직접 현장에 방문합니다.', '이후 진단서를 발급합니다.']}
        />
        <div className="mt-9 grid gap-[clamp(24px,3vw,44px)] [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
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
        </div>
      </section>

      {/* (f) 신청하면 어떻게 되나요 */}
      <section className="bg-paper">
        <div className={SHELL + ' ' + PAD}>
        <h2 className={H2}>신청하면 어떻게 되나요?</h2>
        <div className="mt-9 grid gap-[clamp(28px,3vw,48px)] [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
          {STEPS.map((s) => (
            <div key={s.n} className="border-t-2 border-ink pt-[18px]">
              <p className="font-serif text-[28px] font-semibold text-deep">{s.n}</p>
              <p className="mt-2 text-[20px] font-semibold text-ink">{s.title}</p>
              <Lines className="mt-3 text-[16px] leading-[1.75]" items={s.lines} />
              <p className="mt-3 text-[13px] text-muted">{s.when}</p>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* (g) 할 수 있는 일과 할 수 없는 일 */}
      <section className="border-y border-line bg-wash">
        <div className={SHELL + ' ' + PAD}>
        <h2 className={H2}>이 진단서로 어떤 일을 할 수 있고, 어떤 일은 할 수 없나요?</h2>
        <div className="mt-8 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
          {LIMITS.map((lines) => (
            <div key={lines[0]} className="rounded-[4px] border border-line px-5 py-[18px]">
              <Lines className="text-[16px] leading-[1.7] text-body" items={lines} />
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* (h) 진단 신청 */}
      <section
        id="apply"
        className="bg-ink"
      >
        <div className={SHELL + ' grid items-start gap-[clamp(32px,5vw,64px)] pb-[clamp(56px,6vw,88px)] pt-[clamp(48px,6vw,80px)] [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]'}>
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
        </div>
      </section>

      {/* (i) 푸터 */}
      <footer className="border-t border-deep bg-ink">
        <div className={SHELL + ' flex flex-col gap-[18px] pb-11 pt-9'}>
        <p className="font-serif text-[17px] font-semibold text-pale">빈집이력서</p>
        <Lines
          className="max-w-[64ch] gap-1 text-[14px] leading-[1.75] text-dash"
          items={[
            '본 서비스는 공개된 공적 자료와 현장 확인을 근거로 부동산의 현재 상태와 보유 비용을 정리해 제공합니다.',
            '중개대상물의 표시·광고나 거래 알선을 하지 않습니다.',
          ]}
        />
        <Lines
          className="gap-1 text-[13px] leading-[1.7] text-dash"
          items={['정소희', '010-7428-2624 (평일 9시 - 18시)', 'rsoy2918@gmail.com', '경북 포항시 남구']}
        />
        {/* 개인정보를 받는 서비스라 처리방침은 상시 접근이 가능해야 한다 */}
        <a href="/privacy" className="text-[13px] leading-[1.7] text-dash underline">
          개인정보 처리방침
        </a>
        </div>
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
