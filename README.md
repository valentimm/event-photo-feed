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

## 📱 Versão app (iOS e Android com Capacitor)

O app web é empacotado num app nativo com [Capacitor](https://capacitorjs.com/),
mantendo a mesma base de código. Os projetos nativos ficam em `android/` e `ios/`.

### Pré-requisitos

- **Android**: [Android Studio](https://developer.android.com/studio) (funciona no Windows/Mac/Linux).
- **iOS**: um **Mac** com [Xcode](https://developer.apple.com/xcode/) e CocoaPods
  (`sudo gem install cocoapods`). Não é possível compilar iOS no Windows.
- Contas de desenvolvedor para publicar:
  - **Apple Developer Program** — US$ 99/ano
  - **Google Play Console** — US$ 25 (taxa única)

> O `appId` está definido como `com.valentimm.eventphotofeed` em
> `capacitor.config.ts`. Troque para o seu domínio reverso antes de publicar.

### Fluxo de desenvolvimento

Sempre que mudar o código web, rode o build + sync antes de abrir o projeto nativo:

```bash
npm run sync        # build do web + copia para android/ e ios/
```

Atalhos que já fazem build + sync + abrir a IDE nativa:

```bash
npm run android     # abre o Android Studio
npm run ios         # abre o Xcode (somente no Mac)
```

### Publicar na Google Play (Android)

1. `npm run android` (abre o Android Studio).
2. Em **Build → Generate Signed Bundle / APK → Android App Bundle (.aab)**.
3. Crie/forneça uma **keystore** (guarde bem — ela assina todas as atualizações).
4. Gere o `.aab` em modo **release**.
5. No [Google Play Console](https://play.google.com/console): crie o app, preencha
   a ficha da loja (ícone, descrição, screenshots, política de privacidade) e
   envie o `.aab` em uma trilha (Internal testing → Production).

### Publicar na App Store (iOS) — no Mac

1. `npm run ios` (abre o Xcode).
2. Em **Signing & Capabilities**, selecione seu **Team** (conta Apple Developer).
3. Ajuste **Bundle Identifier**, versão e ícones.
4. Selecione **Any iOS Device** e vá em **Product → Archive**.
5. No Organizer, **Distribute App → App Store Connect**.
6. No [App Store Connect](https://appstoreconnect.apple.com): preencha a ficha,
   anexe o build e envie para revisão.

### Foto e vídeo

O feed aceita **fotos e vídeos** (coluna `media_type` em `photos`). Vídeos têm
limite de **20 segundos**, validado no app após a seleção.

- **Foto**: no app nativo usa o plugin
  [`@capacitor/camera`](https://capacitorjs.com/docs/apis/camera) (Câmera/Galeria);
  na web, faz fallback para `<input type="file" capture>`.
- **Vídeo**: usa `<input type="file" accept="video/*" capture>` (abre a câmera de
  vídeo no celular; funciona na web e no app).

> Se você já tinha criado a tabela `photos` antes, rode
> `supabase/add_media_type.sql` no SQL Editor para adicionar a coluna `media_type`.

As permissões já estão declaradas:

- **Android** (`android/app/src/main/AndroidManifest.xml`): `CAMERA`,
  `READ_MEDIA_IMAGES`, `READ_EXTERNAL_STORAGE`.
- **iOS** (`ios/App/App/Info.plist`): `NSCameraUsageDescription`,
  `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription`.

## ⚠️ Observação de segurança

O login usa **nome e sobrenome + senha simples em texto puro** (não usa Supabase
Auth) e as policies de RLS são **públicas**; a regra "só apaga a própria foto" é
garantida **na aplicação**. É adequado para um evento descontraído, mas **não é
segurança forte** — qualquer pessoa com a chave e a URL poderia manipular os
dados diretamente.
