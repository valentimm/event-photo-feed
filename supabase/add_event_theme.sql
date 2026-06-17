-- Migração: personalização visual por evento (7 cores + logo)
alter table public.events
  add column if not exists color_background text not null default '#09090b',
  add column if not exists color_text text not null default '#ffffff',
  add column if not exists color_text_muted text not null default '#a1a1aa',
  add column if not exists color_primary text not null default '#d946ef',
  add column if not exists color_accent text not null default '#e879f9',
  add column if not exists color_gradient_start text not null default '#701a75',
  add column if not exists color_gradient_end text not null default '#312e81',
  add column if not exists logo_url text;
