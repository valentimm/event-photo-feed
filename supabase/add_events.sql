-- =====================================================================
-- Migração: eventos, memberships, admin e event_id em photos
-- ---------------------------------------------------------------------
-- Rode este arquivo no SQL Editor do Supabase SE você já tinha o schema
-- antigo (feed único). Em projetos novos, o schema.sql já inclui tudo.
-- =====================================================================

-- Eventos
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  event_type  text not null default 'other',
  event_date  date,
  description text,
  color_primary text not null default '#d946ef',
  color_accent text not null default '#e879f9',
  color_gradient_start text not null default '#701a75',
  color_gradient_end text not null default '#312e81',
  logo_url text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Admin (login simples — mesma observação de segurança do app)
create table if not exists public.admins (
  id          uuid primary key default gen_random_uuid(),
  username    text not null unique,
  password    text not null,
  created_at  timestamptz not null default now()
);

insert into public.admins (username, password)
values ('admin', 'admin1322')
on conflict (username) do nothing;

-- Quem entrou em cada evento
create table if not exists public.event_memberships (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  user_id     uuid not null references public.users (id) on delete cascade,
  joined_at   timestamptz not null default now(),
  unique (event_id, user_id)
);

-- Coluna event_id em photos (posts antigos vão para um evento padrão)
alter table public.photos
  add column if not exists event_id uuid references public.events (id) on delete cascade;

-- Evento padrão para posts existentes (só se ainda houver photos sem event_id)
do $$
declare
  default_event_id uuid;
begin
  if exists (select 1 from public.photos where event_id is null) then
    insert into public.events (name, is_active)
    values ('Evento padrão', true)
    returning id into default_event_id;

    update public.photos set event_id = default_event_id where event_id is null;
  end if;
end $$;

create index if not exists photos_event_created_idx
  on public.photos (event_id, created_at desc);

create index if not exists event_memberships_event_idx
  on public.event_memberships (event_id);

-- RLS aberto (mesmo modelo do app)
alter table public.events            enable row level security;
alter table public.admins            enable row level security;
alter table public.event_memberships enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'events' and policyname = 'events_public_all') then
    create policy events_public_all on public.events for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'admins' and policyname = 'admins_public_all') then
    create policy admins_public_all on public.admins for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'event_memberships' and policyname = 'memberships_public_all') then
    create policy memberships_public_all on public.event_memberships for all using (true) with check (true);
  end if;
end $$;
