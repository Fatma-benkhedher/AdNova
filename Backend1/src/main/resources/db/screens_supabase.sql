-- =============================================================================
-- Schéma de référence Supabase — tables robots + screens
-- (colonnes comme dans ton projet : id, nom, robot_id, created_at, address, lat/lng, robot)
-- =============================================================================

create table if not exists public.robots (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.screens (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null unique,
  robot_id    uuid not null references public.robots (id) on delete restrict,
  created_at  timestamptz not null default now(),
  address     text not null default '',
  latitude    double precision,
  longitude   double precision,
  robot       text not null
);

create index if not exists idx_screens_robot_id on public.screens (robot_id);

insert into public.robots (nom) values
  ('Robot-A1'),
  ('Robot-B2'),
  ('Robot-C3'),
  ('Robot-D4'),
  ('Robot-E5')
on conflict (nom) do nothing;
