// Manually verified public UI snapshot, not synthetic transactions or a valuation.
// Source path and exclusions are recorded in docs/pohang-market-evidence.md.
export const POHANG_MARKET_EVIDENCE = {
  checkedAt: '2026-09-15',
  sourceUrl: 'https://rt.molit.go.kr/pt/gis/gis.do?srhThingSecd=C&mobileAt=',
  commissionUrl: 'https://www.gb.go.kr/Main/finace/page.do?mnu_uid=15502',
  region: '포항시 남구 호미곶면 대보리',
  deals: [
    { date: '2026-01-21', jibun: '8**', road: '해맞이로183번길', floorArea: 67, landArea: 169, priceManwon: 8000, type: '직거래' },
    { date: '2025-09-03', jibun: '2**', road: '해맞이로', floorArea: 78.52, landArea: 218, priceManwon: 4830, type: '직거래' },
    { date: '2025-04-21', jibun: '2**', road: '해맞이로', floorArea: 76.65, landArea: 291, priceManwon: 9700, type: '직거래' },
  ],
} as const
