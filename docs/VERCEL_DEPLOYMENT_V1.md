# RoboHood 운영 데모 Vercel 배포

최종 재배포일: 2026-09-18. 제조업·소상공인 프런트엔드를 하나의 정적 배포에서 경로로 분리하였다. 반응형 웹, 좁은 화면용 메뉴 서랍, 표 카드 전환, 파비콘, 현장 탐색 지도와 34초 발표 흐름을 포함한다.

## 접속 주소

| 대상 | 주소 |
|---|---|
| 앱 선택 | https://robohood-v1.vercel.app/ |
| 제조업 대시보드 | https://robohood-v1.vercel.app/manufacturing/mf-03.html |
| 소상공인 대시보드 | https://robohood-v1.vercel.app/small-business/sb-03.html |
| 소상공인 발표 흐름 시작 | https://robohood-v1.vercel.app/small-business/sb-13.html?scenario=restaurant&presenter=1 |
| 제조업 이미지 갤러리 | https://robohood-v1.vercel.app/manufacturing/image-gallery.html |
| 소상공인 이미지 갤러리 | https://robohood-v1.vercel.app/small-business/image-gallery.html |
| Vercel 프로젝트 | https://vercel.com/geond/robohood-v1 |
| 현재 배포 | https://vercel.com/geond/robohood-v1/5ZjYmnuLWJDdMwy6ZUcTjGRqAagj |

계정 범위는 `GEOND (geond)`, 프로젝트는 `robohood-v1`, 확인한 플랜은 Hobby다. 유료 업그레이드·커스텀 도메인 구매·별도 유료 서비스 추가는 하지 않았다. 현재 고정 배포 주소는 `https://robohood-v1-qdmgo3hpr-geond.vercel.app`이며, 공유에는 production alias인 `https://robohood-v1.vercel.app`을 사용한다.

## 배포한 범위

- 제조업 21개·소상공인 20개 화면, 생성 시안 41개, 시나리오 이미지, 공통 스타일과 브라우저 동작 코드.
- 공개 정적 파일 116개, 81,093,567 bytes. 라우팅 설정을 포함한 CLI 전송 대상은 117개다.
- `dist/` 전체나 저장소 전체를 올리지 않았다. `scripts/prepare-vercel.mjs`가 허용 목록만 새 임시 폴더의 `.vercel/output/static/`에 복사한다.
- 다운로드 데이터·원본 ZIP·SQL·기획 문서·환경변수 파일·프로젝트 연결 정보는 배포 대상에서 제외하였다. CLI dry-run에서도 일치 여부를 검사했다.
- [Build Output API v3](https://vercel.com/docs/build-output-api/configuration)와 [CLI prebuilt 배포](https://vercel.com/docs/cli/deploy)를 사용한다. HTML 확장자와 두 앱의 상대경로를 유지하고, 없는 주소는 HTTP 404로 응답한다.

**서비스 경계:** 실제 로그인·서버 업로드·Supabase 조회·AI 추론·로봇 제어·지급은 미연결이다. 입력 상태는 사용자 브라우저에만 저장되며 제조업·소상공인 상태는 분리한다. 로컬 영상 미리보기는 서버로 전송되지 않는다. 실제 개인정보를 입력하는 운영 서비스로 사용하지 않는다.

## 검증 결과

- `npm run check` 자동 테스트 **91개 통과**.
- 배포 허용 목록 생성과 dry-run을 거쳐 production 상태가 `READY`임을 확인하였다.
- 제조업 21개·소상공인 20개 화면을 데스크톱 `1440×900`과 모바일 `390×844`에서 각각 확인하여 **총 82개 브라우저 화면 검사**를 통과하였다.
- 82개 검사에서 HTTP 오류, 런타임 오류, 전체 페이지 가로 넘침, 좁은 화면의 표 넘침, 노출된 `v1` 표기를 발견하지 않았다.
- 좁은 화면에서는 메뉴가 서랍으로 열리고 닫히며, 닫힌 메뉴는 키보드와 보조 기술의 탐색 대상에서 제외된다. 데스크톱에서는 웹 사이드바가 유지된다.
- 소상공인 현장 탐색의 네이버 지도 제공자 상태를 데스크톱과 모바일에서 확인하였다. 제조업 현장 탐색은 실제 위치로 오해하지 않도록 예시 지도를 유지한다.
- 발표자 모드의 실제 클릭 흐름을 production에서 끝까지 확인하였다.

| 단계 | 화면 | 확인 결과 |
|---|---|---|
| 1 | 청년 현장 작업 | `수집 완료·제출` 후 독립 검수 화면으로 이동 |
| 2 | 검수 담당 운영 콘솔 | `독립 검수 완료` 후 접근·이용 승인 화면으로 이동 |
| 3 | 운영팀 승인 | `승인·지급 반영` 후 청년 수행·보상 이력으로 이동 |
| 최종 상태 | 청년 수행 이력 | 수집 기록 1건, 검수 승인, 지급 확인, 데이터셋 연결 반영 |

브라우저 점검은 Playwright로 수행하였다. 이는 현재 정적 데모의 화면·상태 전환 검증이며, 실제 백엔드·결제·로봇 학습 파이프라인의 종단 간 검증을 뜻하지 않는다.

## 배포 이력

| 배포 | 내용 |
|---|---|
| `dpl_ExeAGsZksuZyN3boZ6W3gh24nAuG` | 최초 공개 배포, 당시 자동 검사 68개 통과 |
| `dpl_9GbEHZtVnrrb2JBA5VzhsbAyafCp` | 시각 보완 반영. 공개 브라우저 점검에서 전체 화면 메뉴의 설정 타입 충돌 발견 |
| `dpl_5m1SQSGXda7FJLmFEr6szh38zNvr` | 모바일 목록과 현재 화면 상태 분리, 자동 검사 75개 및 공개 메뉴 점검 통과 |
| `dpl_5ZjYmnuLWJDdMwy6ZUcTjGRqAagj` | 현재 production. 반응형 메뉴·표, 파비콘, 문구 정리와 34초 발표 흐름 반영. 자동 검사 91개와 82개 화면 점검 통과 |

이전 배포는 삭제하지 않았다. 기존 production alias와 브라우저 저장소 키는 유지하였다.

## 재배포

현재 배포는 Git의 앱 코드 커밋 `1fbe816`과 기획 문서 정렬 커밋 `33b135e` 이후 생성하였다. GitHub와 Vercel의 자동 배포 연결이 아니라 로컬에서 검증한 허용 목록을 CLI로 배포하는 방식이다.

```sh
npm run deploy:prepare

ROBOHOOD_DEPLOY_DIR="$(node -p "JSON.parse(require('fs').readFileSync('tmp/vercel-latest.json','utf8')).directory")"
vercel link --yes --project robohood-v1 --scope geond --cwd "$ROBOHOOD_DEPLOY_DIR"
vercel deploy --dry --prebuilt --format json --cwd "$ROBOHOOD_DEPLOY_DIR"
# 허용 목록 이외의 파일이 없는지 확인한 뒤 실행
vercel deploy --prebuilt --prod --yes --scope geond --cwd "$ROBOHOOD_DEPLOY_DIR"
```

`vercel link`가 임시 폴더에 환경변수 파일을 만들 수 있다. 내용을 출력·복사·커밋하지 않는다. `--prebuilt`를 빼거나 저장소 루트에서 무심코 배포하지 않는다.

배포 후 공유 주소에서 두 앱, 이미지 갤러리, 지도, 발표 흐름, 모바일 메뉴, JS 모듈과 누락 주소의 404를 다시 확인한다. 이전 버전으로 되돌릴 때는 Vercel 프로젝트의 배포 이력에서 정확한 대상 배포를 선택하며, 기존 배포나 프로젝트를 삭제하는 방식으로 복구하지 않는다.
