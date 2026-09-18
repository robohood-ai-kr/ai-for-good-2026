export const STORAGE_VERSION = 1;
export const gateNames = [
  "교육·과제 적격",
  "현장 촬영 허용",
  "안전·감독",
  "수행 범위·예상 시간",
  "보상·보완 조건",
];
export const presenterPlan = Object.freeze([
  Object.freeze({
    action: "presenter-collect",
    label: "현장 수집·제출",
    actionLabel: "1. 수집 완료·제출",
    actor: "청년 · 현장 작업 화면",
    startSecond: 0,
    endSecond: 12,
    description: "청년 현장 전문인력이 현장 작업 화면에서 조건을 확인하고 수집 기록을 제출합니다.",
  }),
  Object.freeze({
    action: "presenter-approve",
    label: "웹 독립 검수",
    actionLabel: "2. 독립 검수 완료",
    actor: "검수 담당 · 운영 콘솔",
    startSecond: 12,
    endSecond: 22,
    description: "수집자와 분리된 검수 담당자가 운영 콘솔에서 품질과 허용 범위를 확인합니다.",
  }),
  Object.freeze({
    action: "presenter-finish",
    label: "수행 이력 확인",
    actionLabel: "3. 승인·지급 반영",
    actor: "운영팀 → 청년 현장 작업",
    startSecond: 22,
    endSecond: 34,
    description: "운영팀이 이용·지급 기록을 확정하면 청년 현장 작업에 수행 이력이 반영됩니다.",
  }),
]);
export const storageKey = (sector) => `robohood:${sector}:v1`;
export function segmentRecord({ start, end, name, verdict = 'hold', notes = '', duration } = {}) {
  const from = Number(start), to = Number(end);
  if (start === '' || end === '' || !Number.isFinite(from) || !Number.isFinite(to) || from < 0 || to <= from)
    throw new Error('시작은 0초 이상, 끝은 시작보다 큰 시간으로 입력해 주세요.');
  if (Number.isFinite(duration) && to > duration)
    throw new Error('구간 끝이 선택한 영상 길이를 초과합니다.');
  if (!String(name ?? '').trim()) throw new Error('작업 구간 이름을 입력해 주세요.');
  if (!['success', 'failure', 'hold'].includes(verdict)) throw new Error('유효한 작업 판정을 선택해 주세요.');
  return { kind: 'segment', start: from, end: to, name: String(name).trim().slice(0, 100), verdict,
    notes: String(notes).slice(0, 1000), at: new Date().toISOString(), simulated: true };
}
export function initialState(sector) {
  return {
    version: STORAGE_VERSION,
    sector,
    role: sector === "manufacturing" ? "manager" : "coordinator",
    drafts: {},
    task: null,
    gates: [false, false, false, false, false],
    session: "대기",
    review: "미검수",
    access: "미승인",
    payment: "지급 대기",
    label: "hold",
    marks: [],
    events: [],
    simulation: "정지",
  };
}
export function collectionAllowed(state) {
  return (
    state.gates.length === 5 && state.gates.every((value) => value === true)
  );
}
export function transition(state, action, payload = {}) {
  const next = structuredClone(state);
  const require = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  switch (action) {
    case "create-task":
      require(typeof payload.title === "string" &&
        payload.title.trim().length >
          0, "과제 이름 또는 목적을 입력해 주세요.");
      if (state.marks.length || state.task) {
        next.history = [...(state.history ?? []), { task: state.task, marks: state.marks,
          review: state.review, access: state.access, payment: state.payment }].slice(-20);
      }
      next.task = { title: payload.title.trim(), createdAt: payload.at ?? new Date().toISOString() };
      next.gates = [false, false, false, false, false];
      next.session = "대기";
      next.review = "미검수";
      next.access = "미승인";
      next.payment = "지급 대기";
      next.marks = [];
      break;
    case "start":
      require(collectionAllowed(
        state,
      ), "교육·현장 허용·감독·수행 범위·보상 조건을 모두 확인해야 합니다.");
      next.session = "수집 중";
      next.review = "미검수";
      next.access = "미승인";
      next.payment = "지급 대기";
      next.marks = [];
      break;
    case "submit":
      require(state.session ===
        "수집 중", "조건 확인 후 수집 세션을 먼저 시작해 주세요.");
      require(state.marks.length >
        0, "샘플 촬영 또는 작업 구간을 하나 이상 기록해 주세요.");
      next.session = "검수 대기";
      next.review = "검수 대기";
      next.collector = state.role;
      break;
    case "approve":
      require(["reviewer", "manager", "coordinator"].includes(
        state.role,
      ), "역할을 검수 담당 또는 운영팀으로 전환해 주세요.");
      require(state.collector !==
        state.role, "동일 역할로 제출한 세션은 직접 승인할 수 없습니다. 검수 담당 역할로 전환해 주세요.");
      require(state.review === "검수 대기", "먼저 수집 세션을 제출해 주세요.");
      next.review = "승인";
      next.session = "승인 버전 준비";
      break;
    case "rework":
      require(["reviewer", "manager", "coordinator"].includes(
        state.role,
      ), "보완 요청은 검수 담당 또는 운영팀 역할에서 기록합니다.");
      require(state.review === "검수 대기", "먼저 수집 세션을 제출해 주세요.");
      require(payload.reason?.trim(), "보완 사유를 입력해 주세요.");
      next.review = "보완 요청";
      next.session = "보완 대기";
      next.reason = payload.reason.trim();
      next.gates[4] = false;
      break;
    case "request-access":
      require(state.review ===
        "승인", "승인된 수집 세션이 있어야 이용 신청을 기록할 수 있습니다.");
      next.access = "신청 대기";
      break;
    case "grant-access":
      require(["manager", "coordinator"].includes(
        state.role,
      ), "이용 승인은 운영팀 역할에서 별도로 확인합니다.");
      require(state.access === "신청 대기", "이용 신청이 먼저 필요합니다.");
      next.access = "조회·평가 승인";
      break;
    case "confirm-payment":
      require(["manager", "coordinator"].includes(
        state.role,
      ), "지급 확인은 운영팀 역할에서 기록합니다.");
      require(state.review === "승인", "검수 승인 후 지급 확인을 기록할 수 있습니다.");
      require(state.marks.length > 0, "수집 기록이 있어야 지급 확인을 기록할 수 있습니다.");
      next.payment = "지급 확인";
      break;
    case "simulate":
      require(state.sector === "manufacturing" &&
        state.role ===
          "fde", "시험 실행은 제조업 현장 적용 FDE 역할 전용입니다.");
      next.simulation = "모의 실행";
      break;
    case "stop":
      next.session = "중단";
      next.simulation = "정지";
      break;
    default:
      throw new Error("Unknown demo action");
  }
  next.events.unshift({
    action,
    at: payload.at ?? new Date().toISOString(),
    message: payload.reason ?? payload.title ?? "",
  });
  next.events = next.events.slice(0, 40);
  return next;
}
