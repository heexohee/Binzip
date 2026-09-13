/** General legal context, not a determination about the visitor's property. */
export const HOME_CONCERNS_CHECKED_AT = '2026-09-13'

export const HOME_CONCERNS = [
  {
    id: 'tax', label: '세금 부담',
    title: '시골 빈집 때문에 나도 다주택자에 양도소득세 폭탄?',
    description: '그대로 둘 때의 부담부터, 팔고 나서 남는 돈까지. 내 집의 세금 확인사항을 진단서에서 살펴보세요.',
    laws: [
      { label: '국세청 1세대 1주택 고가주택 계산', url: 'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=8799&mi=12271' },
      { label: '국세청 양도소득세 세율', url: 'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7711&mi=2312' },
      { label: '국세청 장기보유특별공제율', url: 'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7710&mi=2311' },
      { label: '지방세법 제107조 · 재산세 납세의무', url: 'https://law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1019932541' },
      { label: '소득세법 시행령 제155조 · 1세대 1주택 특례', url: 'https://www.law.go.kr/LSW/lsSideInfoP.do?docCls=jo&joBrNo=00&joNo=0155&lsiSeq=285631&urlMode=lsScJoRltInfoR' },
    ],
    evidence: '비교 사례: 시골집을 2012년 매입하고 아파트를 2016년 6월 4억 원에 취득해 2026년 10월 20억 원에 매도한다고 가정했어요. 10년 보유·2년 거주, 필요경비 2,000만 원으로 양도차익은 15억 8,000만 원이에요. 아파트를 먼저 팔면 일반 장기보유공제 20%와 기본공제 250만 원을 적용한 과세표준이 12억 6,150만 원이며, 양도소득세 5억 173만 5,000원과 지방소득세 5,017만 3,500원을 합쳐 5억 5,190만 8,500원이에요. 빈집을 먼저 팔고 아파트가 1세대 1주택 요건을 충족하면 12억 원 초과분에 해당하는 양도차익 6억 3,200만 원에 보유 40%·거주 8%의 장기보유공제를 적용해요. 기본공제 후 과세표준 3억 2,614만 원, 양도소득세와 지방소득세 합계는 1억 1,496만 7,600원이에요. 고가주택이므로 1주택 요건을 충족해도 세금이 0원은 아니에요. 비조정대상지역·단독명의 거주자이며 다른 과세대상 양도 및 등록임대 등 별도 규정이 없는 가정이에요. 상속·농어촌주택 특례가 적용되면 빈집 보유 중에도 결과가 달라질 수 있어요. 빈집 자체의 매도 세금·거래비·정리비는 별도예요. 실제 세금은 소재지와 취득·거주·처분 조건에 따라 달라져요.',
  },
  {
    id: 'order', label: '조치명령과 이행강제금',
    title: '정비 명령에 따른 이행강제금이 부과될 수 있어요.',
    metric: '최대 500만 원',
    metricCondition: '특정빈집 조치명령을 기한 내 이행하지 않을 때 · 1회 이행강제금',
    description: '',
    laws: [
      { label: '농어촌정비법 제65조의5제1항 · 제133조', url: 'https://www.law.go.kr/LSW/lsInfoP.do?ancNo=21433&ancYd=20260310&efYd=20260911&lsiSeq=283947' },
    ],
    evidence: '특정빈집 정비 명령을 받고도 기한 내 이행하지 않은 경우에 적용돼요.',
    evidenceItems: [
      ['대상', '특정빈집에 대한 조치명령을 기한 내 이행하지 않은 소유자'],
      ['금액', '1회 최대 500만 원. 조치명령 종류 등 법령 기준에 따라 달라져요.'],
      ['반복 부과', '명령을 이행할 때까지 연 2회 이내 부과될 수 있어요.'],
    ],
  },

] as const
