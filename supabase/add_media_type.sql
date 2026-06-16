-- =====================================================================
-- Migração: suporte a vídeo no feed
-- ---------------------------------------------------------------------
-- Rode este arquivo no SQL Editor do Supabase SE você já tinha criado a
-- tabela "photos" antes do suporte a vídeo. Em projetos novos, o
-- schema.sql já inclui a coluna.
--
-- A coluna "media_type" diz se cada item é 'image' ou 'video', para o
-- feed saber como exibir (img vs video).
-- =====================================================================

alter table public.photos
  add column if not exists media_type text not null default 'image';
