/** 판정 축별 결과. unknown/suspect 가 하나라도 있으면 종합은 '가능'이 될 수 없다. */
export type AxisVerdict = 'clear' | 'suspect' | 'blocked' | 'unknown'

export type AxisResult = {
  verdict: AxisVerdict
  /** 화면에 그대로 나가는 근거 문장 */
  reason: string
  /** 출처 라벨. 진단서에 "건축물대장 2026.09.10 확인" 형태로 찍힌다 */
  source: string
  checkedAt: string
}

/** 주소 해석 결과. PNU 와 건축물대장 조회 키를 함께 담는다. */
export type ResolvedAddress = {
  /** 19자리: 법정동코드(10) + 산여부(1: 1=일반 2=산) + 본번(4) + 부번(4) */
  pnu: string
  /** 법정동코드 10자리 */
  bcode: string
  /** 시군구코드 5자리 = bcode[0:5] */
  sigunguCd: string
  /** 법정동코드 5자리 = bcode[5:10] */
  bjdongCd: string
  /** 건축물대장용 대지구분. ⚠️ PNU 산여부(1/2)와 체계가 다르다: 0=대지, 1=산 */
  platGbCd: '0' | '1'
  /** 본번 4자리 zero-pad */
  bun: string
  /** 부번 4자리 zero-pad */
  ji: string
  isMountain: boolean
  /** 좌표. juso 기본 API 는 좌표를 주지 않으므로 null 일 수 있다 (5단계 정사영상에서만 필요) */
  x: number | null
  y: number | null
  jibunAddress: string
  roadAddress: string | null
  /** 어느 창구로 해석했는지 */
  provider: 'juso' | 'kakao'
  /**
   * 입력 지번과 응답 지번이 일치하는지.
   *   exact — 입력한 지번과 정확히 같은 필지
   *   road  — 입력에 지번이 없어 도로명으로 찾음 (대조 불가)
   *   fuzzy — 검색엔진이 다른 필지를 돌려줌. 절대 그대로 쓰면 안 된다
   */
  matchQuality: 'exact' | 'road' | 'fuzzy'
}

/** 세움터 대량자료에서 뽑아낸 건축물대장 1건 */
export type LedgerRecord = {
  pnu: string
  buildingName: string | null
  /** 주용도명. '단독주택' 여부 판별에 쓴다 */
  mainPurpose: string | null
  /** 사용승인일 YYYYMMDD */
  approvalDate: string | null
  totalArea: number | null
  /** 위반건축물 등재 여부 */
  violation: boolean | null
}

export type LedgerIndex = Record<string, LedgerRecord>
