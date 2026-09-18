# RoboHood 제조업 중심 UI v1 — 글자 수정본

활성 화면은 21개(데스크톱 18개·모바일 3개)다. 2026-09-18에는 상위 인력 명칭과 역할 구분을 반영해 **20개는 글자만 수정하고 08은 유지**했다. 이 제조업 글자 수정 작업에 AI 이미지 생성·재생성을 사용하지 않았다. 소상공인 중심 v1은 [별도 기획안](../../../docs/small-business/v1/PROJECT_PLAN.md)과 [별도 20개 이미지 세트](../small-business/v1/index.html)를 갖는다.

- [갤러리](index.html): 확대·이동·수정 전후 비교
- [화면 설계](../../../docs/UI_SCREEN_PLAN.md) · [버전 기록](../../../docs/VERSION_HISTORY.md)
- [글자 변경 명세](text-overlay-manifest.json): 원문·교체 문구·좌표·글꼴·색상
- [검증 기록](text-overlay-report.json): 원본/수정본 해시, 크기, 지정 영역 밖 변경 픽셀
- [재현 스크립트](../../../scripts/ui_text_overlays.swift): macOS에서 아래 명령 실행

```sh
swift scripts/ui_text_overlays.swift render assets/ui-concepts/v1/text-overlay-manifest.json
```

PNG에는 편집 가능한 글자 레이어가 없으므로 지정한 글자 영역의 배경을 보간하고 새 문구를 그렸다. 사진·아이콘·배치와 지정 영역 밖의 sRGB 픽셀은 유지한다. 실제 저장한 PNG를 다시 읽어 검증하며 원본은 덮어쓰지 않는다. 향후 문구는 변경 명세를 수정해 재현한다. 구조·권한·결제 등의 기능 구현은 포함하지 않는다.

## 현재 화면과 원본

| 번호 | 화면 | 현재 시안 | 글자 수정 전 |
|---|---|---|---|
| 01 | 서비스 소개 | [수정본](text-overlays/01-service-home-text.png) | [원본](01-service-home-aligned.png) |
| 02 | 로그인·워크스페이스 | [수정본](text-overlays/02-workspace-entry-text.png) | [원본](02-workspace-entry.png) |
| 03 | 워크스페이스 개요 | [수정본](text-overlays/03-workspace-overview-text.png) | [원본](03-workspace-overview.png) |
| 04 | 현장 과제 목록 | [수정본](text-overlays/04-field-projects-text.png) | [원본](04-field-projects-aligned.png) |
| 05 | 현장 과제 등록 | [수정본](text-overlays/05-new-project-text.png) | [원본](05-new-project-aligned.png) |
| 06 | 과제 상세 | [수정본](text-overlays/06-project-detail-text.png) | [원본](06-project-detail-aligned.png) |
| 07 | 수집팀·현장 인력 매칭 | [수정본](text-overlays/07-operator-matching-text.png) | [원본](07-operator-matching-aligned.png) |
| 08 | 현장 데이터 수집 | [유지본](08-mobile-data-collection.png) | 변경 없음 |
| 09 | 검수·라벨링 | [수정본](text-overlays/09-quality-review-text.png) | [원본](09-quality-review.png) |
| 10 | 데이터셋 라이브러리 | [수정본](text-overlays/10-dataset-library-text.png) | [원본](10-dataset-library.png) |
| 11 | 데이터셋 상세·버전 | [수정본](text-overlays/11-dataset-detail-text.png) | [원본](11-dataset-detail-aligned.png) |
| 12 | 모델 목록·상세 | [수정본](text-overlays/12-model-registry-text.png) | [원본](12-model-registry.png) |
| 13 | 장비·호환성 | [수정본](text-overlays/13-hardware-catalog-text.png) | [원본](13-hardware-catalog.png) |
| 14 | 배포 준비 | [수정본](text-overlays/14-deployment-setup-text.png) | [원본](14-deployment-setup.png) |
| 15 | 실시간 관제 | [수정본](text-overlays/15-fleet-monitor-text.png) | [원본](15-fleet-monitor.png) |
| 16 | 이벤트·재수집 | [수정본](text-overlays/16-incident-recollection-text.png) | [원본](16-incident-recollection.png) |
| 17 | 현장 인력 작업함 | [수정본](text-overlays/17-mobile-operator-inbox-text.png) | [원본](17-mobile-operator-inbox.png) |
| 18 | 경력·교육 | [수정본](text-overlays/18-mobile-career-learning-text.png) | [원본](18-mobile-career-learning.png) |
| 19 | 데이터 접근·이용 조건 | [수정본](text-overlays/19-data-access-text.png) | [원본](19-data-access-aligned.png) |
| 20 | 워크스페이스 설정 | [수정본](text-overlays/20-workspace-settings-text.png) | [원본](20-workspace-settings-aligned.png) |
| 21 | 현장 탐색 | [수정본](text-overlays/21-field-explorer-text.png) | [원본](21-field-explorer.png) |

## 이전 생성 이력

최초 20개 PNG, 역할·목적을 보완한 8개 `*-aligned.png`, 추가 현장 탐색 1개를 보존한다. 기존 29개 PNG와 새 글자 수정본 20개를 합친 저장 파일 수는 활성 화면 21개와 다르다.

- [최초 생성 프롬프트](prompts.json)
- [기존 8개 보완 프롬프트](alignment-prompts.json)
- [현장 탐색 생성 프롬프트](21-field-explorer-prompt.json)

최초 01–20은 기존 제조공장 콘셉트 이미지를 사용하지 않았다. 21은 지도·현장 목록 배치만 참고했다. 이전 프롬프트의 명칭은 제작 당시 이력이며 현재 문구는 글자 변경 명세를 따른다. 회사·위치·인물·통계·기기 상태는 모두 예시이고 실제 협력·운영·고용 성과가 아니다.
