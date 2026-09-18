import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { loadEnvFile } from 'node:process';
import { sectors, screenId, escapeHtml as e } from '../apps/shared/catalog.mjs';
import { renderPage, icon } from '../apps/refined/render.mjs';
import { specFor } from '../apps/refined/screen-specs.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
try {
  loadEnvFile(path.join(root, '.env.local'));
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}
const selected = process.argv[2] ? [process.argv[2]] : Object.keys(sectors);
if (selected.some(s=>!sectors[s])) throw new Error('Unknown app');
const naverMapClientId = (process.env.NAVER_MAP_CLIENT_ID ?? '').trim();
const concepts = path.join(root,'assets/ui-concepts/refined-v1');
const css = await readFile(path.join(root,'apps/refined/theme.css'),'utf8') + '\n' + await readFile(path.join(root,'apps/refined/fidelity.css'),'utf8');
const report = {version:'v1',refinement:'image-to-code',apps:{},externalAssets:[],notes:['Generated references are design input, not operational evidence.','Browser-only state; no authentication, upload, AI inference, robot or payments.']};
const galleryStyle=`body{font:16px/1.6 "Pretendard",-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;letter-spacing:-.01em;-webkit-font-smoothing:antialiased;color:#0f172a;background:#f4f7fb;margin:0;padding:32px}main{max-width:1400px;margin:auto}a{color:#1d4ed8}h1{font-size:32px;letter-spacing:-.03em;font-weight:700}p{color:#475569}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}.card{background:white;border:1px solid #d5dde7;border-radius:12px;padding:18px;min-width:0}.card img{width:100%;height:230px;object-fit:contain;background:#f4f7fb;border:1px solid #e2e8f0;border-radius:6px}.card h2{font-size:18px;margin:16px 0 8px;letter-spacing:-.02em;font-weight:600}.links{display:flex;gap:16px;flex-wrap:wrap}.meta{font-size:14px;color:#64748b}.hero{padding:24px;background:white;border:1px solid #d5dde7;border-radius:12px;margin-bottom:24px}svg{width:25px;height:25px;vertical-align:middle}.button{display:inline-block;background:#2563eb;color:white;text-decoration:none;padding:12px 18px;border-radius:8px;margin:16px 10px 0 0;letter-spacing:-.02em;font-weight:600}@media(max-width:600px){body{padding:20px 16px}.grid{grid-template-columns:1fr}h1{font-size:27px}}`;
function html(title,content,fontHref) {return `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>${fontHref?`<link rel="stylesheet" href="${fontHref}">`:''}<style>${galleryStyle}</style><main>${content}</main></html>`;}
function gallery(sector,online=true) {
 const c=sectors[sector];
 const start=online?'./index.html':`http://127.0.0.1:4173/${sector}/`;
 const surfaceName = number => c.fieldWorkspace?.includes(number) ? '현장 작업' : '운영 콘솔';
 return html(`${c.name} · 화면 설계 자료`,`<div class="hero"><h1>${c.name} 화면 설계 자료</h1><p>현장 작업과 운영 콘솔의 화면 구성을 확인할 수 있습니다. 이미지의 예시 수치·문구가 기능 보장을 뜻하지 않습니다.</p><div class="links"><a href="${start}">서비스 열기</a><a href="${online?`./${c.prefix}-03.html`:'./prompts.json'}">${online?'운영 콘솔':'프롬프트 원문'}</a></div></div><div class="grid">${c.names.map((name,i)=>{const id=screenId(sector,i+1),img=online?`./references/${id}.png`:`./${sector}/${id}.png`;return `<article class="card"><a href="${img}" target="_blank" rel="noopener"><img loading="lazy" src="${img}" alt="${e(specFor(sector,i+1).title)} 화면 참고 이미지"></a><p class="meta">${id.toUpperCase()} · ${surfaceName(i+1)}</p><h2>${e(name)}</h2><div class="links"><a href="${img}" target="_blank" rel="noopener">참고 이미지</a><a href="${online?`./${id}.html`:`http://127.0.0.1:4173/${sector}/${id}.html`}">서비스 화면 ↗</a></div></article>`}).join('')}</div>`,online?'./assets/pretendard.css':`../../../dist/${sector}/assets/pretendard.css`);
}
for(const sector of selected) {
 const c=sectors[sector], dest=path.join(root,'dist',sector);
 await mkdir(path.join(dest,'assets'),{recursive:true});
 await mkdir(path.join(dest,'assets','woff2'),{recursive:true});
 await mkdir(path.join(dest,'assets','scenarios'),{recursive:true});
 await mkdir(path.join(dest,'references'),{recursive:true});
 await writeFile(path.join(dest,'assets/app.css'),css);
 const pretendardCss = (await readFile(path.join(root,'node_modules/pretendard/dist/web/variable/pretendardvariable.css'),'utf8')).replaceAll("'Pretendard Variable'", "'Pretendard'");
 await writeFile(path.join(dest,'assets/pretendard.css'),pretendardCss);
 await copyFile(path.join(root,'node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2'),path.join(dest,'assets/woff2/PretendardVariable.woff2'));
 await copyFile(path.join(root,'node_modules/pretendard/dist/LICENSE.txt'),path.join(dest,'assets/woff2/Pretendard-LICENSE.txt'));
 for(const file of ['app.mjs','state.mjs','naver-map.mjs']) await copyFile(path.join(root,'apps/shared',file),path.join(dest,'assets',file));
 const photo=sector==='manufacturing'?'rgb-part.png':'tray-task.png';
 await copyFile(path.join(concepts,sector,photo),path.join(dest,'assets',photo));
 if (sector === 'small-business') {
  const scenarioImages = [
   ...Object.values(c.scenarios).map(item=>item.image),
   ...c.datasetExamples.map(item=>item.image),
  ];
  for (const image of new Set(scenarioImages))
   await copyFile(path.join(concepts,sector,'scenarios',image),path.join(dest,'assets','scenarios',image));
 }
 const pages=[];
 for(let n=1;n<=c.names.length;n++) {
  const id=screenId(sector,n), source=path.join(concepts,sector,`${id}.png`);
  const buffer=await readFile(source);
  const imageHash=createHash('sha256').update(buffer).digest('hex');
  await copyFile(source,path.join(dest,'references',`${id}.png`));
  await writeFile(path.join(dest,`${id}.html`),renderPage(sector,n,{naverMapClientId}));
  await writeFile(path.join(dest,'assets',`${id}.css`),css);
  pages.push({id,title:specFor(sector,n).title,mobile:c.mobile.includes(n),reference:`references/${id}.png`,imageSha256:imageHash});
 }
 await copyFile(path.join(dest,`${screenId(sector,1)}.html`),path.join(dest,'index.html'));
 await writeFile(path.join(dest,'image-gallery.html'),gallery(sector));
 await writeFile(path.join(dest,'screens.json'),JSON.stringify(pages,null,2));
 report.apps[sector]={screens:pages.length,mobile:c.mobile.length,references:pages.filter(p=>p.imageSha256).length,pages};
 console.log(`${c.name}: ${pages.length} pages built from refined images`);
}
await writeFile(path.join(root,'dist/index.html'),html('RoboHood · 현장 데이터 플랫폼',`<div class="hero"><p>ROBOHOOD · PHYSICAL AI DATA</p><h1>${icon('robot')} 현장의 데이터를,<br>다음 기회로.</h1><p>소상공인과 제조 현장의 데이터 수집·검수·활용 흐름을 연결합니다.</p><p class="meta">운영할 현장을 선택하세요. 실제 인증·지급·장비 연동은 연결 전 상태입니다.</p></div><div class="grid">${Object.entries(sectors).map(([sector,c])=>`<article class="card"><a href="./${sector}/${c.prefix}-03.html"><img src="./${sector}/references/${c.prefix}-03.png" alt="${c.name} 운영 화면 미리보기"></a><h2>${c.name}</h2><p>${c.description}</p><a class="button" href="./${sector}/${c.prefix}-03.html">운영 콘솔 열기 →</a><p class="links"><a href="./${sector}/">서비스 소개</a><a href="./${sector}/${c.prefix}-${sector==='manufacturing'?'17':'11'}.html">현장 작업</a></p></article>`).join('')}</div>`,'./manufacturing/assets/pretendard.css'));
await writeFile(path.join(root,'dist/build-report.json'),JSON.stringify(report,null,2));
for(const sector of selected) await writeFile(path.join(concepts,`${sector}.html`),gallery(sector,false));
await writeFile(path.join(concepts,'index.html'),html('RoboHood 개선 이미지',`<h1>RoboHood · 개선 이미지</h1><p>imagegen과 Stitch의 장점을 합친 두 제품의 독립 시안입니다.</p><div class="grid">${Object.entries(sectors).map(([s,c])=>`<article class="card"><img src="./${s}/${c.prefix}-03.png" alt="${c.name} 대시보드"><h2>${c.name} · ${c.names.length}화면</h2><a href="./${s}.html">전체 생성 이미지 보기</a></article>`).join('')}</div><p><a href="./prompts.json">화면별 생성 프롬프트</a></p>`,'../../../dist/manufacturing/assets/pretendard.css'));
