/** Public-interest context, not findings about the visitor's property. */
export const HOME_CONCERNS_CHECKED_AT = '2026-09-12'

export const HOME_CONCERNS = [
  {
    id: 'environment', label: '안전과 주변 환경',
    title: '집 안의 문제가 이웃에게도 영향을 줄 수 있어요.',
    description: '붕괴·화재 우려나 위생·경관 문제가 생긴 빈집은 정비가 필요할 수 있어요. 지금 집의 상태부터 살펴보세요.',
    evidence: '농림축산식품부는 안전사고·범죄·위생·경관 문제 등이 우려되는 특정빈집을 정비 대상으로 설명해요. 모든 빈집이 위험하다는 뜻은 아니며, 개별 상태를 확인해야 해요.',
    sourceLabel: '농림축산식품부 · 농촌빈집 정비·이용 안내 (2024.07.02)',
    sourceUrl: 'https://mafra.go.kr/bbs/home/792/570719/artclView.do',
  },
  {
    id: 'order', label: '조치명령과 이행강제금',
    title: '정비하라는 명령을 받았다면, 기한을 확인하세요.',
    description: '특정빈집에 대한 지자체의 조치명령을 정당한 사유 없이 기한 내 이행하지 않으면 이행강제금이 부과될 수 있어요.',
    evidence: '농어촌정비법상 특정빈집에 대한 조치명령과 미이행 절차에 관한 안내예요. 집을 비워뒀다는 이유만으로 바로 부과되는 것은 아니에요. 소재지의 적용 법률과 실제 받은 명령을 확인해야 해요.',
    sourceLabel: '농림축산식품부 · 특정빈집 이행강제금 안내 (2024.07.02)',
    sourceUrl: 'https://mafra.go.kr/bbs/home/792/570719/artclView.do',
    additionalSource: { label: '농어촌정비법 제65조의5 · 조치명령', url: 'https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1029383889' },
  },
  {
    id: 'tax', label: '보유 중 세금',
    title: '살지 않는 집도 재산세를 확인해야 해요.',
    description: '과세 대상인 집과 땅은 비어 있어도 재산세가 부과될 수 있어요. 그대로 둘 때와 정리할 때의 부담을 함께 살펴보세요.',
    evidence: '재산세는 토지·건축물·주택 등을 대상으로, 원칙적으로 과세기준일의 사실상 소유자에게 부과돼요. 빈집의 실제 상태와 비과세·감면 조건에 따라 달라질 수 있어요. 방치 기간만으로 세금이 늘거나, 철거만 하면 세금이 없어지는 것으로 단정하지 않아요.',
    sourceLabel: '법제처 찾기쉬운 생활법령정보 · 재산세',
    sourceUrl: 'https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=4&cciNo=1&cnpClsNo=3&csmSeq=1259',
  },
] as const
