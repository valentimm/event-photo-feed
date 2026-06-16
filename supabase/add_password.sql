-- =====================================================================
-- Migração: adicionar senha simples aos usuários
-- ---------------------------------------------------------------------
-- Rode este arquivo no SQL Editor do Supabase SE você já tinha criado a
-- tabela "users" antes da senha existir. Em projetos novos, o schema.sql
-- já inclui a coluna e este arquivo não é necessário.
--
-- Observação: a senha é simples e fica em texto puro (sem hash). Como o
-- login não usa Supabase Auth e as policies são públicas, NÃO é segurança
-- forte — serve apenas para distinguir pessoas com o mesmo nome no evento.
-- =====================================================================

alter table public.users
  add column if not exists password text not null default '';
