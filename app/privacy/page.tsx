import type { Metadata } from 'next'
import { RETENTION_MONTHS } from '../../src/application'

export const metadata: Metadata = {
  title: '개인정보 처리방침 — 빈집이력서',
  description: '빈집이력서가 어떤 정보를 받아 어디에 쓰고 언제 지우는지 정리했습니다.',
}

/**
 * 개인정보 처리방침.
 *
 * 개인정보보호법 §15·§22 가 요구하는 고지사항을 담는다 —
 * 목적 · 항목 · 보유기간 · 위탁 · 국외이전 · 거부 권리와 불이익 · 정보주체 권리.
 *
 * 대상이 60대 이상이라 법령 문투를 쓰지 않는다. 표를 먼저 보이고 설명을 뒤에 둔다.
 * 수집 항목은 applications 테이블 스키마와 1:1 로 맞춘다 —
 * 화면에 적은 것과 실제로 받는 것이 다르면 그 자체가 위반이다.
 */
export default function PrivacyPage() {
  return (
    <main className="doc mx-auto max-w-[820px] px-5 py-8 md:px-12 md:py-14">
      <header className="border-b-2 border-ink pb-4">
        <h1 className="font-serif text-[27px] font-semibold text-ink">개인정보 처리방침</h1>
        <p className="mt-2 text-[15px]">
          빈집이력서가 어떤 정보를 받아 어디에 쓰고 언제 지우는지 정리했습니다.
        </p>
      </header>

      <Section no="①" title="누가 받습니까">
        <P>정소희 (빈집이력서 운영자)</P>
        <P>경북 포항시 남구 · 010-7428-2624 (평일 9시–18시) · rsoy2918@gmail.com</P>
        <P className="text-muted">
          법인이 아닌 개인이 운영합니다. 문의·열람·삭제 요청은 위 연락처로 하시면 됩니다.
        </P>
      </Section>

      <Section no="②" title="무엇에 씁니까">
        <P>이 집으로 지금 무엇을 할 수 있는지 정리한 진단서를 만들어 보내드리는 데만 씁니다.</P>
        <P>그 밖의 목적으로는 쓰지 않고, 팔거나 빌려주지 않습니다.</P>
      </Section>

      <Section no="③" title="무엇을 받습니까">
        <Table
          rows={[
            ['집 주소', '어느 집을 진단할지 정하고 공적 자료를 찾는 데 씁니다'],
            ['집 상태', '현장에서 무엇을 볼지 정하는 데 씁니다'],
            ['취득 경위 (상속·매입 등)', '권리관계에서 볼 것을 정하는 데 씁니다'],
            ['소유관계 (단독·공동 등)', '같음'],
            ['가장 걱정되는 것', '진단서에서 어느 이야기를 먼저 쓸지 정하는 데 씁니다'],
            ['희망 소요 기간', '서류만 볼지 현장까지 갈지 정하는 데 씁니다'],
            ['전화번호', '진단서 발송이 실패했을 때 연락하는 데 씁니다'],
            ['이메일', '진단서를 보내는 데 씁니다'],
            ['받을 방법 (문자·이메일)', '어느 쪽을 편해하시는지 참고합니다'],
          ]}
        />
        <P className="text-muted">
          주소를 넣으시면 그 주소에 해당하는 필지번호와 정규화된 주소가 함께 저장됩니다.
          공적 자료를 찾기 위한 것이고 새로 여쭙는 정보는 아닙니다.
        </P>
        <P>
          주민등록번호·가족관계·소득·재산 같은 민감한 정보는 <strong>받지 않습니다.</strong>
        </P>
      </Section>

      <Section no="④" title="언제 지웁니까">
        <P>
          진단서를 보내드린 뒤 <strong>{RETENTION_MONTHS}개월</strong>이 지나면 지웁니다.
        </P>
        <P>
          그 전에 <strong>지워달라고 하시면 바로 지웁니다.</strong> 위 연락처로 말씀하시면 됩니다.
        </P>
      </Section>

      <Section no="⑤" title="어디를 거칩니까">
        <P>진단서를 만들고 보내려면 아래 서비스를 거칩니다. 각각 필요한 만큼만 전달됩니다.</P>
        <Table
          rows={[
            ['Supabase Inc.', '신청 내용과 진단서 저장'],
            ['Resend, Inc.', '진단서와 접수 알림 메일 발송'],
            ['Vercel Inc.', '웹사이트 운영'],
            ['행정안전부 주소정보누리집', '입력한 주소를 정규화 (주소만 전달)'],
            ['국토교통부 브이월드 · 공공데이터포털', '건축물·토지 자료 조회 (필지번호만 전달)'],
          ]}
        />
        <P className="text-muted">
          공공기관 쪽에는 <strong>주소와 필지번호만</strong> 보냅니다. 이름·전화번호·이메일은
          보내지 않습니다.
        </P>
        <P>
          <strong>국외 이전이 발생합니다.</strong> Supabase·Resend·Vercel은 국외에 서버를 둔
          사업자이고, 저장과 메일 발송 과정에서 위 항목이 국외로 옮겨져 처리될 수 있습니다.
          이전되는 항목·목적·보유기간은 위 ③·②·④와 같습니다. 이 이전에 동의하지 않으시면
          신청 접수를 해드릴 수 없습니다.
        </P>
      </Section>

      <Section no="⑥" title="동의하지 않아도 됩니까">
        <P>
          <strong>됩니다.</strong> 동의는 강제가 아닙니다.
        </P>
        <P>
          다만 주소와 연락처가 없으면 진단서를 만들 수도, 보내드릴 수도 없습니다. 그래서
          <strong> 동의하지 않으시면 신청 접수가 되지 않습니다.</strong> 그 외의 불이익은 없습니다.
        </P>
      </Section>

      <Section no="⑦" title="무엇을 요구할 수 있습니까">
        <P>언제든 아래를 요구하실 수 있고, 저희는 지체 없이 처리합니다.</P>
        <Table
          rows={[
            ['열람', '어떤 정보가 저장돼 있는지 보여드립니다'],
            ['정정', '틀린 내용을 고칩니다'],
            ['삭제', '지웁니다. 지운 뒤에는 진단서를 다시 보내드릴 수 없습니다'],
            ['처리 정지', '더 이상 쓰지 않도록 멈춥니다'],
            ['동의 철회', '이미 동의한 것을 거둘 수 있습니다'],
          ]}
        />
        <P className="text-muted">010-7428-2624 또는 rsoy2918@gmail.com 으로 말씀하시면 됩니다.</P>
        <P className="text-muted">
          처리 결과가 만족스럽지 않으시면 개인정보 침해신고센터(국번 없이 118,
          privacy.kisa.or.kr)나 개인정보 분쟁조정위원회(1833-6972, kopico.go.kr)에 도움을
          요청하실 수 있습니다.
        </P>
      </Section>

      <Section no="⑧" title="안전하게 지키고 있습니까">
        <P>
          저장된 정보는 운영자만 볼 수 있도록 잠가 두었습니다. 신청자 정보를 보는 화면은 별도
          인증이 있어야 열리고, 검색엔진에 노출되지 않습니다.
        </P>
        <P>
          소유주께 보내는 진단서 링크에는{' '}
          <strong>이름·전화번호·이메일이 들어가지 않습니다.</strong> 링크가 다른 사람에게
          전달되어도 연락처는 보이지 않습니다.
        </P>
      </Section>

      <footer className="mt-10 border-t border-mid pt-5">
        <p className="text-[13px] leading-[1.7] text-muted">
          이 방침은 2026년 9월 6일부터 적용됩니다. 내용이 바뀌면 이 페이지에 먼저 알려드립니다.
        </p>
        <p className="mt-3 text-[14px]">
          <a href="/" className="underline">
            빈집이력서로 돌아가기
          </a>
        </p>
      </footer>
    </main>
  )
}

function Section({
  no,
  title,
  children,
}: {
  no: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-8 break-inside-avoid">
      <div className="flex items-baseline gap-3 border-b border-mid pb-2">
        <span className="font-serif text-[16px] text-mid">{no}</span>
        <h2 className="font-serif text-[18px] font-semibold text-ink">{title}</h2>
      </div>
      <div className="mt-3 flex flex-col gap-2">{children}</div>
    </section>
  )
}

function P({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <p className={'text-[16px] leading-[1.7] ' + className}>{children}</p>
}

/** 왼쪽에 항목, 오른쪽에 쓰임. 진단서와 같은 격자를 쓴다. */
function Table({ rows }: { rows: [string, string][] }) {
  return (
    <div className="mt-1 flex flex-col">
      {rows.map(([label, use]) => (
        <div
          key={label}
          className="mt-2 grid grid-cols-1 gap-x-[14px] border-l-[3px] border-mid bg-paper py-[12px] pl-4 md:grid-cols-[220px_1fr]"
        >
          <span className="text-[15px] text-muted">{label}</span>
          <span className="text-[16px] leading-[1.6]">{use}</span>
        </div>
      ))}
    </div>
  )
}
