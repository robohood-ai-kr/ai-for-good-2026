import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { safeKey, tarHeaders } from '../scripts/data/prepare-reference-data.mjs';
import { validate, seedSQL, sqlLiteral, VERIFY_SQL } from '../scripts/data/import-reference-data.mjs';

const catalog = JSON.parse(await readFile(new URL('../data/reference-v1/sources.json', import.meta.url)));
const manifest = JSON.parse(await readFile(new URL('../data/reference-v1/manifest.json', import.meta.url)));
test('reference catalog only imports approved public samples', () => {
  assert.doesNotThrow(() => validate(catalog, manifest));
  assert.equal(catalog.sources.length, 7);
  assert.equal(manifest.assets.length, 48);
  assert.deepEqual([...new Set(manifest.assets.map(a => a.source_id))].sort(), ['hoyer-egocentric', 'smartdeer-egocentric', 'visa']);
  const changed = structuredClone(manifest); changed.assets[0].source_id = 'kamp-chromate';
  assert.throws(() => validate(catalog, changed), /not approved/);
});
test('media paths cannot escape the seed folder', () => {
  assert.equal(safeKey('manufacturing/visa/001.JPG'), 'manufacturing/visa/001.JPG');
  for (const path of ['../secret', '/secret', 'foo/../secret', 'foo//bar', 'foo\\bar']) assert.throws(() => safeKey(path));
});
test('review state and source identity are never fabricated', () => {
  for (const asset of manifest.assets) {
    assert.equal(asset.review_status, 'pending');
    assert.equal(asset.origin_type, 'external_reference');
    assert.ok(!asset.media.streams.some(s => s.codec_type === 'audio'));
  }
  const changed = structuredClone(manifest); changed.assets[0].review_status = 'approved';
  assert.throws(() => validate(catalog, changed), /fabricate/);
});
test('stereo views are three episodes, not six independent recordings', () => {
  const videos = manifest.assets.filter(a => a.source_id === 'smartdeer-egocentric');
  assert.equal(videos.length, 6);
  assert.equal(new Set(videos.map(a => a.episode_id)).size, 3);
  assert.ok(videos.every(a => a.upstream_task_verified === false && a.upstream_review_status === 'pending'));
});
test('every anomaly image has its matching publisher mask', () => {
  const visa = manifest.assets.filter(a => a.source_id === 'visa');
  const images = visa.filter(a => a.asset_kind === 'inspection_image');
  const masks = visa.filter(a => a.asset_kind === 'segmentation_mask');
  assert.equal(images.filter(a => a.upstream_label === 'normal').length, 12);
  assert.equal(images.filter(a => a.upstream_label === 'anomaly').length, 12);
  assert.equal(masks.length, 12);
  for (const mask of masks) assert.ok(images.some(a => a.source_member === mask.related_image_member));
});
test('SQL seed escapes text and does not silently overwrite existing assets', () => {
  assert.equal(sqlLiteral("it's"), "'it''s'");
  const sql = seedSQL(catalog, manifest);
  assert.match(sql, /refuse overwrite/);
  assert.match(sql, /on conflict \(id\) do nothing/);
  assert.doesNotMatch(sql, /update.+review_status/i);
  assert.match(VERIFY_SQL, /anon_can_select/);
});
test('tar headers require a valid checksum and reject random media bytes', () => {
  assert.deepEqual(tarHeaders(Buffer.alloc(1024)), []);
  const h = Buffer.alloc(512); h.write('pcb1/Data/Images/Normal/001.JPG');
  h.write('00000000123\0', 124); h[156] = 48; h.fill(32, 148, 156);
  const sum = [...h].reduce((a, b) => a + b, 0); h.write(`${sum.toString(8).padStart(6, '0')}\0 `, 148);
  assert.equal(tarHeaders(h, 1024)[0].offset, 1024);
  h[20] ^= 1; assert.deepEqual(tarHeaders(h), []);
});
