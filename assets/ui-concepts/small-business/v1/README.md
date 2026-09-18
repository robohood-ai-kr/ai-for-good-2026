# RoboHood 소상공인 중심 UI 시안 v1

총 20개 페이지(데스크톱 15개·모바일 5개)를 내장 image_gen으로 생성했다. 제조업 중심 이미지와 별도 세트다.

- [갤러리 열기](index.html) — 전체·데스크톱·모바일·업무 단계별 필터, 확대·방향키 이동
- [화면 설계·사용자 흐름](../../../../docs/small-business/v1/UI_SCREEN_PLAN.md)
- [제품 기획](../../../../docs/small-business/v1/PROJECT_PLAN.md) · [MVP](../../../../docs/small-business/v1/MVP_SPEC.md)
- [생성 프롬프트](prompts.json)
- [파일·링크 검증 기록](validation-report.json)
- [제조업 중심 갤러리](../../v1/index.html)

## 페이지 목록

| 번호 | 페이지 | 형식 | 파일 |
|---|---|---|---|
| 01 | 서비스 소개 | 데스크톱 | [PNG](01-service-home.png) |
| 02 | 로그인·작업 공간 | 데스크톱 | [PNG](02-workspace-entry.png) |
| 03 | 작업 공간 개요 | 데스크톱 | [PNG](03-workspace-overview.png) |
| 04 | 현장 탐색 | 데스크톱 | [PNG](04-field-explorer.png) |
| 05 | 현장 상세·수집 조건 | 데스크톱 | [PNG](05-site-detail.png) |
| 06 | 수집 과제 목록 | 데스크톱 | [PNG](06-task-list.png) |
| 07 | 데이터 요청 등록 | 데스크톱 | [PNG](07-new-request.png) |
| 08 | 과제 상세·유급 작업 조건 | 데스크톱 | [PNG](08-task-detail.png) |
| 09 | 교육·현장 인력 배정 | 데스크톱 | [PNG](09-training-matching.png) |
| 10 | 모바일 교육·과제 적격 | 모바일 | [PNG](10-mobile-training.png) |
| 11 | 모바일 작업함 | 모바일 | [PNG](11-mobile-inbox.png) |
| 12 | 모바일 작업 전 확인 | 모바일 | [PNG](12-mobile-preflight.png) |
| 13 | 모바일 영상 수집 | 모바일 | [PNG](13-mobile-collection.png) |
| 14 | 모바일 보완·중단 보고 | 모바일 | [PNG](14-mobile-rework.png) |
| 15 | 영상 검수·구간 라벨 | 데스크톱 | [PNG](15-quality-review-aligned.png) |
| 16 | 데이터셋 라이브러리 | 데스크톱 | [PNG](16-dataset-library.png) |
| 17 | 데이터셋 상세·버전 | 데스크톱 | [PNG](17-dataset-detail.png) |
| 18 | 수행·보상 이력 | 데스크톱 | [PNG](18-work-compensation.png) |
| 19 | 데이터 접근·이용 승인 | 데스크톱 | [PNG](19-data-access-aligned.png) |
| 20 | 작업 공간 설정 | 데스크톱 | [PNG](20-workspace-settings.png) |

## 열람·구현 시 주의

15 검수 화면의 담당자 명칭과 19 요청 기업의 접근 승인 표시를 보완했다. 현재 갤러리는 `*-aligned.png`를 사용하며 최초 20개 생성본도 보존한다. 따라서 활성 화면은 20개, 저장된 PNG는 22개다. 편집 입력도 생성 프롬프트 파일에 기록했다.

이미지는 실제 앱·수집 영상·승인 데이터·고용·지급 실적이 아니다. 사진처럼 보이는 손·컵·매장도 생성된 장면이다. 첫 데모의 실제 데이터 처리는 별도 구현·검증해야 한다.

교육·현장 허용·감독·안전·보상 확인, 사유가 있는 보완, 승인 데이터의 이용 권한을 핵심으로 잡았다. 검수 완료와 지급 확인을 구분하고 지급 표시는 모두 모의로 둔다. 모델·장비 카탈로그, 배포·관제·자동 결제는 포함하지 않는다.

각 페이지는 서로 다른 시점의 예시이며 수치는 동일 시점의 운영 데이터가 아니다. 이미지의 작은 문구보다 문서의 요구사항이 우선한다. 갤러리의 버튼은 이미지 열람용이며 이미지 내부 버튼은 작동하지 않는다.
