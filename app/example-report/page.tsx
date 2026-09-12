import type { Metadata } from 'next'
import type { AxisBlock } from '../../src/report-view'
import { buildSupports } from '../../src/supports'
import { ReportOverview } from '../report/report-overview'

export const revalidate = 86400
export const metadata: Metadata = {
  title: '매도·철거 비용 비교 리포트 예시 — 빈집진단서',
  description: '설명용 가정값으로 매도·철거 후 남는 돈을 비교하고, 다음 할 일과 공적 지원 확인 항목을 살펴보세요.',
}

const blocks: AxisBlock[] = [
  { axis: 'rights', label: '권리관계', badge: '등기 확인 필요', items: [{ label: '소유관계와 채무', lines: ['등기자료와 금융기관의 상환 예상액을 아직 확인하지 않은 예시예요. 계산기에 넣은 채무 500만 원은 설명용 가정값이에요.'], source: '설명용 예시 · 실제 자료 조회 없음', unverified: true }] },
  { axis: 'tax', label: '세금·거래비용', badge: '개별 조건 확인 필요', items: [{ label: '매각 시 부담할 비용', lines: ['취득 경위, 취득가, 보유 주택 등 개인 조건과 거래비용을 확인해야 해요. 위 계산의 세금·거래비용은 실제 세액 산정 결과가 아니에요.'], source: '설명용 예시 · 세금 계산 없음', unverified: true }] },
  { axis: 'property', label: '건물·토지와 현장 상태', badge: '자료·현장 확인 필요', items: [{ label: '사진으로 보이지 않는 부분', lines: ['기초·내부 목재·지붕 내부 등은 외관 사진만으로 상태를 확정할 수 없어요. 건축물대장과 현장 확인 내용을 함께 정리해요.'], source: '설명용 예시 · 현장 확인 없음', unverified: true }] },
  { axis: 'market', label: '주변 거래와 매도 가능성', badge: '비교 거래 확인 필요', items: [{ label: '현상태와 철거 후 토지 가격', lines: ['그대로 매도 3,000만 원, 철거 후 매도 4,200만 원은 계산을 설명하는 가정값이에요. 이 집의 시세나 공시가격을 환산한 금액이 아니에요.'], source: '설명용 예시 · 실제 거래 조회 없음', unverified: true }] },
]

export default function ExampleReportPage() {
  return <ReportOverview example address="포항시 · 설명용 빈집" dateLabel="실제 주소를 조회한 결과가 아니에요" documentLabel="계산·구성 예시" blocks={blocks} supports={buildSupports({ address: '포항시 (구성 예시)' })} records={[
    { label: '건축물대장 용도', value: '미확인' },
    { label: '대장상 구조', value: '미확인' },
    { label: '건축면적', value: '미확인' },
  ]} />
}
