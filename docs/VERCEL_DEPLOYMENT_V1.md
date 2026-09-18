# RoboHood v1 Vercel 배포

최종 재배포일: 2026-09-18. 두 독립 v1 프런트엔드를 하나의 정적 배포에서 경로로 분리하였다. 이미지 대비 시각 보완과 화면 이동 메뉴 수정본을 반영하였다. 새 기획 버전이나 백엔드 릴리스가 아니다.

## 접속 주소

| 대상 | 주소 |
|---|---|
| 앱 선택 | https://robohood-v1.vercel.app/ |
| 제조업 대시보드 | https://robohood-v1.vercel.app/manufacturing/mf-03.html |
| 소상공인 대시보드 | https://robohood-v1.vercel.app/small-business/sb-03.html |
| 제조업 이미지 갤러리 | https://robohood-v1.vercel.app/manufacturing/image-gallery.html |
| 소상공인 이미지 갤러리 | https://robohood-v1.vercel.app/small-business/image-gallery.html |
| Vercel 프로젝트 | https://vercel.com/geond/robohood-v1 |
| 이번 배포 | https://vercel.com/geond/robohood-v1/5m1SQSGXda7FJLmFEr6szh38zNvr |

계정 범위는 `GEOND (geond)`, 프로젝트는 `robohood-v1`, 생성 시 확인한 플랜은 Hobby다. 유료 업그레이드·커스텀 도메인 구매·별도 유료 서비스 추가는 하지 않았다. 고정 배포 주소는 `https://robohood-v1-pu2a207ue-geond.vercel.app`이며 공유용 주소는 위 production alias를 권한다.

## 배포한 범위

- 제조업 21개·소상공인 20개 화면, 생성 시안 41개와 예시 사진 2개, 공통 스타일·브라우저 동작 코드.
- 공개 정적 파일 98개, 61,543,761 bytes. 라우팅 설정 1개를 포함해 CLI 전송 대상은 99개다.
- `dist/` 전체나 저장소 전체를 올리지 않았다. `scripts/prepare-vercel.mjs`가 허용 목록만 새 임시 폴더의 `.vercel/output/static/`에 복사한다.
- 다운로드 데이터·원본 ZIP·SQL·기획 문서·환경변수 파일·프로젝트 연결 정보는 배포 대상에서 제외하였다. CLI dry-run에서도 일치 여부를 검사했다.
- [Build Output API v3](https://vercel.com/docs/build-output-api/configuration)와 [CLI prebuilt 배포](https://vercel.com/docs/cli/deploy)를 사용한다. HTML 확장자와 두 앱의 상대경로를 유지하고, 없는 주소는 실제 HTTP 404로 응답한다.

**서비스 경계:** 실제 로그인·서버 업로드·Supabase 조회·AI 추론·로봇 제어·지급은 미연결이다. 입력 상태는 사용자 브라우저에만 저장되며 제조업·소상공인 상태는 분리한다. 로컬 영상 미리보기는 서버로 전송되지 않는다. 실제 개인정보를 입력하는 운영 서비스로 사용하지 않는다.

## 검증 결과

- 로컬 빌드 및 자동 테스트 **75개 통과**. 모든 화면의 모바일 목록과 현재 화면 여부 값이 분리되어 있는지 검사하는 회귀 테스트를 추가하였다.
- 공개 정적 파일 **98개**에 대해 HTTP 200 확인. 이 중 HTML·CSS·JS·JSON **55개는 배포 전 SHA-256과 일치**하였다. PNG 43개는 HEAD 요청으로 접근을 확인하였다.
- 루트와 두 앱의 slash 유무를 포함한 진입 경로 **5개** 확인.
- `.env.local`, `.vercel/project.json`, 데이터·SQL·Supabase 설정·패키지·README·이전 ZIP·없는 주소 등 **9개 경로에서 HTTP 404** 확인.
- 브라우저에서 두 대시보드의 새 배치·사진을 확인하였다. 두 앱의 ‘전체 화면’ 대화상자에서 21개/20개 목록과 검색을 확인하고, 제조업 새 과제 및 소상공인 현장 탐색 링크도 열었다. 최종 점검에서 브라우저 경고·오류 로그는 없었다.
- Vercel 응답은 `READY`, target은 `production`이었다. 익명 HTTP 요청으로 공개 접근을 확인했으며 로그인된 브라우저의 접근만으로 판단하지 않았다.

최종 검증 상세는 로컬 Git 제외 파일 `tmp/vercel-visual-v1-live-verification.json`에 보관한다. 최초 배포의 검증 기록은 `tmp/vercel-live-verification.json`이다. 모든 업무 흐름의 클라우드 종단 간 검증이나 백엔드 검증을 의미하지 않는다.

## 배포 이력

| 배포 | 내용 |
|---|---|
| `dpl_ExeAGsZksuZyN3boZ6W3gh24nAuG` | 최초 공개 배포, 당시 자동 검사 68개 통과 |
| `dpl_9GbEHZtVnrrb2JBA5VzhsbAyafCp` | 시각 보완 반영. 공개 브라우저 점검에서 전체 화면 메뉴의 설정 타입 충돌 발견 |
| `dpl_5m1SQSGXda7FJLmFEr6szh38zNvr` | 현재 production. 모바일 화면 목록을 유지하고 현재 화면 여부를 `isMobile`로 분리, 회귀 검사 및 공개 메뉴 점검 통과 |

이전 배포는 삭제하지 않았다. 화면의 v1 표기와 기존 공개 주소, 브라우저 저장소 키를 유지하였다.

## 재배포

현재는 로컬 소스에서 CLI로 배포했다. **Git 커밋·푸시와 GitHub 자동 배포 연결은 수행하지 않았다.** 다음 배포 시에도 기존 변경을 확인하고 먼저 빌드·테스트한다.

```sh
npm run deploy:prepare

ROBOHOOD_DEPLOY_DIR="$(node -p "JSON.parse(require('fs').readFileSync('tmp/vercel-latest.json','utf8')).directory")"
vercel link --yes --project robohood-v1 --scope geond --cwd "$ROBOHOOD_DEPLOY_DIR"
vercel deploy --dry --prebuilt --format json --cwd "$ROBOHOOD_DEPLOY_DIR"
# 허용 목록 이외의 파일이 없는지 확인한 뒤 실행
vercel deploy --prebuilt --prod --yes --scope geond --cwd "$ROBOHOOD_DEPLOY_DIR"
```

`vercel link`가 임시 폴더에 환경변수 파일을 만들 수 있다. 내용을 출력·복사·커밋하지 않는다. `--prebuilt`를 빼거나 저장소 루트에서 무심코 배포하지 않는다. 이번 dry-run에서는 해당 파일과 연결 메타데이터가 명시적으로 제외됨을 확인하였다.

배포 후 공유 주소에서 두 앱, 이미지 갤러리, JS 모듈, 누락 주소 404를 다시 확인한다. 이전 버전으로 되돌릴 필요가 있으면 Vercel 프로젝트의 배포 이력에서 정확한 대상 배포를 선택한다. 기존 배포·프로젝트를 삭제하는 방식으로 복구하지 않는다.
