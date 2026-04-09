# Milestones

このファイルは、2026-03-23 時点のマイルストーンと進捗状況を記録します。  
現在の前提は Google Spreadsheet + Google Apps Script + Cloudflare Pages / Functions + LIFF です。

## 現在地

- 完了: Milestone 0, 1, 2, 3, 4, 5
- 未着手: Milestone 6

現行実装の一次ソース:

- `README.md`
- `docs/pivot-plan.md`
- `docs/sprint0-completion-status.md`
- `docs/sprint1-completion-report.md`
- `docs/cloudflare-migration-completion.md`

---

## Milestone 0: 方針転換とリポジトリ基盤の整理

**目的:** 旧構成を整理し、現行方針で開発を継続できる状態を作る

**状況:** 完了

- [x] リポジトリの基本ドキュメントを整備
- [x] `docs/pivot-plan.md` で方針転換を文書化
- [x] README から新アーキテクチャへの導線を追加
- [x] 旧 Next.js / Prisma 実装を legacy ブランチ / タグ参照に切り分け

---

## Milestone 1: Sheets + GAS + LIFF の骨格構築

**目的:** MVP 実装の土台となる最小構成を動く形で揃える

**状況:** 完了

- [x] Spreadsheet スキーマを確定 (`Config`, `Surveys`, `SurveyDates`, `Users`, `Responses`, `Logs`)
- [x] CSV テンプレートを整備
- [x] GAS Web App の骨格を実装 (`doGet`, `doPost`, `health`, ログ, LockService)
- [x] LIFF 初期画面を実装（`liff.init()`, `liff.getProfile()`, 疎通確認）
- [x] セットアップ手順と動作確認手順を整備

---

## Milestone 2: Cloudflare Pages / Functions への移行

**目的:** 本番配信面と API 経路を Cloudflare に統一し、運用とセキュリティを安定させる

**状況:** 完了

- [x] LIFF 配信元を Cloudflare Pages に移行
- [x] `/api/health` と `/api/gas/health` を Cloudflare Functions で提供
- [x] GAS 直アクセスを API キー必須化
- [x] JSONP 経路を廃止
- [x] Cloudflare 用セットアップ / シークレット / 検証手順を整備

---

## Milestone 3: LIFF ミニアプリの MVP（アンケート取得・回答送信）

**目的:** 保護者が LINE 上で実際にアンケート回答できる状態にする

**状況:** 完了

- [x] LIFF 起動、ログイン、`userId` / `displayName` の取得
- [x] `health` / `config` 系の基盤 API を用意
- [x] `activeSurveyId` をもとに最新アンケートを取得する API を実装
- [x] LIFF 画面で候補日一覧を表示
- [x] 回答送信 API を実装し、`Responses` シートへ保存
- [x] 初回プロフィール登録と `Users` シート連携を実装
- [x] ID トークン検証を実装
- [x] LIFF なしで確認できる `?preview=1` プレビュー導線を実装
- [x] Cloudflare Pages 本番デプロイへ最新コードを反映し、`/api/survey` と `/?preview=1` を確認
- [x] 実データの Spreadsheet を使って、ユーザー登録と回答保存の本番検証を完了

2026-04-09 に本番デプロイ・実データ検証を完了。GAS コールドスタートによるタイムアウト問題を修正済み（PR #73）。

---

## Milestone 4: 管理・運用向け機能の整備

**目的:** 日常運用を Spreadsheet 依存だけにせず、必要な補助機能を揃える

**状況:** 完了

- [x] アンケート作成・切替の運用フローを整理
- [x] 回答結果の一覧表示 / フィルタ / CSV 出力を整備
- [x] 確定日程と参加者の登録フローを整備
- [x] Spreadsheet 運用だけで不足する箇所に限定して補助 UI を検討
- [x] 監視 / レート制限 / アラートなどの運用強化を検討

2026-04-10 完了。管理 API（PR #75）、CSV エクスポート（PR #76）、確定日程・参加者登録 API を整備。
補助 UI は現時点では Spreadsheet + API で十分と判断し、専用 UI は Milestone 5 以降の必要性に応じて検討する。
監視・レート制限は Cloudflare の標準機能（Analytics, WAF）で初期運用をカバーし、トラフィック増加時に再検討する。

---

## Milestone 5: 絵本記録機能の実装

**目的:** 「どの年度・学年で、どの絵本を読んだか」を長期的に活用できるようにする

**状況:** 完了

- [x] 絵本マスタ登録画面（管理者）
  - [x] ISBN 入力 → 書誌情報取得（外部 API 連携）
  - [x] タイトル等の編集
- [x] 読み聞かせ記録登録
  - [x] 日付・年度・学年・クラス・絵本を紐付けて保存
- [x] 年度・学年での「読んだ絵本一覧」画面
- [x] 本ごとの「どの年度・学年で読んだか」履歴画面

2026-04-10 完了。Google Books API を使った ISBN 検索、絵本マスタ登録、読み聞かせ記録の登録・参照・履歴 API を整備。
Spreadsheet に Books / ReadingRecords タブを追加。管理 API（ADMIN_API_KEY 認証）経由で操作する構成。

---

## Milestone 6: データライフサイクル & 引き継ぎ

**目的:** 「いつか卒園する」ことを前提に、きれいに畳める / 引き継げる設計にする

**状況:** 未着手

- [ ] 年度ごとのデータ削除機能
  - [ ] アンケート・回答・確定日程・年度別プロフィールの削除
- [ ] 匿名統計 or 完全削除の方針を文書化
- [ ] 管理者アカウントの追加・削除機能（後任への引き継ぎ）
- [ ] 簡易運用マニュアルの作成（別ドキュメント）

---

## 次に優先する項目

直近の優先順位は Milestone 6 です。
年度データの削除、管理者引き継ぎ、運用マニュアルを整備して、年度末の運用を安全に行えるようにします。

---
