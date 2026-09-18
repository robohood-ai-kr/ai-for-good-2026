# RoboHood v1 시나리오용 공개 데이터

확인일: 2026-09-18. **출처 7개 조사, 3개 출처의 실제 미디어 48개(26,706,253 bytes, 약 26.7MB)를 로컬에 준비하였다. Supabase 생성·적재는 아직 실행하지 않았다.**

제조업은 VisA로 이미지 검수 흐름을, 소상공인은 1인칭 조작 영상으로 세션·구간 검수 흐름을 시연하는 구성이 현실적이다. KAMP는 국내 제조 맥락에 더 가깝지만 로그인과 이용 조건 확인을 선행해야 한다. 데이터 파일 준비와 모델 학습·현장 배포·프런트엔드 연동은 별개이며 후자는 이번 작업에 포함하지 않는다.

## 1. 후보와 선택

| 시나리오 | 데이터 / 공식 출처 | 가능한 활용 | 이번 처리 / 제한 |
|---|---|---|---|
| 제조업 | [VisA — Amazon Science](https://github.com/amazon-science/spot-diff) | PCB 외관 정상·이상 분류, 결함 마스크 비교, 검수·평가 화면 | **샘플 준비 완료.** 데이터 CC BY 4.0. 금속 부품과는 대상물이 다름. |
| 제조업 | [KAMP 크로메이트 품질 이상탐지](https://www.kamp-ai.kr/aidataDetail?DATASET_SEQ=25) | 표면처리 제품 외관 이미지와 공정 변수 연결 | **카탈로그만 준비.** 다운로드 시 로그인 요구. 상업 이용·독자 플랫폼 재배포 조건 미확인. |
| 소상공인 | [HoyerChou EgocentricVideos](https://huggingface.co/datasets/HoyerChou/EgocentricVideos) | 탁상 양손 조작, 1인칭 영상 재생, 구간 설명·검수 | **샘플 준비 완료.** 카드에 Apache-2.0 표기. 실제 식당·컵 정리 데이터는 아님. |
| 소상공인 | [SmartDeer 공개 샘플](https://huggingface.co/datasets/SmartDeer/egocentric-manipulation-sample) | 병뚜껑 조작, 좌우 카메라 연결, 검수 보류·재수집 시연 | **샘플 준비 완료.** CC BY 4.0. 원본의 미검증 상태를 유지. |
| 제조업 | [MPDD](https://github.com/stepanje/MPDD) | 금속 부품 결함과 픽셀 마스크. 기존 대상물과 가장 가까운 공개 연구 후보 | CC BY-NC-SA 4.0. 사업용 활용 범위 확인 전 **원본 제외**. |
| 제조업 | [MVTec AD](https://www.mvtec.com/research-teaching/datasets/mvtec-ad) | 산업 외관 이상탐지 비교·연구 | 공식적으로 비상업적 이용 조건. **원본 제외**. |
| 소상공인 | [Apple EgoDex](https://github.com/apple-aiml-research/ml-egodex) | 다양한 일상 탁상 조작과 손·머리 pose 연구 | CC-by-NC-ND 및 대용량. README에 라이선스 버전 미명시. **원본 제외**. |

라이선스는 확인한 제공자 표기이며, 초상권·개인정보·현장 소유자의 동의 등 별도 권리까지 보증하지 않는다. 외부 공개·사업 활용 전 실제 이용 형태에 맞는 확인이 필요하다.

### KAMP에서 확인한 내용

- 데이터명: 품질 이상탐지, 진단(크로메이트) AI 데이터셋, `DATASET_SEQ=25`.
- 제공 화면: KAIST, 수행기관 에이비에이치·임픽스, 최종 수정 2025-04-02.
- 표면처리 제품 품질과 `LoT / pH / Temp / Voltage / Index / Time` 공정 변수를 다룬다.
- 상세 설명은 CSV·PNG, 911MB, 302,115건이다. **302,115장을 의미한다고 확인한 것은 아니다.** 헤더의 jpg 표기와 상세 형식 설명도 다르다.
- 공개 화면의 ‘콘텐츠 변경허용’만으로 독자 플랫폼 재배포까지 허용된다고 판단하지 않았다. [일반 이용약관](https://www.kamp-ai.kr/agreement) 외에 로그인 후 다운로드 조건을 확인해야 한다.
- 실제 다운로드 버튼에서 로그인 요구를 확인하고 중단했다. 로그인 우회나 원본 복제는 하지 않았다.

## 2. 실제 준비한 샘플

| 출처 | 준비 파일 | 검증·변경 내역 |
|---|---:|---|
| VisA PCB1 | 정상 JPG 12 + 이상 JPG 12 + 대응 PNG 마스크 12 | 공식 S3 tar의 필요한 범위만 읽음. tar 체크섬·ETag 고정, 각 파일 SHA-256·이미지 크기 기록. 원본 파일 변경 없음. |
| Hoyer pick-place | MP4 6 | 공식 ZIP SHA-256 대조. 약 2.0–2.3초 단위 영상. 오디오와 컨테이너 메타데이터 제거, 영상 스트림은 재인코딩하지 않음. 원본 ZIP·MP4는 로컬 보존. |
| SmartDeer twist_cap | MP4 6 | 원본 공개 manifest의 SHA-256 대조. 17초·12초·19초 **3개 에피소드 × 좌우 카메라**. 무음 원본 그대로 보존. |
| **합계** | **48개 / 약 26.7MB** | 이미지 24 + 마스크 12 + 영상 12. 비디오 작업 단위는 9개이며 독립 작업자·현장 수가 아님. |

시각 확인은 제조 정상·이상 각 1장, Hoyer `clip_001 / clip_004`, SmartDeer 각 에피소드 왼쪽 영상의 6개 시점 프레임을 표본으로 수행했다. **전체 프레임 개인정보 심사나 동작 성공 판정은 수행하지 않았다.** 모든 자료의 플랫폼 `review_status`는 `pending`이다.

### 시나리오에 연결하는 방법

- **제조 `RH-MF-001`:** 외부 샘플임을 표시한 수집 세션 → 정상/이상 원본 라벨 확인 → 결함 마스크 검수 → 보류 사유 작성 → 재수집 요청 흐름에 연결한다. 마스크를 로봇 행동 데이터로 취급하지 않는다.
- **소상공인 `RH-SB-001`:** 외부 유사 작업 영상 → 시작/종료 구간 표시 → 작업 설명 → 독립 검수·보류 흐름에 연결한다. 실제 ‘트레이 위 컵 정리’ 데이터가 필요하면 현장 동의를 받아 별도 수집해야 한다.
- Hoyer 영상은 같은 원본 세션에서 잘린 클립이다. 인접 클립을 학습·평가로 섞으면 누수가 발생할 수 있다. SmartDeer 좌우 영상도 동일 에피소드로 묶는다.
- `upstream_label`은 제공자 라벨, `review_status`는 RoboHood 검수 상태이다. 정상/이상 라벨이 있어도 검수 승인으로 바꾸지 않는다.
- `origin_type=external_reference`로 기록한다. 서울 매장에서 청년이 수집한 실적, 유료 일자리, 지급 완료 보상, 학습된 RFM 성능처럼 표시하지 않는다.
- 이번 선택은 소규모 편의 샘플이다. 모델 정확도 평가를 위한 대표 표본이나 train/test split이 아니다.

## 3. 저장 구조와 Supabase 준비 상태

```text
data/reference-v1/
  sources.json       # 출처·버전·권리·시나리오 적합성 7건
  manifest.json      # 미디어 48건의 경로·체크섬·크기·원본 라벨
data/local/reference-v1/  # Git 제외
  manufacturing/visa/    # JPG + PNG
  small-business/        # MP4
  _originals/            # 원본 ZIP/영상/제공자 manifest
  _derived/              # 무음 remux 중간 결과
  seed.sql / verify.sql  # 생성된 적재·점검 SQL
supabase/migrations/202609180001_reference_data_v1.sql
scripts/data/prepare-reference-data.mjs
scripts/data/import-reference-data.mjs
```

계획된 클라우드 대상은 **새 Free 프로젝트 `robohood-v1-data`**다. 계정에 RoboHood 조직이 없어 새 전용 Free 조직 생성 여부를 사용자에게 확인 중이다. 기존 다른 서비스 조직·프로젝트는 변경하지 않았다.

- DB: `reference_dataset_sources` 7행, `reference_dataset_assets` 48행.
- Storage: `robohood-reference-v1`, **private**, 파일당 최대 50,000,000 bytes, JPG·PNG·MP4만 허용.
- 테이블 RLS 활성화 및 anon/authenticated 권한 회수. 공개 읽기·쓰기 정책을 만들지 않는다. 운영자 Dashboard/CLI로만 적재·확인하는 초기 저장소다.
- [Supabase private bucket](https://supabase.com/docs/guides/storage/buckets/fundamentals)은 권한 또는 서명된 URL로 접근한다. 아직 앱용 권한 모델·서명 URL API는 구현하지 않았다.
- [현재 Free 한도](https://supabase.com/pricing)는 DB 500MB, Storage 1GB, 파일당 50MB이다. 이 샘플은 용량 안에 들지만 프로젝트 생성 가능 여부·계정 한도는 생성 시 다시 확인한다. 유료 업그레이드하지 않는다.

**로컬 재현** (Node 22+, `unzip`, `ffmpeg`, `ffprobe` 필요):

```sh
node scripts/data/prepare-reference-data.mjs
node scripts/data/import-reference-data.mjs
node --test tests/reference-data.test.mjs
```

첫 명령은 공개 미디어를 내려받으며 원본 전체가 아닌 제한된 샘플을 준비한다. 두 번째는 파일 체크섬을 확인하고 SQL만 생성한다. 클라우드 작업은 하지 않는다.

**사용자 승인 후 클라우드 적재**:

1. RoboHood용 Free 조직/프로젝트를 생성한다. 기존 서비스 조직을 임의 선택하지 않는다.
2. `supabase link --project-ref <승인된-project-ref>`로 연결한다. 비밀번호는 보안 프롬프트로 처리하고 저장소·문서·로그에 남기지 않는다.
3. 아래 명령은 연결 대상 ID, 이름 `robohood-v1-data`, `ACTIVE_HEALTHY` 상태, 모든 로컬 파일 체크섬을 확인한 후에만 실행된다.

```sh
node scripts/data/import-reference-data.mjs --apply --project-ref <승인된-project-ref>
```

4. 원격 점검 결과의 출처 7개, 미디어 48개, Storage 48개, private/RLS, anon/authenticated 읽기 차단을 확인한다. 임의 파일을 내려받아 원본 SHA-256도 대조한다.
5. 도중 실패 시 Dashboard와 Storage 상태를 먼저 확인한다. 기존 객체를 삭제하거나 다른 프로젝트에 다시 실행하지 않는다. 자동 덮어쓰기·실패 정리는 수행하지 않는다.

**검증 범위:** 로컬 파일 무결성, 스키마 생성 코드·manifest 안전성 테스트 및 기존 앱 테스트까지 통과했다. 원격 SQL 적용·Storage 업로드·접근 차단은 프로젝트 미생성 상태이므로 아직 검증하지 않았다. 기존 프런트엔드·기획안·배포 환경은 변경하지 않았다.

## 4. 남은 결정

1. RoboHood 전용 Free 조직·프로젝트 생성 승인 또는 사용할 조직 지정.
2. KAMP 로그인 후 데이터별 이용·재배포 조건 확인. 확인 전에는 카탈로그만 사용.
3. 현장 실증 시 실제 금속 부품 / 컵 정리 작업 데이터를 별도 수집할지 결정.
4. 앱에 연결할 경우 역할별 조회 권한·검수 이력·서명 URL 만료 정책을 별도 설계. 서비스 키를 브라우저에 넣지 않는다.
