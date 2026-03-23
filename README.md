# yomikikase-planner

幼稚園の「絵本読み聞かせ」活動のための、LINE ミニアプリと運用補助ツールです。

現在の構成は以下です。

- データの正: Google Spreadsheet
- API / 一部 HTML 配信: Google Apps Script Web App
- 参加者 UI: LIFF 静的アプリ
- API プロキシ: Cloudflare Pages Functions
- 管理運用: まずは Spreadsheet 中心

## 🚀 はじめ方（Cloudflare セットアップ）

**最短で環境を構築する場合は、こちらから始めてください：**

👉 **[Cloudflare 環境セットアップ - クイックスタート](docs/cloudflare-quickstart.md)** 👈

- ✅ **所要時間**: 初回 30-40 分、再セットアップ 15-20 分
- ✅ **対象**: Cloudflare Pages で本番運用する方（推奨）
- ✅ **セキュア**: API キー認証、CORS 問題なし、GAS URL 隠蔽

### その他のドキュメント

- **[セットアップ手順書（詳細版）](docs/setup.md)** - Spreadsheet / GAS / LINE ミニアプリの完全ガイド
- **[Cloudflare Pages セットアップ](docs/cloudflare-pages-setup.md)** - Cloudflare Pages の詳細設定
- **[Cloudflare Secrets 設定](docs/cloudflare-secrets-setup.md)** - 環境変数の設定方法

---

## 現在の到達点

### 🎉 Sprint 1 完了（2025年12月29日）

Sheets + GAS Web App + LIFF の最小構成が完成しました！

- ✅ **Spreadsheet テンプレート確定** - 6タブのデータモデルとCSVテンプレート
- ✅ **GAS Web App 骨格実装** - HTML配信、health API、ログ/ロック機能
- ✅ **LIFF 初期画面実装** - ログイン、ユーザー識別、疎通確認
- ✅ **セットアップ手順完備** - 数ヶ月後でも再開できる詳細ドキュメント

詳細は **[Sprint 1 完了報告](docs/sprint1-completion-report.md)** をご覧ください。

### 🎉 Cloudflare Pages への移行完了（2025年1月12日）

- ✅ 本番配信元を Cloudflare Pages に統一
- ✅ `/api/gas/*` を Cloudflare Functions 経由に統一
- ✅ GAS 直アクセスは API キー必須
- ✅ JSONP 経路は廃止

詳細は **[Cloudflare 移行完了レポート](docs/cloudflare-migration-completion.md)** をご覧ください。

### 🚧 現在進行中

現在は Milestone 3 として、以下を進める段階です。

- 最新アンケートの取得 API
- LIFF での候補日表示
- 回答送信と `Responses` シート保存
- 初回プロフィール登録と `Users` シート連携
- ID トークン検証

進捗一覧は **[Milestone](Milestone.md)** を参照してください。

### 📊 データ構造・テンプレート

新方式のデータ構造は以下で確認できます：

- **[Spreadsheet スキーマ定義](docs/sheets-schema.md)** - 各タブの列定義と仕様
- **[シートテンプレート](sheet-template/)** - CSV形式のテンプレートファイル

### 🚀 Google Apps Script Web App

GAS Web App の実装とデプロイ手順：

- **[セットアップ手順書](docs/setup.md)** - 環境構築の完全ガイド（Spreadsheet / GAS / LINE ミニアプリ）
- **[GAS ディレクトリ](gas/)** - Apps Script のコードとデプロイ手順
- **[動作確認](gas/VERIFICATION.md)** - デプロイ後の動作確認チェックリスト
- **主な機能**: HTML配信、health API、Logsシート記録、LockService ラッパー

### 📱 LIFF 静的アプリケーション

**主開発場所: [`liff/`](liff/) ディレクトリ（Cloudflare Pages で配信）**

- **[liff/index.html](liff/index.html)** - LIFF アプリケーションの本体（`liff.init()` → `liff.getProfile()` 機能を実装）
- **[Cloudflare Pages セットアップ手順](docs/cloudflare-pages-setup.md)** - デプロイ手順
- **[Cloudflare Secrets 設定手順](docs/cloudflare-secrets-setup.md)** - GAS プロキシ API のための環境変数設定
- **[LIFF デプロイ・動作確認チェックリスト](docs/liff-deployment-verification.md)** - 本番運用前の総合的な確認手順
- **実装方針**: フロントエンドは GAS URL を直接参照せず、同一オリジンの `/api/*` のみを呼び出す

#### 🔌 Cloudflare Pages Functions（API プロキシ）

Cloudflare Pages Functions を使用して、GAS Web App への通信を集約しています：

- **[functions/api/gas/health.js](functions/api/gas/health.js)** - GAS ヘルスチェック API へのプロキシ
- **方針**: JSONP を廃止し、普通の JSON API として扱う
- **セキュリティ**: API キーによる認証（必須、環境変数で管理、Git 管理外）
- **メリット**: CORS 問題の回避、GAS URL の隠蔽、同一オリジン通信

#### 🛑 停止：GitHub Pages + JSONP 経路（2025-01-12）

**⚠️ この経路は完全に停止されました - 使用禁止**

セキュリティ強化のため、以下の経路を完全に廃止しました：

- ❌ **GitHub Pages から GAS への直接アクセス - 禁止**
- ❌ **JSONP (`callback` パラメータ) - 廃止**
- ❌ **API キーなしでの GAS アクセス - 禁止**

**現在の推奨構成**: Cloudflare Pages + Cloudflare Functions → **[クイックスタート](docs/cloudflare-quickstart.md)**

詳細と移行済みの記録は **[GitHub Pages + JSONP 廃止ドキュメント](docs/github-pages-jsonp-deprecation.md)** を参照してください。

#### 🔎 移行状況の確認資料

- **[Cloudflare Pages 移行 EPIC 完了レポート](docs/cloudflare-migration-epic-completion.md)**
- **[Cloudflare 移行完了レポート](docs/cloudflare-migration-completion.md)**
- **[移行検証チェックリスト](docs/cloudflare-migration-verification-checklist.md)**

#### 🛑 停止：GitHub Pages 静的 LIFF PoC（参考資料）

**⚠️ この手順は停止されました（2025-01-12）- 使用しないでください**

GitHub Pages で静的 LIFF を配信する PoC は完了しましたが、セキュリティ上の理由により停止されました：

- ❌ **[GitHub Pages LIFF PoC 手順書](docs/github-pages-liff-poc.md)** - **停止（運用不可）**
- ❌ **[miniapp-poc ディレクトリ](docs/miniapp-poc/)** - **停止（運用不可）**

**停止理由**:
- JSONP 廃止によりセキュリティリスクあり
- API キー管理ができない
- 本番運用には Cloudflare Pages を使用してください → **[クイックスタート](docs/cloudflare-quickstart.md)**

**位置づけ**: 過去の PoC として参考資料のみ。今後の開発は `liff/` (Cloudflare Pages) で行う

### 🔍 ログとトラブルシューティング

システム障害時の問題切り分けとログ確認の手順：

- **[ログ戦略とトラブルシューティング手順](docs/logging-strategy.md)** - 10分以内に問題を切り分ける手順
- **[Cloudflare ログ確認手順](docs/cloudflare-logs-guide.md)** - Cloudflare Pages Functions のログ確認方法
- **Spreadsheet Logs タブ** - GAS のリクエストログが記録される（永続的）

**ログの記録場所**:
- Cloudflare Functions → Cloudflare Dashboard で確認（24時間保存）
- GAS → Spreadsheet の Logs タブ（永続保存）
- LIFF → ブラウザコンソール（セッション中のみ）

**個人情報保護**:
- ログには LINE userId, displayName などの個人識別情報を記録しない
- 記録するのはリクエスト種類、エラー内容、タイムスタンプのみ

## 背景

現在は Google フォーム＋ LINE グループ＋ Excel のような運用で、

- 名前表記ゆれによる紐付けの大変さ
- 「誰が何回参加したのか」を追う手間
- 過去に読んだ絵本の記録が散逸してしまう

といった課題がある。

このリポジトリでは、次のようなポリシーで改善を目指します。

- ユーザー識別は **LINE の userId** で行い、「名前文字列マッチ地獄」から脱出する
- 年度ごとに活動を区切り、人に紐づくデータは長期保存しない
- 絵本の履歴は **ISBN / 書誌情報** ベースで残し、次の絵本選びに活かせるようにする

---

## 機能概要

### 管理者向け

- Spreadsheet でアンケートを作成・切替
- 回答結果を集計・確認
- 必要に応じて CSV エクスポート
- 確定日程・参加者の運用を整備

### 参加者（保護者）向け

- LINE ミニアプリ（LIFF）からのアンケート回答
  - LINE アカウント（userId）で識別
  - 最新アンケートの候補日を表示
  - 各候補日への参加可否を回答
  - 必要に応じてプロフィール登録

### 絵本の記録（将来機能）

- 読み聞かせで使用した絵本の登録
  - ISBN をもとに書誌情報・表紙画像URLを取得
  - 「いつ」「どの年度・学年で」読んだかを記録
- 過去に読んだ絵本の一覧・検索
- 「この学年でまだ読んでいない本」の把握

---

## 技術スタック

- フロントエンド
  - LIFF 静的アプリ (`liff/`)
- API プロキシ
  - Cloudflare Pages Functions (`functions/`)
- バックエンド
  - Google Apps Script Web App (`gas/`)
- データストア
  - Google Spreadsheet
- 外部サービス
  - LIFF / LINE Developers
  - 書誌情報 API（将来機能）

---

## ディレクトリ構成

```text
yomikikase-planner/
  README.md
  Milestone.md
  ArchitectureDesign.md
  RequirementSpecification.md

  docs/
  functions/           # Cloudflare Pages Functions
  gas/                 # Google Apps Script Web App
  liff/                # LIFF 静的アプリ
  scripts/             # 補助スクリプト
  sheet-template/      # Spreadsheet テンプレート
```

## 次にやること

- 最新アンケート取得 API の実装
- 回答送信 API の実装
- `Users` / `Responses` シート連携
- LIFF の実運用画面化
- 管理・運用補助機能の整備

詳細は Milestone.md を参照。