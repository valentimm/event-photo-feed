-- Migração: fundo e cores de texto por evento (tema claro estilo convite)
alter table public.events
  add column if not exists color_background text not null default '#09090b',
  add column if not exists color_text text not null default '#ffffff',
  add column if not exists color_text_muted text not null default '#a1a1aa';
