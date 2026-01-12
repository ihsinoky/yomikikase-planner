# Google Apps Script Web App

このディレクトリには、yomikikase-planner の Google Apps Script (GAS) Web App のコードが含まれています。

## ⚠️ 重要：GAS への直接アクセスは禁止

**セキュリティ上の重要なお知らせ：**

- 🚫 **GAS Web App URL に直接アクセスしないでください**
- ✅ **必ず Cloudflare Pages Functions 経由でアクセスしてください**（`/api/gas/*`）
- 🔒 **API キーは必須です** - スクリプトプロパティに `API_KEY` を設定する必要があります
- ❌ **JSONP は廃止されました** - `callback` パラメータは受け付けません

### なぜ直接アクセスを禁止するのか？

1. **セキュリティリスク**: API キーが URL に露出する可能性
2. **濫用リスク**: 公開 URL への直接アクセスでレート制限なしの攻撃を受ける可能性
3. **保守性**: GAS URL が変更されても、プロキシ経由なら影響を受けない
4. **CORS 問題**: 直接アクセスでは CORS エラーが発生する可能性

### 正しいアクセス方法

```javascript
// ✅ 正しい: Cloudflare Pages Functions 経由
const response = await fetch('/api/gas/health');
const data = await response.json();
```

```javascript
// ❌ 間違い: GAS に直接アクセス
const response = await fetch('https://script.google.com/macros/s/.../exec?action=health&apiKey=...');
```

## ファイル構成

- `Code.gs` - サーバーサイドロジック（GAS スクリプト）
  - HTTP リクエストハンドラ（doGet/doPost）
  - ルーティング機能
  - Logs シートへのロギング
  - LockService ラッパー
- `index.html` - LIFF 用の静的 HTML（クライアントサイド UI）

## 機能概要

### Sprint 1 で実装済み

- ✅ `doGet()` で HTML を配信
- ✅ `?action=health` で JSON を返すヘルスチェック API
- ✅ Logs シートへの書き込み（`logToSheet` 関数）
- ✅ `withLock(fn)` - LockService ラッパー
- ✅ 例外時の自動ログ記録
- ✅ LIFF SDK 統合（index.html）
- ✅ LIFF 初期化フロー（liff.init → isLoggedIn → login）
- ✅ ユーザープロフィール表示（userId, displayName）
- ✅ 外部ブラウザ対応（自動ログインリダイレクト）
- ✅ GAS Health API 呼び出しと結果表示
- ✅ デバッグ情報の動的表示（環境、OS、LINEバージョン等）

### Sprint 2 以降で実装予定

- ⏳ アンケートデータの取得（LIFF画面での表示）
- ⏳ 回答データの保存（LIFFからGASへ）
- ⏳ ユーザープロフィール管理（学年・クラス情報）
- ⏳ Spreadsheetとの本格的な連携

## デプロイ手順

### 1. Google Spreadsheet の準備

1. Google Spreadsheet を新規作成
2. 以下のタブを作成（または [sheet-template](../sheet-template/) からインポート）:
   - Config
   - Surveys
   - SurveyDates
   - Users
   - Responses
   - Logs（自動作成されますが、手動で作成しても可）

### 2. Apps Script プロジェクトの作成

1. Spreadsheet を開く
2. メニューから「拡張機能」→「Apps Script」を選択
3. 新しいプロジェクトが作成される

### 3. コードのコピー

1. `Code.gs` の内容を Apps Script エディタの `コード.gs` にコピー
2. `index.html` を追加:
   - 左サイドバーの「+」ボタン → 「HTML」を選択
   - ファイル名を `index` にする
   - `index.html` の内容をコピー

### 4. Web App としてデプロイ

1. Apps Script エディタで「デプロイ」→「新しいデプロイ」を選択
2. 「種類の選択」で「ウェブアプリ」を選択
3. 設定:
   - **説明**: `yomikikase-planner Web App`
   - **次のユーザーとして実行**: 「自分」
   - **アクセスできるユーザー**: 「全員」（LIFF からアクセスするため）
4. 「デプロイ」をクリック
5. **ウェブアプリの URL** をコピー（後で使用）

### 5. LIFF アプリの設定（オプション - Sprint 1 で動作確認する場合）

LINE ミニアプリ機能をテストする場合は、LINE Developers Console で LINE ミニアプリチャネルを設定します:

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. プロバイダーを作成（まだの場合）
3. 「Create a new channel」→「LINE ミニアプリ」を選択
4. 必須項目を入力してチャネル作成
5. チャネル設定画面で **Developing タブ** を選択
6. Basic settings セクションで以下を設定:
   - **Endpoint URL**: `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec` (手順4でコピーしたURL)
7. 「Save」をクリック
8. Developing タブに表示されている **LIFF ID** をコピー（`1234567890-abcdefgh` 形式）

LIFF ID を取得したら、以下のURLでアクセス可能になります:

```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?liffId=YOUR_LIFF_ID
```

または、LINE のトークやリッチメニューに以下の URL を設定:

```
https://miniapp.line.me/YOUR_LIFF_ID
```

（従来形式の `https://liff.line.me/YOUR_LIFF_ID` も引き続き使用可能）

### 6. 動作確認

#### ヘルスチェック API

ブラウザで以下の URL にアクセス:

```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=health
```

期待されるレスポンス:

```json
{
  "ok": true,
  "timestamp": "2025-12-28T12:00:00.000Z",
  "message": "yomikikase-planner GAS Web App is running"
}
```

#### LIFF HTML の配信

ブラウザで以下の URL にアクセス:

```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

「読み聞かせプランナー」のページが表示されることを確認。

**LIFF ID を指定する場合** (Sprint 1 で実装):

```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?liffId=YOUR_LIFF_ID
```

この場合、以下の動作が行われます:
1. LIFF SDK が初期化される
2. ログイン状態をチェックし、未ログインの場合は自動的にLINEログインページにリダイレクト
3. ログイン後、ユーザープロフィール（userId, displayName）が表示される
4. GAS Health API が自動的に呼び出され、結果が表示される
5. デバッグ情報（OS、LINEバージョン、起動環境等）が表示される

#### ログの確認

Spreadsheet の Logs タブを開き、以下が記録されていることを確認:

- ヘルスチェック実行時のログ
- HTML 配信時のログ

## API エンドポイント

### ⚠️ 重要：すべてのエンドポイントは Cloudflare 経由でアクセスしてください

**直接アクセスは禁止されています。** 以下のエンドポイント説明は、デプロイ確認時の参考情報です。

### GET /exec

**デフォルト動作**: LIFF HTML を返す（認証不要）

```
GET https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

### GET /exec?action=health

**ヘルスチェック API**: システムの動作確認（API キー必須）

🚫 **このエンドポイントに直接アクセスしないでください。**  
✅ **Cloudflare Pages Functions 経由でアクセスしてください:** `/api/gas/health`

```
# ❌ 直接アクセス禁止
GET https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=health&apiKey=YOUR_API_KEY

# ✅ 正しいアクセス方法
GET https://your-domain.pages.dev/api/gas/health
```

**パラメータ**:
- `action`: `health` (必須)
- `apiKey`: API キー (必須 - スクリプトプロパティに設定)
- `callback`: **廃止されました** - JSONP は使用できません

**⚠️ API キーの必須化について**:
- API キーが設定されていない場合、すべての API リクエストは拒否されます
- API キーが不正な場合も拒否されます
- GAS の制約により HTTP ステータスコードは設定できませんが、JSON レスポンスの `ok: false` で判定できます

**レスポンス例（成功時）**:
```json
{
  "ok": true,
  "timestamp": "2025-12-28T12:00:00.000Z",
  "message": "yomikikase-planner GAS Web App is running"
}
```

**レスポンス例（API キーが未設定・不正な場合）**:
```json
{
  "ok": false,
  "error": "Unauthorized"
}
```

**レスポンス例（JSONP callback パラメータが指定された場合）**:
```json
{
  "ok": false,
  "error": "JSONP is not supported. Please use JSON API via Cloudflare Functions."
}
```

**推奨されるアクセス方法**:

フロントエンドから GAS にアクセスする場合は、必ず Cloudflare Pages Functions 経由でアクセスしてください：

```javascript
// ✅ 推奨: Cloudflare Pages Functions 経由
const response = await fetch('/api/gas/health');
const data = await response.json();
```

```bash
# ✅ 推奨: コマンドラインからも Cloudflare 経由
curl https://yomikikase-planner.pages.dev/api/gas/health
```

**⚠️ 重要な変更 (2025-01-12)**: 
- **API キーは必須になりました** - スクリプトプロパティに `API_KEY` を設定する必要があります
- API キーが未設定の場合、すべての API リクエストは `Unauthorized` エラーを返します
- この変更により、GitHub Pages + JSONP 経路の使用が完全に停止されます

### POST /exec?action=saveResponse

**アンケート回答保存** (Sprint 2 で実装予定)

現在は "Not implemented yet" エラーを返します。

## テスト関数

Apps Script エディタから手動実行できるテスト関数:

### testHealthCheck()

ヘルスチェック API をテスト実行し、結果をログに出力します。

実行方法:
1. Apps Script エディタで関数を選択: `testHealthCheck`
2. 「実行」ボタンをクリック
3. 実行ログで結果を確認

### clearLogsSheet()

Logs シートのデータをクリアします（ヘッダー行は保持）。

実行方法:
1. Apps Script エディタで関数を選択: `clearLogsSheet`
2. 「実行」ボタンをクリック
3. Logs シートが空になることを確認

## トラブルシューティング

### "ロック取得に失敗" エラー

複数のリクエストが同時に実行された場合に発生する可能性があります。

- デフォルトのタイムアウトは 30 秒
- `withLock` 関数の第2引数でタイムアウト時間を調整可能

### Logs シートにログが記録されない

1. Spreadsheet に "Logs" タブが存在するか確認
2. Apps Script に Spreadsheet へのアクセス権限があるか確認
3. `clearLogsSheet()` を実行してシートをリセット

### LIFF が動作しない

- Sprint 1 では LIFF ID が未設定のため、LIFF 初期化はスキップされます
- Sprint 2 で LIFF ID を設定し、初期化コードを実装予定

### "Unauthorized" エラーが返される

**原因**: API キーが未設定、または不正

**対処法**:
1. スクリプトプロパティに `API_KEY` が設定されているか確認
2. Cloudflare Pages の環境変数 `GAS_API_KEY` と一致しているか確認
3. API キーに余分な空白や改行が含まれていないか確認
4. 詳細は [API キーの設定](#api-キーの設定) セクションを参照

### "JSONP is not supported" エラーが返される

**原因**: `callback` パラメータが URL に含まれている

**対処法**:
1. JSONP は廃止されました
2. 代わりに Cloudflare Pages Functions 経由で JSON API を使用してください
3. フロントエンドコードから `callback` パラメータを削除してください

## セキュリティ考慮事項

### 現在の実装（2025-01-12 更新）

- ✅ **API キー認証必須化** - すべての API エンドポイントで API キー検証
- ✅ **JSONP 廃止** - callback パラメータを拒否
- ✅ **直接アクセス禁止** - Cloudflare Functions 経由のみ推奨
- ✅ LockService による同時書き込み対策
- ✅ エラーハンドリングとログ記録
- ✅ try/catch による例外処理
- ✅ API キーによる認証（スクリプトプロパティで管理）

### Sprint 2 以降で対応予定

- ⏳ LIFF ID トークン検証
- ⏳ ユーザー認証・認可
- ⏳ レート制限

### API キーの設定（必須）

🔒 **重要**: API キーの設定は必須です。設定されていない場合、すべての API リクエストは拒否されます。

1. Apps Script エディタで「プロジェクトの設定」（歯車アイコン）を開く
2. 「スクリプト プロパティ」セクションで「スクリプト プロパティを追加」をクリック
3. 以下を入力：
   - **プロパティ**: `API_KEY`
   - **値**: 安全なランダム文字列（32文字以上推奨）
     - 例: `openssl rand -base64 32` で生成
4. 保存

詳細は [Cloudflare Secrets 設定手順](../docs/cloudflare-secrets-setup.md) を参照してください。

## 関連ドキュメント

- [Spreadsheet スキーマ定義](../docs/sheets-schema.md)
- [軌道修正計画](../docs/pivot-plan.md)
- [Sheet テンプレート](../sheet-template/)

## 変更履歴

| 日付 | 変更内容 | 担当 |
|------|---------|------|
| 2025-12-28 | Sprint 1: 骨格実装 | @copilot |
