import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';
import { renderPage } from '../apps/refined/render.mjs';

test('both explorer pages enable NAVER Maps only with an injected Client ID', () => {
  for (const [sector, explorerPage, otherPageNumber] of [
    ['small-business', 4, 5],
    ['manufacturing', 21, 20],
  ]) {
    const $ = cheerio.load(renderPage(sector, explorerPage, { naverMapClientId: 'test-public-client-id' }));
    const config = JSON.parse($('#rh-config').text());

    assert.equal(config.naverMapClientId, 'test-public-client-id');
    const csp = $('meta[http-equiv="Content-Security-Policy"]').attr('content');
    assert.match(csp, /https:\/\/oapi\.map\.naver\.com/);
    assert.match(csp, /http:\/\/oapi\.map\.naver\.com/);
    assert.match(csp, /http:\/\/nrbe\.map\.naver\.net/);
    assert.match(csp, /http:\/\/static\.naver\.net/);

    const otherPage = cheerio.load(renderPage(sector, otherPageNumber, { naverMapClientId: 'test-public-client-id' }));
    const otherConfig = JSON.parse(otherPage('#rh-config').text());
    assert.equal(otherConfig.naverMapClientId, undefined);
    assert.match(otherPage('meta[http-equiv="Content-Security-Policy"]').attr('content'), /connect-src 'none'/);
  }
});

test('both explorers preserve schematic fallbacks without a Client ID', async () => {
  const source = await readFile(new URL('../apps/shared/naver-map.mjs', import.meta.url), 'utf8');

  for (const [sector, explorerPage] of [['small-business', 4], ['manufacturing', 21]]) {
    const $ = cheerio.load(renderPage(sector, explorerPage));
    const config = JSON.parse($('#rh-config').text());
    assert.equal(config.naverMapClientId, undefined);
    assert.equal($('.rh-map svg').length, 1);
    assert.match($('meta[http-equiv="Content-Security-Policy"]').attr('content'), /connect-src 'none'/);
  }

  assert.match(source, /성수 식당 A/);
  assert.match(source, /망원 동네마트 A/);
  assert.match(source, /한빛 정밀 모의 현장/);
  assert.match(source, /모의 금속가공 현장 B/);
  assert.match(source, /모의 조립 현장 C/);
  assert.match(source, /mapProvider = 'fallback'/);
  assert.doesNotMatch(source, /Client Secret|X-NCP-APIGW-API-KEY/);
});

test('manufacturing sidebar omits the decorative metal-part photo', () => {
  const $ = cheerio.load(renderPage('manufacturing', 21));
  assert.equal($('.rh-sidebar-footer .rh-photo').length, 0);
  assert.match($('.rh-sidebar-footer').text(), /작은 데이터가/);
});
