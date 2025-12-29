# GAS Web App 動作確認チェックリスト

このドキュメントは、GAS Web App を Google Apps Script にデプロイ後の動作確認手順です。

## 前提条件

- [ ] Google Spreadsheet を作成済み
- [ ] Spreadsheet に Config, Surveys, SurveyDates, Users, Responses タブを作成済み
- [ ] Apps Script プロジェクトに `Code.gs` と `index.html` をコピー済み
- [ ] Web App としてデプロイ済み（デプロイ URL を取得済み）

## 受け入れ条件の確認

### 1. Web App としてデプロイできる

- [ ] Apps Script エディタで「デプロイ」→「新しいデプロイ」を実行
- [ ] 「ウェブアプリ」として選択
- [ ] デプロイが成功し、URL が発行される
- [ ] デプロイ URL の形式: `https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec`

### 2. ブラウザで `?action=health` にアクセスすると `{ ok: true }` 相当が返る

**テスト URL**: 
```
https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec?action=health
```

**期待される結果**:
```json
{
  "ok": true,
  "timestamp": "2025-12-28T...",
  "message": "yomikikase-planner GAS Web App is running"
}
```

- [ ] ブラウザで上記 URL にアクセス
- [ ] `ok: true` が返る
- [ ] `timestamp` フィールドが存在する
- [ ] `message` フィールドが存在する

### 3. 失敗時に Logs に記録が残る

#### テストケース 3-1: 正常なリクエストのログ

- [ ] `?action=health` にアクセス
- [ ] Spreadsheet の Logs タブを確認
- [ ] 新しい行が追加されている
- [ ] `level` = `INFO`
- [ ] `source` = `handleHealthCheck`
- [ ] `message` = `ヘルスチェックが実行されました`

#### テストケース 3-2: Apps Script エディタからテスト関数を実行

- [ ] Apps Script エディタで `testHealthCheck` を選択
- [ ] 「実行」ボタンをクリック
- [ ] 実行ログに JSON レスポンスが表示される
- [ ] Logs シートに INFO レベルのログが追加される

#### テストケース 3-3: エラーログの確認（想定シナリオ）

GAS では意図的にエラーを起こすのが難しいため、このテストは参考情報として記載:

- エラーが発生した場合、Logs シートに以下が記録されるはず:
  - `level` = `ERROR`
  - `source` = エラー発生元の関数名
  - `message` = エラーメッセージ
  - `details` = エラーの詳細情報（JSON）

### 4. LIFF HTML を返せる

**テスト URL**:
```
https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec
```

**期待される結果**:
- HTML ページが表示される
- タイトル: 「📚 読み聞かせプランナー」
- ステータス: 「✓ GAS Web App として正常に動作しています」または「✓ LIFF SDK 読み込み完了」
- システム情報セクションが表示される
- 実装予定機能セクションが表示される

確認項目:
- [ ] ブラウザで上記 URL にアクセス
- [ ] HTML ページが正常に表示される
- [ ] タイトルが「📚 読み聞かせプランナー」
- [ ] ステータスメッセージが表示される
- [ ] LIFF SDK が読み込まれる（エラーがない）
- [ ] フッターに「yomikikase-planner v1.0.0」と表示される
- [ ] Logs シートに `handleServeHtml` のログが記録される

## 追加の動作確認

### LockService のテスト

同時実行でもデータの整合性が保たれることを確認（オプション）:

- [ ] 複数のブラウザタブで同時に `?action=health` にアクセス
- [ ] すべてのリクエストが成功する（タイムアウトしない）
- [ ] Logs シートに各リクエストのログが記録される
- [ ] ログの `logId` が重複していない

### Logs シートのクリア機能

- [ ] Apps Script エディタで `clearLogsSheet` を選択
- [ ] 「実行」ボタンをクリック
- [ ] Logs シートのデータ行が削除される（ヘッダー行は残る）
- [ ] 実行ログに "Logs sheet cleared" と表示される

## トラブルシューティング

### よくある問題

**問題**: デプロイ URL にアクセスすると「認証が必要です」と表示される

**解決策**:
- デプロイ設定で「アクセスできるユーザー」を「全員」に設定
- 再度デプロイを実行

**問題**: Logs シートにログが記録されない

**解決策**:
- Spreadsheet に "Logs" タブが存在するか確認
- Apps Script に Spreadsheet へのアクセス権限があるか確認（初回実行時に承認が必要）
- `clearLogsSheet()` を実行してシートをリセット

**問題**: LIFF SDK のエラーが表示される

**解決策**:
- Sprint 1 では LIFF ID が未設定のため、初期化エラーは正常です
- Sprint 2 で LIFF ID を設定してから初期化を実装します

## 完了条件

すべての受け入れ条件（1〜4）が満たされた場合、Sprint 1 の実装は完了です。

- [ ] すべての受け入れ条件をクリア
- [ ] Logs シートにログが正常に記録される
- [ ] HTML が正常に配信される
- [ ] ヘルスチェック API が動作する

## 次のステップ（Sprint 2）

Sprint 1 が完了したら、Sprint 2 で以下を実装します:

- LIFF ID の設定と初期化
- アンケートデータの取得（Surveys + SurveyDates）
- 回答データの保存（Responses シート）
- ユーザープロフィール管理（Users シート）
