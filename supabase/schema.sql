-- =====================================================================
-- Event Photo Feed - Schema do Supabase
-- ---------------------------------------------------------------------
-- Rode este arquivo no SQL Editor do seu projeto Supabase.
-- (Dashboard -> SQL Editor -> New query -> cole tudo -> Run)
--
-- Observacao de seguranca: o login do app e por nome de usuario, SEM
-- senha (nao usa Supabase Auth). Por isso as policies de RLS sao
-- publicas e a regra "so apaga a propria foto" e garantida na aplicacao.
-- Adequado para um evento, mas NAO e seguranca forte.
-- =====================================================================

-- Extensao para gerar UUIDs
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  event_type  text not null default 'other',
  event_date  date,
  description text,
  color_background text not null default '#09090b',
  color_text text not null default '#ffffff',
  color_text_muted text not null default '#a1a1aa',
  color_primary text not null default '#d946ef',
  color_accent text not null default '#e879f9',
  color_gradient_start text not null default '#701a75',
  color_gradient_end text not null default '#312e81',
  logo_url text,
  is_active   boolean not null default true,
  challenges_enabled boolean not null default false,
  challenges_title text not null default 'Desafios',
  face_album_enabled boolean not null default false,
  feed_peek_faces_enabled boolean not null default false,
  teams_enabled boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.admins (
  id          uuid primary key default gen_random_uuid(),
  username    text not null unique,
  password    text not null,
  created_at  timestamptz not null default now()
);

insert into public.admins (username, password)
values ('admin', 'admin1322')
on conflict (username) do nothing;

create table if not exists public.event_teams (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  name        text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.event_memberships (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  user_id     uuid not null references public.users (id) on delete cascade,
  team_id     uuid references public.event_teams (id) on delete set null,
  joined_at   timestamptz not null default now(),
  unique (event_id, user_id)
);

create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  username    text not null,
  username_key text not null,
  password    text not null default '',
  created_at  timestamptz not null default now()
);

create unique index if not exists users_username_key_unique on public.users (username_key);

create table if not exists public.photos (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  user_id     uuid not null references public.users (id) on delete cascade,
  image_url   text not null,
  image_path  text,                       -- caminho no Storage (para apagar o arquivo)
  media_type  text not null default 'image',  -- 'image' ou 'video'
  caption     text,
  created_at  timestamptz not null default now()
);

create table if not exists public.likes (
  id          uuid primary key default gen_random_uuid(),
  photo_id    uuid not null references public.photos (id) on delete cascade,
  user_id     uuid not null references public.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (photo_id, user_id)
);

create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  photo_id    uuid not null references public.photos (id) on delete cascade,
  user_id     uuid not null references public.users (id) on delete cascade,
  text        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.event_challenges (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  text        text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.challenge_completions (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references public.event_challenges (id) on delete cascade,
  user_id       uuid not null references public.users (id) on delete cascade,
  completed_at  timestamptz not null default now(),
  unique (challenge_id, user_id)
);

create table if not exists public.event_faces (
  id                    uuid primary key default gen_random_uuid(),
  event_id              uuid not null references public.events (id) on delete cascade,
  name                  text not null,
  reference_image_url   text not null,
  reference_image_path  text,
  descriptor            jsonb not null,
  created_at            timestamptz not null default now()
);

create table if not exists public.photo_face_matches (
  id            uuid primary key default gen_random_uuid(),
  photo_id      uuid not null references public.photos (id) on delete cascade,
  event_face_id uuid not null references public.event_faces (id) on delete cascade,
  confidence    real not null default 0,
  created_at    timestamptz not null default now(),
  unique (photo_id, event_face_id)
);

create table if not exists public.event_feed_peek_faces (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  name        text not null,
  image_url   text not null,
  image_path  text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- Indices uteis para o feed
create index if not exists photos_event_created_idx on public.photos (event_id, created_at desc);
create index if not exists photos_created_at_idx on public.photos (created_at desc);
create index if not exists likes_photo_id_idx on public.likes (photo_id);
create index if not exists comments_photo_id_idx on public.comments (photo_id);
create index if not exists event_memberships_event_idx on public.event_memberships (event_id);
create index if not exists event_challenges_event_idx on public.event_challenges (event_id, sort_order);
create index if not exists event_teams_event_idx on public.event_teams (event_id, sort_order);
create index if not exists event_faces_event_idx on public.event_faces (event_id);
create index if not exists photo_face_matches_face_idx on public.photo_face_matches (event_face_id);
create index if not exists photo_face_matches_photo_idx on public.photo_face_matches (photo_id);
create index if not exists event_feed_peek_faces_event_idx on public.event_feed_peek_faces (event_id, sort_order);

-- ---------------------------------------------------------------------
-- Row Level Security (publico - sem Supabase Auth)
-- ---------------------------------------------------------------------

alter table public.users            enable row level security;
alter table public.events           enable row level security;
alter table public.admins           enable row level security;
alter table public.event_memberships enable row level security;
alter table public.photos           enable row level security;
alter table public.likes            enable row level security;
alter table public.comments         enable row level security;
alter table public.event_teams enable row level security;
alter table public.event_challenges enable row level security;
alter table public.challenge_completions enable row level security;
alter table public.event_faces enable row level security;
alter table public.photo_face_matches enable row level security;
alter table public.event_feed_peek_faces enable row level security;

-- Policies abertas para a chave anon (leitura/escrita liberadas).
do $$
begin
  -- users
  if not exists (select 1 from pg_policies where tablename = 'users' and policyname = 'users_public_all') then
    create policy users_public_all on public.users for all using (true) with check (true);
  end if;
  -- events
  if not exists (select 1 from pg_policies where tablename = 'events' and policyname = 'events_public_all') then
    create policy events_public_all on public.events for all using (true) with check (true);
  end if;
  -- admins
  if not exists (select 1 from pg_policies where tablename = 'admins' and policyname = 'admins_public_all') then
    create policy admins_public_all on public.admins for all using (true) with check (true);
  end if;
  -- event_memberships
  if not exists (select 1 from pg_policies where tablename = 'event_memberships' and policyname = 'memberships_public_all') then
    create policy memberships_public_all on public.event_memberships for all using (true) with check (true);
  end if;
  -- photos
  if not exists (select 1 from pg_policies where tablename = 'photos' and policyname = 'photos_public_all') then
    create policy photos_public_all on public.photos for all using (true) with check (true);
  end if;
  -- likes
  if not exists (select 1 from pg_policies where tablename = 'likes' and policyname = 'likes_public_all') then
    create policy likes_public_all on public.likes for all using (true) with check (true);
  end if;
  -- comments
  if not exists (select 1 from pg_policies where tablename = 'comments' and policyname = 'comments_public_all') then
    create policy comments_public_all on public.comments for all using (true) with check (true);
  end if;
  -- event_teams
  if not exists (select 1 from pg_policies where tablename = 'event_teams' and policyname = 'event_teams_public_all') then
    create policy event_teams_public_all on public.event_teams for all using (true) with check (true);
  end if;
  -- event_challenges
  if not exists (select 1 from pg_policies where tablename = 'event_challenges' and policyname = 'event_challenges_public_all') then
    create policy event_challenges_public_all on public.event_challenges for all using (true) with check (true);
  end if;
  -- challenge_completions
  if not exists (select 1 from pg_policies where tablename = 'challenge_completions' and policyname = 'challenge_completions_public_all') then
    create policy challenge_completions_public_all on public.challenge_completions for all using (true) with check (true);
  end if;
  -- event_faces
  if not exists (select 1 from pg_policies where tablename = 'event_faces' and policyname = 'event_faces_public_all') then
    create policy event_faces_public_all on public.event_faces for all using (true) with check (true);
  end if;
  -- photo_face_matches
  if not exists (select 1 from pg_policies where tablename = 'photo_face_matches' and policyname = 'photo_face_matches_public_all') then
    create policy photo_face_matches_public_all on public.photo_face_matches for all using (true) with check (true);
  end if;
  -- event_feed_peek_faces
  if not exists (select 1 from pg_policies where tablename = 'event_feed_peek_faces' and policyname = 'event_feed_peek_faces_public_all') then
    create policy event_feed_peek_faces_public_all on public.event_feed_peek_faces for all using (true) with check (true);
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Storage: bucket publico "photos"
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

-- Policies de storage abertas para o bucket "photos".
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'photos_storage_read') then
    create policy photos_storage_read on storage.objects
      for select using (bucket_id = 'photos');
  end if;
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'photos_storage_insert') then
    create policy photos_storage_insert on storage.objects
      for insert with check (bucket_id = 'photos');
  end if;
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'photos_storage_delete') then
    create policy photos_storage_delete on storage.objects
      for delete using (bucket_id = 'photos');
  end if;
end $$;
