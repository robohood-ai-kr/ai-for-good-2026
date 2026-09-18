# RoboHood Stitch 앱 소스

두 제품은 `catalog.mjs`의 화면 목록·메뉴·역할과 서로 다른 브라우저 저장소를 사용합니다. `app.mjs`는 공통 데모 동작이며 `state.mjs`는 순수 상태 전이 함수입니다. 원본 화면은 `design/stitch/v1/`에 보존합니다.

`npm run build`는 원본 HTML에서 실행 스크립트를 제거하고 로컬 CSS·검토된 공통 동작을 적용해 `dist/manufacturing/`, `dist/small-business/`를 생성합니다. 각 디렉터리는 별도 정적 사이트로도 실행할 수 있습니다.

실제 인증·서버 권한·영상 업로드·모델 실행·장치 제어·고용·지급은 구현하지 않습니다. 역할 선택과 상태 전이는 화면 흐름 확인용이며 보안 경계가 아닙니다.
