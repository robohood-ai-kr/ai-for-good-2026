import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";
import JSON5 from "json5";
import postcss from "postcss";
import tailwind from "tailwindcss";
import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";
import {
  sectors,
  route,
  screenId,
  escapeHtml as esc,
} from "../apps/shared/catalog.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const selected = process.argv[2] ? [process.argv[2]] : Object.keys(sectors);
if (selected.some((sector) => !sectors[sector]))
  throw new Error("Unknown app. Use manufacturing or small-business.");
const report = {
  version: "v1",
  apps: {},
  externalAssets: [
    "fonts.googleapis.com",
    "fonts.gstatic.com",
    "lh3.googleusercontent.com",
  ],
  notes: [
    "Original export scripts and inline handlers are removed.",
    "Each app is a UI prototype, not a backend implementation.",
  ],
};

const icon = (name) =>
  `<span class="material-symbols-outlined" aria-hidden="true">${name}</span>`;
const links = (sector, numbers) =>
  numbers
    .map(
      (n) =>
        `<a href="${route(sector, n)}"><span>${screenId(sector, n).toUpperCase()}</span>${esc(sectors[sector].names[n - 1])}</a>`,
    )
    .join("");

function toolbar(sector, number) {
  const product = sectors[sector];
  return `<div class="rh-toolbar"><a class="rh-brand" href="./index.html" aria-label="${product.name} 소개">🤖 <span>RoboHood</span></a><span class="rh-sector">${product.name} v1</span><label class="rh-sr-only" for="rh-screen-select">화면 선택</label><select id="rh-screen-select">${product.names.map((name, i) => `<option value="${route(sector, i + 1)}" ${i + 1 === number ? "selected" : ""}>${screenId(sector, i + 1).toUpperCase()} · ${esc(name)}</option>`).join("")}</select><span class="rh-demo-label">UI 데모 · 실제 연동 없음</span><button data-action="screens" aria-label="전체 화면과 사용 안내">${icon("apps")}<span>화면·안내</span></button></div>`;
}

function sidebar(sector, number) {
  return `<aside class="rh-sidebar" id="rh-sidebar"><p class="rh-eyebrow">${sectors[sector].name} WORKSPACE</p><nav aria-label="주 메뉴">${sectors[sector].nav.map(([name, n, i]) => `<a href="${route(sector, n)}" ${n === number ? 'aria-current="page"' : ""}>${icon(i)}${esc(name)}</a>`).join("")}</nav><div class="rh-sidebar-footer"><a href="${route(sector, sector === "manufacturing" ? 17 : 11)}">${icon("smartphone")} 현장 모바일</a><button data-action="role">${icon("account_circle")} <span data-role-label>데모 역할</span></button><small>가상 현장·예시 수치<br>수집 허용 ≠ 데이터 이용 승인</small></div></aside>`;
}

function shellHeader(sector, number) {
  return `<header class="rh-header"><button class="rh-menu" aria-controls="rh-sidebar" aria-expanded="false" data-action="menu" aria-label="메뉴 열기">${icon("menu")}</button><div><span class="rh-breadcrumb">${sectors[sector].name} v1 / ${screenId(sector, number).toUpperCase()}</span><strong>${esc(sectors[sector].names[number - 1])}</strong></div><div class="rh-header-actions"><button data-action="screens" aria-label="화면 검색">${icon("search")}</button><a class="rh-primary" href="${route(sector, sectors[sector].newPage)}">${icon("add")} 새 과제</a><button data-action="role">${icon("account_circle")}<span data-role-label>역할</span></button></div></header>`;
}

function context(sector, number) {
  return `<section class="rh-context" aria-label="데모 기록"><div><span class="rh-kicker">연결된 내 데모 · ${sectors[sector].caseId}</span><strong data-task-title>${esc(sectors[sector].defaultTask)}</strong><p>원본 지표·영상·지도·기술·보상 조건은 미검증 예시입니다. 실제 연동·인증·제휴·지급이 아닙니다. 버튼으로 만든 기록만 이 브라우저에 저장됩니다.</p></div><button data-action="workflow">진행 기록 <span data-session-status>대기</span> ${icon("arrow_forward")}</button></section>`;
}

function controls(sector, number) {
  const config = sectors[sector];
  if (
    (number === 8 && sector === "manufacturing") ||
    (number === 13 && sector === "small-business")
  ) {
    return `<section class="rh-workbench"><h2>수집 데모 조건 확인</h2><p>실제 교육·촬영 허가를 대신하지 않는 UI 테스트입니다. 실제 카메라는 켜지지 않습니다.</p><div class="rh-gates">${["교육·과제 적격 확인", "촬영 구역·현장 허용 확인", "안전 조건·감독자 확인", "수행 범위·예상 시간 확인", "보상·보완 조건 확인"].map((name, i) => `<label><input type="checkbox" data-gate="${i}"> ${name}</label>`).join("")}</div><p data-gate-status role="status"></p><button class="rh-primary" data-action="start">조건 확인 후 데모 수집 시작</button><button data-action="workflow">세션 기록 보기</button></section>`;
  }
  if (number === config.reviewPage)
    return `<section class="rh-workbench"><h2>내 데모 세션 검수</h2><p>원본 화면의 샘플과 별개로, 이 브라우저에서 제출한 기록을 검수합니다. 실제 파일 품질 검사는 아닙니다.</p><p data-review-status role="status"></p><label>보완 사유<textarea id="rh-review-reason" placeholder="예: 작업 구간 표시를 다시 확인해 주세요."></textarea></label><div class="rh-actions"><button data-action="rework">보완 요청 기록</button><button class="rh-primary" data-action="approve">데모 세션 승인</button></div></section>`;
  if (number === config.accessPage)
    return `<section class="rh-workbench"><h2>내 데모 데이터 이용 승인</h2><p>수집 허용과 별도 절차입니다. 평가 목적만 모의 승인하며 실제 파일 접근 권한은 발급하지 않습니다.</p><p data-access-status role="status"></p><div class="rh-actions"><button data-action="request-access">평가 목적 이용 신청</button><button data-action="grant-access">운영팀 모의 승인</button><button class="rh-primary" data-action="export-demo">승인된 데모 기록 JSON</button></div></section>`;
  return "";
}

function visibleText($, element) {
  const clone = $(element).clone();
  clone.find(".material-symbols-outlined,svg,.rh-sr-only").remove();
  return clone.text().replace(/\s+/g, " ").trim();
}

function destination(sector, number, text, iconText, id) {
  const c = sectors[sector],
    mf = sector === "manufacturing";
  if (id?.startsWith("card-")) return { action: "set-role", role: id.slice(5) };
  if (number === 2 && /진입하기|워크스페이스 진입|권한으로 진입/.test(text))
    return { action: "enter" };
  if (/과제 등록.*요청|타겟 재수집 과제 생성/.test(text))
    return { action: number === 16 && mf ? "recollect" : "create-task" };
  if (/임시 저장|변경 사항 저장/.test(text)) return { action: "save" };
  if (/필터 초기화|^초기화$|입력값 초기화/.test(text))
    return { action: "reset-fields" };
  if (id === "btn-run-sim" || /시험 실행|가상 환경 재평가/.test(text))
    return { action: "simulate" };
  if (
    /긴급 작업 중단|즉시 중단|가상 E-Stop|수집 일시 중지|시뮬레이터 일시 정지/.test(
      text,
    )
  )
    return { action: "stop" };
  if (/보완 수집 재시작/.test(text)) return { page: 12 };
  if (/수집 시작 \(세션 개시\)/.test(text)) return { action: "start" };
  if (/세션 종료 및 업로드|세션 완료 및 데이터 제출/.test(text))
    return { action: "submit" };
  if (/검수 승인|검수 최종 승인/.test(text)) return { action: "approve" };
  if (/보완 요청 전송|사유 작성 후 보완 요청/.test(text))
    return { action: "rework" };
  if (id === "shutter-btn" || id === "submit-next-btn")
    return { action: "capture" };
  if (
    mf &&
    number === 8 &&
    /정상 표면|미세 스크래치|버\/이물|판정 보류/.test(text)
  )
    return { action: "label" };
  if (!mf && number === 13 && /^[1-4]\s/.test(text)) return { action: "mark" };
  if (/다운로드|내보내기|PDF|엑셀|증명서|수료증|발행|출력|Export/.test(text))
    return { action: "download-info" };
  if (/^복사$/.test(text)) return { action: "copy" };
  if (
    /OTP|SSO|FIDO2|실증 연구 협약|개인정보|이용약관|산안법|보안 지침|인증 사양/.test(
      text,
    )
  )
    return { action: "info" };
  if (/미이수 교육 이어보기|수강 신청|보수 교육/.test(text))
    return { page: mf ? 18 : 10 };
  if (/워크스페이스|데모 작업공간|시작하기/.test(text) && number === 1)
    return { page: 2 };
  if (/데모 둘러보기/.test(text)) return { page: 3 };
  if (/현장 데이터 수집 시작/.test(text)) return { page: mf ? 17 : 11 };
  if (
    /신규 (과제|작업)|새 과제|이 현장에.*수집 요청|재수집 요청 생성/.test(text)
  )
    return { page: c.newPage };
  const explicit = text.match(
    new RegExp(`${c.prefix.toUpperCase()}[- ](\\d{2})`),
  );
  if (explicit) return { page: Number(explicit[1]) };
  if (/^서비스 소개$|^RoboHood$|^홈$/.test(text)) return { page: 1 };
  if (/^개요$|작업 공간 개요/.test(text)) return { page: 3 };
  if (/현장 탐색|실증 모의셀 탐색/.test(text)) return { page: mf ? 21 : 4 };
  if (/현장 조건 보기/.test(text)) return { page: 5 };
  if (/^(현장 과제|수집 과제)$|과제 둘러보기/.test(text))
    return { page: mf ? 4 : 6 };
  if (
    /인력|매칭|^교육·현장 인력$/.test(text) &&
    /보기|배정|매칭|^현장 인력$/.test(text)
  )
    return { page: mf ? 7 : 9 };
  if (/인력 배정 확정|배정 승인|배정 선택/.test(text))
    return { action: "assignment" };
  if (
    /^데이터$|^데이터셋$|데이터셋 확인|전체 데이터 파이프라인|데이터 브라우저/.test(
      text,
    )
  )
    return { page: mf ? 10 : 16 };
  if (
    /데이터셋 보기|데이터셋 버전|상세 및 버전|버전 이력|연동 데이터셋/.test(
      text,
    )
  )
    return { page: c.datasetPage };
  if (
    /이용 신청|이용 권한|접근.*(라이선스|이용)|이용 승인|접근 승인/.test(text)
  )
    return { page: c.accessPage };
  if (/^모델$/.test(text)) return { page: 12 };
  if (/^장비$/.test(text)) return { page: 13 };
  if (/^배포·관제$|적용 및 시험 이력/.test(text)) return { page: 14 };
  if (/관제 피드|세션 모니터링/.test(text)) return { page: mf ? 15 : 13 };
  if (/검수 시작|수집 데이터 검수|^검수$|영상 확인/.test(text))
    return { page: c.reviewPage };
  if (/^설정$|내 정보/.test(text)) return { page: 20 };
  if (/^작업함$|작업함으로/.test(text)) return { page: mf ? 17 : 11 };
  if (/^수집$/.test(text)) return { page: mf ? 8 : 12 };
  if (/^경력$|^교육$/.test(text)) return { page: mf ? 18 : 10 };
  if (/수행·보상|내 이력|완료 및 보상/.test(text)) return { page: 18 };
  if (/조건 (검토 및 수락|확인 및 수락)/.test(text))
    return { page: mf ? 8 : 12 };
  if (/보완 확인|보완 내역|조건 재검토/.test(text))
    return { page: mf ? 16 : 14 };
  if (/상세\s?보기|상세 내역|세부 내용|과제 로그|상세 검토/.test(text))
    return { page: c.taskPage };
  if (
    /^이전$|^다음$|^\d+$|^(전체|진행 중|수락 대기|완료 내역|적격|검수 승인|모의 지급 대기|지급 확인 완료)/.test(
      text,
    )
  )
    return { action: "filter-tab" };
  if (/arrow_back|chevron_left/.test(iconText) && !text)
    return { action: "back" };
  if (/menu/.test(iconText) && !text) return { action: "menu" };
  return { action: "info" };
}

function sanitizeText($) {
  const replacements = [
    [/KRDS 접근성 지침 2\.1 준수/g, "접근성 검증 예정"],
    [/KRDS 준수|KRDS compliant/gi, "접근성 목표 (미검증)"],
    [
      /산업안전보건법\s*(?:제)?31조(?:를 준수하는| 준수|에 따른| 안전보건교육)?/g,
      "현장별 안전 기준(별도 확인)",
    ],
    [/산안법 제31조[^.。\n<]{0,25}/g, "현장 안전 기준 별도 확인"],
    [/K-SEC-Level3|Level-3 자격 승인/g, "데모 역할 표시"],
    [/실시간 비식별화 블러 가동 중/g, "비식별화 UI 예시 · 미연동"],
    [/Isaac Sim 4\.0/g, "브라우저 모의 환경"],
    [/E-Stop 안전 인증/g, "정지 UI 예시"],
    [/AI 1차 피드백: 정상 동작/g, "구간 판정 예시 · AI 미연동"],
    [/법정 유급 수당 보장|유급 수당 보장/g, "유급 보상 조건 예시"],
    [
      /법정 최저임금 대비 \+190% 가산 실무 전문 단가 산정/g,
      "모의 보상 단가 · 실제 금액은 별도 합의",
    ],
    [/지급 보증 완료/g, "모의 보상 조건"],
    [/영업 손실 및 고용 책임 전무/g, "현장 제공·운영 책임 사전 합의"],
    [/검수 합격 시 유급 보상 지급/g, "작업·보완 시간의 보상 조건 합의"],
    [/고객 초상권 자동 마스킹 파이프라인/g, "개인정보 노출 확인 · 자동 마스킹 미연동"],
    [/실증 R&D 혁신 바우처 예산 직할 정산/g, "모의 예산 · 실제 지원금 미확보"],
    [
      /등록 완료 시 매칭 인력 후보 3명에게 공고 알림이 즉시 발송됩니다\./g,
      "데모에서는 인력 공고나 알림을 발송하지 않습니다.",
    ],
    [/v1\.4\.2 \(LTS\)/g, "v1 · UI 데모"],
    [
      /검수 결재는 FDE 자격 인증을 보유한 전문 검수 책임자에 의해서만 승인됩니다\./g,
      "검수는 지정 검수 담당자가 수행하며, 현장 적용 FDE의 업무와 구분합니다.",
    ],
    [/(?:0\d{1,2})-\d{3,4}-\d{4}/g, "연락처 미등록(데모)"],
    [/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g, "demo@example.invalid"],
  ];
  function rewrite(value) {
    for (const [pattern, replacement] of replacements)
      value = value.replace(pattern, replacement);
    return value;
  }
  $("body *")
    .contents()
    .filter((_, node) => node.type === "text")
    .each((_, node) => {
      node.data = rewrite(node.data);
    });
  $("input[value]").each((_, node) =>
    $(node).attr("value", rewrite($(node).attr("value"))),
  );
}

for (const sector of selected) {
  const product = sectors[sector];
  const output = path.join(root, "dist", sector);
  await mkdir(path.join(output, "assets"), { recursive: true });
  for (const file of ["app.mjs", "state.mjs", "app.css"])
    await copyFile(
      path.join(root, "apps/shared", file),
      path.join(output, "assets", file),
    );
  report.apps[sector] = [];
  for (let number = 1; number <= product.names.length; number++) {
    const id = screenId(sector, number);
    const original = await readFile(
      path.join(root, "design/stitch/v1", sector, id, "code.html"),
      "utf8",
    );
    const $ = load(original);
    const configText = $("#tailwind-config")
      .text()
      .trim()
      .replace(/^tailwind\.config\s*=\s*/, "")
      .replace(/;\s*$/, "");
    const config = JSON5.parse(configText); // Parse a data literal; never execute code from the ZIP.
    if (!config.theme?.extend)
      throw new Error(`Missing Tailwind configuration: ${id}`);
    const exportStyle = $("style")
      .map((_, node) => $(node).text())
      .get()
      .join("\n");
    const scriptCount = $("script").length;
    $("script, iframe, object, embed, base, meta[http-equiv], style").remove();
    let handlerCount = 0;
    $("*").each((_, node) => {
      for (const attr of Object.keys(node.attribs ?? {})) {
        if (/^on/i.test(attr)) {
          $(node).removeAttr(attr);
          handlerCount++;
        }
      }
    });
    $("link").each((_, node) => {
      const href = $(node).attr("href") ?? "";
      if (
        !href.startsWith("https://fonts.googleapis.com") &&
        !href.startsWith("https://fonts.gstatic.com")
      )
        $(node).remove();
    });
    $('link[href*="fonts.googleapis.com/css"]')
      .not('[href*="Material+Symbols"]')
      .remove();
    const seen = new Set();
    $("link").each((_, node) => {
      const href = $(node).attr("href");
      if (seen.has(href)) $(node).remove();
      else seen.add(href);
    });
    $("head").append(
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap">',
    );
    $("img").each((_, node) => {
      const el = $(node),
        src = el.attr("src") ?? "";
      if (!src.startsWith("https://lh3.googleusercontent.com/"))
        el.removeAttr("src");
      if (!el.attr("alt")) el.attr("alt", "Stitch 생성 예시 이미지");
      el.attr("referrerpolicy", "no-referrer");
    });
    $("form").removeAttr("action").attr("data-demo-form", "true");
    $('input[type="password"]')
      .attr("readonly", "")
      .attr("aria-label", "실제 로그인 없음 · 데모 표시")
      .attr("value", "")
      .attr("placeholder", "실제 비밀번호를 입력하지 마세요");
    sanitizeText($);
    if (sector === "small-business" && number === 1) {
      const hero = $("main>section").first().addClass("rh-landing-hero");
      hero.children("div").first().addClass("rh-hero-intro");
      hero.children("div").last().addClass("rh-hero-summary");
    }
    if (sector === "small-business" && number === 12) {
      const names = [
        "교육·과제 적격 확인",
        "촬영 구역·현장 허용 확인",
        "안전 조건 확인",
        "수행 범위·예상 시간·감독자 확인",
        "보상·보완 조건 확인",
      ];
      const descriptions = [
        "필수 교육과 과제별 모의 평가 이수를 확인하는 데모입니다.",
        "고객·직원이 없는 모의 구역에서 허용된 물체만 촬영합니다.",
        "고온·화기·날붙이·가동 설비를 포함하지 않는 저위험 작업인지 확인합니다.",
        "예상 시간과 수행 범위, 감독자·중단 경로가 합의되었는지 확인합니다.",
        "준비·수집·보완 시간의 모의 보상 조건을 확인합니다. 실제 지급은 없습니다.",
      ];
      $("main article").each((index, node) => {
        const card = $(node).attr("data-gate-card", index);
        card
          .children("div")
          .first()
          .html(
            `<input type="checkbox" data-gate="${index}" aria-label="${names[index]}" style="width:20px;height:20px;accent-color:#2563eb">`,
          );
        const textBlock = card.children("div").last();
        textBlock
          .children("div")
          .first()
          .children("span")
          .first()
          .text(`${index + 1}. ${names[index]}`);
        textBlock
          .children("div")
          .first()
          .children("span")
          .last()
          .attr("data-gate-badge", index)
          .text("미확인");
        textBlock.children("p").first().text(descriptions[index]);
      });
      $("main section")
        .filter((_, node) => $(node).text().includes("4 / 5 항목"))
        .html('<p data-gate-status role="status">0/5 확인</p>');
      $("main section")
        .filter((_, node) => $(node).find("h4").length > 0)
        .html(
          '<p data-gate-status role="status">모든 조건 확인 전 수집을 시작할 수 없습니다.</p>',
        );
      $("button[disabled]").next("p").attr("data-gate-status", "");
    }
    const mobile = product.mobile.includes(number);
    const workspace = number > 2 && !mobile;
    if (workspace) {
      const main = $("main").first();
      if (!main.length) throw new Error(`Missing main region: ${id}`);
      const footer = $("footer")
        .filter((_, node) => !$(node).closest("main").length)
        .addClass("rh-export-footer")
        .toString();
      const content = main.html() + footer;
      $("body")
        .html(
          `${shellHeader(sector, number)}${sidebar(sector, number)}<main class="rh-main" id="rh-main">${context(sector, number)}${controls(sector, number)}<div class="rh-export-content">${content}</div></main>`,
        )
        .attr("class", "rh-workspace");
      $("[data-location]").each((_, node) => {
        $(node).addClass("rh-map");
        $(node)
          .closest("section")
          .addClass("rh-map-section")
          .parent()
          .addClass("rh-map-layout");
      });
    } else {
      $("body").addClass(mobile ? "rh-mobile" : "rh-public");
      $("main").first().attr("id", "rh-main");
      if (mobile) $("main").first().prepend(controls(sector, number));
      $("main")
        .first()
        .prepend(
          '<div class="rh-source-note">Stitch UI 시안 · 화면의 수치·기술·보상·인증은 미검증 예시이며 실제 운영 상태가 아닙니다.</div>',
        );
      $("#qr-modal,#sim-modal").remove();
    }
    let routes = 0,
      actions = 0;
    $('a,button,[id^="card-"]').each((_, node) => {
      const el = $(node);
      if (el.attr("data-action") || (el.attr("href") ?? "").startsWith("./"))
        return;
      const text = visibleText($, node),
        iconText = el.find(".material-symbols-outlined").text();
      const target = destination(sector, number, text, iconText, el.attr("id"));
      if (node.tagName === "button") el.attr("type", "button");
      if (!text && !el.attr("aria-label"))
        el.attr(
          "aria-label",
          el.attr("title") ||
            ({
              notifications: "알림",
              help: "도움말",
              search: "검색",
              more_vert: "추가 메뉴",
              chevron_right: "다음",
              chevron_left: "이전",
              close: "닫기",
            }[iconText.trim()] ??
              "화면 동작 안내"),
        );
      if (target.page && !el.is("[disabled]")) {
        const href = route(sector, target.page);
        if (node.tagName === "a") el.attr("href", href);
        else el.attr("data-route", href);
        routes++;
      } else {
        const href = el.attr("href");
        if (
          href?.startsWith("#") &&
          href.length > 1 &&
          $("[id]")
            .toArray()
            .some((n) => n.attribs.id === href.slice(1))
        )
          return;
        el.removeAttr("href").attr("data-action", target.action ?? "info");
        if (node.tagName === "a" || target.role)
          el.attr("role", "button").attr("tabindex", "0");
        if (target.role) el.attr("data-role", target.role);
        el.attr("data-label", text || el.attr("aria-label") || "추가 기능");
        actions++;
      }
    });
    // Wire list rows without swallowing their nested controls.
    if ([sector === "manufacturing" ? 4 : 6].includes(number))
      $("tbody tr")
        .attr("data-route", route(sector, product.taskPage))
        .attr("tabindex", "0")
        .attr("role", "link");
    $("h3").each((_, node) => {
      const card = $(node)
        .parents("article,div")
        .filter((_, parent) =>
          /border.*rounded|rounded.*border/.test(parent.attribs.class ?? ""),
        )
        .first();
      if (card.length) card.attr("data-search-item", "");
    });
    if (sector === "small-business" && number === 4)
      $("input[type=checkbox]").attr("data-hide-map", "");
    $("input,select,textarea").each((index, node) => {
      const el = $(node);
      if (el.attr("data-gate") !== undefined) return;
      el.attr("data-field", el.attr("id") || `${node.tagName}-${index}`);
      if (
        !el.attr("aria-label") &&
        !el.attr("id") &&
        !el.closest("label").length
      )
        el.attr(
          "aria-label",
          el.attr("placeholder") ||
            `${node.tagName === "select" ? "조건 선택" : "입력 항목"} ${index + 1}`,
        );
      if (
        el.attr("id") &&
        !$(`label[for="${el.attr("id")}"]`).length &&
        !el.closest("label").length &&
        !el.attr("aria-label")
      )
        el.attr("aria-label", el.attr("placeholder") || el.attr("id"));
      if (/검색/.test(el.attr("placeholder") ?? ""))
        el.attr("data-search", "true").attr("autocomplete", "off");
    });
    $("title").text(
      `RoboHood ${product.name} v1 · ${product.names[number - 1]}`,
    );
    $('meta[name="viewport"]').attr(
      "content",
      "width=device-width, initial-scale=1.0",
    );
    $("html").attr("lang", "ko").removeClass("dark");
    $("body").prepend(
      `<a class="rh-skip" href="#rh-main">본문으로 이동</a>${toolbar(sector, number)}`,
    );
    $("body").append(
      '<dialog id="rh-dialog" aria-labelledby="rh-dialog-title"><div class="rh-dialog-head"><h2 id="rh-dialog-title"></h2><button data-action="close-dialog" aria-label="닫기">✕</button></div><div id="rh-dialog-body"></div></dialog><div id="rh-toast" role="status" aria-live="polite" hidden></div>',
    );
    $("head").prepend(
      "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://lh3.googleusercontent.com; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'\">",
    );
    $("head").append(
      `<link rel="stylesheet" href="./assets/${id}.css"><link rel="stylesheet" href="./assets/app.css">`,
    );
    const payload = { sector, number, id, mobile, ...product };
    $("body").append(
      `<script type="application/json" id="rh-config">${JSON.stringify(payload).replaceAll("<", "\\u003c")}</script><script type="module" src="./assets/app.mjs"></script>`,
    );
    const html = $.html();
    config.content = [{ raw: html, extension: "html" }];
    config.plugins = [forms, containerQueries];
    for (const key of Object.keys(config.theme.extend.fontFamily ?? {}))
      config.theme.extend.fontFamily[key] = [
        "Noto Sans KR",
        "system-ui",
        "sans-serif",
      ];
    const css = await postcss([tailwind(config)]).process(
      `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n${exportStyle}`,
      { from: undefined },
    );
    await writeFile(path.join(output, "assets", `${id}.css`), css.css);
    await writeFile(path.join(output, `${id}.html`), html);
    if (number === 1) await writeFile(path.join(output, "index.html"), html);
    report.apps[sector].push({
      screen: id,
      title: product.names[number - 1],
      mobile,
      routes,
      actions,
      removedScripts: scriptCount,
      removedHandlers: handlerCount,
    });
  }
  const list = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${product.name} v1 화면 목록</title><link rel="stylesheet" href="./assets/app.css"></head><body class="rh-hub"><main><a href="./index.html">← ${product.name} 앱</a><h1>${product.name} v1 · 전체 화면</h1><p>${product.description}</p><div class="rh-screen-list">${links(
    sector,
    product.names.map((_, i) => i + 1),
  )}</div></main></body></html>`;
  await writeFile(path.join(output, "screens.html"), list);
}

const hub = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RoboHood · 두 가지 v1</title><link rel="stylesheet" href="./${selected[0]}/assets/app.css"></head><body class="rh-hub"><main><div class="rh-kicker">ROBOHOOD / STITCH PROTOTYPES</div><h1>현장의 데이터를,<br>다음 기회로.</h1><p class="rh-hub-intro">제조업과 소상공인. 서로 다른 현장을 위한 두 개의 v1 앱입니다.<br>내보낸 화면을 이어 붙인 탐색·입력·상태 전이 데모를 확인해 보세요.</p><div class="rh-hub-grid">${selected.map((sector) => `<article><span class="rh-hub-icon">${sector === "manufacturing" ? "⚙" : "☕"}</span><span class="rh-kicker">${sector === "manufacturing" ? "MANUFACTURING" : "LOCAL BUSINESS"} / v1</span><h2>${sectors[sector].name}</h2><p>${sectors[sector].description}</p><div class="rh-hub-meta">${sectors[sector].names.length}개 화면 · 모바일 ${sectors[sector].mobile.length}개</div><div class="rh-actions"><a class="rh-primary" href="./${sector}/index.html">앱 열기 →</a><a href="./${sector}/screens.html">화면 목록</a></div></article>`).join("")}</div><p class="rh-hub-note">UI 프로토타입 · 실제 인증, 데이터 업로드, AI 모델, 로봇, 지급 미연동<br>원본 ZIP·HTML·PNG는 별도 보존했습니다. Google Fonts 및 Stitch 이미지에는 네트워크 연결이 필요합니다.</p></main></body></html>`;
await writeFile(path.join(root, "dist/index.html"), hub);
await writeFile(
  path.join(root, "dist/build-report.json"),
  JSON.stringify(report, null, 2),
);
console.log(
  `Built ${selected.map((s) => `${s}: ${report.apps[s].length} screens`).join(", ")} → dist/`,
);
