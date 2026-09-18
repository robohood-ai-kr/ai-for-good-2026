// Public-source, bounded samples only. Does not create cloud resources or execute downloaded code.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const LOCAL = resolve(ROOT, 'data/local/reference-v1');
const CATALOG = resolve(ROOT, 'data/reference-v1');
const VISA_URL = 'https://amazon-visual-anomaly.s3.us-west-2.amazonaws.com/VisA_20220922.tar';
const VISA_ETAG = '"05c830591a1172938cb714895c9e0cfb-113"';
const HOYER_REV = '81efb2a752042805b26e6e24b0d36cc4a1c226b6';
const DEER_REV = '803028bfb69c002053d66a56b961d35197aeb0ea';
const HOYER_MEMBER = '2026-01-05_19-35-47-pick-place';
const HOYER_URL = `https://huggingface.co/datasets/HoyerChou/EgocentricVideos/resolve/${HOYER_REV}/${HOYER_MEMBER}.zip`;
const HOYER_HASH = '21e0bface2c086dfab0db4772bad6814043bdbb0039e7f0115c905a8e0c271e2';
const sha = data => createHash('sha256').update(data).digest('hex');
const json = data => `${JSON.stringify(data, null, 2)}\n`;
export function safeKey(key) {
  if (!/^[A-Za-z0-9_.\/-]+$/.test(key) || key.split('/').some(p => !p || p === '.' || p === '..')) throw Error('Unsafe object path');
  return key;
}

export function tarHeaders(buffer, base = 0) {
  const entries = [];
  for (let o = 0; o + 512 <= buffer.length; o += 512) {
    const h = buffer.subarray(o, o + 512);
    const name = h.subarray(0, 100).toString().split('\0')[0];
    const size = h.subarray(124, 136).toString().replace(/\0/g, '').trim();
    const check = h.subarray(148, 156).toString().replace(/\0/g, '').trim();
    if (!/^[0-7]+$/.test(size) || !/^[0-7]+$/.test(check) || !/^\w+\//.test(name)) continue;
    let sum = 0;
    for (let i = 0; i < 512; i++) sum += i >= 148 && i < 156 ? 32 : h[i];
    if (sum !== parseInt(check, 8)) continue;
    if (![0, 48].includes(h[156])) continue; // regular files only; never links/devices
    entries.push({ name: safeKey(name), size: parseInt(size, 8), offset: base + o });
  }
  return entries;
}

async function get(url, { start, length, maxBytes = 100_000_000 } = {}) {
  const headers = start === undefined ? {} : { Range: `bytes=${start}-${start + length - 1}`, 'If-Match': VISA_ETAG };
  const r = await fetch(url, { headers, signal: AbortSignal.timeout(120_000) });
  if (!r.ok || (start !== undefined && r.status !== 206)) throw Error(`Download failed: HTTP ${r.status}`);
  if (start !== undefined && r.headers.get('etag') !== VISA_ETAG) throw Error('VisA archive changed; re-inspect ranges');
  if (Number(r.headers.get('content-length') || 0) > maxBytes) throw Error('Download exceeds limit');
  const chunks = []; let bytes = 0;
  for await (const part of r.body) {
    bytes += part.length;
    if (bytes > maxBytes) throw Error('Download exceeds limit');
    chunks.push(part);
  }
  if (length !== undefined && bytes !== length) throw Error('Truncated range');
  return Buffer.concat(chunks);
}

async function save(path, bytes) { await mkdir(dirname(path), { recursive: true }); await writeFile(path, bytes); }
async function media(path) {
  const m = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,avg_frame_rate', '-of', 'json', path], { encoding: 'utf8' }));
  return { streams: m.streams, duration_seconds: m.format?.duration ? Number(m.format.duration) : null };
}

async function main() {
  await mkdir(LOCAL, { recursive: true });
  const assets = [];
  async function record(key, bytes, fields) {
    safeKey(key);
    if (bytes.length > 50_000_000) throw Error('Exceeds private bucket file limit');
    const path = resolve(LOCAL, key); await save(path, bytes);
    const measured = await media(path);
    assets.push({ id: key.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase(), object_key: key, bucket_id: 'robohood-reference-v1', byte_size: bytes.length, sha256: sha(bytes), origin_type: 'external_reference', review_status: 'pending', visual_review: 'not_yet_reviewed', media: measured, transformations: [], ...fields });
  }

  // Read a few verified ranges, not the complete 1.93GB archive. Offsets are pinned by ETag.
  const regions = await Promise.all([[880, 5], [1024, 5], [1136, 16]].map(async ([mb, size]) => {
    const base = mb * 1024 * 1024;
    const bytes = await get(VISA_URL, { start: base, length: size * 1024 * 1024 });
    return { base, bytes, entries: tarHeaders(bytes, base) };
  }));
  const entries = regions.flatMap(r => r.entries);
  const anomaly = entries.filter(e => /^pcb1\/Data\/Images\/Anomaly\/\d+\.JPG$/.test(e.name)).slice(0, 12);
  const normal = entries.filter(e => /^pcb1\/Data\/Images\/Normal\/\d+\.JPG$/.test(e.name)).slice(0, 12);
  if (normal.length !== 12 || anomaly.length !== 12) throw Error('VisA expected 12 normal + 12 anomaly');
  const masks = anomaly.map(e => entries.find(m => m.name === e.name.replace('/Images/', '/Masks/').replace('.JPG', '.png')));
  if (masks.some(m => !m)) throw Error('Missing matching VisA masks');
  for (const e of [...normal, ...anomaly, ...masks]) {
    const region = regions.find(r => e.offset + 512 >= r.base && e.offset + 512 + e.size <= r.base + r.bytes.length);
    const bytes = region ? region.bytes.subarray(e.offset + 512 - region.base, e.offset + 512 + e.size - region.base) : await get(VISA_URL, { start: e.offset + 512, length: e.size });
    const isMask = e.name.includes('/Masks/');
    await record(`manufacturing/visa/${e.name}`, bytes, { source_id: 'visa', scenario_id: 'RH-MF-001', media_type: isMask ? 'image/png' : 'image/jpeg', asset_kind: isMask ? 'segmentation_mask' : 'inspection_image', source_url: VISA_URL, source_member: e.name, source_archive_etag: VISA_ETAG, source_byte_offset: e.offset + 512, upstream_label: e.name.includes('/Normal/') ? 'normal' : 'anomaly', upstream_label_status: 'publisher_provided', task: 'pcb_visual_inspection', episode_id: null, camera_id: null, related_image_member: isMask ? e.name.replace('/Masks/', '/Images/').replace('.png', '.JPG') : null });
  }
  console.log('VisA: 24 images + 12 matching masks prepared');

  let zip;
  try { const cached = await readFile(resolve(ROOT, 'tmp/data-research/pick-place.zip')); if (sha(cached) === HOYER_HASH) zip = cached; } catch {}
  zip ??= await get(HOYER_URL);
  if (sha(zip) !== HOYER_HASH) throw Error('Hoyer archive checksum mismatch');
  const zipPath = resolve(LOCAL, '_originals/hoyer-pick-place.zip'); await save(zipPath, zip);
  for (let i = 1; i <= 6; i++) {
    const clip = `clip_${String(i).padStart(3, '0')}.mp4`, member = `${HOYER_MEMBER}/${clip}`;
    const original = execFileSync('unzip', ['-p', zipPath, member], { maxBuffer: 10_000_000 });
    const input = resolve(LOCAL, `_originals/hoyer/${clip}`), output = resolve(LOCAL, `_derived/hoyer/${clip}`);
    await save(input, original); await mkdir(dirname(output), { recursive: true });
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', input, '-map', '0:v:0', '-c:v', 'copy', '-an', '-map_metadata', '-1', '-movflags', '+faststart', output]);
    await record(`small-business/hoyer/${clip}`, await readFile(output), { source_id: 'hoyer-egocentric', scenario_id: 'RH-SB-001', media_type: 'video/mp4', asset_kind: 'human_demonstration', source_url: HOYER_URL, source_member: member, source_sha256: sha(original), upstream_label: null, upstream_label_status: 'unlabeled_demonstration', task: 'tabletop_pick_place', episode_id: `hoyer-pick-place-${i}`, source_session_id: HOYER_MEMBER, camera_id: 'egocentric', transformations: ['audio_removed', 'container_metadata_removed', 'video_stream_copied_no_reencoding'] });
  }
  console.log('Hoyer: 6 silent video clips prepared (no success/failure labels invented)');

  const deerBase = `https://huggingface.co/datasets/SmartDeer/egocentric-manipulation-sample/resolve/${DEER_REV}/dataset`;
  const deerRaw = await get(`${deerBase}/episode_manifest.jsonl`, { maxBytes: 100_000 });
  await save(resolve(LOCAL, '_originals/smartdeer-episode-manifest.jsonl'), deerRaw);
  const episodes = deerRaw.toString().trim().split('\n').map(line => JSON.parse(line));
  for (const ep of episodes) for (const camera of ['left', 'right']) {
    const member = safeKey(ep.cameras[camera]);
    const url = `${deerBase}/${member}`, bytes = await get(url, { maxBytes: 10_000_000 });
    if (sha(bytes) !== ep.sha256[camera]) throw Error('SmartDeer publisher checksum mismatch');
    await record(`small-business/smartdeer/${ep.episode_id}_${camera}.mp4`, bytes, { source_id: 'smartdeer-egocentric', scenario_id: 'RH-SB-001', media_type: 'video/mp4', asset_kind: 'human_demonstration', source_url: url, source_member: `dataset/${member}`, upstream_label: ep.task, upstream_label_status: 'pending_verification', upstream_task_verified: false, upstream_review_status: 'pending', task: ep.task, episode_id: `smartdeer-${ep.episode_id}`, camera_id: camera, source_sha256: ep.sha256[camera] });
  }
  console.log('SmartDeer: 3 stereo episodes / 6 videos prepared');

  const manifest = { schema_version: 1, generated_at: new Date().toISOString(), bucket_id: 'robohood-reference-v1', bucket_public: false, local_media_root: 'data/local/reference-v1', selection: 'Small deterministic convenience sample, not a train/test split or representative benchmark', counts: { assets: assets.length, bytes: assets.reduce((n, a) => n + a.byte_size, 0), manufacturing_images: 24, manufacturing_masks: 12, small_business_video_files: 12, small_business_episodes: 9 }, assets };
  await save(resolve(CATALOG, 'manifest.json'), json(manifest));
  console.log(JSON.stringify(manifest.counts));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e.message); process.exitCode = 1; });
