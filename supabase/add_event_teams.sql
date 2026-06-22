-- =====================================================================
-- Migração: escolha de time por evento
-- ---------------------------------------------------------------------
-- Rode no SQL Editor do Supabase se o projeto já existia antes desta feature.
-- =====================================================================

alter table public.events
  add column if not exists teams_enabled boolean not null default false;

create table if not exists public.event_teams (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  name        text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists event_teams_event_idx on public.event_teams (event_id, sort_order);

alter table public.event_memberships
  add column if not exists team_id uuid references public.event_teams (id) on delete set null;

alter table public.event_teams enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'event_teams' and policyname = 'event_teams_public_all') then
    create policy event_teams_public_all on public.event_teams for all using (true) with check (true);
  end if;
end $$;
