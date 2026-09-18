import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { load } from 'cheerio';
import { sectors, screenId } from '../apps/shared/catalog.mjs';
import { referenceArt, referenceCrops, referenceIllustrations } from '../apps/refined/reference-art.mjs';

const page = async (sector, number) => load(await readFile(new URL(`../dist/${sector}/${screenId(sector,number)}.html`,import.meta.url),'utf8'));

test('screen menu keeps the mobile page list separate from the current page flag', async () => {
  for (const [sector,c] of Object.entries(sectors)) for(let n=1;n<=c.names.length;n++) {
    const $=await page(sector,n);
    const config=JSON.parse($('#rh-config').text());
    assert.deepEqual(config.mobile,c.mobile);
    assert.equal(config.isMobile,c.mobile.includes(n));
    // This is the lookup used when the browser opens the complete screen menu.
    assert.equal(config.names.filter((_,i)=>config.mobile.includes(i+1)).length,c.mobile.length);
  }
});

test('reference artwork is bounded to decorative regions, never an entire screenshot UI', async () => {
  for (const [type,table] of Object.entries({photo:referenceCrops,illustration:referenceIllustrations})) {
    for (const [id,regions] of Object.entries(table)) {
      const sector = id.startsWith('mf') ? 'manufacturing' : 'small-business';
      const source = id==='sb-08' && type==='photo' ? 'sb-05' : id;
      const png = await readFile(new URL(`../assets/ui-concepts/refined-v1/${sector}/${source}.png`,import.meta.url));
      const width=png.readUInt32BE(16), height=png.readUInt32BE(20);
      regions.forEach(([x,y,w,h],i)=>{
        assert.ok(x>=0 && y>=0 && w>0 && h>0 && x+w<=width && y+h<=height,`${id} crop ${i}: bounds`);
        assert.ok(w*h < width*height*.30,`${id} crop ${i}: too large for decorative art`);
        const $=load(referenceArt(sector,Number(id.slice(3)),i,type));
        assert.equal($('svg[role=img]').length,1);
        assert.equal($('image').attr('href'),`./references/${source}.png`);
        assert.equal($('button,input,a,foreignObject').length,0);
      });
    }
  }
});

test('every screen includes the versioned composition layer and real HTML controls', async () => {
  for (const [sector,c] of Object.entries(sectors)) for(let n=1;n<=c.names.length;n++) {
    const $=await page(sector,n);
    assert.match($('body').attr('class'),/rh-kind-/);
    assert.ok($('#rh-main button,#rh-main a,#rh-main input,#rh-main select,#rh-main textarea').length>0);
    for(const node of $('svg.rh-scene image').toArray()) assert.match(node.attribs.href,/^\.\/references\/(mf|sb)-\d{2}\.png$/);
  }
  const css=await readFile(new URL('../dist/manufacturing/assets/app.css',import.meta.url),'utf8');
  assert.match(css,/v1 visual convergence/);
  assert.match(css,/\.rh-request-columns/);
  assert.match(css,/@media \(max-width:720px\)/);
});

test('manufacturing and small-business request screens retain distinct reference layouts', async () => {
  const mf=await page('manufacturing',5), sb=await page('small-business',7);
  assert.equal(mf('.rh-request-grid .rh-form-stack>.rh-card').length,3);
  assert.equal(mf('.rh-request-summary').length,1);
  assert.equal(sb('form.rh-request-columns>.rh-card').length,3);
  assert.equal(sb('.rh-request-steps li').length,3);
  for(const $ of [mf,sb]) {
    for(const id of ['taskName','purpose','siteName','captureConditions','trainingPlan','supervisionPlan','compensationTerms']) assert.equal($('#'+id).length,1);
    assert.equal($('[data-action=create-task]').length,1);
  }
});

test('dataset layouts preserve source, version and live records without copying example approvals', async () => {
  const mf=await page('manufacturing',11), sb=await page('small-business',17);
  assert.equal(mf('.rh-reference-samples .rh-photo').length,6);
  assert.equal(sb('.rh-sb-dataset-hero').length,1);
  assert.equal(sb('.rh-sb-dataset-records>.rh-card').length,3);
  assert.equal(sb('[data-marks]').length,1);
  assert.equal(sb('[data-marks]').text(),'');
  assert.ok(sb('[data-value=access]').length);
  assert.ok(sb('[data-value=payment]').length);
});

test('mobile segment collection has accessible native inputs and no screenshot-only controls', async () => {
  const $=await page('small-business',13);
  assert.equal($('.rh-segment-fields input').length,3);
  assert.equal($('input[name=verdict]').length,3);
  assert.equal($('[data-action=mark]').length,1);
  assert.equal($('input[type=file][accept="video/*"]').length,1);
  assert.equal($('video[controls][hidden]').length,1);
  assert.equal($('.rh-saved-records summary').length,1);
  assert.equal($('[data-action=submit]').length,1);
  assert.equal($('[data-gate]').length,5);
});

test('explorer filters stay bound to the three existing mock sites', async () => {
  for(const [sector,n] of [['manufacturing',21],['small-business',4]]) {
    const $=await page(sector,n);
    assert.equal($('[data-site-filter]').length,4);
    assert.equal($('[data-search-item][data-site-category][data-site-state]').length,3);
    assert.equal($('.rh-selected-site').length,1);
    assert.equal($('[data-hide-map]').length,1);
    assert.match($('.rh-map').attr('aria-label'),/가상|예시/);
  }
});
