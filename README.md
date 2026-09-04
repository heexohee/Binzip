# 빈집이력서

포항 빈 저가 단독주택 소유주에게 "이 집을 지금 어떤 방법으로 쓸 수 있는가"를 진단서 한 장으로 알려주는 서비스.

- 설계: [`docs/설계.md`](docs/설계.md)
- **마감 2026-09-18** · 현재 **W1(데이터)** 구간

## 지금 상태

| 모듈 | 파일 | 상태 |
|---|---|---|
| PNU 변환 | `src/pnu.ts` | ✅ 자가검증 16/16 |
| data.go.kr 클라이언트 | `src/sources/client.ts` | ✅ 함정 3종 처리 |
| 세움터 파서 | `scripts/build-ledger.ts` | ✅ 입력 파일 대기 |
| 건축물대장 룩업 | `src/sources/ledger.ts` | ✅ |
| 개별주택가격 | `src/sources/housePrice.ts` | ⚠️ 엔드포인트·필드 미확정 |
| 토지이용규제 | `src/sources/landUse.ts` | ⚠️ 엔드포인트·필드 미확정 |
| G1 게이트 | `scripts/verify-g1.ts` | ✅ 주소 목록 대기 |

## 시작하기

```bash
npm install
cp .env.example .env      # 키를 채운다
```

### 1. PNU 로직 확인 (키 불필요)

```bash
npm run pnu -- --selftest
npm run pnu -- 4711325300 123 4
```

### 2. 세움터 대량자료 → ledger.json

세움터에서 포항 남구·북구 건축물대장(표제부) 대량자료를 받아 `data/raw/` 에 둔다.

```bash
# 먼저 컬럼명을 확인한다 (배포본마다 다르다)
npm run ledger:inspect -- --in data/raw/표제부.csv

# 매핑이 맞으면 변환
npm run ledger:build -- --in data/raw/표제부.csv --sigungu 47111,47113
```

컬럼을 못 찾으면 `scripts/build-ledger.ts` 의 `HEADER_MAP` 에 실제 이름을 추가한다.
CSV 인코딩(UTF-8 / CP949)은 자동 감지한다.

### 3. G1 게이트 (마감 9/9)

`data/g1-addresses.txt` 에 구룡포·호미곶 실제 주소 10개를 적고:

```bash
npm run verify:g1
```

10개 중 **7개 이상** 정상 응답이면 통과. 미달이면 라이브 조회를 포기하고
전량 사전구축 DB로 전환한다 — **판단은 9/9에 내리고 W2로 끌고 가지 않는다.**

## 알아둘 것

- **산여부 코드가 두 체계다.** PNU 는 `1=일반 / 2=산`, 건축물대장 `platGbCd` 는 `0=대지 / 1=산`.
  구룡포·호미곶은 산지 필지가 많아 반드시 걸린다. `src/pnu.ts` 가 둘 다 만들어 준다.
- **`DATA_GO_KR_KEY` 는 '디코딩' 키를 넣는다.** 인코딩 키를 넣으면 이중 인코딩으로 오류 30.
- **공공 API 는 서버에서만 부른다.** 브라우저 직접 호출은 CORS 로 막힌다.
- 자동 파이프라인만으로는 판정이 `가능`까지 가지 않는다. 등기(7단계)에 공개 API 가 없어
  항상 `unknown` 이므로 최선이 `조건부 + 미확인 목록`이다. 이는 설계이지 결함이 아니다.
