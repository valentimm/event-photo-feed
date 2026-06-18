-- Desafios por evento
alter table public.events
  add column if not exists challenges_enabled boolean not null default false,
  add column if not exists challenges_title text not null default 'Desafios';

create table if not exists public.event_challenges (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  text        text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists event_challenges_event_idx on public.event_challenges (event_id, sort_order);

create table if not exists public.challenge_completions (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references public.event_challenges (id) on delete cascade,
  user_id       uuid not null references public.users (id) on delete cascade,
  completed_at  timestamptz not null default now(),
  unique (challenge_id, user_id)
);

alter table public.event_challenges enable row level security;
alter table public.challenge_completions enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'event_challenges' and policyname = 'event_challenges_public_all') then
    create policy event_challenges_public_all on public.event_challenges for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'challenge_completions' and policyname = 'challenge_completions_public_all') then
    create policy challenge_completions_public_all on public.challenge_completions for all using (true) with check (true);
  end if;
end $$;
