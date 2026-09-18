import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';
import { renderPage } from '../apps/refined/render.mjs';

test('small-business explorer enables NAVER Maps only with an injected Client ID', () => {
  const html = renderPage('small-business', 4, { naverMapClientId: 'test-public-client-id' });
  const $ = cheerio.load(html);
  const config = JSON.parse($('#rh-config').text());

  assert.equal(config.naverMapClientId, 'test-public-client-id');
  const csp = $('meta[http-equiv="Content-Security-Policy"]').attr('content');
  assert.match(csp, /https:\/\/oapi\.map\.naver\.com/);
  assert.match(csp, /http:\/\/oapi\.map\.naver\.com/);
  assert.match(csp, /http:\/\/nrbe\.map\.naver\.net/);
  assert.match(csp, /http:\/\/static\.naver\.net/);

  const otherPage = cheerio.load(renderPage('small-business', 5, { naverMapClientId: 'test-public-client-id' }));
  const otherConfig = JSON.parse(otherPage('#rh-config').text());
  assert.equal(otherConfig.naverMapClientId, undefined);
  assert.match(otherPage('meta[http-equiv="Content-Security-Policy"]').attr('content'), /connect-src 'none'/);
});

test('small-business explorer preserves its schematic fallback without a Client ID', async () => {
  const $ = cheerio.load(renderPage('small-business', 4));
  const config = JSON.parse($('#rh-config').text());
  const source = await readFile(new URL('../apps/shared/naver-map.mjs', import.meta.url), 'utf8');

  assert.equal(config.naverMapClientId, undefined);
  assert.equal($('.rh-map svg').length, 1);
  assert.match($('meta[http-equiv="Content-Security-Policy"]').attr('content'), /connect-src 'none'/);
  assert.match(source, /모의 식당 A/);
  assert.match(source, /모의 동네마트 A/);
  assert.match(source, /mapProvider = 'fallback'/);
  assert.doesNotMatch(source, /Client Secret|X-NCP-APIGW-API-KEY/);
});
