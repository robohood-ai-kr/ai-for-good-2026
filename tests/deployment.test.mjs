import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { load } from 'cheerio';
import { publicPaths, outputConfig } from '../scripts/prepare-vercel.mjs';

test('deployment allowlist excludes datasets, archives, credentials and source documents', () => {
  const paths = publicPaths();
  assert.equal(new Set(paths).size, paths.length);
  for (const path of paths) assert.doesNotMatch(path, /(^|\/)(data|supabase|\.env|\.git|\.vercel|docs|packages|node_modules)(\/|$)|\.(zip|sql|toml)$/);
  assert.equal(paths.filter(p => /\/(mf|sb)-\d+\.html$/.test(p)).length, 41);
  assert.equal(paths.filter(p => /\/references\/.+\.png$/.test(p)).length, 41);
});
test('every published HTML asset and page link is included in the allowlist', async () => {
  const paths = new Set(publicPaths());
  for (const path of [...paths].filter(p => p.endsWith('.html'))) {
    const $ = load(await readFile(new URL(`../dist/${path}`, import.meta.url), 'utf8'));
    for (const element of $('[href],[src]').toArray()) {
      const link = element.attribs.href ?? element.attribs.src;
      if (!link || /^(#|mailto:|tel:|data:|blob:)/.test(link)) continue;
      const url = new URL(link, `https://robohood.test/${path}`);
      assert.equal(url.hostname, 'robohood.test', `${path}: external asset/link`);
      let target = decodeURIComponent(url.pathname).slice(1);
      if (!target || target.endsWith('/')) target += 'index.html';
      assert.ok(paths.has(target), `${path}: missing ${target}`);
    }
  }
});
test('prebuilt output preserves multipage routes and returns real 404s', () => {
  assert.equal(outputConfig.version, 3);
  assert.ok(outputConfig.routes.some(r => r.src === '^/$' && r.dest === '/index.html'));
  assert.ok(outputConfig.routes.some(r => r.src === '^/(manufacturing|small-business)/$'));
  assert.equal(outputConfig.routes.at(-1).status, 404);
  assert.ok(outputConfig.routes.some(r => r.headers?.['Content-Type']?.includes('javascript')));
});
