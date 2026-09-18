// Image-to-code composition layer. References remain immutable; live demo state
// is never replaced with the successful/example values printed in the images.
import { escapeHtml as e, route } from '../shared/catalog.mjs';
import { extendedContent } from './fidelity-pages.mjs';
import { referenceArt, scenePhoto } from './reference-art.mjs';

export function fidelityContent(sector, number, h) {
  const {c,s,icon,badge,status,card,button,link,notice,field,rows,photo,caseTag,taskTitle,journey,gates,sceneMap,scenarioText} = h;
  const mf = sector === 'manufacturing';
  const shortTitle = `<span data-task-short>${mf?'소형 부품 외관 검사':scenarioText('title')}</span>`;
  const actions = content => `<div class="rh-actions">${content}</div>`;
  const roundIcon = name => `<span class="rh-round-icon">${icon(name)}</span>`;
  const meta = entries => `<dl class="rh-compact-details">${entries.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
  const metric = (label,value,name,description) => card('',`${roundIcon(name)}<div><p>${label}</p><strong class="rh-metric">${value}</strong><small>${description}</small></div>`);
  const plainMetric = (label,value,description) => card('',`<p>${label}</p><strong class="rh-metric">${value}</strong><small>${description}</small>`);
  const roles = () => `<div class="rh-grid three rh-partner-cards">${[
    ['요청 기업','필요한 데이터 정의','현장의 문제를 해결하기 위한 데이터를 요청합니다.','assignment'],
    [mf?'제조 현장':'소상공인','허용된 현장 제공','동의한 범위 내에서 현장을 제공하고 협력합니다.','explore'],
    ['청년 현장 전문인력','교육 후 유급 수집','교육을 이수하고, 현장에서 데이터를 수집합니다.','groups'],
  ].map(([t,k,d,i],n)=>card('',`${!mf?`<span class="rh-partner-art">${referenceArt('small-business',3,n,'illustration')}</span>`:roundIcon(i)}<div><h3>${t}</h3><strong>${k}</strong><p>${d}</p></div>`)).join('')}</div>`;
  const participants = () => `<div class="rh-participants">${[
    ['요청','AI 연구팀','데이터 수집 목적과 요구 사항을 정의합니다.','assignment'],
    ['수집','로컬 수집팀','현장에서 데이터를 수집하고 관리합니다.','groups'],
    ['적용','현장 적용 FDE','검수된 데이터의 현장 적용을 확인합니다.','precision_manufacturing'],
  ].map(([k,t,d,i],n)=>`<div><strong>${k}</strong><div><span class="rh-portrait">${referenceArt('manufacturing',3,n,'illustration')}</span><section><h3>${t}</h3><p>${d}</p></section></div></div>`).join('')}</div>`;
  const linked = () => `<div class="rh-grid three rh-linked rh-evidence-cards">${[
    ['데이터셋','RGB 이미지','소형 부품의 다양한 각도에서 촬영한 RGB 이미지의 기록을 관리합니다.',11,'dataset','출처와 버전 확인'],
    ['모델','평가 방식 미정','수집된 데이터로 적합한 모델과 평가 방식을 검토할 예정입니다.',12,'neurology','모델 후보 검토'],
    ['장비','브라우저 모의 UI','별도 장비 설치 없이 브라우저에서 검수할 수 있는 모의 환경입니다.',13,'monitoring','모의 환경 확인'],
  ].map(([t,k,d,n,i,f])=>`<a class="rh-card" href="./mf-${String(n).padStart(2,'0')}.html"><div class="rh-evidence-head">${roundIcon(i)}<div><h3>${t}</h3><strong>${k}</strong><p>${d}</p></div></div><span class="rh-evidence-footer">${icon(i)}${f}${icon('arrow')}</span></a>`).join('')}</div>`;
  const reviewChecks = () => `<div class="rh-check-list rh-review-checks">${(mf?[
    ['부품 식별','대상 부품이 명확하게 식별되는가'],['촬영 조건','초점·밝기·흔들림이 적절한가'],['라벨 초안','기록한 라벨이 적절한가'],['허용 범위','합의한 수집 범위 내의 기록인가'],
  ]:[['손·물체 식별','손과 작업 물체가 명확하게 보이는가'],['구간 라벨','시작·끝과 작업 내용이 일치하는가'],['개인정보 노출','얼굴·주소 등 개인정보가 없는가'],['촬영 조건','합의한 범위와 촬영 조건을 준수했는가']]).map(([t,d],i)=>`<label><input type="checkbox" data-field="reviewCheck${i}"><span><strong>${t}</strong><small>${d}</small></span></label>`).join('')}</div>`;
  const previewTimeline = () => `<section class="rh-preview-timeline"><div class="rh-title-line"><h3>작업 구간 구성</h3>${badge('설명용 예시')}</div><div class="rh-segment-example"><span>${scenarioText('step1')}</span><span>${scenarioText('step2')}</span><span>${scenarioText('step3')}</span></div><p class="rh-hint">실제 구간은 아래 수집 기록에서 확인합니다.</p></section>`;
  switch (s.kind) {
    case 'overview': {
      const next = mf?[
        ['촬영 조건 확인','조명, 배경, 촬영 거리 등을 확인합니다.'],['수집 세션 검수','수집된 이미지의 품질을 검토합니다.'],['이용 승인 확인','데이터 이용 범위와 권한을 확인합니다.'],
      ]:[['작업 구간 검수','지정된 구간의 영상과 작업 내용을 확인합니다.'],['준비·보완 시간 확인','추가 촬영이나 보완이 필요한지 확인합니다.'],['보상 조건 확인','과제에 설정된 보상 조건을 다시 확인합니다.']];
      if (!mf) {
        const operatingFlow = [
          ['현장 업무','explore'],['청년 수집','groups'],['독립 검수','fact_check'],['데이터셋','dataset'],
        ].map(([t,i],n)=>`<section>${roundIcon(i)}<div><small>0${n+1}</small><strong>${t}</strong></div></section>`).join('');
        const collectionStatus = `<div class="rh-collection-status"><section><span>수집</span><strong>${status('session')}</strong></section><section><span>기록</span><strong>${status('markCount')}건</strong></section><section><span>검수</span><strong>${status('review')}</strong></section><span class="rh-sr-only">검수 대기 ${status('pendingReview')}</span></div>`;
        return `<section class="rh-card rh-collection-visual"><div class="rh-collection-visual-top"><div class="rh-collection-visual-media">${photo(false)}</div><div class="rh-collection-visual-copy">${caseTag(c)}<h2>${shortTitle}</h2><p class="rh-collection-lead">현장의 작업을 촬영하고, 구간을 기록해 검수 가능한 데이터로 만듭니다.</p>${collectionStatus}${actions(link(sector,13,'현장 수집 열기 →',true)+link(sector,c.reviewPage,'검수 화면'))}</div></div><div class="rh-collection-pipeline">${journey(sector)}</div></section><div class="rh-operation-strip">${operatingFlow}</div>`;
      }
      const metrics = `<div class="rh-grid three rh-metrics rh-icon-metrics">${metric('진행 과제','1','assignment','단일 과제 흐름')}${metric('검수 대기',status('pendingReview'),'fact_check','브라우저 진행 상태')}${metric('이용 승인 대기',status('pendingAccess'),'groups','평가 목적 별도 승인')}</div>`;
      return `${metrics}<div class="rh-grid main-side rh-overview-grid">${card('',`<div class="rh-case-heading"><h2>${shortTitle}</h2>${badge('제조업 중심')}</div>${caseTag(c)}${journey(sector)}${participants()}`,'rh-case-card')}${card('다음 할 일',`<ol class="rh-next-actions">${next.map(([t,d],i)=>`<li><span class="rh-next-number">${i+1}</span><div><strong ${i===0?'data-next-title':''}>${t}</strong><p>${d}</p></div></li>`).join('')}</ol>${link(sector,c.reviewPage,'검수 열기 →',true)}<details class="rh-workflow-details"><summary>진행 기록</summary>${button('내 진행 기록 보기','workflow')}</details>`,'rh-next-card')}</div>${linked()}<div class="rh-boundary-banner">${roundIcon('shield')}<div><strong>청년 현장 전문인력과 FDE는 별도 직무입니다.</strong><p>데이터를 수집하는 역할과 현장에 적용하는 역할은 서로 다른 직무로, 각각의 전문성과 책임이 구분됩니다.</p></div></div>`;
    }
    case 'request': {
      const heading = (n,t,d) => `<div class="rh-number-heading"><span>${n}</span><div><h2>${t}</h2><p>${d}</p></div></div>`;

      if (!mf) return `<form class="rh-grid three rh-request-columns">${card('',`${heading(1,'요청 목적','어떤 현장의 문제를 해결하기 위한 데이터인가요?')}${field('과제명','taskName',c.defaultTask,{required:true,scenarioField:'defaultTask'})}${field('활용 목적','purpose',c.scenarios[c.defaultScenario].purpose,{area:true,scenarioField:'purpose'})}${notice('<strong>활용 범위부터 정합니다.</strong><br>조회·평가, 모델 학습, 외부 공유의 이용 범위는 각각 별도로 합의합니다.')}`)}${card('',`${heading(2,'현장 작업 영상 조건','어떤 영상을, 어떻게 촬영하나요?')}${field('현장','siteName',c.scenarios[c.defaultScenario].site,{scenarioField:'site'})}${field('세션 수','sessionCount','1',{type:'number',required:true})}${field('촬영 조건','captureConditions',c.scenarios[c.defaultScenario].conditions,{area:true,scenarioField:'conditions'})}<div class="rh-request-examples"><h3>촬영 대상 업무</h3><div>${photo(false,'compact')}</div></div>`)}${card('',`${heading(3,'교육·보상 조건','참여하는 분들과 진행 조건을 정합니다.')}${field('수집자 교육','trainingPlan','작업 가이드·안전 교육 사전 협의')}${field('작업 감독','supervisionPlan','운영팀 감독·중단 방법 사전 협의')}${field('보상 조건·비용 부담자','compensationTerms','요청 기업·현장·운영팀 간 준비·수집·보완 조건과 비용 부담자 협의 필요',{area:true})}${notice('동의·안전·시간·보상 조건은 과제를 배정하기 전에 모두 확인합니다.')}${actions(button('임시 저장','save')+button('과제 등록','create-task',true))}`)}</form>`;

      return `<form class="rh-grid main-side rh-request-grid"><div class="rh-form-stack">${card('',`${heading(1,'요청자·활용 목적','어떤 목적으로, 누구를 위해 필요한 데이터인지 작성합니다.')}${field('과제명','taskName',c.defaultTask,{required:true})}${field('활용 목적','purpose',mf?'RGB 외관 판별 평가':'작업 영상의 구간 이해 평가')}`)}${card('',`${heading(2,mf?'현장·RGB 수집 조건':'현장·영상 수집 조건','어떤 현장에서, 어떤 방식으로 데이터를 수집할지 정의합니다.')}${field('현장','siteName',mf?'한빛 정밀 모의 현장':'모의 카페 A')}${field(mf?'요청 이미지 수':'요청 세션 수',mf?'frameCount':'sessionCount','1',{type:'number',required:true})}${field('촬영 조건','captureConditions',mf?'비가동 작업대에서 소형 부품을 촬영합니다. 부품과 조명, 촬영 거리를 사전에 확인합니다.':'고객 없는 모의 공간에서 빈 비파손 컵을 트레이에 정리합니다. 손과 물체만 촬영합니다.',{area:true})}`)}${card('',`${heading(3,'교육·감독·보상','수집 전에 교육·감독·유급 조건을 합의합니다.')}${field('수집자 교육','trainingPlan','작업 가이드와 안전 안내 · 사전 협의')}${field('작업 감독','supervisionPlan','운영팀 감독과 중단 방법 · 사전 협의')}${field('보상 조건','compensationTerms','비용 부담자와 준비·수집·보완 조건 협의 필요',{area:true})}${actions(button('임시 저장','save')+button('과제 등록','create-task',true))}`)}</div>${card('과제 요약',`${caseTag(c)}<h2>${shortTitle}</h2><p>${mf?'한빛 정밀 · RGB 데이터 수집':'모의 카페 A · 1인칭 영상 수집'}</p>${photo(mf,'compact')}${rows([['과제 코드',c.caseId],['데이터 유형',mf?'RGB 이미지':'1인칭 작업 영상'],['활용 목적',mf?'외관 판별 평가':'작업 구간 이해 평가'],['다음 단계','교육·동의·안전·시간·보상 확인']])}${notice('이 과제는 예시입니다. 등록하면 현재 과제가 새로 시작하며, 실제 계약이나 배정은 발생하지 않습니다.')}`,'rh-request-summary')}</form>`;
    }
    case 'review': {
      const sessionCard = card('수집 세션',`<div class="rh-session-id"><strong>S-001 · 수집 세션</strong>${badge(status('review'))}</div>${meta([['과제 코드',mf?c.caseId:scenarioText('caseId')],['현장',mf?'한빛 정밀 현장':scenarioText('site')],['수집 담당',status('collector')],['데이터',mf?'RGB 이미지':scenarioText('dataType')],['작업',mf?'소형 부품 외관 검사':scenarioText('title')],['수집 기록',status('markCount')+'건'],['현재 역할','<span data-role-label></span>']])}${mf?`<div class="rh-sample-strip">${photo(true)}<div><strong>수집 이미지</strong><p>촬영 조건 확인 필요</p></div></div>`:`<h3 class="rh-subsection">작업 설명</h3><p>${scenarioText('scope')}</p>`}${button('역할 변경','role')}`,'rh-session-info');
      const center = card(mf?'이미지 및 라벨 확인':'1인칭 작업 영상',`${photo(mf)}<div class="rh-media-caption"><strong>${mf?'RGB 이미지':'작업 장면'}</strong>${badge('수집 기록')}</div>${mf?'<h3 class="rh-subsection">수집한 라벨 초안</h3>':previewTimeline()}<div data-marks class="rh-records"></div>${notice(mf?'저장된 이미지와 라벨 초안을 기준으로 품질을 확인합니다.':'원본 영상의 접근 권한과 구간 메타데이터를 함께 확인합니다.')}`,'rh-review-media');
      const approveLabel = '승인하고 데이터셋 보기 →';
      const criteria = card('검수 기준',`<p>아래 기준을 확인하고 검수 사유를 남깁니다.</p>${reviewChecks()}<div class="rh-review-result"><h3>검수 결과</h3><p>${status('review')}</p><small>담당자가 검수 후 결정합니다.</small></div>${field('검수·보완 사유','rh-review-reason','',{area:true})}${actions(button('보완 요청','rework')+button(approveLabel,'approve',true))}${notice('승인하면 청년 현장 전문인력의 역할과 분리된 검수 기록을 저장하고 데이터셋 상세로 이동합니다. 이용 승인은 별도입니다.')}`,'rh-review-criteria');
      return `<div class="rh-review-layout">${sessionCard}${center}${criteria}</div>`;
    }
    case 'explorer': {
      const filter = (label,values)=>`<label>${label}<select data-site-filter aria-label="${label}">${values.map(v=>`<option>${v}</option>`).join('')}</select></label>`;
      const filters = card('',`<div class="rh-explorer-filters">${filter(mf?'지역':'생활권',['전체',mf?'제조 권역':'서울 생활권'])}${filter(mf?'공정·업종':'업종',['전체',mf?'금속가공':'음식점',mf?'조립':'동네마트','확장 업종'])}${filter('데이터 유형',mf?['전체','RGB 이미지']:['전체','1인칭 작업 영상','행동 구간'])}${filter('수집 상태',['전체','수집 가능','준비 중'])}</div><div class="rh-explorer-search"><label class="rh-search">${icon('search')}<input type="search" data-search aria-label="현장 검색" placeholder="현장명·업무·데이터 검색"></label><label class="rh-toggle"><input type="checkbox" data-hide-map>지도 숨기기</label></div>`,'rh-filter-card');
      if (!mf) {
        const scenarioCards = Object.entries(c.scenarios).map(([id,item],index)=>{
          const conditions = `<ol><li>${e(item.conditions)}</li><li>${e(item.safety)}</li><li>현장 담당자와 촬영 시간·범위를 사전에 확정합니다.</li></ol>`;
          const conditionBlock = index===0
            ? `<section class="rh-site-conditions"><h3>수집 시 지켜야 할 조건</h3>${conditions}</section>`
            : `<details class="rh-site-conditions rh-site-conditions-collapsible"><summary>수집 조건 보기</summary>${conditions}</details>`;
          return `<article class="rh-card rh-site-item ${index===0?'rh-selected-site':''}" data-search-item data-scenario-card="${id}" data-site-category="${e(item.siteCategory)}" data-site-state="수집 가능"><figure class="rh-photo compact"><img src="./assets/scenarios/${e(item.image)}" alt="${e(item.alt)}"><figcaption>현장 업무 이미지</figcaption></figure><div class="rh-site-description"><div class="rh-title-line"><h3>${e(item.site)}</h3>${badge('수집 가능','blue')}</div><p>${e(item.title)}</p><div class="rh-tags">${badge(e(item.dataType))}${badge('범위 협의 필요')}</div>${conditionBlock}${actions(`<a class="rh-button" href="${route(sector,5)}" data-scenario-link="${id}">현장 상세</a><a class="rh-button rh-primary" href="${route(sector,c.newPage)}" data-scenario-link="${id}">수집 요청</a>`)}</div></article>`;
        }).join('');
        const examples = `<article class="rh-card rh-site-item rh-site-placeholder" data-search-item data-site-category="확장 업종" data-site-state="준비 중"><span class="rh-icon-tile">${icon('dataset')}</span><div><h3>그 밖의 소상공인 현장</h3><p>전통시장·세탁소·숙박업·점주 교육·장인 기술 기록</p><div class="rh-tags">${badge('데이터셋 사례')}${badge('준비 중')}</div>${actions(link(sector,c.datasetPage-1,'데이터셋 목록에서 보기'))}</div></article>`;
        const list = `<section class="rh-site-list"><div class="rh-site-list-heading"><h2>현장 목록 <span>3</span></h2><small>업종별 수집 가능 현장</small></div>${scenarioCards}${examples}${notice('식당과 동네마트는 전체 수집 흐름을 제공합니다. 다른 업종은 순차적으로 연결됩니다.')}</section>`;
        return `<div class="rh-map-layout"><div class="rh-local-map-panel">${filters}${sceneMap(false)}</div>${list}</div>`;
      }
      const sites = [mf?'한빛 정밀 모의 현장':'모의 카페 A',...(mf?['모의 금속가공 현장 B','모의 조립 현장 C']:['모의 베이커리 B','모의 서점 C'])];
      const list = `<section class="rh-site-list"><div class="rh-site-list-heading"><h2>현장 목록 <span>3</span></h2><small>위치 예시 · 실제 모집 아님</small></div>${sites.map((name,i)=>`<article class="rh-card rh-site-item ${i===0?'rh-selected-site':''}" data-search-item data-site-category="${i===0?(mf?'금속가공':'카페'):i===1?(mf?'금속가공':'베이커리'):mf?'조립':'기타'}" data-site-state="${i===0?'협의 필요':'협의 전'}">${i===0?photo(mf,'compact'):!mf?scenePhoto(sector,number,'compact',i):`<div class="rh-site-thumb">${icon(i===2?'assignment':'explore')}<small>모의 현장</small></div>`}<div class="rh-site-description"><div class="rh-title-line"><h3>${name}</h3>${badge(i===0?'선택':'협의 전',i===0?'blue':'')}</div><p>${i===0?(mf?'소형 부품 외관 검사 · 비가동 작업대':'트레이 위 컵 정리 · 모의 실습 공간'):'수집 조건·허용 업무 미정'}</p><div class="rh-tags">${badge(i===0?(mf?'RGB 이미지':'1인칭 영상'):'조건 미정')}${badge(i===0?'범위 협의 필요':'미모집')}</div>${mf&&i===0?'<section class="rh-site-conditions"><h3>수집 시 지켜야 할 조건</h3><ol><li>비가동 작업대와 허용된 부품만 촬영합니다.</li><li>가동 설비 조작·위험 공정·작업자 얼굴은 제외합니다.</li><li>현장 담당자와 촬영 범위·조명·감독 조건을 사전에 확정합니다.</li></ol></section>':!mf&&i===0?'<section class="rh-site-conditions"><h3>수집 시 지켜야 할 조건</h3><ol><li>동의한 범위에서 손과 물체만 촬영</li><li>빈 비파손 컵과 트레이만 사용</li><li>고객·얼굴·개인정보 촬영 금지</li></ol></section>':''}${i===0?actions(link(sector,mf?6:5,'현장 상세')+link(sector,c.newPage,'수집 요청',true)):'<p class="rh-hint">탐색 화면의 배치 예시입니다.</p>'}</div></article>`).join('')}${notice('지도 표시는 모의 위치 예시이며 실제 사업장 위치·모집 현황·협약을 나타내지 않습니다. 선택된 한 개 과제만 서비스 흐름에서 연결됩니다.')}</section>`;
      return `<div class="rh-map-layout"><div class="rh-local-map-panel">${filters}${mf?regionMap():sceneMap(false)}</div>${list}</div>`;
    }
    default: return extendedContent(sector, number, {...h, shortTitle, actions, roundIcon, meta, roles, participants, linked});
  }
}

function regionMap() {
  // Deliberately schematic: no precise location, real site, or map attribution claim.
  return `<div class="rh-map rh-region-map" role="img" aria-label="제조 권역 탐색을 위한 가상 배치도. 실제 좌표가 아닙니다."><svg viewBox="0 0 560 680" aria-hidden="true"><rect width="560" height="680" fill="#e7f0f7"/><g stroke="#b6c5d4" stroke-width="1.5" fill="#f7fafb"><path d="m304 40 20 45 29 39 24 65 35 59 37 86-8 91-33 59-40 68-43 29-24-23-35 40-42-14-23-23 14-47-33-30 27-35-28-34 9-45-31-15 35-38-22-35 26-49 15-28 18-18 12-69 25-27z"/><path d="m243 149 82 30 52 10m-144 48 85 10 75-30m-153 103 91-26 89 17m-190 76 74 12 131-25m-209 79 79 19 110-35m-63-355-22 88 16 76-42 89 30 82-6 77m-58-158-20 112 17 82" fill="none"/><path d="m188 621 39-12 24 11-23 18-35-2z"/></g><g fill="#8495a9" font-size="16" text-anchor="middle"><text x="264" y="221">수도권</text><text x="351" y="207">강원권</text><text x="279" y="318">충청권</text><text x="373" y="350">영남권</text><text x="254" y="457">호남권</text></g><g fill="#2563eb" stroke="white" stroke-width="4"><circle cx="267" cy="251" r="19"/><circle cx="351" cy="416" r="15"/><circle cx="254" cy="396" r="15"/></g><g fill="white" font-size="15" text-anchor="middle"><text x="267" y="257">A</text><text x="351" y="421">B</text><text x="254" y="401">C</text></g></svg><span class="rh-map-disclaimer">예시 지도 · 실제 위치 아님</span><div class="rh-map-label">한빛 정밀 모의 현장<small>RGB 이미지 · 범위 협의 필요</small></div><div class="rh-map-legend"><i></i> 선택 현장 <i></i> 모의 현장</div></div>`;
}
