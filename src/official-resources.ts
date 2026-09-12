/** Curated official destinations. Links are guidance, not eligibility or live application status. */
export const RESOURCE_CHECKED_AT = '2026-09-11'
export const RESOURCE_GROUPS = [
  { id: 'national', label: '전국 빈집·매물 정보', description: '다른 빈집의 사례를 보거나, 매도·활용 가능성을 알아볼 때' },
  { id: 'pohang', label: '포항시 지원·공지', description: '철거 지원이나 노후 건축물 점검을 문의할 때' },
  { id: 'records', label: '집의 서류 확인', description: '소유관계와 건축물 기록을 준비할 때' },
  { id: 'laws', label: '관련 법령·조례', description: '내 집에 적용되는 기준을 담당자와 확인할 때' },
] as const
export type ResourceGroup = (typeof RESOURCE_GROUPS)[number]['id']
export type OfficialResource = {
  id: string; group: ResourceGroup; name: string; operator: string; title: string
  description: string; before: string; href: string; linkLabel: string
}
export const OFFICIAL_RESOURCES = [
  { id: 'binzibe', group: 'national', name: '빈집애(愛)', operator: '한국부동산원', title: '빈집 현황과 정비·활용 사례 살펴보기', description: '전국 빈집 현황, 빈집정비사업 안내, 활용 사례와 공개된 빈집 매물을 확인해요.', before: '관심 지역을 준비해 주세요. 공개된 매물 정보만으로 내 집의 거래 가능성이 확정되는 것은 아니에요.', href: 'https://www.binzibe.kr/main/', linkLabel: '빈집애에서 살펴보기' },
  { id: 'greendaero', group: 'national', name: '그린대로 · 농촌 빈집은행', operator: '농림수산식품교육문화정보원', title: '농촌 빈집 매물과 참여 지역 확인하기', description: '지역별 빈집 매물을 살펴보고, 귀농·귀촌에 필요한 정보로 이어갈 수 있어요.', before: '내 집의 등록 가능 여부와 절차는 소재지 담당 부서에 확인해 주세요. 모든 지역·빈집이 등록되어 있지는 않아요.', href: 'https://www.greendaero.go.kr/svc/rfph/cpif/front/vacantlist.do', linkLabel: '농촌 빈집은행 보기' },
  { id: 'transactions', group: 'national', name: '실거래가 공개시스템', operator: '국토교통부', title: '주변 단독주택·토지의 거래 사례 보기', description: '단독·다가구와 토지의 신고된 매매 사례를 비교할 수 있어요.', before: '거래 시점, 면적, 도로 조건이 다른 사례를 내 집의 예상 매도가로 그대로 사용하지 마세요.', href: 'https://rt.molit.go.kr/', linkLabel: '주변 거래 찾아보기' },
  { id: 'pohang-notices', group: 'pohang', name: '포항시 도시안전주택 공지사항', operator: '포항시', title: '빈집정비·노후 건축물 지원 공고 찾기', description: '빈집정비사업과 노후건축물 안전점검 등 시에서 게시한 공고를 확인해요.', before: '게시판에서 ‘빈집정비’ 또는 ‘노후건축물’을 검색해 주세요. 공고 연도·신청 기간·잔여 예산은 별도 확인이 필요해요.', href: 'https://pohang.go.kr/dept/board/post/list.do?bcIdx=100&mid=0307010000&cateList%5B0%5D.cateIdx=7&cateList%5B0%5D.inputValue=%EA%B1%B4%EC%84%A4%EB%8F%84%EC%8B%9C&postMenus=notUse', linkLabel: '포항시 공고 찾아보기' },
  { id: 'registry', group: 'records', name: '인터넷등기소', operator: '대한민국 법원', title: '집과 땅의 소유·권리 자료 준비하기', description: '토지와 건물의 등기사항증명서를 열람·발급하는 공식 서비스예요.', before: '토지와 건물의 주소를 각각 확인해 주세요. 등기에 적힌 담보 금액과 실제 갚을 대출금은 다를 수 있어요.', href: 'https://www.iros.go.kr/', linkLabel: '인터넷등기소 열기' },
  { id: 'building-ledger', group: 'records', name: '세움터', operator: '국토교통부 · 건축행정시스템', title: '건축물대장과 건축행정 안내 확인하기', description: '건축물대장을 준비하고 건축행정 관련 서비스를 확인하는 공식 창구예요.', before: '대장 기록과 현재 건물의 모습이 같은지는 현장에서 확인해야 해요. 발급·민원에는 로그인 등이 필요할 수 있어요.', href: 'https://www.eais.go.kr/', linkLabel: '세움터에서 확인하기' },
  { id: 'rural-law', group: 'laws', name: '농어촌정비법', operator: '국가법령정보센터', title: '농어촌 빈집 정비의 법령 확인하기', description: '농어촌 빈집 정비와 관리에 관한 법령 원문을 확인해요.', before: '현행·시행 예정 법령을 구분하고, 내 집의 소재지에 어떤 조항이 적용되는지 관할 부서에 확인해 주세요.', href: 'https://www.law.go.kr/법령/농어촌정비법', linkLabel: '농어촌정비법 원문 보기' },
  { id: 'urban-law', group: 'laws', name: '빈집 및 소규모주택 정비에 관한 특례법', operator: '국가법령정보센터', title: '빈집 정비의 적용 범위와 절차 확인하기', description: '빈집정비사업 관련 규정과 다른 법률과의 관계를 원문에서 확인해요.', before: '농어촌·준농어촌에는 적용 범위가 달라질 수 있어요. ‘시골집’이라는 표현이나 외관만으로 적용 법률을 정하지 않아요.', href: 'https://www.law.go.kr/법령/빈집및소규모주택정비에관한특례법', linkLabel: '빈집정비 관련 법령 보기' },
  { id: 'pohang-ordinance', group: 'laws', name: '포항시 읍·면지역 빈집 정비 및 관리에 관한 조례', operator: '포항시 · 국가법령정보센터', title: '포항 읍·면지역의 조례 확인하기', description: '포항시 읍·면지역 빈집 정비·관리 조례의 원문과 개정 이력을 확인해요.', before: '확인한 원문은 2025.10.1. 시행본이에요. 최신 개정 여부와 해당 주소의 적용 범위를 함께 확인해 주세요.', href: 'https://law.go.kr/LSW/ordinInfoP.do?ordinSeq=2075511', linkLabel: '포항시 조례 원문 보기' },
] as const satisfies readonly OfficialResource[]
export type ResourceId = (typeof OFFICIAL_RESOURCES)[number]['id']
export const resourceById = (id: ResourceId) => OFFICIAL_RESOURCES.find(resource => resource.id === id)!
