# Cloudflare Pages Functions

このディレクトリには、Cloudflare Pages Functions の実装が含まれています。

## 📁 ディレクトリ構造

```
functions/
└── api/
    ├── health.js      # ヘルスチェック API
    ├── config.js      # 設定配信 API
    └── gas/
        └── health.js  # GAS Web App へのプロキシ（ヘルスチェック）
```

## 🎯 Pages Functions とは

Cloudflare Pages Functions は、Cloudflare Pages で動的な API エンドポイントを実装するためのサーバーレス関数です。

### 主な特徴

- **ゼロ設定**: ファイルベースルーティングで自動的にエンドポイントが作成される
- **高速**: Cloudflare の Edge ネットワークで実行
- **スケーラブル**: 自動スケーリング、リクエストごとの課金
- **統合**: 静的コンテンツと同一オリジンで配信（CORS 不要）

## 📄 実装済み API

### `/api/health`

ヘルスチェック用のエンドポイント。API が正常に動作しているかを確認するために使用します。

**ファイル**: `functions/api/health.js`

**リクエスト**:
```bash
GET /api/health
```

**レスポンス**:
```json
{
  "ok": true
}
```

**HTTP ステータス**: 200

**ヘッダー**:
- `Access-Control-Allow-Origin: *` - CORS 対応
- `X-Content-Type-Options: nosniff` - セキュリティヘッダー
- `X-Frame-Options: DENY` - クリックジャッキング対策
- `Content-Security-Policy: default-src 'none'` - XSS 対策
- `Referrer-Policy: no-referrer` - リファラー情報の保護

### `/api/config`

LIFF アプリケーションに必要な設定情報を配信するエンドポイント。

**ファイル**: `functions/api/config.js`

**リクエスト**:
```bash
GET /api/config
```

**レスポンス**:
```json
{
  "liffId": "1234567890-abcdefgh",
  "apiBaseUrl": "https://yomikikase-planner.pages.dev/api",
  "environment": "production"
}
```

**HTTP ステータス**: 200

**設定値の説明**:
- `liffId`: LINE LIFF アプリケーションの ID（環境変数 `LIFF_ID` から取得、未設定時は `null`）
- `apiBaseUrl`: API のベース URL（同一オリジンの `/api` パス）
- `environment`: 環境名（環境変数 `ENVIRONMENT_NAME` から取得、デフォルトは `production`）

**環境変数**:
- `LIFF_ID`: LINE LIFF アプリケーションの ID（オプション、未設定時は `null`）
- `ENVIRONMENT_NAME`: 環境名（オプション、デフォルト: `production`）

**ヘッダー**:
- `Access-Control-Allow-Origin: *` - CORS 対応
- `X-Content-Type-Options: nosniff` - セキュリティヘッダー
- `X-Frame-Options: DENY` - クリックジャッキング対策
- `Content-Security-Policy: default-src 'none'` - XSS 対策
- `Referrer-Policy: no-referrer` - リファラー情報の保護

### `/api/gas/health`

Google Apps Script Web App のヘルスチェック API へのプロキシ。

**ファイル**: `functions/api/gas/health.js`

**リクエスト**:
```bash
GET /api/gas/health
```

**レスポンス（成功時）**:
```json
{
  "ok": true,
  "timestamp": "2020-01-01T00:00:00.000Z",
  "message": "yomikikase-planner GAS Web App is running"
}
```

**HTTP ステータス**: 200

**レスポンス（エラー時）**:
```json
{
  "ok": false,
  "error": "Failed to communicate with upstream service",
  "message": "..."
}
```

**HTTP ステータス**: 502 (Bad Gateway)

**環境変数**:
- `GAS_BASE_URL`: GAS Web App の URL（例: `https://script.google.com/macros/s/.../exec`）
- `GAS_API_KEY`: GAS との通信に使用する API キー

**セットアップ**: [Cloudflare Secrets 設定手順](../docs/cloudflare-secrets-setup.md) を参照

### `/api/gas/surveys`

アクティブなアンケート本体と候補日一覧を取得する GAS プロキシ。

**ファイル**: `functions/api/gas/surveys.js`

**リクエスト**:
```bash
GET /api/gas/surveys
```

**レスポンス（成功時）**:
```json
{
  "ok": true,
  "survey": {
    "surveyId": "survey_001",
    "title": "1月の読み聞かせ参加希望調査",
    "status": "active"
  },
  "dates": [
    {
      "surveyDateId": "date_001",
      "label": "1月15日(水) 10:00〜 年少",
      "targetGrade": "年少"
    }
  ]
}
```

### `/api/users`

LINE ID トークンを検証したうえで、現在のユーザー情報を取得・登録するエンドポイント。

**ファイル**: `functions/api/users.js`

**認証**:
- `Authorization: Bearer <LIFF ID token>` が必須
- Cloudflare から LINE verify API を呼び出して `sub` を検証

**GET /api/users**:
- 現在の `lineUserId` に対応する年度プロフィールを返す

**POST /api/users**:
```json
{
  "childName": "山田 太郎",
  "grade": "年少",
  "class": "さくら組"
}
```

### `/api/gas/responses`

LINE ID トークンを検証したうえで、回答を `Responses` シートへ保存する GAS プロキシ。

**ファイル**: `functions/api/gas/responses.js`

**認証**:
- `Authorization: Bearer <LIFF ID token>` が必須

**リクエスト**:
```json
{
  "surveyId": "survey_001",
  "surveyDateId": "date_001",
  "answer": "可",
  "notes": ""
}
```

**保存ポリシー**:
- 同一 `lineUserId + surveyDateId` の再送は既存行を更新する
- `surveyDateId` が現在の `activeSurveyId` に属さない場合は拒否する

## 🔧 実装方法

### 基本構造

Cloudflare Pages Functions は、ファイルパスに基づいて自動的にルーティングされます。

```
functions/api/health.js  →  GET /api/health
functions/api/users.js   →  GET /api/users
```

### 関数の定義

各ファイルは `onRequest` または HTTP メソッド別の関数をエクスポートします。

```javascript
// すべての HTTP メソッドに対応
export async function onRequest({ request }) {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// または、HTTP メソッド別に定義
export async function onRequestGet({ request }) {
  // GET リクエストの処理
}

export async function onRequestPost({ request }) {
  // POST リクエストの処理
}
```

### パラメータ

関数は `context` オブジェクトを受け取ります：

```javascript
export async function onRequest(context) {
  const {
    request,    // Request オブジェクト
    env,        // 環境変数
    params,     // URL パラメータ
    data,       // ミドルウェア間のデータ共有
  } = context;
  
  // 処理...
}
```

## 🛡️ ルーティング制御

`liff/_routes.json` により、Functions の起動範囲を制御しています：

```json
{
  "version": 1,
  "include": ["/api/*"],
  "exclude": []
}
```

これにより：
- `/api/*` へのリクエスト → Functions が処理
- `/` や `/index.html` などの静的ファイル → Edge から直接配信（Functions を起動しない）

## 🧪 ローカル開発

Cloudflare の Wrangler CLI を使用してローカルで開発・テストできます：

```bash
# Wrangler のインストール（未インストールの場合）
npm install -g wrangler

# Pages プロジェクトのローカル実行
wrangler pages dev liff

# ブラウザで確認
# http://localhost:8788/
# http://localhost:8788/api/health
```

## 🔐 認証に必要な環境変数

| 変数名 | 説明 |
|--------|------|
| `GAS_BASE_URL` | GAS Web App の URL |
| `GAS_API_KEY` | GAS との通信用 API キー |
| `LIFF_ID` | LIFF 初期化に使う ID |
| `LINE_LOGIN_CHANNEL_ID` | LINE ID トークン検証用のチャネル ID |

`LINE_LOGIN_CHANNEL_ID` が未設定の場合、`/api/users` と `/api/gas/responses` は 500 エラーになります。

## 🔗 参考リンク

- [Cloudflare Pages Functions ドキュメント](https://developers.cloudflare.com/pages/functions/)
- [Pages Functions ルーティング](https://developers.cloudflare.com/pages/functions/routing/)
- [_routes.json の設定](https://developers.cloudflare.com/pages/functions/routing/#function-invocation-routes)
