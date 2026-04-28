# 🚀 本番デプロイ手順（Vercel + GitHub）

## 全体像

```
[ ローカル開発環境 ]
        ↓ git push
[ GitHub リポジトリ ]
        ↓ 自動デプロイ
[ Vercel ホスティング ]
        ↓
[ https://coachpad.vercel.app ]
```

所要時間：**約40分**

---

# STEP 1: GitHub リポジトリの作成（5分）

## 1-1. GitHub にログイン

https://github.com/login

## 1-2. 新しいリポジトリを作成

1. 右上の `+` → **New repository**
2. 入力:
   - **Repository name**: `coachpad` （任意）
   - **Description**: `Coaching platform for endurance athletes`
   - **Visibility**: **Private**（推奨・無料でOK）
   - ❌ Add a README file はチェックなし
   - ❌ .gitignore はチェックなし
   - ❌ License はチェックなし
3. **Create repository**

## 1-3. 表示される URL をメモ

```
https://github.com/あなたのユーザー名/coachpad.git
```

このURL を使って次のステップでpushします。

---

# STEP 2: ローカルリポジトリ初期化と Push（10分）

## 2-1. ターミナルで以下のコマンドを順番に実行

```bash
cd "C:\Users\コアデザイン\OneDrive\デスクトップ\アプリ開発\coaching-platform"

# Git 初期化
git init
git branch -M main

# 設定（初回のみ）
git config user.email "あなたのメール"
git config user.name "あなたの名前"

# ファイル追加
git add .

# コミット
git commit -m "Initial commit"

# リモート追加（URL は STEP 1-3 のもの）
git remote add origin https://github.com/あなたのユーザー名/coachpad.git

# Push
git push -u origin main
```

## 2-2. GitHub の認証

初回 push 時に GitHub のログイン認証を求められます：
- ブラウザで認証 → 完了

## 2-3. 成功確認

GitHub のリポジトリページをリロード → コードが表示されればOK

⚠️ **`.env.local` は .gitignore で除外済**なので環境変数は GitHub に上がりません

---

# STEP 3: Vercel アカウント作成と接続（5分）

## 3-1. Vercel にサインアップ

https://vercel.com/signup

- **「Continue with GitHub」** を選択
- GitHub の認証画面で **Authorize Vercel** をクリック
- アカウント情報入力（無料 Hobby プランで OK）

## 3-2. プロジェクトをインポート

1. Vercel ダッシュボード → **Add New** → **Project**
2. **Import Git Repository** で `coachpad` を選択 → **Import**

## 3-3. プロジェクト設定画面

| 項目 | 設定 |
|------|------|
| **Project Name** | `coachpad`（または任意） |
| **Framework Preset** | `Next.js`（自動検出） |
| **Root Directory** | `./`（デフォルト） |
| **Build Command** | `next build`（デフォルト） |
| **Output Directory** | `.next`（デフォルト） |

⚠️ **まだ Deploy ボタンを押さない**。次の環境変数設定を先に。

---

# STEP 4: Vercel 環境変数の設定（10分）

「**Environment Variables**」セクションで以下を全て登録：

## 4-1. Firebase クライアント

`.env.local` から該当する値を Vercel に貼り付け：

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `coachpad-8ee14.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `coachpad-8ee14` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `coachpad-8ee14.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `1051714841167` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:1051714841167:web:0f83f520949d5ab24b983a` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `G-CFCRPJEBMY` |

## 4-2. Firebase Admin SDK

| Name | Value |
|------|-------|
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | （`.env.local` の長い Base64 文字列） |

## 4-3. Strava

| Name | Value |
|------|-------|
| `STRAVA_CLIENT_ID` | `230773` |
| `STRAVA_CLIENT_SECRET` | `2bef6ed4...` |
| `STRAVA_VERIFY_TOKEN` | `coachpad-webhook-2026-secret` |

## 4-4. Anthropic API

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` |

## 4-5. 本番URL（仮）

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_APP_URL` | `https://coachpad.vercel.app`（後で実際のURLに更新） |

⚠️ **登録後、Deploy ボタンを押す**

---

# STEP 5: 初回デプロイ（5分）

## 5-1. Deploy 実行

**「Deploy」** ボタンをクリック → ビルドログが流れる

## 5-2. 完了

3〜5分後に **「Congratulations!」** 画面が表示される

## 5-3. URL の確認

例: `https://coachpad-abc123.vercel.app`

このURL が本番URLです。

---

# STEP 6: 本番URLで設定を更新（5分）

## 6-1. Vercel 環境変数を更新

Vercel ダッシュボード → Settings → Environment Variables

`NEXT_PUBLIC_APP_URL` を実際のURLに変更：
```
https://coachpad-abc123.vercel.app
```

そして **Redeploy** （Deployments タブ → 最新の Deploy → 右上「...」→ Redeploy）

## 6-2. Firebase Authentication の許可ドメイン追加

1. Firebase Console → Authentication → Settings → Authorized domains
2. **Add domain** で本番URLのドメインを追加：
   ```
   coachpad-abc123.vercel.app
   ```
3. Save

## 6-3. Strava アプリの URL 更新

1. https://www.strava.com/settings/api
2. **Authorization Callback Domain** を更新：
   ```
   coachpad-abc123.vercel.app
   ```
3. **Website** を本番URLに更新：
   ```
   https://coachpad-abc123.vercel.app
   ```

---

# STEP 7: Strava Webhook 購読（5分）

ローカル開発時は Webhook が使えませんが、本番では使えます。
以下のコマンドを **PowerShell** または **コマンドプロンプト** で1回だけ実行：

```bash
curl -X POST "https://www.strava.com/api/v3/push_subscriptions" \
  -F "client_id=230773" \
  -F "client_secret=2bef6ed4e0df99368849f5f94d2cd780fcc844fc" \
  -F "callback_url=https://coachpad-abc123.vercel.app/api/strava/webhook" \
  -F "verify_token=coachpad-webhook-2026-secret"
```

成功すると `{ "id": 123456 }` のようなレスポンス。

これで選手の Strava アクティビティが自動で同期されます。

---

# STEP 8: Firestore セキュリティルールの本番化（10分）

開発用の緩いルールを、本番用の厳格なルールに変更。

Firebase Console → Firestore → ルール:

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

    function getUser(uid) {
      return get(/databases/$(database)/documents/users/$(uid)).data;
    }

    function isCoach() {
      return isSignedIn() && getUser(request.auth.uid).role == 'coach';
    }

    function isAthlete() {
      return isSignedIn() && getUser(request.auth.uid).role == 'athlete';
    }

    function isCoachOf(athleteId) {
      return isCoach() && getUser(athleteId).coachId == request.auth.uid;
    }

    // ============= ユーザー =============
    match /users/{userId} {
      allow read: if isOwner(userId) || isCoachOf(userId) || isCoach();
      allow write: if isOwner(userId);

      match /integrations/{provider} {
        allow read, write: if isOwner(userId);
      }
      match /aiProfile/{doc} {
        allow read, write: if isOwner(userId);
      }
    }

    match /athletes/{athleteId} {
      allow read: if isOwner(athleteId) ||
        (isCoach() && resource.data.coachId == request.auth.uid);
      allow create: if isSignedIn();
      allow update: if isOwner(athleteId) ||
        (isCoach() && resource.data.coachId == request.auth.uid);
    }

    // ============= ワークアウト =============
    match /workouts/{workoutId} {
      allow read: if isOwner(resource.data.athleteId) ||
        (isCoach() && resource.data.coachId == request.auth.uid);
      allow create: if isSignedIn() &&
        (request.resource.data.athleteId == request.auth.uid ||
         request.resource.data.coachId == request.auth.uid);
      allow update, delete: if isOwner(resource.data.athleteId) ||
        (isCoach() && resource.data.coachId == request.auth.uid);
    }

    // ============= プロトコル =============
    match /strengthTemplates/{id} {
      allow read: if isSignedIn();
      allow write: if isCoach() &&
        (resource == null ||
         resource.data.coachId == request.auth.uid ||
         request.resource.data.coachId == request.auth.uid);
    }

    match /strengthAssignments/{id} {
      allow read: if isOwner(resource.data.athleteId) ||
        (isCoach() && resource.data.coachId == request.auth.uid);
      allow create: if isCoach() &&
        request.resource.data.coachId == request.auth.uid;
      allow update: if isOwner(resource.data.athleteId) ||
        (isCoach() && resource.data.coachId == request.auth.uid);
      allow delete: if isCoach() && resource.data.coachId == request.auth.uid;
    }

    // ============= 種目ライブラリ =============
    match /exerciseLibrary/{id} {
      allow read: if isSignedIn();
      allow create: if isCoach();
      allow update, delete: if isCoach() && resource.data.coachId == request.auth.uid;
    }

    // ============= Wellness =============
    match /wellnessEntries/{id} {
      allow read: if isOwner(resource.data.athleteId) ||
        (isCoach() && getUser(resource.data.athleteId).coachId == request.auth.uid);
      allow create: if isOwner(request.resource.data.athleteId);
      allow update: if isOwner(resource.data.athleteId);
      allow delete: if isOwner(resource.data.athleteId);
    }

    // ============= 動作分析 =============
    match /motionAnalyses/{id} {
      allow read: if isOwner(resource.data.athleteId) ||
        (isCoach() && resource.data.coachId == request.auth.uid);
      allow create: if isOwner(request.resource.data.athleteId);
      allow update: if isCoach() && resource.data.coachId == request.auth.uid;
      allow delete: if isOwner(resource.data.athleteId) ||
        (isCoach() && resource.data.coachId == request.auth.uid);
    }

    // ============= チャット =============
    match /chats/{chatId} {
      allow read: if isSignedIn() &&
        request.auth.uid in resource.data.participants;
      allow create: if isSignedIn() &&
        request.auth.uid in request.resource.data.participants;
      allow update: if isSignedIn() &&
        request.auth.uid in resource.data.participants;

      match /messages/{messageId} {
        allow read, create: if isSignedIn() &&
          request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      }
    }

    // ============= 招待 =============
    match /invites/{id} {
      allow read: if true;  // トークンで検証なので全員可
      allow create: if isCoach();
      allow update: if isSignedIn();
    }

    // ============= 通知 =============
    match /notifications/{id} {
      allow read, update: if isOwner(resource.data.recipientId);
      allow create: if isSignedIn();
    }

    // ============= Stravaマップ =============
    match /stravaUserMap/{stravaId} {
      allow read, write: if false;  // Admin SDK のみ
    }
  }
}
```

「**公開**」をクリック

## Storage ルール（チャット画像 + 動画用）

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // チャット画像
    match /chats/{chatId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        request.resource.size < 10 * 1024 * 1024; // 10MB制限
    }

    // 動作分析動画
    match /motionAnalyses/{athleteId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == athleteId &&
        request.resource.size < 100 * 1024 * 1024; // 100MB制限
    }
  }
}
```

---

# STEP 9: 動作確認（5分）

本番URLでテスト：

- [ ] ログイン画面が表示される
- [ ] コーチアカウント（`s.hanawa@coredesign-athlete.com`）でログイン
- [ ] ダッシュボード表示
- [ ] 選手一覧に「テストタロウ」が表示
- [ ] AI 機能（「AIでメニュー作成」など）が動作
- [ ] Strava 連携（再認証が必要）

---

# STEP 10: 独自ドメイン設定（任意・10分）

## 10-1. ドメイン購入

`coachpad.com` や `coredesign-coach.com` などを購入：
- お名前.com
- ムームードメイン
- Google Domains

価格：年 ¥1,500〜¥3,000程度

## 10-2. Vercel に追加

1. Vercel → Project → Settings → **Domains**
2. ドメイン入力 → **Add**
3. 表示される DNS レコード（CNAME）をドメイン管理画面で追加

## 10-3. Strava・Firebase の設定更新

新しいドメインでも認証ドメイン設定を追加：
- Firebase Authentication → 認可ドメイン
- Strava API → Authorization Callback Domain

---

# 🎉 完了！

これで本番運用開始です。

## 今後のフロー

| 操作 | 方法 |
|------|------|
| **コードの変更を本番反映** | `git push` するだけで自動デプロイ |
| **環境変数の変更** | Vercel ダッシュボードで編集 → Redeploy |
| **ロールバック** | Vercel Deployments タブで過去のデプロイに戻れる |
| **アクセス分析** | Vercel Analytics（無料）で確認 |

---

# よくあるトラブル

## ❌ ビルド失敗

- ローカルで `npm run build` して確認
- TypeScript エラーがあれば修正してから push

## ❌ 環境変数が反映されない

- Vercel で変更後、必ず **Redeploy**
- `NEXT_PUBLIC_` プレフィックスのものはクライアントに露出する

## ❌ Firebase 認証が失敗

- Firebase Authentication の認可ドメインに本番URLを追加したか確認

## ❌ Strava 連携できない

- Strava API 設定の Authorization Callback Domain が本番ドメインになっているか
- Vercel の `NEXT_PUBLIC_APP_URL` が本番URLになっているか

何か問題が起きたら、Vercel の **Deployments → Logs** で詳細確認できます。
