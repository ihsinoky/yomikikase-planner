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

### Sprint 2 以降で実装予定

- ⏳ アンケートデータの取得
- ⏳ 回答データの保存
- ⏳ LIFF 初期化と認証
- ⏳ ユーザープロフィール管理

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

### 5. 動作確認

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
GET https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=health
```

**レスポンス例**:
```json
{
  "ok": true,
  "timestamp": "2025-12-28T12:00:00.000Z",
  "message": "yomikikase-planner GAS Web App is running"
}
```

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

### Sprint 2 以降で対応予定

- ⏳ LIFF ID トークン検証
- ⏳ ユーザー認証・認可
- ⏳ レート制限

## 関連ドキュメント

- [Spreadsheet スキーマ定義](../docs/sheets-schema.md)
- [軌道修正計画](../docs/pivot-plan.md)
- [Sheet テンプレート](../sheet-template/)

## 変更履歴

| 日付 | 変更内容 | 担当 |
|------|---------|------|
| 2025-12-28 | Sprint 1: 骨格実装 | @copilot |
