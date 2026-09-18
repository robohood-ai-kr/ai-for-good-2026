export const sectors = {
  manufacturing: {
    name: "제조업 중심",
    prefix: "mf",
    caseId: "RH-MF-001",
    description: "제조 현장의 수집·검수·데이터 버전과 FDE의 적용·재수집 흐름",
    mobile: [8, 17, 18],
    names: [
      "서비스 소개",
      "역할 선택·작업 공간",
      "작업 공간 개요",
      "현장 과제 목록",
      "현장 과제 등록",
      "과제 상세",
      "수집팀·현장 인력 배정",
      "모바일 RGB 수집",
      "검수·라벨링",
      "데이터셋 라이브러리",
      "데이터셋 상세·버전",
      "모델 목록·상세",
      "장비·호환성",
      "배포 준비",
      "모의 적용 상태 확인",
      "이벤트·재수집",
      "모바일 작업함",
      "경력·교육",
      "데이터 접근·이용 조건",
      "작업 공간 설정",
      "현장 탐색",
    ],
    nav: [
      ["개요", 3, "dashboard"],
      ["현장 탐색", 21, "explore"],
      ["현장 과제", 4, "assignment"],
      ["현장 인력", 7, "groups"],
      ["검수·라벨링", 9, "fact_check"],
      ["데이터셋", 10, "dataset"],
      ["모델", 12, "neurology"],
      ["장비", 13, "precision_manufacturing"],
      ["배포·관제", 14, "monitoring"],
      ["접근 승인", 19, "shield"],
      ["설정", 20, "settings"],
    ],
    flows: [
      ["요청·검수", [21, 5, 6, 7, 9, 10, 11]],
      ["현장 수집", [18, 17, 8, 9]],
      ["FDE 적용·재수집", [12, 13, 14, 15, 16]],
    ],
    roles: {
      manager: "운영팀",
      researcher: "요청 기업",
      operator: "수집 담당",
      reviewer: "검수 담당",
      fde: "현장 적용 FDE",
    },
    roleEntry: {
      manager: 3,
      researcher: 10,
      operator: 17,
      reviewer: 9,
      fde: 14,
    },
    taskPage: 6,
    newPage: 5,
    reviewPage: 9,
    datasetPage: 11,
    accessPage: 19,
    defaultTask: "소형 부품 외관 검사 RGB 이미지 수집",
  },
  "small-business": {
    name: "소상공인 중심",
    prefix: "sb",
    caseId: "RH-SB-001",
    description:
      "생활권 현장에서 청년의 교육·유급 수집·검수·수행 이력을 연결하는 흐름",
    mobile: [10, 11, 12, 13, 14],
    names: [
      "서비스 소개",
      "역할 선택·작업 공간",
      "작업 공간 개요",
      "현장 탐색",
      "현장 상세·수집 조건",
      "수집 과제 목록",
      "데이터 요청 등록",
      "과제 상세·유급 조건",
      "교육·현장 인력 배정",
      "모바일 교육·적격",
      "모바일 작업함",
      "모바일 작업 전 확인",
      "모바일 영상 수집",
      "모바일 보완·중단 보고",
      "영상 검수·구간 라벨",
      "데이터셋 라이브러리",
      "데이터셋 상세·버전",
      "수행·보상 이력",
      "데이터 접근·이용 승인",
      "작업 공간 설정",
    ],
    nav: [
      ["개요", 3, "dashboard"],
      ["현장 탐색", 4, "explore"],
      ["수집 과제", 6, "assignment"],
      ["교육·현장 인력", 9, "groups"],
      ["검수", 15, "fact_check"],
      ["데이터셋", 16, "dataset"],
      ["수행·보상", 18, "payments"],
      ["접근 승인", 19, "shield"],
      ["설정", 20, "settings"],
    ],
    flows: [
      ["요청 기업", [4, 5, 7, 8, 16, 17, 19]],
      ["청년 수집 담당", [10, 11, 12, 13, 14, 18]],
      ["운영·검수", [6, 9, 15, 16, 18]],
    ],
    roles: {
      coordinator: "운영팀",
      merchant: "현장 제공자",
      researcher: "요청 기업",
      operator: "수집 담당",
      reviewer: "검수 담당",
    },
    roleEntry: {
      coordinator: 3,
      merchant: 5,
      researcher: 4,
      operator: 11,
      reviewer: 15,
    },
    taskPage: 8,
    newPage: 7,
    reviewPage: 15,
    datasetPage: 17,
    accessPage: 19,
    defaultTask: "모의 카페 A · 빈 컵을 트레이에 정리하는 1인칭 영상",
  },
};

export function screenId(sector, number) {
  return `${sectors[sector].prefix}-${String(number).padStart(2, "0")}`;
}
export function route(sector, number) {
  if (
    !sectors[sector] ||
    !Number.isInteger(number) ||
    number < 1 ||
    number > sectors[sector].names.length
  )
    throw new Error("Unknown screen");
  return `./${screenId(sector, number)}.html`;
}
export function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
}
