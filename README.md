# yomikikase-planner

幼稚園の「絵本読み聞かせ」活動のための、LINEミニアプリ＋管理用Webアプリです。

## ⚠️ 重要なお知らせ：アーキテクチャの軌道修正

**2025年12月: Google Spreadsheet + Apps Script + 静的LIFF への方針転換**

個人運用で更新頻度が低い（1ヶ月〜1年）ため、Node/Next の依存更新追従を前提にしない構成に軌道修正しました。
詳細は **[軌道修正計画（Pivot Plan）](docs/pivot-plan.md)** をご覧ください。

- データの正：Google Spreadsheet
- API/配信：Google Apps Script（Web App）
- 参加者UI：LIFF（静的HTML/JS、依存最小）
- 管理UI：まずは Spreadsheet（必要最小限の運用）

### 🎉 Sprint 1 完了（2025年12月29日）

Sheets + GAS Web App + LIFF の最小構成が完成しました！

- ✅ **Spreadsheet テンプレート確定** - 6タブのデータモデルとCSVテンプレート
- ✅ **GAS Web App 骨格実装** - HTML配信、health API、ログ/ロック機能
- ✅ **LIFF 初期画面実装** - ログイン、ユーザー識別、疎通確認
- ✅ **セットアップ手順完備** - 数ヶ月後でも再開できる詳細ドキュメント

詳細は **[Sprint 1 完了報告](docs/sprint1-completion-report.md)** をご覧ください。

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
- **実装方針**: フロントエンドは GAS URL を直接参照せず、同一オリジンの `/api/*` のみを呼び出す

#### 🔌 Cloudflare Pages Functions（API プロキシ）

Cloudflare Pages Functions を使用して、GAS Web App への通信を集約しています：

- **[functions/api/gas/health.js](functions/api/gas/health.js)** - GAS ヘルスチェック API へのプロキシ
- **方針**: JSONP を廃止し、普通の JSON API として扱う
- **セキュリティ**: API キーによる認証（必須、環境変数で管理、Git 管理外）
- **メリット**: CORS 問題の回避、GAS URL の隠蔽、同一オリジン通信

#### ⚠️ 重要なお知らせ：GitHub Pages + JSONP 経路の廃止（2025-01-12）

セキュリティ強化のため、以下の経路を完全に廃止しました：

- ❌ **GitHub Pages から GAS への直接アクセス禁止**
- ❌ **JSONP (`callback` パラメータ) の廃止**
- ❌ **API キーなしでの GAS アクセス禁止**

詳細と移行手順は **[GitHub Pages + JSONP 廃止ドキュメント](docs/github-pages-jsonp-deprecation.md)** を参照してください。

#### 🎉 Cloudflare Pages への移行完了（2025-01-12）

LINE ミニアプリの配信元を Cloudflare Pages に統一しました：

- ✅ **本番運用**: Cloudflare Pages (`liff/`) - Endpoint URL を Cloudflare に設定
- ✅ **API 経路**: `/api/gas/*` (Cloudflare Functions) 経由で GAS にアクセス
- ✅ **セキュリティ**: API キー必須、JSONP 廃止、GAS 直接アクセス禁止
- 🏆 **EPIC 完了レポート**: **[Cloudflare Pages 移行 EPIC 完了レポート](docs/cloudflare-migration-epic-completion.md)**
- 📊 **移行完了レポート**: **[Cloudflare 移行完了レポート](docs/cloudflare-migration-completion.md)**
- 📋 **検証チェックリスト**: **[移行検証チェックリスト](docs/cloudflare-migration-verification-checklist.md)**

#### 📚 参考：GitHub Pages 静的 LIFF PoC（過去の成果物）

GitHub Pages で静的 LIFF を配信する PoC（概念実証）として作成されました：

- **[GitHub Pages LIFF PoC 手順書](docs/github-pages-liff-poc.md)** - GitHub Pages セットアップと LINE 連携の完全ガイド（運用非推奨）
- **[miniapp-poc ディレクトリ](docs/miniapp-poc/)** - 静的 LIFF アプリケーションの PoC 実装（運用非推奨）
- **位置づけ**: 過去の PoC として参考用に保存。**JSONP 廃止により使用不可**。今後の開発は `liff/` (Cloudflare Pages) で行う

### 旧実装（Next.js/Prisma）の参照先

当初のNext.js/Prismaベースの実装は、以下のブランチ・タグで保存されています：

- **ブランチ**: [`legacy/nextjs-2025-12`](https://github.com/ihsinoky/yomikikase-planner/tree/legacy/nextjs-2025-12)
- **タグ**: [`legacy-nextjs-2025-12`](https://github.com/ihsinoky/yomikikase-planner/tree/legacy-nextjs-2025-12)

今後の開発は新方針（Spreadsheet + GAS + 静的LIFF）で進めます。

---

## 旧README（参考情報）

以下は当初の計画内容です（Next.js/Prisma ベース）。新方式への移行に伴い、参考情報として残しています。

- 保護者は LINE ミニアプリから **参加アンケートに回答** する
- 管理者は Web 画面から **アンケート結果を確認** し、**確定した日程・参加者を登録** する
- 人に紐づくデータ（参加履歴など）は年度単位で完結させつつ、
  **「どの学年でどの絵本を読んだか」の履歴だけ長期保存** できることを目指します

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

## 機能概要（MVP）

MVP では、機能をできるだけ絞り込んでスタートします。

### 管理者向け

- アンケート作成
  - 年度・タイトル・説明
  - 開催候補日（日時＋対象学年）の登録
- アンケート結果の確認
  - 学年・クラスでフィルタ表示
  - CSV エクスポート（別システムでの自動割り当てを想定）
- 確定日程・参加者の登録
  - 学年・クラスごとに見やすいビューで参加者を設定
  - 確定済み日程の一覧表示

### 参加者（保護者）向け

- LINE ミニアプリ（LIFF）からのアンケート回答
  - 初回のみ、名前・学年・クラスを登録
  - 以降は LINE アカウント（userId）で識別
  - 対象アンケートごとに、各候補日への参加可否を回答

### 絵本の記録（将来機能）

- 読み聞かせで使用した絵本の登録
  - ISBN をもとに書誌情報・表紙画像URLを取得
  - 「いつ」「どの年度・学年で」読んだかを記録
- 過去に読んだ絵本の一覧・検索
- 「この学年でまだ読んでいない本」の把握

MVP 段階では **絵本機能のデータモデルだけ定義** し、実装は後続マイルストーンで進める想定です。

---

## 想定技術スタック（案）

※あくまで現時点の候補。実装開始時に見直してもよい。

- フロントエンド
  - LINE ミニアプリ(LIFF)：TypeScript + React（または Next.js の一部として実装）
  - 管理画面：TypeScript + React / Next.js
- バックエンド API
  - Node.js + TypeScript
  - Web フレームワーク：Express / Fastify / NestJS のいずれか
- データベース
  - PostgreSQL もしくは MySQL系（RDB想定）
- インフラ
  - 任意のクラウド（例：Railway, Render, Fly.io, AWS, GCP など）
- 外部サービス
  - LINE Messaging API / LIFF
  - 書誌情報取得用 API（Google Books API / 国会図書館サーチなど）※候補

---

## ディレクトリ構成（案）

まだ実装前なので「たたき台」です。

```text
yomikikase-planner/
  README.md
  Milestone.md
  ArchitectureDesign.md

  src/
    backend/           # API サーバー側
      app/             # ユースケース・サービス
      domain/          # ドメインモデル
      infra/           # DB・外部API連携
      interfaces/      # HTTP ルーティング・DTO
    frontend/
      admin/           # 管理画面（Web）
      liff/            # LIFF アプリ（保護者向け）

  docs/
    # 設計ドキュメント等をここに追加していく予定

  .env.example         # 環境変数のサンプル
  package.json
  tsconfig.json
```

## 開発の進め方（ざっくり）

- まずはドメイン・データモデル・API の最小セットを固める
- 管理画面から、
    - アンケート作成
    - アンケート結果閲覧
    - 確定日程登録ができるところを最初の目標にする
- その後、LIFF 側からのアンケート回答を実装
- 絵本記録機能は、データモデルを活かして段階的に足していく

詳細は Milestone.md を参照。