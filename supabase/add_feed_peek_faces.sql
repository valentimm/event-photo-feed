-- Rostos que espiam por trás dos cards no feed
alter table public.events
  add column if not exists feed_peek_faces_enabled boolean not null default false;

create table if not exists public.event_feed_peek_faces (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  name        text not null,
  image_url   text not null,
  image_path  text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists event_feed_peek_faces_event_idx
  on public.event_feed_peek_faces (event_id, sort_order);

alter table public.event_feed_peek_faces enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'event_feed_peek_faces' and policyname = 'event_feed_peek_faces_public_all'
  ) then
    create policy event_feed_peek_faces_public_all on public.event_feed_peek_faces
      for all using (true) with check (true);
  end if;
end $$;
