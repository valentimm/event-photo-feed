# 📸 Event Photo Feed

Aplicação web para **feeds de fotos por evento**: o admin cria eventos e gera
**QR Codes**; convidados escaneiam, entram com nome e sobrenome + senha, postam
fotos/vídeos e veem o feed daquele evento, podendo **curtir**, **comentar** e
**apagar as próprias postagens**.

## Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS (v4) + React Router
- **Backend/dados**: Supabase (Postgres + Storage)
- **Login convidado**: nome e sobrenome + senha simples, persistido em `localStorage`
- **Admin**: painel em `/admin` (usuário `admin`, senha `admin1322`)
- **QR Code**: biblioteca `qrcode` — link `/e/{eventId}`
- **Mobile**: Capacitor (iOS/Android)

---

## 1. Criar o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto.
2. Aguarde o provisionamento do banco.

## 2. Rodar o SQL (tabelas + storage)

1. No painel do Supabase, vá em **SQL Editor → New query**.
2. Copie todo o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) e cole no editor.
3. Clique em **Run**.

Isso cria as tabelas `events`, `admins`, `event_memberships`, `users`, `photos`,
`likes`, `comments`, o bucket de Storage público `photos` e as policies de acesso.

> Se você já tinha o schema antigo, rode também (na ordem):
> `add_password.sql`, `add_media_type.sql`, `add_events.sql`.

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
VITE_APP_URL=http://localhost:5173
```

> Em produção, defina `VITE_APP_URL` com a URL pública (ex.: `https://seu-app.vercel.app`)
> para os QR Codes apontarem corretamente.

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

### Admin (organizador)

1. Acesse `/admin` → login **`admin`** / **`admin1322`**
2. Crie um evento no painel
3. Abra o evento → **QR Code** + link de acesso (`/e/{id}`)
4. Imprima ou exiba o QR no local do evento
5. Veja usuários, posts, curtidas e comentários por evento

### Convidado

1. Escaneia o QR Code → abre `/e/{eventId}`
2. Entra com **nome e sobrenome + senha**
3. Posta fotos/vídeos (vídeo até 20s), curte e comenta
4. Só apaga as próprias postagens

| Fluxo | Detalhe |
| --- | --- |
| **QR Code** | Aponta para `{VITE_APP_URL}/e/{eventId}` |
| **Entrar** | Login por evento; registra em `event_memberships` |
| **Postar** | Upload no Storage `photos/{eventId}/...` + insert em `photos` |
| **Feed** | Só postagens do evento atual |
| **Encerrar** | Admin pode desativar evento (`is_active = false`) |

## Estrutura

```
src/
  lib/
    supabase.ts, auth.tsx, adminAuth.tsx, events.ts, appUrl.ts, types.ts
  pages/
    HomePage.tsx, EventPage.tsx
    admin/AdminLoginPage.tsx, AdminDashboardPage.tsx, AdminEventPage.tsx
  components/
    LoginScreen.tsx, Header.tsx, Feed.tsx, PhotoCard.tsx
    NewPostForm.tsx, QrCodeCard.tsx
  App.tsx         # rotas React Router
supabase/
  schema.sql, add_events.sql, add_password.sql, add_media_type.sql
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
