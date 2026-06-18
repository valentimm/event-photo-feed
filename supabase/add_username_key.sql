-- Chave normalizada para unicidade (case e acento insensíveis)
create extension if not exists unaccent;

alter table public.users add column if not exists username_key text;

update public.users
set username_key = lower(trim(regexp_replace(unaccent(username), '\s+', ' ', 'g')))
where username_key is null;

alter table public.users alter column username_key set not null;

-- Remove unicidade antiga só no texto exibido (username)
alter table public.users drop constraint if exists users_username_key;

create unique index if not exists users_username_key_unique on public.users (username_key);
