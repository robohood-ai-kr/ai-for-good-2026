begin;

create table if not exists public.reference_dataset_sources (
  id text primary key,
  name text not null,
  sector text not null check (sector in ('manufacturing', 'small-business')),
  source_url text not null check (source_url like 'https://%'),
  license_id text,
  ingestion_policy text not null,
  metadata jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reference_dataset_assets (
  id text primary key,
  source_id text not null references public.reference_dataset_sources(id),
  scenario_id text not null check (scenario_id in ('RH-MF-001', 'RH-SB-001')),
  bucket_id text not null default 'robohood-reference-v1' check (bucket_id = 'robohood-reference-v1'),
  object_key text not null unique,
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 50000000),
  media_type text not null check (media_type in ('image/jpeg', 'image/png', 'video/mp4')),
  asset_kind text not null,
  upstream_label text,
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected', 'hold')),
  ingestion_status text not null default 'prepared' check (ingestion_status in ('prepared', 'stored')),
  origin_type text not null default 'external_reference' check (origin_type = 'external_reference'),
  metadata jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists reference_assets_source_idx on public.reference_dataset_assets(source_id);
create index if not exists reference_assets_scenario_idx on public.reference_dataset_assets(scenario_id);

alter table public.reference_dataset_sources enable row level security;
alter table public.reference_dataset_assets enable row level security;
-- No anonymous/authenticated read or write policies: dashboard/owner ingestion only.
revoke all on public.reference_dataset_sources from public, anon, authenticated;
revoke all on public.reference_dataset_assets from public, anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('robohood-reference-v1', 'robohood-reference-v1', false, 50000000,
  array['image/jpeg', 'image/png', 'video/mp4'])
on conflict (id) do nothing;

do $$ begin
  if exists (select 1 from storage.buckets where id = 'robohood-reference-v1' and public) then
    raise exception 'Existing bucket is public; refuse to import';
  end if;
end $$;
-- No storage.objects policies are added. All sample media stay private.
commit;
