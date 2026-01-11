# Google Apps Script Web App

このディレクトリには、yomikikase-planner の Google Apps Script (GAS) Web App のコードが含まれています。

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

### GET /exec

**デフォルト動作**: LIFF HTML を返す

```
GET https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

### GET /exec?action=health

**ヘルスチェック API**: システムの動作確認

```
GET https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=health&apiKey=YOUR_API_KEY
```

**パラメータ**:
- `action`: `health` (必須)
- `apiKey`: API キー (スクリプトプロパティに設定されている場合は必須)

**レスポンス例（成功時）**:
```json
{
  "ok": true,
  "timestamp": "2025-12-28T12:00:00.000Z",
  "message": "yomikikase-planner GAS Web App is running"
}
```

**レスポンス例（API キーが不正な場合）**:
```json
{
  "ok": false,
  "error": "Unauthorized"
}
```

**注意**: 
- スクリプトプロパティに `API_KEY` が設定されている場合、API キーの検証が行われます
- API キーが未設定の場合は検証をスキップします（後方互換性のため）
- Cloudflare Pages Functions 経由でアクセスすることを推奨します（`/api/gas/health`）

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

## セキュリティ考慮事項

### 現在の実装

- ✅ LockService による同時書き込み対策
- ✅ エラーハンドリングとログ記録
- ✅ try/catch による例外処理
- ✅ API キーによる認証（スクリプトプロパティで管理）

### Sprint 2 以降で対応予定

- ⏳ LIFF ID トークン検証
- ⏳ ユーザー認証・認可
- ⏳ レート制限

### API キーの設定

GAS への直接アクセスを制限するため、API キーを設定できます：

1. Apps Script エディタで「プロジェクトの設定」（歯車アイコン）を開く
2. 「スクリプト プロパティ」セクションで「スクリプト プロパティを追加」をクリック
3. 以下を入力：
   - **プロパティ**: `API_KEY`
   - **値**: 安全なランダム文字列（32文字以上推奨）
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
