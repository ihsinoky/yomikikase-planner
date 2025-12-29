# Sprint 1 デプロイ & 検証チェックリスト

このチェックリストは、Sprint 1の成果物を実際にデプロイし、動作確認するための手順です。

## 事前準備

### 必要なアカウント
- [ ] Google アカウント（Spreadsheet / Apps Script 用）
- [ ] LINE Developers アカウント
- [ ] LINE 公式アカウント（Messaging API チャネル）

### リポジトリの確認
- [ ] `scripts/verify-sprint1.sh` を実行し、全成果物が揃っていることを確認

```bash
cd /path/to/yomikikase-planner
./scripts/verify-sprint1.sh
```

期待される結果: `🎉 Sprint 1 の全成果物が正しく配置されています！`

## 1. Google Spreadsheet の作成

詳細は `docs/setup.md` の「1. Google Spreadsheet の作成」を参照

- [ ] 新しい Google Spreadsheet を作成
- [ ] Spreadsheet ID をメモ: `_______________________`
- [ ] 以下の6つのタブを作成し、CSVテンプレートをインポート
  - [ ] Config
  - [ ] Surveys
  - [ ] SurveyDates
  - [ ] Users
  - [ ] Responses
  - [ ] Logs（オプション: 自動作成されるため）

### インポート確認
- [ ] Config タブ: ヘッダー行 + サンプルデータ3行
- [ ] Surveys タブ: ヘッダー行 + サンプルデータ2行
- [ ] SurveyDates タブ: ヘッダー行 + サンプルデータ4行
- [ ] Users タブ: ヘッダー行 + サンプルデータ3行
- [ ] Responses タブ: ヘッダー行 + サンプルデータ5行
- [ ] Logs タブ: ヘッダー行のみ

## 2. Google Apps Script の作成・デプロイ

詳細は `docs/setup.md` の「2. Google Apps Script の作成・デプロイ」を参照

- [ ] Spreadsheet から「拡張機能」→「Apps Script」を開く
- [ ] プロジェクト名を変更（例: `読み聞かせプランナー GAS`）
- [ ] `gas/Code.gs` の内容を `コード.gs` にコピー
- [ ] `gas/index.html` を新規HTMLファイルとして追加（ファイル名: `index`）
- [ ] テスト関数を実行して権限を承認
  - [ ] 関数 `testHealthCheck` を選択
  - [ ] 「実行」をクリック
  - [ ] 権限承認ダイアログで承認
  - [ ] 実行ログに JSON レスポンスが表示されることを確認

### Web App としてデプロイ
- [ ] 「デプロイ」→「新しいデプロイ」を選択
- [ ] 「種類の選択」→「ウェブアプリ」
- [ ] 設定:
  - [ ] 説明: `yomikikase-planner Web App`
  - [ ] 次のユーザーとして実行: **自分**
  - [ ] アクセスできるユーザー: **全員**
- [ ] 「デプロイ」をクリック
- [ ] Web App URL をメモ: `_______________________`

### デプロイ確認
- [ ] ヘルスチェックAPI を確認
  ```
  https://script.google.com/macros/s/【デプロイID】/exec?action=health
  ```
  期待される結果: `{ "ok": true, "timestamp": "...", "message": "..." }`

- [ ] HTML配信を確認
  ```
  https://script.google.com/macros/s/【デプロイID】/exec
  ```
  期待される結果: 「📚 読み聞かせプランナー」のページが表示される

- [ ] Logs シートを確認
  - [ ] ヘルスチェック実行のログが記録されている
  - [ ] HTML配信のログが記録されている

## 3. LINE Developers での LIFF 作成

詳細は `docs/setup.md` の「3. LINE Developers での LIFF 作成」を参照

### プロバイダーとチャネルの確認/作成
- [ ] [LINE Developers Console](https://developers.line.biz/console/) にアクセス
- [ ] プロバイダーを確認/作成
- [ ] Messaging API チャネルを確認/作成

### LIFF アプリの追加
- [ ] チャネル設定画面で「LIFF」タブを選択
- [ ] 「Add」（追加）をクリック
- [ ] LIFF アプリ情報を入力:
  - [ ] LIFF app name: `読み聞かせプランナー`
  - [ ] Size: `Full`
  - [ ] Endpoint URL: `https://script.google.com/macros/s/【デプロイID】/exec`
  - [ ] Scope: `profile`, `openid` にチェック
  - [ ] Bot link feature: 任意
- [ ] 「Add」をクリック
- [ ] LIFF ID をメモ: `_______________________`

## 4. 設定値の登録

詳細は `docs/setup.md` の「4. 設定値の登録」を参照

- [ ] Spreadsheet の Config タブを開く
- [ ] `liffId` の値を実際の LIFF ID に更新
  
  | key | value | description | updatedAt |
  |-----|-------|-------------|-----------|
  | liffId | 【実際のLIFF ID】 | LIFF アプリケーションID | 【現在時刻】 |

- [ ] `activeSurveyId` が `survey_001` になっていることを確認

## 5. 動作確認

詳細は `gas/VERIFICATION.md` を参照

### 5.1 ヘルスチェックAPI（再確認）
- [ ] ブラウザで以下にアクセス:
  ```
  https://script.google.com/macros/s/【デプロイID】/exec?action=health
  ```
- [ ] `{ "ok": true, ... }` が表示される
- [ ] Logs シートにログが記録される

### 5.2 LIFF 初期化（外部ブラウザ）
- [ ] ブラウザで以下にアクセス:
  ```
  https://script.google.com/macros/s/【デプロイID】/exec?liffId=【LIFF ID】
  ```
- [ ] LIFF 初期化が開始される
- [ ] LINE ログインページにリダイレクトされる
- [ ] ログイン後、元のページに戻る
- [ ] 以下の情報が表示される:
  - [ ] ユーザーID（`U` で始まる文字列）
  - [ ] 表示名
  - [ ] GAS Health: `OK`
  - [ ] デバッグ情報（OS、LINEバージョン等）

### 5.3 LIFF アプリ（LINE アプリ内）
- [ ] LINE アプリで自分にメッセージを送信
- [ ] メッセージに LIFF URL を記載:
  ```
  https://liff.line.me/【LIFF ID】
  ```
- [ ] URL をタップして LIFF アプリを開く
- [ ] ユーザー情報（userId, displayName）が表示される
- [ ] GAS Health が `OK` と表示される
- [ ] デバッグ情報で「外部ブラウザ」が `いいえ（LINEアプリ内）` と表示される

### 5.4 ログの確認
- [ ] Spreadsheet の Logs タブを開く
- [ ] 以下のログが記録されていることを確認:
  - [ ] `handleHealthCheck` のログ（level: INFO）
  - [ ] `handleServeHtml` のログ（level: INFO）
- [ ] `logId` が連番になっている（`log_001`, `log_002`, ...）
- [ ] `timestamp` が日時型で表示されている

## 6. トラブルシューティング

問題が発生した場合は、以下を参照してください:

- [ ] `docs/setup.md` の「6. トラブルシューティング」
- [ ] `gas/VERIFICATION.md` の「トラブルシューティング」

### よくある問題のクイックチェック

#### GAS のデプロイ URL にアクセスすると「認証が必要です」
- [ ] デプロイ設定で「アクセスできるユーザー」が「全員」になっているか確認

#### Logs シートにログが記録されない
- [ ] Spreadsheet に「Logs」タブが存在するか確認
- [ ] Apps Script の権限が承認されているか確認（`testHealthCheck` を実行）

#### LIFF 初期化エラー
- [ ] LIFF ID が正しいか確認
- [ ] LINE Developers Console で LIFF アプリが有効化されているか確認
- [ ] Endpoint URL が正しいか確認

#### userId が取得できない
- [ ] LIFF アプリの Scope に `profile` が含まれているか確認

## 7. 完了確認

すべてのチェック項目が完了したら、Sprint 1 のデプロイは完了です。

- [ ] すべての受け入れ条件（DoD）を達成
  - [ ] LINE から LIFF を起動し、画面が表示される
  - [ ] 画面上で「誰が開いたか」（LINE userId）が確認できる
  - [ ] 画面から GAS 側の health を叩いて OK が返る
  - [ ] Spreadsheet のテンプレ（タブ/列）が確定している
  - [ ] セットアップ手順が docs として残っている

- [ ] 動作確認が完了
  - [ ] ヘルスチェックAPI が動作する
  - [ ] LIFF 初期化が動作する（外部ブラウザ）
  - [ ] LIFF アプリが動作する（LINE アプリ内）
  - [ ] Logs シートにログが記録される

## 8. 次のステップ（Sprint 2）

Sprint 1 が完了したら、Sprint 2 で以下を実装します:

- アンケートデータの取得と表示
- 回答データの保存
- ユーザープロフィール管理
- IDトークン検証

詳細は Sprint 2 の Issue を参照してください。

---

## 備考

### デプロイ情報の記録

後で参照できるように、以下の情報を記録しておくことをおすすめします:

| 項目 | 値 |
|------|-----|
| Spreadsheet ID | |
| Web App URL | |
| LIFF ID | |
| デプロイ日時 | |
| バージョン | 1.0.0 (Sprint 1) |

### バックアップ

- Spreadsheet のコピーを定期的に作成することをおすすめします
- Apps Script のコードもローカルに保存しておくことをおすすめします（このリポジトリに既に保存済み）

---

**チェックリスト作成日**: 2025-12-29
**対象バージョン**: Sprint 1
