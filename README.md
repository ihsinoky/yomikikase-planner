# yomikikase-planner

幼稚園の「絵本読み聞かせ」活動のための、LINE ミニアプリと運用補助ツールです。

この README は、初見の人が最初に読む入口です。  
詳細は用途ごとに次の文書を参照してください。

- 全体像と導入: `README.md`
- 現在のシステム構成: `ArchitectureDesign.md`
- 現在の要求仕様: `RequirementSpecification.md`
- 進捗と優先順位: `Milestone.md`
- セットアップと運用: `docs/README.md`

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

### 完了済み

- Sprint 1: Sheets + GAS Web App + LIFF の最小構成
- Cloudflare Pages / Functions への移行

### 🎉 Cloudflare Pages への移行完了（2025年1月12日）

- ✅ 本番配信元を Cloudflare Pages に統一
- ✅ `/api/gas/*` を Cloudflare Functions 経由に統一
- ✅ GAS 直アクセスは API キー必須
- ✅ JSONP 経路は廃止

詳細な完了記録は `docs/README.md` から辿れます。

### 🚧 現在進行中

現在は Milestone 3 として、以下を進める段階です。

- 最新アンケートの取得 API
- LIFF での候補日表示
- 回答送信と `Responses` シート保存
- 初回プロフィール登録と `Users` シート連携
- ID トークン検証

進捗一覧は **[Milestone](Milestone.md)** を参照してください。

## 文書の読み分け

### 全体像を知りたいとき

- [ArchitectureDesign.md](ArchitectureDesign.md)
- [RequirementSpecification.md](RequirementSpecification.md)

### 進捗を知りたいとき

- [Milestone.md](Milestone.md)

### セットアップしたいとき

- [docs/cloudflare-quickstart.md](docs/cloudflare-quickstart.md)
- [docs/setup.md](docs/setup.md)

### データ構造を確認したいとき

- [docs/sheets-schema.md](docs/sheets-schema.md)
- [sheet-template/README.md](sheet-template/README.md)

### 検証やトラブルシューティングをしたいとき

- [docs/README.md](docs/README.md)

## 停止済みの経路

### GitHub Pages + JSONP 経路

**⚠️ この経路は完全に停止されました - 使用禁止**

セキュリティ強化のため、以下の経路を完全に廃止しました：

- ❌ **GitHub Pages から GAS への直接アクセス - 禁止**
- ❌ **JSONP (`callback` パラメータ) - 廃止**
- ❌ **API キーなしでの GAS アクセス - 禁止**

**現在の推奨構成**: Cloudflare Pages + Cloudflare Functions → **[クイックスタート](docs/cloudflare-quickstart.md)**

詳細と移行済みの記録は **[GitHub Pages + JSONP 廃止ドキュメント](docs/github-pages-jsonp-deprecation.md)** を参照してください。

### GitHub Pages 静的 LIFF PoC

**⚠️ この手順は停止されました（2025-01-12）- 使用しないでください**

GitHub Pages で静的 LIFF を配信する PoC は完了しましたが、セキュリティ上の理由により停止されました：

- ❌ **[GitHub Pages LIFF PoC 手順書](docs/github-pages-liff-poc.md)** - **停止（運用不可）**
- ❌ **[miniapp-poc ディレクトリ](docs/miniapp-poc/)** - **停止（運用不可）**

**停止理由**:
- JSONP 廃止によりセキュリティリスクあり
- API キー管理ができない
- 本番運用には Cloudflare Pages を使用してください → **[クイックスタート](docs/cloudflare-quickstart.md)**

**位置づけ**: 過去の PoC として参考資料のみ。今後の開発は `liff/` (Cloudflare Pages) で行う

## ログとトラブルシューティング

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

## 現在の提供価値

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

## 現在の技術スタック

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

詳細な次の作業は [Milestone.md](Milestone.md) を参照してください。