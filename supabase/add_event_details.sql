-- Migração: detalhes do evento (tipo, data, descrição) — estilo Dots Memories
alter table public.events
  add column if not exists event_type text not null default 'other',
  add column if not exists event_date date,
  add column if not exists description text;
