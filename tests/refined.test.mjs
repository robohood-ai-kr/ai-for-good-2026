import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import { sectors, screenId } from '../apps/shared/catalog.mjs';
import { initialState, transition, segmentRecord } from '../apps/shared/state.mjs';

test('41 generated references map to 41 real HTML screens and manifest hashes',async()=>{
  const report=JSON.parse(await readFile(new URL('../dist/build-report.json',import.meta.url)));
  const manifest=JSON.parse(await readFile(new URL('../assets/ui-concepts/refined-v1/manifest.json',import.meta.url)));
  assert.equal(manifest.screens.length,41);
  assert.equal(new Set(manifest.screens.map(s=>s.id)).size,41);
  for(const [sector,c] of Object.entries(sectors)) {
    assert.equal(report.apps[sector].references,c.names.length);
    for(let n=1;n<=c.names.length;n++) {
      const id=screenId(sector,n), image=await readFile(new URL(`../assets/ui-concepts/refined-v1/${sector}/${id}.png`,import.meta.url));
      assert.equal(image.subarray(1,4).toString(),'PNG');
      assert.ok(image.readUInt32BE(16)>=800);
      assert.ok(image.readUInt32BE(20)>=800);
      assert.equal(report.apps[sector].pages[n-1].imageSha256,createHash('sha256').update(image).digest('hex'));
      assert.equal(manifest.screens.find(s=>s.id===id).sha256,report.apps[sector].pages[n-1].imageSha256);
      const $=load(await readFile(new URL(`../dist/${sector}/${id}.html`,import.meta.url),'utf8'));
      assert.equal($('h1').length,1);
      assert.equal($('.rh-workbench,.rh-context,.rh-toolbar').length,0);
      assert.equal($('[src^="https://"],[href^="https://"]').length,0);
      assert.equal($('a[href="./references/'+id+'.png"]').length,0);
      assert.doesNotMatch($('.rh-header,.rh-sidebar,.rh-page-footer').text(),/v1 · 모의 데모|브라우저 모의 기록|시안 갤러리/);
      assert.ok(!/8\.4\s*ms|mAP|TensorRT|HMAC|ISO\s*27001|80시간/.test($('#rh-main').text()));
      assert.ok($('button,a,input,select,textarea').length>5,'UI must be HTML controls, not a screenshot');
      const ids=$('[id]').toArray().map(el=>el.attribs.id);
      assert.equal(new Set(ids).size,ids.length,`${id}: duplicate IDs`);
    }
  }
  assert.equal(manifest.assets.length,2);
  for(const asset of manifest.assets) {
    const image=await readFile(new URL(`../assets/ui-concepts/refined-v1/${asset.file}`,import.meta.url));
    assert.equal(asset.sha256,createHash('sha256').update(image).digest('hex'));
  }
});
test('presenter flow crosses the correct field and operations surfaces',async()=>{
  for (const [id,surface] of [['sb-13','field-workspace'],['sb-15','operations-console'],['sb-19','operations-console'],['sb-18','field-workspace']]) {
    const $=load(await readFile(new URL(`../dist/small-business/${id}.html`,import.meta.url),'utf8'));
    assert.equal($('body').attr('data-surface'),surface,id);
  }
});
test('small-business youth screens use responsive desktop field workspaces',async()=>{
  for (const id of ['sb-10','sb-11','sb-12','sb-13','sb-14','sb-18']) {
    const $=load(await readFile(new URL(`../dist/small-business/${id}.html`,import.meta.url),'utf8'));
    assert.ok($('body').hasClass('rh-desktop'),id);
    assert.equal($('body').attr('data-surface'),'field-workspace',id);
    assert.equal($('.rh-header > .rh-badge').text(),'현장 작업',id);
    assert.equal($('.rh-sidebar').length,1,id);
    assert.equal($('.rh-bottom-nav').length,0,id);
  }
});
test('manufacturing youth screens use responsive desktop field workspaces',async()=>{
  for (const id of ['mf-08','mf-17','mf-18']) {
    const $=load(await readFile(new URL(`../dist/manufacturing/${id}.html`,import.meta.url),'utf8'));
    assert.ok($('body').hasClass('rh-desktop'),id);
    assert.equal($('body').attr('data-surface'),'field-workspace',id);
    assert.equal($('.rh-header > .rh-badge').text(),'현장 작업',id);
    assert.equal($('.rh-sidebar').length,1,id);
    assert.equal($('.rh-bottom-nav').length,0,id);
  }
});
test('live service pages do not expose prototype version labels',async()=>{
  for (const [sector,c] of Object.entries(sectors)) for(let n=1;n<=c.names.length;n++) {
    const $=load(await readFile(new URL(`../dist/${sector}/${screenId(sector,n)}.html`,import.meta.url),'utf8'));
    assert.doesNotMatch($('#rh-main').text(),/\bv1\b|모바일 RGB|모바일 작업함/i,`${sector}-${n}`);
  }
});
test('small-business scopes do not add manufacturing deployment menus',async()=>{
  const $=load(await readFile(new URL('../dist/small-business/sb-03.html',import.meta.url),'utf8'));
  assert.ok(!/모델|장비|배포/.test($('.rh-sidebar nav').text()));
  assert.equal($('.rh-journey li').length,6);
  assert.equal($('[data-value=pendingReview]').length,1);
});
test('segment metadata validates bounds, duration, labels and verdict',()=>{
  for(const p of [{start:-1,end:2,name:'a'},{start:2,end:2,name:'a'},{start:'',end:1,name:'a'},{start:0,end:8,name:'a',duration:5},{start:0,end:1,name:''},{start:0,end:1,name:'a',verdict:'automatic'}])
    assert.throws(()=>segmentRecord(p));
  const s=segmentRecord({start:'0',end:'1.5',name:'  컵 집기  ',verdict:'success',notes:'예시'});
  assert.equal(s.start,0);assert.equal(s.end,1.5);assert.equal(s.name,'컵 집기');assert.equal(s.notes,'예시');
});
test('a new task preserves prior metadata as history',()=>{
  const state=initialState('manufacturing');state.marks=[{kind:'sample-image'}];
  const next=transition(state,'create-task',{title:'재수집 테스트'});
  assert.equal(next.history.length,1);assert.equal(next.history[0].marks.length,1);
  assert.equal(next.marks.length,0);assert.equal(state.marks.length,1);
});
