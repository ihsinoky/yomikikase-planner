# Cloudflare Pages Secrets 設定手順

このドキュメントは、GAS Web App へのプロキシAPI を設定するために必要な Cloudflare Pages の環境変数/Secrets の設定手順を説明します。

## 目次

- [前提条件](#前提条件)
- [1. GAS API キーの生成](#1-gas-api-キーの生成)
- [2. GAS スクリプトプロパティの設定](#2-gas-スクリプトプロパティの設定)
- [3. Cloudflare Pages 環境変数の設定](#3-cloudflare-pages-環境変数の設定)
- [4. 動作確認](#4-動作確認)
- [5. トラブルシューティング](#5-トラブルシューティング)

---

## 前提条件

- GAS Web App がデプロイ済みであること
- GAS Web App の URL を取得済みであること（例: `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`）
- Cloudflare Pages プロジェクトが作成済みであること

---

## 1. GAS API キーの生成

API キーは、Cloudflare Pages Functions から GAS への通信を認証するために使用します。

### 1.1. ランダムな文字列を生成

以下のいずれかの方法で、安全なランダム文字列を生成します：

**方法 1: Node.js を使用**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**方法 2: OpenSSL を使用**

```bash
openssl rand -base64 32
```

**方法 3: オンラインツール**

- [RandomKeygen](https://randomkeygen.com/) などのツールを使用

### 1.2. 生成した文字列を保存

生成した文字列をメモ帳などに一時的に保存してください。例：

```
your-generated-random-api-key-here-abc123xyz789
```

⚠️ **重要**: この API キーは秘密情報です。Git にコミットしたり、公開リポジトリに含めたりしないでください。

---

## 2. GAS スクリプトプロパティの設定

GAS 側で API キーを検証できるように、スクリプトプロパティに API キーを設定します。

### 2.1. Apps Script エディタを開く

1. Google Spreadsheet を開く
2. メニューから「拡張機能」→「Apps Script」を選択

### 2.2. スクリプトプロパティを設定

1. Apps Script エディタで、左サイドバーの「プロジェクトの設定」（歯車アイコン）をクリック
2. 「スクリプト プロパティ」セクションまでスクロール
3. 「スクリプト プロパティを追加」をクリック
4. 以下を入力：
   - **プロパティ**: `API_KEY`
   - **値**: 手順 1 で生成した API キー（例: `your-generated-random-api-key-here-abc123xyz789`）
5. 「スクリプト プロパティを保存」をクリック

### 2.3. 設定の確認

スクリプト プロパティに `API_KEY` が追加されていることを確認してください。

---

## 3. Cloudflare Pages 環境変数の設定

Cloudflare Pages Functions が GAS にアクセスするための環境変数を設定します。

### 3.1. Cloudflare ダッシュボードにアクセス

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. 「Workers & Pages」を選択
3. `yomikikase-planner` プロジェクトを選択

### 3.2. Settings → Environment variables

1. 上部のタブから「Settings」を選択
2. 左サイドバーから「Environment variables」を選択
3. 「Add variables」または「Edit variables」をクリック

### 3.3. 環境変数を追加

以下の 2 つの環境変数を追加します：

#### 変数 1: GAS_BASE_URL

- **Variable name**: `GAS_BASE_URL`
- **Value**: GAS Web App の URL（例: `https://script.google.com/macros/s/AKfycbx.../exec`）
- **Environment**: `Production` と `Preview` の両方にチェック
- **Type**: `Text`

#### 変数 2: GAS_API_KEY

- **Variable name**: `GAS_API_KEY`
- **Value**: 手順 1 で生成した API キー（例: `your-generated-random-api-key-here-abc123xyz789`）
- **Environment**: `Production` と `Preview` の両方にチェック
- **Type**: `Text`（または `Secret` があれば選択）

⚠️ **重要**: `GAS_API_KEY` は秘密情報です。絶対に公開しないでください。

### 3.4. 保存と再デプロイ

1. 「Save」ボタンをクリック
2. 環境変数を有効にするため、再デプロイが必要です：
   - 「Deployments」タブに移動
   - 最新のデプロイの右側にある「...」メニューをクリック
   - 「Retry deployment」を選択

再デプロイが完了するまで 1〜2 分待ちます。

---

## 4. 動作確認

### 4.1. プロキシ API のテスト

ブラウザまたは curl コマンドで以下の URL にアクセス：

```bash
curl https://yomikikase-planner.pages.dev/api/gas/health
```

**期待されるレスポンス**:

```json
{
  "ok": true,
  "timestamp": "2020-01-01T00:00:00.000Z",
  "message": "yomikikase-planner GAS Web App is running"
}
```

### 4.2. エラーケースの確認

#### ケース 1: 環境変数が未設定

環境変数を削除または無効にした状態で `/api/gas/health` にアクセスすると：

```json
{
  "ok": false,
  "error": "GAS_BASE_URL is not configured"
}
```

または

```json
{
  "ok": false,
  "error": "GAS_API_KEY is not configured"
}
```

#### ケース 2: API キーが一致しない

GAS 側の API キーと Cloudflare 側の API キーが一致しない場合：

```json
{
  "ok": false,
  "error": "Unauthorized"
}
```

### 4.3. GAS 直叩きの動作確認

⚠️ **セキュリティ警告**: 以下の例は設定確認のためのものです。実運用では GAS に直接アクセスせず、必ず Cloudflare Pages Functions 経由（`/api/gas/health`）でアクセスしてください。また、API キーは URL に含めるとブラウザ履歴やログに残るため、本番環境では注意が必要です。

GAS に直接アクセスした場合、API キーなしではエラーが返ることを確認：

```bash
# API キーなし（エラーになるべき）
curl "https://script.google.com/macros/s/DEPLOYMENT_ID/exec?action=health"
```

**期待されるレスポンス**:

```json
{
  "ok": false,
  "error": "Unauthorized"
}
```

**API キーあり（成功するべき）**:

```bash
# 注意: API キーを URL に含めるため、実運用では推奨されません
curl "https://script.google.com/macros/s/DEPLOYMENT_ID/exec?action=health&apiKey=YOUR_API_KEY"
```

**期待されるレスポンス**:

```json
{
  "ok": true,
  "timestamp": "YYYY-MM-DDTHH:MM:SS.SSSZ",
  "message": "yomikikase-planner GAS Web App is running"
}
```

⚠️ **重要**: 上記の直接アクセスは設定確認のみに使用し、実運用では必ず Cloudflare Pages Functions のプロキシ（`/api/gas/health`）経由でアクセスしてください。

---

## 5. トラブルシューティング

### 環境変数が反映されない

**原因**: 環境変数を追加・変更した後に再デプロイしていない

**解決策**:
1. Cloudflare Pages の「Deployments」タブで最新デプロイを「Retry deployment」
2. 完了まで待機（1〜2分）
3. 再度テスト

### プロキシが 502 エラーを返す

**原因**: GAS Web App にアクセスできない、または GAS がエラーを返している

**解決策**:
1. `GAS_BASE_URL` が正しいか確認
2. GAS Web App に直接アクセスして動作確認
3. GAS のログ（Logs シート）を確認

### "Unauthorized" エラーが返る

**原因**: API キーが一致していない

**解決策**:
1. GAS のスクリプトプロパティ `API_KEY` の値を確認
2. Cloudflare Pages の環境変数 `GAS_API_KEY` の値を確認
3. 両方が完全に一致していることを確認（スペースや改行に注意）
4. 必要に応じて再設定・再デプロイ

---

## セキュリティ上の注意事項

### ✅ やるべきこと

- ✅ API キーは安全なランダム文字列を使用する（最低 32 文字）
- ✅ API キーは Cloudflare の環境変数と GAS のスクリプトプロパティにのみ保存する
- ✅ 定期的に API キーをローテーション（更新）する
- ✅ GAS へのアクセスは Cloudflare 経由に限定する方針を明記

### ❌ やってはいけないこと

- ❌ API キーを Git にコミットしない
- ❌ API キーをソースコードにハードコーディングしない
- ❌ API キーを公開リポジトリに含めない
- ❌ API キーをクライアントサイドコード（JavaScript）に含めない

---

## フロントエンドからの利用

### ✅ 正しい方法

LIFF アプリや管理画面から GAS にアクセスする場合は、**必ず Cloudflare Pages Functions 経由**でアクセスします：

```javascript
// ✅ 正しい: 同一オリジンの /api/* を使用
const response = await fetch('/api/gas/health');
const data = await response.json();
```

### ❌ 間違った方法

```javascript
// ❌ 間違い: GAS に直接アクセスしない
const response = await fetch('https://script.google.com/macros/s/.../exec?action=health');
```

### 方針の明記

- **フロントエンドは GAS URL を参照しない**
- **すべての GAS へのアクセスは `/api/*` 経由**
- **API キーはフロントエンドに公開しない**

この方針により：
- CORS の問題を回避（同一オリジン通信）
- セキュリティの向上（API キーをクライアントに露出しない）
- GAS URL の変更に柔軟に対応可能

---

## まとめ

この手順に従うことで、以下が実現できます：

- ✅ Cloudflare Pages Functions から GAS へのプロキシ通信
- ✅ API キーによる認証
- ✅ Secrets の安全な管理（Git 管理外）
- ✅ フロントエンドは同一オリジン `/api/*` のみを使用
- ✅ JSONP を排除し、普通の JSON API として扱える

次のステップ：
- 他の API エンドポイント（例: `/api/gas/surveys`）の実装
- LIFF アプリからプロキシ API を呼び出す実装
