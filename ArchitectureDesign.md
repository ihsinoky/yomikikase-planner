# Architecture Design

幼稚園の絵本読み聞かせ活動を支えるシステムの現行アーキテクチャを記録します。

---

## 1. 目的

このシステムは、保護者が LINE ミニアプリから参加可否を回答し、運営側が Spreadsheet を中心に日程運用できる状態を目指します。

- データの正は Google Spreadsheet に置く
- LIFF は参加者向けの最小 UI として維持する
- API は Cloudflare Functions 経由で GAS に集約する
- 管理 UI はまず Spreadsheet 運用を前提とし、不足部分だけ補助機能を追加する

---

## 2. コンポーネント構成

### 2.1 Google Spreadsheet

- システムのマスターデータを保持する
- 現在の主なタブ:
  - `Config`
  - `Surveys`
  - `SurveyDates`
  - `Users`
  - `Responses`
  - `Logs`

### 2.2 Google Apps Script Web App

- Spreadsheet の読み書きと最低限の API を担当する
- 現在の実装済み機能:
  - `doGet()`
  - `doPost()` の骨格
  - `health` API
  - HTML 配信
  - Logs シート記録
  - LockService による排他制御

### 2.3 Cloudflare Pages Functions

- フロントエンドからの API アクセスを同一オリジンの `/api/*` に統一する
- 現在の実装済み機能:
  - `/api/health`
  - `/api/config`
  - `/api/gas/health`

### 2.4 LIFF 静的アプリ

- 参加者向け UI を提供する
- 現在の実装済み機能:
  - `liff.init()`
  - `liff.isLoggedIn()`
  - `liff.getProfile()`
  - デバッグ表示
  - `health` 疎通確認

---

## 3. 現在のリクエストフロー

### 3.1 参加者の利用フロー

1. 参加者が LINE から LIFF を起動する
2. LIFF が Cloudflare Pages 上の静的アプリを表示する
3. LIFF が `/api/*` を呼ぶ
4. Cloudflare Functions が必要に応じて GAS に中継する
5. GAS が Spreadsheet を読み書きする

### 3.2 運営側の利用フロー

1. 運営側が Spreadsheet でアンケート情報を管理する
2. 必要に応じて Logs タブや Cloudflare ログで障害を切り分ける
3. 回答機能の実装完了後は、Spreadsheet 上で結果確認と運用判断を行う

---

## 4. データモデル

### 4.1 現在のシート構成

- `Config`
  - `activeSurveyId`
  - `liffId`
- `Surveys`
  - `surveyId`
  - `fiscalYear`
  - `title`
  - `description`
  - `status`
  - `createdAt`
- `SurveyDates`
  - `surveyDateId`
  - `surveyId`
  - `dateTime`
  - `targetGrade`
  - `label`
  - `sortOrder`
- `Users`
  - `lineUserId`
  - `displayName`
  - `childName`
  - `grade`
  - `class`
  - `createdAt`
  - `updatedAt`
- `Responses`
  - `responseId`
  - `surveyId`
  - `surveyDateId`
  - `lineUserId`
  - `answer`
  - `submittedAt`
- `Logs`
  - `logId`
  - `timestamp`
  - `level`
  - `source`
  - `message`
  - `details`

詳細は `docs/sheets-schema.md` を参照します。

---

## 5. 現在の実装状況

### 5.1 実装済み

- Spreadsheet テンプレート
- GAS Web App 骨格
- LIFF 初期化とプロフィール取得
- Cloudflare Pages / Functions への移行
- API キー必須化と JSONP 廃止

### 5.2 未実装

- 最新アンケート取得 API
- 回答送信 API
- `Users` / `Responses` 連携
- 初回プロフィール登録フロー
- ID トークン検証
- 管理・運用補助 UI

---

## 6. セキュリティと運用

- フロントエンドは GAS URL を直接参照しない
- Cloudflare Functions から GAS に API キー付きでアクセスする
- GAS は API キーなしの直接アクセスを拒否する
- JSONP は廃止済み
- ログには個人識別情報を残さない
- Cloudflare 側と Spreadsheet Logs の両方でトラブルシューティングする

---

## 7. リポジトリ構成

- `liff/`: LIFF 静的アプリ
- `functions/`: Cloudflare Pages Functions
- `gas/`: Google Apps Script Web App
- `sheet-template/`: Spreadsheet テンプレート
- `docs/`: セットアップ・運用・進捗ドキュメント

---

## 8. 今後の拡張

- 回答一覧のフィルタと CSV 出力の整備
- 確定日程・参加者登録の運用整備
- 絵本記録機能
- データライフサイクル管理
- 監視 / レート制限 / アラート整備

---
