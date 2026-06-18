-- Álbuns por reconhecimento facial
alter table public.events
  add column if not exists face_album_enabled boolean not null default false;

create table if not exists public.event_faces (
  id                    uuid primary key default gen_random_uuid(),
  event_id              uuid not null references public.events (id) on delete cascade,
  name                  text not null,
  reference_image_url   text not null,
  reference_image_path  text,
  descriptor            jsonb not null,
  created_at            timestamptz not null default now()
);

create index if not exists event_faces_event_idx on public.event_faces (event_id);

create table if not exists public.photo_face_matches (
  id            uuid primary key default gen_random_uuid(),
  photo_id      uuid not null references public.photos (id) on delete cascade,
  event_face_id uuid not null references public.event_faces (id) on delete cascade,
  confidence    real not null default 0,
  created_at    timestamptz not null default now(),
  unique (photo_id, event_face_id)
);

create index if not exists photo_face_matches_face_idx on public.photo_face_matches (event_face_id);
create index if not exists photo_face_matches_photo_idx on public.photo_face_matches (photo_id);

alter table public.event_faces enable row level security;
alter table public.photo_face_matches enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'event_faces' and policyname = 'event_faces_public_all') then
    create policy event_faces_public_all on public.event_faces for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'photo_face_matches' and policyname = 'photo_face_matches_public_all') then
    create policy photo_face_matches_public_all on public.photo_face_matches for all using (true) with check (true);
  end if;
end $$;
