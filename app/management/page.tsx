import { jsonLd, pageMetadata } from '../../src/seo'
import { MANAGEMENT_JSON_LD, ManagementView } from './management-view'

export const metadata = pageMetadata({
  path: '/management',
  title: '빈집 관리 대행 — 방문 점검·사진 보고, 월 1회 55,000원 | 빈집진단서',
  description: '멀리 있는 시골 빈집, 열쇠를 맡기면 집 안팎 점검·환기·누수 확인·우편물 수거를 하고 사진 보고서를 보내 드려요. 계절과 날씨에 맞춰 살펴볼 곳도 미리 알려 드려요. 1회성 77,000원, 월 1회 55,000원. 포항·경주 시범 운영.',
})

export default function Management() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(MANAGEMENT_JSON_LD)} /><ManagementView /></>
}
