# API 設定値一覧

このドキュメントは、Cloudflare Pages Functions の `/api/config` エンドポイントが返す設定値の一覧と、その用途を説明します。

## 概要

`/api/config` エンドポイントは、LIFF アプリケーションに必要な設定情報を配信します。これにより、フロントエンドコードに設定をハードコーディングする必要がなくなり、環境ごとの設定管理が容易になります。

## エンドポイント

```
GET /api/config
```

## レスポンス形式

```json
{
  "liffId": "1234567890-abcdefgh",
  "apiBaseUrl": "https://yomikikase-planner.pages.dev/api",
  "environment": "production"
}
```

## 設定値の詳細

### `liffId`

- **型**: `string | null`
- **説明**: LINE LIFF アプリケーションの ID
- **取得元**: 環境変数 `LIFF_ID`
- **デフォルト値**: `null`（環境変数が未設定の場合）
- **用途**: LIFF SDK の初期化時に使用
- **例**: `"1234567890-abcdefgh"`

**LIFF アプリケーションでの使用例**:
```javascript
// /api/config から設定を取得
const response = await fetch('/api/config');
const config = await response.json();

// LIFF SDK の初期化
if (config.liffId) {
  await liff.init({ liffId: config.liffId });
} else {
  console.error('LIFF ID が設定されていません');
}
```

### `apiBaseUrl`

- **型**: `string`
- **説明**: API のベース URL（同一オリジンの `/api` パス）
- **取得元**: リクエストの URL から動的に生成（`${protocol}//${host}/api`）
- **用途**: フロントエンドから API を呼び出す際のベース URL
- **例**: 
  - 本番環境: `"https://yomikikase-planner.pages.dev/api"`
  - ローカル開発: `"http://localhost:8788/api"`

**LIFF アプリケーションでの使用例**:
```javascript
// /api/config から設定を取得
const response = await fetch('/api/config');
const config = await response.json();

// API 呼び出し
const healthResponse = await fetch(`${config.apiBaseUrl}/health`);
const gasHealthResponse = await fetch(`${config.apiBaseUrl}/gas/health`);
```

### `environment`

- **型**: `string`
- **説明**: 環境名（開発環境、本番環境などを識別）
- **取得元**: 環境変数 `ENVIRONMENT_NAME`
- **デフォルト値**: `"production"`（環境変数が未設定の場合）
- **用途**: デバッグ情報の表示制御、環境別の動作切り替えなど
- **例**: 
  - `"development"` - 開発環境
  - `"staging"` - ステージング環境
  - `"production"` - 本番環境

**LIFF アプリケーションでの使用例**:
```javascript
// /api/config から設定を取得
const response = await fetch('/api/config');
const config = await response.json();

// 開発環境のみデバッグ情報を表示
if (config.environment === 'development') {
  console.log('Debug mode enabled');
  showDebugPanel();
}
```

## 環境変数の設定

### Cloudflare Pages での設定方法

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. 「Workers & Pages」→ `yomikikase-planner` プロジェクトを選択
3. 「Settings」→「Environment variables」を選択
4. 以下の環境変数を追加：

| 変数名 | 説明 | 必須 | 例 |
|--------|------|------|-----|
| `LIFF_ID` | LINE LIFF アプリケーションの ID | オプション（未設定時は `null`） | `1234567890-abcdefgh` |
| `ENVIRONMENT_NAME` | 環境名 | オプション | `production` |

### ローカル開発での設定方法

`.dev.vars` ファイルを作成（Git 管理対象外）:

```bash
# .dev.vars
LIFF_ID=1234567890-abcdefgh
ENVIRONMENT_NAME=development
```

## セキュリティ

### CORS 対応

`/api/config` エンドポイントは、以下の CORS ヘッダーを返します：

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

これにより、任意のオリジンからの読み取りアクセスが可能です。設定情報は公開されても問題ない値のみを含むため、このような設定となっています。

### セキュリティヘッダー

以下のセキュリティヘッダーを設定しています：

- `X-Content-Type-Options: nosniff` - MIME タイプスニッフィング防止
- `X-Frame-Options: DENY` - クリックジャッキング対策
- `Content-Security-Policy: default-src 'none'` - XSS 対策
- `Referrer-Policy: no-referrer` - リファラー情報の保護

## 今後の拡張予定

以下の設定値を追加する可能性があります：

- `gasApiUrl`: GAS Web App の URL（プロキシ経由のため現状は不要）
- `features`: 機能フラグ（A/B テスト、段階的リリースなど）
- `version`: アプリケーションバージョン
- `supportEmail`: サポート窓口メールアドレス

## 関連ドキュメント

- [Cloudflare Pages Functions README](../functions/README.md)
- [Cloudflare Secrets 設定手順](./cloudflare-secrets-setup.md)
- [Cloudflare Pages セットアップ手順](./cloudflare-pages-setup.md)
