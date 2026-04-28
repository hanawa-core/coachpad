# セットアップ手順

CoachPad（コーチングプラットフォーム）を起動するための手順です。
以下の手順に従って Firebase と Strava の設定を行ってください。

---

## 1. Firebase プロジェクトの作成

### 1-1. プロジェクト作成
1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」→ 任意の名前（例: `coachpad`）→ 続行
3. Google Analytics は任意（不要なら無効でOK）

### 1-2. ウェブアプリ登録
1. プロジェクトトップ → ウェブアイコン `</>` をクリック
2. アプリのニックネーム（例: `coachpad-web`）→ 登録
3. 表示される `firebaseConfig` の値をメモ（後で `.env.local` に設定）

### 1-3. Authentication 有効化
1. 左メニュー「Authentication」→ 「始める」
2. 「Sign-in method」タブ → 「メール / パスワード」を有効化

### 1-4. Firestore 有効化
1. 左メニュー「Firestore Database」→ 「データベースの作成」
2. **本番モード** で開始（後でセキュリティルールを設定）
3. ロケーション: `asia-northeast1`（東京）推奨

### 1-5. Storage 有効化
1. 左メニュー「Storage」→ 「始める」
2. 本番モードで開始

### 1-6. サービスアカウント鍵の取得（サーバー側用）
Strava Webhook など API ルートからFirestoreにアクセスするために必要です。

1. プロジェクト設定（歯車アイコン）→ 「サービスアカウント」タブ
2. 「新しい秘密鍵の生成」→ JSONファイルがダウンロードされる
3. このJSONを Base64 エンコード:
   ```bash
   # PowerShell の場合
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\serviceAccountKey.json"))
   ```
   → 1行の文字列が出力されます

---

## 2. Strava アプリの登録

### 2-1. アプリ作成
1. [Strava API Settings](https://www.strava.com/settings/api) にアクセス
2. 「Create & Manage Your App」をクリック
3. 入力項目:
   - **Application Name**: `CoachPad`
   - **Category**: `Training`
   - **Website**: `http://localhost:3000`（後で本番URLに変更）
   - **Authorization Callback Domain**: `localhost`（後で本番ドメイン）
4. 作成完了後、`Client ID` と `Client Secret` をメモ

### 2-2. Webhook用の検証トークン
任意のランダム文字列を作成（例: `coachpad-webhook-2026-secret`）

---

## 3. 環境変数の設定

`.env.local` を以下のように編集：

```bash
# ---- Firebase クライアント側 ----
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=coachpad.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=coachpad
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=coachpad.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc

# ---- Firebase Admin SDK（サーバー側）----
# 1-6 で取得したサービスアカウントJSONをBase64化した文字列
FIREBASE_SERVICE_ACCOUNT_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50...

# ---- Strava OAuth ----
STRAVA_CLIENT_ID=12345
STRAVA_CLIENT_SECRET=abcdef1234567890
STRAVA_VERIFY_TOKEN=coachpad-webhook-2026-secret

# ---- アプリベースURL ----
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 4. 開発サーバー起動

```bash
cd coaching-platform
npm run dev
```

ブラウザで http://localhost:3000 を開くと `/login` にリダイレクトされます。

---

## 5. 初期データ投入（最初のコーチを作成）

選手は招待リンクで登録できますが、**最初の1人（あなた＝コーチ）** だけは手動で作成する必要があります。

### 方法A: Firebase Console から作成

1. Authentication → ユーザー追加 → メール+パスワードで自分のアカウント作成
2. メモした `uid` をコピー
3. Firestore で `/users/{uid}` ドキュメントを以下のフィールドで作成:
   ```
   uid: "コピーしたuid"
   email: "your@email.com"
   displayName: "あなたの名前"
   role: "coach"
   avatarUrl: null
   coachId: null
   timezone: "Asia/Tokyo"
   targetRaces: []
   createdAt: (タイムスタンプ・自動)
   ```
4. http://localhost:3000/login からログイン → 動作確認

---

## 6. Firestore セキュリティルールの設定

開発が落ち着いてから、Firestore Console → ルールタブで以下を反映：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function getRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function isCoach() {
      return isSignedIn() && getRole() == 'coach';
    }

    // ユーザー本人 or そのコーチ
    function canReadUser(userId) {
      return isOwner(userId) ||
        (isCoach() && get(/databases/$(database)/documents/users/$(userId)).data.coachId == request.auth.uid);
    }

    match /users/{userId} {
      allow read: if canReadUser(userId);
      allow write: if isOwner(userId);

      match /integrations/{provider} {
        allow read, write: if isOwner(userId);
      }
    }

    match /athletes/{athleteId} {
      allow read: if isOwner(athleteId) || (isCoach() && resource.data.coachId == request.auth.uid);
      allow write: if isSignedIn();
    }

    match /workouts/{workoutId} {
      allow read: if isOwner(resource.data.athleteId) ||
        (isCoach() && resource.data.coachId == request.auth.uid);
      allow create: if isSignedIn();
      allow update: if isOwner(resource.data.athleteId) ||
        (isCoach() && resource.data.coachId == request.auth.uid);
      allow delete: if isCoach() && resource.data.coachId == request.auth.uid;
    }

    match /strengthTemplates/{id} {
      allow read: if isSignedIn();
      allow write: if isCoach() && request.resource.data.coachId == request.auth.uid;
    }

    match /strengthAssignments/{id} {
      allow read: if isOwner(resource.data.athleteId) ||
        (isCoach() && resource.data.coachId == request.auth.uid);
      allow create: if isCoach();
      allow update: if isOwner(resource.data.athleteId) ||
        (isCoach() && resource.data.coachId == request.auth.uid);
    }

    match /invites/{id} {
      allow read: if true;  // トークン検証は誰でも可（本番ではAPIルートに移すと安全）
      allow create: if isCoach();
      allow update: if isSignedIn();
    }

    match /notifications/{id} {
      allow read, update: if isOwner(resource.data.recipientId);
      allow create: if isSignedIn();
    }

    match /stravaUserMap/{stravaId} {
      allow read, write: if false;  // Admin SDK のみ
    }
  }
}
```

---

## 7. Strava Webhook 購読（本番デプロイ後）

ローカル開発時は Webhook が使えないため、 `/settings` の **「過去30日を同期」** ボタンで手動同期します。

本番デプロイ後（Vercel等）に以下のコマンドを1回だけ実行してWebhookを購読：

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=YOUR_CLIENT_ID \
  -F client_secret=YOUR_CLIENT_SECRET \
  -F callback_url=https://your-domain.com/api/strava/webhook \
  -F verify_token=coachpad-webhook-2026-secret
```

成功すると `{ "id": 123456 }` のようなレスポンスが返ります。
以降、選手のStravaに新しいアクティビティが追加されるたびに自動で同期されます。

---

## 8. 動作確認チェックリスト

- [ ] `/login` でコーチアカウントにログインできる
- [ ] `/dashboard` にコーチダッシュボードが表示される
- [ ] `/settings/team` で招待リンクを発行できる
- [ ] 別ブラウザで招待リンクを開き、選手として登録できる
- [ ] 選手アカウントで `/workouts/new` からワークアウトを記録できる
- [ ] コーチアカウントで `/calendar/[athleteId]` から計画を作成できる
- [ ] 選手の `/workouts/[id]` でコーチがフィードバックを書ける
- [ ] 選手の `/settings` で「Stravaに接続」ボタンが動作する
- [ ] Strava認証後、「過去30日を同期」で活動が同期される
- [ ] コーチが筋トレテンプレートを作成・選手に割り当てできる
- [ ] 選手が筋トレ実施を報告できる

---

## トラブルシューティング

### ログインしても `/login` にリダイレクトされる
→ Firestore に `/users/{uid}` ドキュメントが存在しない可能性。手順5を確認。

### コーチダッシュボードに選手が表示されない
→ `/athletes/{userId}` ドキュメントが作成されていない可能性。
招待リンク経由で作成されているか確認。

### Strava 「過去30日を同期」でエラー
→ `FIREBASE_SERVICE_ACCOUNT_BASE64` が設定されているか確認。
サーバーを再起動 (`npm run dev` 再実行)。

### ビルド時 `Module not found`
→ `npm install` を再実行。
