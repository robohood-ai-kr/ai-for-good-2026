// Default: generate local SQL only. --apply requires an explicitly named, linked demo project.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, safeKey } from './prepare-reference-data.mjs';

const LOCAL = resolve(ROOT, 'data/local/reference-v1');
export const sqlLiteral = value => `'${String(value).replaceAll("'", "''")}'`;
export function validate(catalog, manifest) {
  const sources = new Map(catalog.sources.map(s => [s.id, s]));
  const ids = new Set(), keys = new Set();
  if (manifest.bucket_public !== false || manifest.bucket_id !== 'robohood-reference-v1') throw Error('Must use private reference bucket');
  for (const a of manifest.assets) {
    if (sources.get(a.source_id)?.ingestion_policy !== 'private_sample') throw Error(`Source not approved for sample import: ${a.source_id}`);
    if (a.bucket_id !== manifest.bucket_id) throw Error('Asset bucket differs from manifest');
    safeKey(a.object_key);
    if (ids.has(a.id) || keys.has(a.object_key)) throw Error('Duplicate asset');
    ids.add(a.id); keys.add(a.object_key);
    if (!/^[a-f0-9]{64}$/.test(a.sha256) || a.byte_size <= 0 || a.byte_size > 50_000_000) throw Error('Invalid file integrity metadata');
    if (a.origin_type !== 'external_reference' || a.review_status !== 'pending') throw Error('Never fabricate local collection or approved review');
    if (a.media?.streams?.some(s => s.codec_type === 'audio')) throw Error('Audio must not be included in this seed');
  }
  if (ids.size !== manifest.counts.assets) throw Error('Manifest count mismatch');
}

export function seedSQL(catalog, manifest) {
  validate(catalog, manifest);
  const sources = sqlLiteral(JSON.stringify(catalog.sources)), assets = sqlLiteral(JSON.stringify(manifest.assets));
  return `begin;
insert into public.reference_dataset_sources (id,name,sector,source_url,license_id,ingestion_policy,metadata)
select s->>'id',s->>'name',s->>'sector',s->>'source_url',s->>'license_id',s->>'ingestion_policy',s
from jsonb_array_elements(${sources}::jsonb) s
on conflict (id) do nothing;
create temporary table robohood_reference_seed_assets on commit drop as
select value as metadata from jsonb_array_elements(${assets}::jsonb);
do $$ begin
 if exists (
   select 1 from public.reference_dataset_assets a
   join robohood_reference_seed_assets s on s.metadata->>'id'=a.id
   where a.sha256 <> s.metadata->>'sha256' or a.object_key <> s.metadata->>'object_key'
 ) then raise exception 'Existing asset differs; refuse overwrite'; end if;
end $$;
insert into public.reference_dataset_assets
(id,source_id,scenario_id,bucket_id,object_key,sha256,byte_size,media_type,asset_kind,upstream_label,review_status,origin_type,metadata)
select a->>'id',a->>'source_id',a->>'scenario_id',a->>'bucket_id',a->>'object_key',a->>'sha256',
(a->>'byte_size')::bigint,a->>'media_type',a->>'asset_kind',a->>'upstream_label','pending','external_reference',a
from jsonb_array_elements(${assets}::jsonb) a
on conflict (id) do nothing;
commit;\n`;
}

export const VERIFY_SQL = `select
 (select count(*) from public.reference_dataset_sources) as source_count,
 (select count(*) from public.reference_dataset_assets) as asset_count,
 (select count(*) from public.reference_dataset_assets where ingestion_status='stored') as stored_asset_count,
 (select count(*) from storage.objects where bucket_id='robohood-reference-v1') as storage_object_count,
 (select public from storage.buckets where id='robohood-reference-v1') as bucket_public,
 (select bool_and(relrowsecurity) from pg_class where oid in ('public.reference_dataset_sources'::regclass,'public.reference_dataset_assets'::regclass)) as rls_enabled,
 has_table_privilege('anon','public.reference_dataset_assets','select') as anon_can_select,
 has_table_privilege('authenticated','public.reference_dataset_assets','select') as authenticated_can_select;\n`;

function cli(args, jsonOutput = false) {
  // Errors intentionally do not include stdout/stderr: never leak CLI credentials.
  try { const out = execFileSync('supabase', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 5_000_000 }); return jsonOutput ? JSON.parse(out) : out; }
  catch { throw Error(`Supabase command failed (${args.slice(0, 2).join(' ')}); inspect the dashboard before retrying`); }
}

async function main() {
  const catalog = JSON.parse(await readFile(resolve(ROOT, 'data/reference-v1/sources.json')));
  const manifest = JSON.parse(await readFile(resolve(ROOT, 'data/reference-v1/manifest.json')));
  validate(catalog, manifest);
  for (const a of manifest.assets) {
    const b = await readFile(resolve(LOCAL, safeKey(a.object_key)));
    if (b.length !== a.byte_size || createHash('sha256').update(b).digest('hex') !== a.sha256) throw Error(`Local checksum mismatch: ${a.id}`);
  }
  await mkdir(LOCAL, { recursive: true });
  const seed = resolve(LOCAL, 'seed.sql'), verify = resolve(LOCAL, 'verify.sql');
  await writeFile(seed, seedSQL(catalog, manifest)); await writeFile(verify, VERIFY_SQL);
  if (!process.argv.includes('--apply')) { console.log(`Prepared ${catalog.sources.length} catalog sources / ${manifest.assets.length} assets. No cloud writes. SQL: data/local/reference-v1/{seed,verify}.sql`); return; }
  const ref = process.argv[process.argv.indexOf('--project-ref') + 1];
  if (!process.argv.includes('--project-ref') || !/^[a-z]{20}$/.test(ref || '')) throw Error('--apply requires --project-ref <approved project ref>');
  const linked = (await readFile(resolve(ROOT, 'supabase/.temp/project-ref'), 'utf8')).trim();
  if (linked !== ref) throw Error('Linked project does not match explicit target');
  const projects = cli(['projects', 'list', '--output', 'json'], true);
  const target = projects.find(p => p.id === ref);
  if (!target || target.name !== 'robohood-v1-data' || target.status !== 'ACTIVE_HEALTHY') throw Error('Target is not the healthy robohood-v1-data demo project');
  cli(['db', 'query', '--linked', '--file', 'supabase/migrations/202609180001_reference_data_v1.sql']);
  cli(['db', 'query', '--linked', '--file', seed]);
  for (const [index, a] of manifest.assets.entries()) {
    cli(['storage', 'cp', resolve(LOCAL, a.object_key), `ss:///${a.bucket_id}/${a.object_key}`, '--linked', '--content-type', a.media_type]);
    console.log(`Uploaded ${index + 1}/${manifest.assets.length}: ${a.object_key}`);
  }
  const complete = resolve(LOCAL, 'mark-stored.sql');
  // Mark only this manifest, only when the Storage row exists; do not alter review status.
  await writeFile(complete, `update public.reference_dataset_assets a set ingestion_status='stored'
where a.id in (${manifest.assets.map(a => sqlLiteral(a.id)).join(',')})
and exists (select 1 from storage.objects o where o.bucket_id=a.bucket_id and o.name=a.object_key);`);
  cli(['db', 'query', '--linked', '--file', complete]);
  const result = cli(['db', 'query', '--linked', '--file', verify, '--output', 'json'], true);
  await writeFile(resolve(LOCAL, 'remote-verification.json'), `${JSON.stringify({ checked_at: new Date().toISOString(), project_ref: ref, result }, null, 2)}\n`);
  const rows = Array.isArray(result) ? result : result.rows ?? result.result ?? result.data;
  const r = Array.isArray(rows) ? rows[0] : null;
  if (!r || Number(r.source_count) !== catalog.sources.length || Number(r.asset_count) !== manifest.assets.length || Number(r.stored_asset_count) !== manifest.assets.length || Number(r.storage_object_count) !== manifest.assets.length || r.bucket_public !== false || r.rls_enabled !== true || r.anon_can_select !== false || r.authenticated_can_select !== false) throw Error('Remote count/privacy verification failed; inspect data/local/reference-v1/remote-verification.json');
  console.log(JSON.stringify(result));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e.message); process.exitCode = 1; });
