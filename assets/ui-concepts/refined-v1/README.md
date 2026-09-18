# RoboHood · v1 개선 이미지

제조업 21개와 소상공인 20개를 **별도 제품 v1**으로 새로 생성했다. 이전 생성 이미지의 간결한 작업 흐름·현장 중심 설명과 Stitch의 파란색 운영 UI·상세 정보 구조를 결합했다. 기본 시각 기준은 [DESIGN.md](../../../DESIGN.md)이다.

- [전체 갤러리](index.html) · [제조업 21개](manufacturing.html) · [소상공인 20개](small-business.html)
- `manufacturing/mf-01.png`~`mf-21.png`: 제조업 화면, 모바일 3개 포함
- `small-business/sb-01.png`~`sb-20.png`: 소상공인 화면, 모바일 5개 포함
- `manufacturing/rgb-part.png`, `small-business/tray-task.png`: 실제 HTML 본문에서 쓰는 생성 사진 2개
- [원 생성 프롬프트](prompts.json) · [보완 프롬프트](refinements.json) · [활성 파일·출처 목록](manifest.json)

내장 `image_gen`을 사용했다. API/CLI 대체 생성이나 실제 현장 사진을 사용하지 않았다. `*-draft.png`는 이번 작업 중 보존한 이전 출력이며 활성 갤러리에 포함하지 않는다. 기존 `../v1/`, `../small-business/v1/`과 Stitch 원본은 별도로 보존한다.

## 이미지 → 코드

화면 ID는 구현 URL과 동일하다. 예를 들어 `mf-03.png`는 `/manufacturing/mf-03.html`, `sb-15.png`는 `/small-business/sb-15.html`의 구성 기준이다. 각 실행 화면 하단에서 대응 PNG를 열 수 있다.

코드의 공통 색상·간격·내비게이션은 `apps/refined/theme.css`, 각 화면의 배치는 `apps/refined/render.mjs`, 목적과 초기 생성 입력은 `apps/refined/screen-specs.mjs`에 있다. 사진만 이미지 자산이며 제목·입력·버튼·목록·상태는 실제 HTML이다.

생성 이미지의 한글 오자·예시 수치·가상 배치는 제품 계약이 아니다. 구현은 기획서·MVP·운영 원칙에 맞춰 문구를 교정하고, 시안의 정적 예시 대신 브라우저 기록을 표시한다. 위치·인물·지표는 실제 운영 근거가 아니며 완전한 픽셀 일치 또는 모든 시안 기능의 구현을 주장하지 않는다.

실행·검증 범위는 [UI 개선 구현 안내](../../../docs/UI_REFINEMENT_V1.md)를 참고한다.
