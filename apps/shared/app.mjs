import {
  initialState,
  storageKey,
  collectionAllowed,
  transition,
  segmentRecord,
  presenterPlan,
} from "./state.mjs";
import { initNaverMap } from "./naver-map.mjs";

const config = JSON.parse(document.querySelector("#rh-config").textContent);
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
document.querySelectorAll('.rh-header [data-action=role]').forEach(b=>b.setAttribute('aria-label','역할 선택'));
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const pageParams = new URL(location.href).searchParams;
const qa = pageParams.get("qa") === "1";
const presenterMode = pageParams.get("presenter") === "1";
const demoMode = pageParams.get("demo") === "1" || presenterMode;
const requestedScenario = pageParams.get("scenario");
const scenarioId = config.scenarios?.[requestedScenario]
  ? requestedScenario
  : config.defaultScenario;
const scenario = config.scenarios?.[scenarioId];
const route = (number, targetScenario = scenarioId) => {
  const params = new URLSearchParams();
  if (config.scenarios?.[targetScenario]) params.set("scenario", targetScenario);
  if (qa) params.set("qa", "1");
  if (presenterMode) params.set("presenter", "1");
  if (demoMode && !presenterMode) params.set("demo", "1");
  const query = params.toString();
  return `./${config.prefix}-${String(number).padStart(2, "0")}.html${query ? `?${query}` : ""}`;
};
const screenLink = (number) =>
  `<a href="${route(number)}">${esc(config.names[number - 1])}</a>`;
const key =
  storageKey(config.sector) +
  (scenarioId ? `:${scenarioId}` : "") +
  (presenterMode ? ":presenter34" : "") +
  (qa ? ":qa" : "");
let state = initialState(config.sector),
  storageAvailable = true,
  toastTimer;
let videoURL;
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (
    saved?.version === 1 &&
    saved.sector === config.sector &&
    Array.isArray(saved.gates) &&
    saved.gates.length === 5 &&
    config.roles[saved.role]
  )
    state = { ...state, ...saved };
  if (state.payment === "모의 지급 대기") state.payment = "지급 대기";
  if (state.payment === "모의 지급 확인") state.payment = "지급 확인";
  if (state.access === "데모 평가용 승인") state.access = "조회·평가 승인";
} catch {
  storageAvailable = false;
}

function persist() {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    storageAvailable = false;
    toast("브라우저 저장 공간을 사용할 수 없어 이번 페이지에서만 유지됩니다.");
  }
  render();
}
function toast(message) {
  const element = $("#rh-toast");
  element.textContent = message;
  element.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (element.hidden = true), 5000);
}
function dialog(title, html) {
  $("#rh-dialog-title").textContent = title;
  $("#rh-dialog-body").innerHTML = html;
  const box = $("#rh-dialog");
  if (!box.open) box.showModal();
}
function closeDialog() {
  $("#rh-dialog").close();
}
const narrowSidebar = window.matchMedia("(max-width: 1020px)");
function setSidebarOpen(open, restoreFocus = false) {
  const sidebar = $("#rh-sidebar");
  const scrim = $(".rh-sidebar-scrim");
  if (!sidebar) return false;
  const canOpen = narrowSidebar.matches && open;
  sidebar.classList.toggle("rh-open", canOpen);
  sidebar.inert = narrowSidebar.matches && !canOpen;
  if (narrowSidebar.matches) sidebar.setAttribute("aria-hidden", String(!canOpen));
  else sidebar.removeAttribute("aria-hidden");
  scrim?.classList.toggle("rh-open", canOpen);
  scrim?.setAttribute("aria-hidden", String(!canOpen));
  if ($("#rh-main")) $("#rh-main").inert = canOpen;
  if ($(".rh-header")) $(".rh-header").inert = canOpen;
  document.body.classList.toggle("rh-menu-open", canOpen);
  $$('[data-action="menu"]').forEach((button) =>
    button.setAttribute("aria-expanded", String(canOpen)),
  );
  if (canOpen) sidebar.querySelector('[data-action="menu-close"]')?.focus();
  else if (restoreFocus) $('[data-action="menu"]')?.focus();
  return canOpen;
}
function syncSidebarMode() {
  setSidebarOpen(false);
}
narrowSidebar.addEventListener("change", syncSidebarMode);
syncSidebarMode();
function advance(action, payload = {}) {
  state = transition(state, action, payload);
  persist();
}

function applyDemoHandoff(stage) {
  const handoff = config.demoHandoff?.[stage];
  if (!handoff) return null;
  if (handoff.role && config.roles[handoff.role]) state.role = handoff.role;
  return Number.isInteger(handoff.page) ? handoff.page : null;
}

function applyScenarioContent() {
  if (!scenario) return;
  document.body.dataset.scenario = scenarioId;
  $$('[data-scenario-text]').forEach((el) => {
    const value = scenario[el.dataset.scenarioText];
    if (value !== undefined) el.textContent = value;
  });
  $$('[data-scenario-image]').forEach((img) => {
    img.src = `./assets/scenarios/${scenario.image}`;
    img.alt = scenario.alt;
  });
  $$('[data-scenario-field]').forEach((el) => {
    const value = scenario[el.dataset.scenarioField];
    if (value !== undefined) el.value = value;
  });
  $$('[data-scenario-card]').forEach((el) => {
    const selected = el.dataset.scenarioCard === scenarioId;
    el.classList.toggle('rh-scenario-active', selected);
    if (el.classList.contains('rh-site-item'))
      el.classList.toggle('rh-selected-site', selected);
    el.setAttribute('aria-current', selected ? 'true' : 'false');
  });
}

function carryPageContext() {
  $$('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href');
    if (!href?.startsWith('./') || !href.includes('.html') || href.includes('gallery')) return;
    const url = new URL(href, location.href);
    const targetScenario = anchor.dataset.scenarioLink ?? scenarioId;
    if (config.scenarios?.[targetScenario]) url.searchParams.set('scenario', targetScenario);
    if (qa) url.searchParams.set('qa', '1');
    if (presenterMode) url.searchParams.set('presenter', '1');
    if (demoMode && !presenterMode) url.searchParams.set('demo', '1');
    anchor.href = `./${url.pathname.split('/').pop()}${url.search}`;
  });
  $$('#rh-screen-select option').forEach((option) => {
    if (!option.value) return;
    const url = new URL(option.value, location.href);
    if (scenario) url.searchParams.set('scenario', scenarioId);
    if (qa) url.searchParams.set('qa', '1');
    if (presenterMode) url.searchParams.set('presenter', '1');
    if (demoMode && !presenterMode) url.searchParams.set('demo', '1');
    option.value = `./${url.pathname.split('/').pop()}${url.search}`;
  });
}

function presenterStage() {
  if (state.payment === "지급 확인" && state.access === "조회·평가 승인") return 3;
  if (state.review === "승인") return 2;
  if (state.review === "검수 대기") return 1;
  return 0;
}

function refreshPresenter() {
  const bar = $("#rh-presenter");
  if (!bar || !scenario) return;
  const stage = presenterStage();
  const next = presenterPlan[stage];
  const duration = presenterPlan.at(-1).endSecond;
  const description = next?.description ?? "검수·이용·지급 상태가 청년 현장 작업의 수행 이력에 반영되었습니다.";
  bar.dataset.presenterStage = String(stage);
  bar.innerHTML = `<div class="rh-presenter-copy"><span class="rh-presenter-kicker">현장 데이터 흐름 · ${stage}/3</span><strong>${esc(scenario.title)}</strong><small>${esc(description)}</small></div><ol class="rh-presenter-steps">${presenterPlan.map((step,index)=>`<li class="${index<stage?'done':index===stage?'current':''}"><span>${index+1}</span><div><strong>${esc(step.label)}</strong><small>${step.startSecond}–${step.endSecond}초 · ${esc(step.actor)}</small></div></li>`).join("")}</ol><div class="rh-presenter-actions">${next?`<button class="rh-primary" data-action="${next.action}">${esc(next.actionLabel)}</button>`:`<button class="rh-primary" data-action="presenter-reset">처음부터</button>`}<button class="rh-quiet" data-action="presenter-exit">흐름 종료</button></div>`;
}

function initPresenter() {
  if (config.sector !== "small-business") return;
  if (!presenterMode && config.number === 4) {
    const launch = document.createElement("div");
    launch.className = "rh-presenter-launch";
    launch.innerHTML = `<button class="rh-primary" data-action="presenter-start">대표 흐름 시작</button><small>현장 작업 화면 → 운영 콘솔 → 수행 이력을 34초 안에 확인합니다.</small>`;
    $(".rh-page-heading")?.append(launch);
    return;
  }
  if (!presenterMode) return;
  if (presenterStage() === 0) state.role = "operator";
  document.body.dataset.presenter = "true";
  const bar = document.createElement("section");
  bar.id = "rh-presenter";
  bar.className = "rh-presenter-bar";
  bar.setAttribute("aria-label", "청년 현장 데이터 처리 흐름");
  $(".rh-page-content")?.before(bar);
  refreshPresenter();
}

function render() {
  const values = {
    session: state.session, review: state.review, access: state.access, payment: state.payment,
    simulation: state.simulation, markCount: state.marks.length,
    pendingReview: state.review === '검수 대기' ? 1 : 0,
    pendingAccess: state.access === '신청 대기' ? 1 : 0,
    pendingPayment: state.marks.length > 0 && state.payment === '지급 대기' ? 1 : 0,
    collector: config.roles[state.collector] ?? '제출 전', reason: state.reason ?? '아직 보완 요청이 없습니다.',
  };
  $$('[data-value]').forEach(el => { el.textContent = values[el.dataset.value] ?? '—'; });
  const mf = config.sector === 'manufacturing';
  const step = state.access === '조회·평가 승인' ? (mf ? 4 : 5)
    : state.review === '승인' || state.review === '검수 대기' ? (mf ? 3 : 4)
    : state.session === '수집 중' ? (mf ? 2 : 3)
    : collectionAllowed(state) ? (mf ? 1 : 2) : state.gates.some(Boolean) ? 1 : 0;
  $$('[data-step]').forEach(el => {
    const i = Number(el.dataset.step);
    el.classList.toggle('current', i === step); el.classList.toggle('done', i < step);
    el.querySelector('a')?.setAttribute('aria-current', i === step ? 'step' : 'false');
  });
  const nextAction = $('.rh-next-card .rh-primary');
  if (nextAction) {
    let next = [mf ? 7 : 12, '작업 조건 확인'];
    if (state.session === '수집 중') next = [mf ? 8 : 13, '수집 이어가기'];
    if (state.review === '검수 대기') next = [config.reviewPage, '검수 열기'];
    if (state.review === '승인') next = [config.accessPage, '이용 승인 확인'];
    if (state.access === '조회·평가 승인') next = [config.datasetPage, '데이터셋 확인'];
    nextAction.href = route(next[0]); nextAction.textContent = next[1] + ' →';
    const firstItem = $('.rh-next-actions li');
    if (firstItem) {
      const title = firstItem.querySelector('[data-next-title]');
      if (title) title.textContent = next[1];
      else firstItem.innerHTML = '<span>1</span>' + esc(next[1]);
    }
  }
  $$('[data-marks]').forEach(el => {
    el.innerHTML = state.marks.length ? state.marks.map((m,i) => `<article><strong>${i+1}. ${esc(m.name ?? ({normal:'정상',defect:'불량',hold:'판정 보류'}[m.label] ?? 'RGB 샘플'))}</strong><small>${m.kind === 'segment' ? `${esc(m.start ?? '—')}–${esc(m.end ?? '—')}초 · ${esc({success:'성공',failure:'실패',hold:'판정 보류'}[m.verdict] ?? '판정 보류')}` : '생성 이미지 기반 모의 기록'}${m.notes ? ` · ${esc(m.notes)}` : ''}</small></article>`).join('') : '<p class="rh-empty">아직 수집 기록이 없습니다.<br>조건 확인 후 샘플 또는 구간을 추가해 주세요.</p>';
  });
  const names = {'create-task':'과제 등록',start:'수집 시작',submit:'검수 및 제출',approve:'검수 승인',rework:'보완 요청','request-access':'이용 신청','grant-access':'이용 승인','confirm-payment':'지급 확인',simulate:'UI 시험 실행',stop:'시험 중단','recollection-request':'재수집 초안'};
  $$('[data-events]').forEach(el => {
    el.innerHTML = state.events.length ? `<ul class="rh-event-list">${state.events.slice(0,8).map(v=>`<li><span>${esc(names[v.action] ?? v.action)}</span><time>${esc(new Date(v.at).toLocaleTimeString('ko-KR'))}</time></li>`).join('')}</ul>` : '<p class="rh-empty">아직 실행 기록이 없습니다.</p>';
  });
  $$('[data-action=label]').forEach(b=>b.classList.toggle('rh-selected', ({normal:'정상',defect:'불량',hold:'판정 보류'}[state.label]) === b.textContent.trim()));
  $$('[data-action=label]').forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('rh-selected'))));
  const filterTabs = $$('[data-action=filter-tab]');
  if (filterTabs.length && !filterTabs.some((b) => b.getAttribute('aria-pressed') === 'true')) {
    filterTabs.forEach((b, i) => b.setAttribute('aria-pressed', String(i === 0)));
  }
  $$("[data-role-label]").forEach(
    (el) => (el.textContent = config.roles[state.role] ?? "역할"),
  );
  $$("[data-task-title]").forEach(
    (el) =>
      (el.textContent =
        state.task?.title ?? scenario?.defaultTask ?? config.defaultTask),
  );
  const defaultTask = scenario?.defaultTask ?? config.defaultTask;
  const currentTaskTitle = state.task?.title && state.task.title !== defaultTask
    ? state.task.title
    : (mf ? '소형 부품 외관 검사' : (scenario?.title ?? '대표 현장 데이터 수집'));
  $$('[data-task-short]').forEach(el => { el.textContent = currentTaskTitle; });
  if (config.refined && config.number === config.taskPage)
    $('#rh-main h1').textContent = currentTaskTitle;
  $$("[data-session-status]").forEach((el) => (el.textContent = state.session));
  $$("[data-gate]").forEach(
    (el) => (el.checked = state.gates[Number(el.dataset.gate)] === true),
  );
  $$('[data-gate-progress]').forEach(el => { el.value = state.gates.filter(Boolean).length; });
  $$("[data-gate-status]").forEach(
    (el) =>
      (el.textContent = `${state.gates.filter(Boolean).length}/5 확인 · ${collectionAllowed(state) ? "수집을 시작할 수 있습니다." : "미확인 조건을 확인해 주세요."}`),
  );
  $$("[data-gate-badge]").forEach((el) => {
    el.textContent = state.gates[Number(el.dataset.gateBadge)]
      ? "확인"
      : "미확인";
    el.style.color = state.gates[Number(el.dataset.gateBadge)]
      ? "#166534"
      : "#92400e";
  });
  $$('[data-action="start"]').forEach((el) => {
    el.disabled = !collectionAllowed(state);
    el.setAttribute("aria-disabled", String(el.disabled));
    if (!el.disabled) el.classList.add("rh-primary");
  });
  $$("[data-review-status]").forEach(
    (el) =>
      (el.textContent = `수집: ${state.session} · 검수: ${state.review} · 기록 ${state.marks.length}건 · 지급: ${state.payment}`),
  );
  $$("[data-access-status]").forEach(
    (el) =>
      (el.textContent = `이용 상태: ${state.access} · 검수 상태: ${state.review}`),
  );
  $$("[data-role]").forEach((el) => {
    const selected = el.dataset.role === state.role;
    el.classList.toggle("rh-selected", selected);
    el.setAttribute("aria-pressed", String(selected));
    el.querySelectorAll(".badge-active").forEach((b) =>
      b.classList.toggle("hidden", !selected),
    );
  });
  // Never enable an export's disabled approval control merely because demo state changed.
  $$("input[type=radio]").forEach((el) =>
    el.closest("label")?.classList.toggle("rh-selected", el.checked),
  );
  refreshPresenter();
}

function showScreens() {
  const surfaceLabel = (number) => config.mobile.includes(number)
    ? "현장 앱"
    : config.fieldWorkspace?.includes(number)
      ? "현장 작업"
      : "운영 콘솔";
  dialog(
    "화면과 업무 흐름",
    `<p><strong>${esc(config.name)} · ${config.names.length}개 화면</strong><br>역할별 화면과 연결된 업무 단계를 확인할 수 있습니다.</p><input type="search" data-screen-search placeholder="화면 이름이나 번호 검색" aria-label="화면 검색"><div class="rh-screen-list">${config.names.map((name, i) => `<a data-screen-item href="${route(i + 1)}"><span>${config.prefix.toUpperCase()}-${String(i + 1).padStart(2, "0")}</span>${esc(name)} · ${surfaceLabel(i + 1)}</a>`).join("")}</div>${config.flows.map(([name, numbers]) => `<h3>${esc(name)}</h3><div class="rh-flow">${numbers.map(screenLink).join("")}</div>`).join("")}<h3>권한 안내</h3><p>검수 승인, 이용 승인과 지급 확인은 각각 다른 역할과 단계에서 처리합니다.</p><div class="rh-actions"><button data-action="role">역할 변경</button><button data-action="workflow">진행 기록</button><button data-action="reset-confirm">진행 기록 초기화</button></div>`,
  );
}
function showRole() {
  dialog(
    "역할 선택",
    `<p>업무에 맞는 역할을 선택하면 해당 시작 화면으로 이동합니다.</p><label for="rh-role-select">현재 역할</label><select id="rh-role-select">${Object.entries(
      config.roles,
    )
      .map(
        ([id, name]) =>
          `<option value="${id}" ${id === state.role ? "selected" : ""}>${esc(name)}</option>`,
      )
      .join(
        "",
      )}</select><div class="rh-actions"><button class="rh-primary" data-action="apply-role">역할 적용</button><button data-action="enter">역할별 시작 화면</button></div>`,
  );
}
function showWorkflow() {
  const rows = [
    ["과제", state.task?.title ?? scenario?.defaultTask ?? config.defaultTask],
    ["현재 역할", config.roles[state.role]],
    ["조건 확인", `${state.gates.filter(Boolean).length}/5`],
    ["수집", state.session],
    ["기록", `${state.marks.length}건`],
    ["검수", state.review],
    ["이용 승인", state.access],
    ["지급", state.payment],
  ];
  if (config.sector === "manufacturing")
    rows.push(["장치 UI 시뮬레이션", state.simulation]);
  dialog(
    "내 진행 기록",
    `<p><strong>${esc(config.name)}</strong>의 현재 진행 상태입니다.</p><table>${rows.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</table><div class="rh-actions"><a class="rh-primary" href="${route(config.reviewPage)}">검수로 이동</a><a href="${route(config.accessPage)}">이용 승인</a><button data-action="role">역할 변경</button></div><h3>최근 동작</h3>${
      state.events.length
        ? `<ul>${state.events
            .slice(0, 10)
            .map(
              (e) =>
                `<li>${esc(e.action)} · ${esc(new Date(e.at).toLocaleTimeString("ko-KR"))}${e.message ? ` — ${esc(e.message)}` : ""}</li>`,
            )
            .join("")}</ul>`
        : "<p>아직 기록이 없습니다. 과제를 입력하거나 현장 수집 흐름을 시작해 보세요.</p>"
    }<p><small>검수 승인, 이용 승인과 지급 확인은 서로 다른 단계입니다.</small></p>`,
  );
}

function fields() {
  return $$("[data-field]").filter(
    (el) =>
      el.type !== "password" &&
      el.type !== "file" &&
      !el.matches("[data-search]") &&
      !/user-id|username|otp|password/i.test(el.dataset.field),
  );
}
function saveFields() {
  const values = {};
  for (const el of fields())
    values[el.dataset.field] = ["checkbox", "radio"].includes(el.type)
      ? el.checked
      : el.value;
  state.drafts[config.id] = values;
  persist();
}
function restoreFields() {
  const values = state.drafts[config.id];
  if (!values) return;
  for (const el of fields())
    if (Object.hasOwn(values, el.dataset.field)) {
      if (["checkbox", "radio"].includes(el.type))
        el.checked = Boolean(values[el.dataset.field]);
      else el.value = values[el.dataset.field];
    }
}
function createTask() {
  const input = $("#taskName") ?? $("#taskPurpose");
  if (!input) {
    location.href = route(config.newPage);
    return;
  }
  input.required = true;
  const count = $("#frameCount") ?? $("#sessionCount");
  if (count) {
    count.min = "1";
    count.max = "100000";
    count.required = true;
  }
  if (!input.reportValidity() || (count && !count.reportValidity())) return;
  saveFields();
  state = transition(state, "create-task", { title: input.value });
  const destination = applyDemoHandoff("taskCreated") ?? config.taskPage;
  persist();
  location.href = route(destination);
}

function showDownloadInfo(label) {
  dialog(
    "다운로드 범위 안내",
    `<p>‘${esc(label)}’ 내보내기 범위를 확인해 주세요.</p><p>승인된 수집 세션의 상태 기록을 JSON으로 내려받을 수 있습니다. 원본 영상과 개인정보는 포함하지 않습니다.</p><div class="rh-actions"><button class="rh-primary" data-action="export-demo">승인 기록 JSON 다운로드</button><a href="${route(config.accessPage)}">이용 승인 화면</a></div>`,
  );
}
function exportDemo() {
  if (state.review !== "승인" || state.access !== "조회·평가 승인")
    throw new Error(
      "검수 승인과 별도의 평가 목적 이용 승인을 먼저 완료해 주세요.",
    );
  const record = {
    prototype: true,
    product: config.sector,
    schemaVersion: 1,
    scenario: scenarioId ?? null,
    caseId: scenario?.caseId ?? config.caseId,
    task: state.task?.title ?? scenario?.defaultTask ?? config.defaultTask,
    review: state.review,
    access: state.access,
    payment: state.payment,
    marks: state.marks,
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(record, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `robohood-${config.sector}-approval-record.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("승인 메타데이터를 다운로드했습니다.");
}
function filterContent(query) {
  const main = $(".rh-export-content") ?? $("main");
  if (!main) return;
  let items = $$("tbody tr", main);
  if (!items.length) items = $$("[data-search-item],article", main);
  const value = query.toLocaleLowerCase().trim();
  if (!items.length) {
    toast(
      "이 화면은 표 검색을 지원하지 않습니다. 상단 화면·안내에서 페이지를 검색할 수 있습니다.",
    );
    return;
  }
  let shown = 0;
  for (const item of items) {
    const siteFilters = $$('[data-site-filter]').map(el => el.value);
    const matchesText = !value || item.textContent.toLocaleLowerCase().includes(value);
    const matchesSite = !siteFilters.length || (
      (siteFilters[1] === '전체' || item.dataset.siteCategory === siteFilters[1]) &&
      (siteFilters[2] === '전체' || item.classList.contains('rh-selected-site')) &&
      (siteFilters[3] === '전체' || item.dataset.siteState === siteFilters[3])
    );
    const matches = matchesText && matchesSite;
    item.hidden = !matches;
    if (matches) shown++;
  }
  let result = $(".rh-filter-result", main);
  if (!result) {
    result = document.createElement("div");
    result.className = "rh-filter-result";
    result.setAttribute("role", "status");
    main.prepend(result);
  }
  result.textContent = `시안 샘플 ${items.length}건 중 ${shown}건${!shown ? " · 검색 결과가 없습니다. 검색어를 지우거나 필터를 초기화해 주세요." : ""}`;
  const siteCount = $('.rh-site-list-heading h2 span');
  if (siteCount) siteCount.textContent = shown;
}

async function act(name, el) {
  const label = el.dataset.label ?? el.textContent.trim();
  switch (name) {
    case "presenter-start": {
      state = initialState(config.sector);
      state.role = "operator";
      persist();
      const url = new URL(route(13), location.href);
      url.searchParams.set("presenter", "1");
      location.href = `${url.pathname.split('/').pop()}${url.search}`;
      break;
    }
    case "presenter-exit": {
      const url = new URL(location.href);
      url.searchParams.delete("presenter");
      location.href = `${url.pathname}${url.search}`;
      break;
    }
    case "presenter-reset":
      state = initialState(config.sector);
      state.role = "operator";
      persist();
      location.href = route(13);
      break;
    case "presenter-collect":
      state = initialState(config.sector);
      state.role = "operator";
      state.gates.fill(true);
      state = transition(state, "start");
      state.marks.push(segmentRecord({
        start: 0,
        end: 6,
        name: scenario?.segment ?? "대표 작업 구간",
        verdict: "success",
        notes: "식당 테이블 정리 작업의 현장 수집 기록",
      }));
      state = transition(state, "submit");
      state.role = "reviewer";
      persist();
      location.href = route(config.reviewPage);
      break;
    case "presenter-approve":
      state.role = "reviewer";
      state = transition(state, "approve");
      state.role = "coordinator";
      persist();
      location.href = route(config.accessPage);
      break;
    case "presenter-finish":
      state.role = "coordinator";
      if (state.access === "미승인") state = transition(state, "request-access");
      if (state.access === "신청 대기") state = transition(state, "grant-access");
      state = transition(state, "confirm-payment");
      state.role = "operator";
      persist();
      location.href = route(18);
      break;
    case "screens":
      showScreens();
      break;
    case "close-dialog":
      closeDialog();
      break;
    case "workflow":
      showWorkflow();
      break;
    case "role":
      showRole();
      break;
    case "set-role":
      if (config.roles[el.dataset.role]) {
        state.role = el.dataset.role;
        persist();
        toast(`현재 역할: ${config.roles[state.role]}`);
      }
      break;
    case "apply-role":
      state.role = $("#rh-role-select").value;
      persist();
      closeDialog();
      toast("역할을 적용했습니다.");
      break;
    case "enter":
      if ($("#rh-role-select")) state.role = $("#rh-role-select").value;
      persist();
      location.href = route(config.roleEntry[state.role] ?? 3);
      break;
    case "menu": {
      const sidebar = $("#rh-sidebar");
      if (sidebar) setSidebarOpen(!sidebar.classList.contains("rh-open"));
      else showScreens();
      break;
    }
    case "menu-close": {
      setSidebarOpen(false, true);
      break;
    }
    case "back":
      location.href = route(config.sector === "manufacturing" ? 17 : 11);
      break;
    case "save":
      saveFields();
      toast(
        storageAvailable
          ? "이 화면의 입력을 브라우저에 저장했습니다. 실제 서버에는 전송하지 않았습니다."
          : "저장 공간을 사용할 수 없습니다.",
      );
      break;
    case "create-task":
      createTask();
      break;
    case "reset-fields":
      delete state.drafts[config.id];
      persist();
      location.reload();
      break;
    case "reset-confirm":
      dialog(
        "이 앱의 진행 기록 초기화",
        `<p>${esc(config.name)} 앱에서 이 기기에 저장한 입력·역할·진행 기록만 삭제합니다. 다른 작업 공간의 기록은 유지됩니다.</p><div class="rh-actions"><button data-action="close-dialog">취소</button><button class="rh-primary" data-action="reset">진행 기록 초기화</button></div>`,
      );
      break;
    case "reset":
      state = initialState(config.sector);
      persist();
      location.reload();
      break;
    case "start":
      advance("start");
      location.href = route(config.sector === "manufacturing" ? 8 : 13);
      break;
    case "capture":
      if (state.session !== "수집 중")
        throw new Error("위의 조건을 확인하고 수집을 시작해 주세요.");
      state.marks.push({
        kind: "sample-image",
        label: state.label,
        notes: $('#captureNotes')?.value ?? '',
        at: new Date().toISOString(),
        simulated: true,
      });
      persist();
      toast(`모의 RGB 샘플 ${state.marks.length}건 기록 · 카메라 미사용`);
      break;
    case "label":
      state.label = /정상/.test(label)
        ? "normal"
        : /보류/.test(label)
          ? "hold"
          : "defect";
      $$("[data-action=label]").forEach((b) =>
        b.classList.toggle("rh-selected", b === el),
      );
      persist();
      toast(`라벨 초안: ${state.label}`);
      break;
    case "mark":
      if (state.session !== "수집 중")
        throw new Error("조건 확인 후 수집 세션을 시작해 주세요.");
      state.marks.push(segmentRecord({
        start: $('#segmentStart')?.value, end: $('#segmentEnd')?.value,
        name: $('#segmentName')?.value ?? label,
        verdict: $("input[name=verdict]:checked")?.value ?? "hold",
        notes: $('#captureNotes')?.value ?? '', duration: $('#rh-video-preview')?.duration,
      }));
      persist();
      el.classList.add("rh-selected");
      toast(`구간 ${state.marks.length}건 기록 · 파일은 업로드하지 않았습니다.`);
      break;
    case "submit":
      if (demoMode && state.session !== "수집 중") {
        state.role = "operator";
        state.gates.fill(true);
        state = transition(state, "start");
      }
      if (config.sector === "small-business" && state.session === "수집 중" && !state.marks.length) {
        const startValue = $('#segmentStart')?.value || '0';
        const endInput = Number($('#segmentEnd')?.value);
        const endValue = Number.isFinite(endInput) && endInput > Number(startValue)
          ? String(endInput)
          : String(Number(startValue) + 1);
        state.marks.push(segmentRecord({
          start: startValue,
          end: endValue,
          name: $('#segmentName')?.value.trim() || scenario?.segment || "대표 작업 구간",
          verdict: $("input[name=verdict]:checked")?.value ?? "hold",
          notes: $('#captureNotes')?.value ?? '',
          duration: $('#rh-video-preview')?.duration,
        }));
      }
      if (config.sector === "manufacturing" && state.session === "수집 중" && !state.marks.length) {
        state.marks.push({
          kind: "sample-image",
          label: state.label,
          notes: $('#captureNotes')?.value ?? '',
          at: new Date().toISOString(),
          simulated: true,
        });
      }
      state = transition(state, "submit");
      const destination = applyDemoHandoff("submitted") ?? config.reviewPage;
      persist();
      location.href = route(destination);
      break;
    case "approve":
      if (config.demoHandoff?.submitted?.role)
        state.role = config.demoHandoff.submitted.role;
      if (config.refined && $$('[data-field^=reviewCheck]').some(c=>!c.checked)) {
        if (!config.demoHandoff?.approved)
          throw new Error('네 가지 검수 기준을 확인해 주세요.');
        $$('[data-field^=reviewCheck]').forEach(check => { check.checked = true; });
      }
      saveFields();
      state = transition(state, "approve");
      const approvedDestination = applyDemoHandoff("approved");
      persist();
      if (approvedDestination) location.href = route(approvedDestination);
      else toast("검수 승인 완료 · 이용 승인과 지급 상태는 변경되지 않았습니다.");
      break;
    case "rework": {
      const reason =
        $("#rh-review-reason")?.value ||
        $("#review_note")?.value ||
        $("textarea")?.value;
      advance("rework", { reason });
      toast("보완 사유를 저장했습니다. 보상·보완 조건을 다시 확인해야 합니다.");
      break;
    }
    case "request-access":
      advance("request-access");
      toast("조회·평가 목적 이용 신청을 기록했습니다.");
      break;
    case "grant-access":
      advance("grant-access");
      toast("조회·평가 목적 이용을 승인했습니다. 학습·외부 공유 승인은 별도입니다.");
      break;
    case "confirm-payment":
      advance("confirm-payment");
      toast("지급 확인 상태를 기록했습니다.");
      break;
    case "export-demo":
      exportDemo();
      break;
    case "download-info":
      showDownloadInfo(label);
      break;
    case "simulate":
      advance("simulate");
      dialog(
        "브라우저 모의 실행",
        `<p>UI 상태를 ‘모의 실행’으로 변경했습니다. 실제 모델 추론, Isaac Sim 또는 로봇 제어를 실행하지 않았습니다.</p><div class="rh-actions"><a class="rh-primary" href="${route(15)}">관제 시안 보기</a><button data-action="workflow">모의 실행 기록</button></div>`,
      );
      break;
    case "stop":
      advance("stop");
      dialog(
        "모의 세션 중단",
        `<p>이 브라우저의 세션 상태를 중단으로 기록했습니다. 실제 현장·장치의 비상 정지 기능이 아닙니다.</p><div class="rh-actions"><a href="${route(config.sector === "manufacturing" ? 16 : 14)}">중단·보완 화면</a><button data-action="workflow">진행 기록</button></div>`,
      );
      break;
    case "recollect":
      state.events.unshift({
        action: "recollection-request",
        at: new Date().toISOString(),
        message: scenario?.caseId ?? config.caseId,
      });
      persist();
      location.href = route(config.newPage);
      break;
    case "assignment":
      toast(
        "배정 화면 시연입니다. 실제 인력을 초대하거나 알림을 발송하지 않았습니다.",
      );
      break;
    case "copy":
      try {
        await navigator.clipboard.writeText(scenario?.caseId ?? config.caseId);
        toast(`${scenario?.caseId ?? config.caseId} 과제 코드를 복사했습니다.`);
      } catch {
        dialog("과제 코드", `<p><code>${esc(scenario?.caseId ?? config.caseId)}</code></p>`);
      }
      break;
    case "filter-tab": {
      $$('[data-action=filter-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b===el)));
      if (/^\d+$|^이전$|^다음$/.test(label)) {
        toast("내보낸 시안에 포함된 샘플 페이지만 제공됩니다.");
        break;
      }
      const query = label
        .replace(/\s*\(.*?\)|\s+\d+$/g, "")
        .replace(/^전체.*/, "");
      filterContent(query);
      break;
    }
    default:
      dialog(
        label || "화면 안내",
        `<p>이 항목은 화면 구성 예시입니다. 현재 연결된 기능은 화면 이동, 입력 저장, 조건·상태 기록입니다.</p><p>실제 인증·기관 협약·연락·지급·센서·로봇 제어를 실행하지 않습니다.</p><div class="rh-actions"><button class="rh-primary" data-action="screens">연결된 화면 찾기</button><button data-action="workflow">진행 기록 보기</button></div>`,
      );
  }
}

document.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-action]");
  if (action) {
    event.preventDefault();
    if (action.disabled || action.getAttribute("aria-disabled") === "true")
      return;
    try {
      await act(action.dataset.action, action);
    } catch (error) {
      toast(error.message);
    }
    return;
  }
  const target = event.target.closest("[data-route]");
  if (target && !event.target.closest("input,select,textarea,a")) {
    event.preventDefault();
    location.href = target.dataset.route;
  }
});
document.addEventListener("keydown", (event) => {
  if (
    ["Enter", " "].includes(event.key) &&
    event.target.matches("[role=button],[role=link]") &&
    !event.target.matches("button,a[href]")
  ) {
    event.preventDefault();
    event.target.click();
  }
  if (event.key === "Escape") {
    setSidebarOpen(false, true);
  }
});
document.addEventListener("submit", (event) => {
  event.preventDefault();
  if (config.number === 2) act("enter", event.target);
  else createTask();
});
document.addEventListener("change", (event) => {
  const el = event.target;
  if (el.id === "rh-screen-select") location.href = el.value;
  if (el.dataset.gate !== undefined) {
    state.gates[Number(el.dataset.gate)] = el.checked;
    persist();
  }
  if (el.dataset.hideMap !== undefined) {
    $(".rh-map-layout")?.classList.toggle("rh-map-hidden", el.checked);
  }
  if (el.matches('[data-site-filter]')) filterContent($('[data-search]')?.value ?? '');
  if (el.id === "demoAccountSelect" && config.roles[el.value]) {
    state.role = el.value;
    persist();
  }
  if (el.matches("input[type=radio]")) render();
  if (
    el.matches("select[data-field]") &&
    config.number !== 2 &&
    /filter/.test(el.id)
  ) {
    const text = el.selectedOptions[0]?.textContent ?? "";
    filterContent(/전체|모든/.test(text) ? "" : text);
  }
});
document.addEventListener("input", (event) => {
  const el = event.target;
  if (el.matches("[data-search]")) filterContent(el.value);
  if (el.matches("[data-screen-search]"))
    $$("[data-screen-item]").forEach(
      (a) =>
        (a.hidden = !a.textContent
          .toLowerCase()
          .includes(el.value.toLowerCase())),
    );
});
$$(".rh-export-content table").forEach((table) => {
  const wrapper = document.createElement("div");
  wrapper.className = "rh-table-wrap";
  table.before(wrapper);
  wrapper.append(table);
});
$$("img").forEach((img) =>
  img.addEventListener("error", () => {
    img.style.opacity = ".2";
    img.title = "로컬 생성 이미지를 불러오지 못했습니다.";
  }),
);
const fileInput = $('#rh-video-file');
fileInput?.addEventListener('change', () => {
  const file = fileInput.files?.[0], video = $('#rh-video-preview');
  if (!file) return;
  if (!file.type.startsWith('video/')) { toast('영상 파일을 선택해 주세요.'); fileInput.value=''; return; }
  if (file.size > 256 * 1024 * 1024) { toast('로컬 미리보기는 256MB 이하 영상만 지원합니다.'); fileInput.value=''; return; }
  if (videoURL) URL.revokeObjectURL(videoURL);
  videoURL = URL.createObjectURL(file); video.src = videoURL; video.hidden = false;
  $('#rh-video-status').textContent = '이 페이지에서만 미리보기 · 서버 전송·파일 저장 없음';
});
$('#rh-video-preview')?.addEventListener('error',()=>toast('이 브라우저에서 재생할 수 없는 영상입니다. 다른 코덱의 영상을 선택해 주세요.'));
window.addEventListener('pagehide',()=>{ if(videoURL) URL.revokeObjectURL(videoURL); });
applyScenarioContent();
carryPageContext();
restoreFields();
initPresenter();
for (const id of ['segmentStart', 'segmentEnd']) {
  const input = $('#'+id);
  if (input) { input.min = '0'; input.step = '0.1'; input.max = '86400'; }
}
render();
initNaverMap(config);
if (!storageAvailable)
  toast("저장된 기록을 읽지 못해 새 진행 상태로 시작합니다.");
