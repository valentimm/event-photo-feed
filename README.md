# 📸 Event Photo Feed

Aplicação web para um **feed de fotos de evento**: cada pessoa entra com um nome
de usuário, posta fotos rapidamente (com a câmera no celular) e vê um feed único
com todas as fotos, podendo **curtir**, **comentar** e **apagar as próprias fotos**.

## Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS (v4)
- **Backend/dados**: Supabase (Postgres + Storage)
- **Login**: nome de usuário simples (sem senha), persistido em `localStorage`
- **SDK**: `@supabase/supabase-js`

---

## 1. Criar o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto.
2. Aguarde o provisionamento do banco.

## 2. Rodar o SQL (tabelas + storage)

1. No painel do Supabase, vá em **SQL Editor → New query**.
2. Copie todo o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) e cole no editor.
3. Clique em **Run**.

Isso cria as tabelas `users`, `photos`, `likes`, `comments`, o bucket de Storage
público `photos` e as policies de acesso.

## 3. Preencher o `.env`

1. Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

2. No painel do Supabase, vá em **Project Settings → API** e copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
3. Preencha o `.env`:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-public-key
```

## 4. Rodar localmente

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal (geralmente `http://localhost:5173`).

> 💡 Para testar a câmera/upload pelo celular na mesma rede, rode
> `npm run dev -- --host` e acesse o IP da sua máquina pelo telefone.

---

## Como funciona

| Fluxo | Detalhe |
| --- | --- |
| **Entrar** | Digita um nome → cria/recupera o `user` → salva no `localStorage`. |
| **Postar** | Escolhe/tira foto + legenda → upload no bucket `photos` → insere em `photos`. |
| **Curtir** | Toggle na tabela `likes` (único por `photo_id` + `user_id`). |
| **Comentar** | Insere em `comments`, listado abaixo da foto. |
| **Apagar** | Só nas próprias fotos → remove do Storage e da tabela. |
| **Sair/reentrar** | `Sair` limpa o `localStorage`; reentrar é só digitar o nome de novo. |

## Estrutura

```
src/
  lib/
    supabase.ts   # cliente Supabase + nome do bucket
    auth.tsx      # contexto de login por username (localStorage)
    types.ts      # tipos de dados
  components/
    LoginScreen.tsx
    Header.tsx
    Feed.tsx          # busca e lista as fotos
    PhotoCard.tsx     # foto, likes, comentários, apagar
    NewPostForm.tsx   # upload de foto + legenda
  App.tsx
supabase/
  schema.sql      # rode no SQL Editor do Supabase
```

## ⚠️ Observação de segurança

O login é **sem senha** (não usa Supabase Auth), então as policies de RLS são
**públicas** e a regra "só apaga a própria foto" é garantida **na aplicação**.
É adequado para um evento descontraído, mas **não é segurança forte** — qualquer
pessoa com a chave anon e a URL poderia manipular os dados diretamente.
