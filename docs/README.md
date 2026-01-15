# ドキュメント一覧

このディレクトリには、yomikikase-planner のセットアップ、運用、アーキテクチャに関するドキュメントが含まれています。

## 🚀 はじめに

### 新規セットアップ（推奨）

**Cloudflare Pages で本番運用する場合**:

1. **[Cloudflare 環境セットアップ - クイックスタート](cloudflare-quickstart.md)** ← **ここから始める**
   - 所要時間: 初回 30-40 分
   - Spreadsheet、GAS、Cloudflare Pages、LINE ミニアプリの全セットアップ

### 詳細な設定手順

2. **[セットアップ手順書（詳細版）](setup.md)**
   - Spreadsheet / GAS / LINE ミニアプリの詳細ガイド
   - トラブルシューティング情報

3. **[Cloudflare Pages セットアップ](cloudflare-pages-setup.md)**
   - Cloudflare Pages プロジェクトの作成と設定

4. **[Cloudflare Secrets 設定](cloudflare-secrets-setup.md)**
   - 環境変数（GAS_BASE_URL、GAS_API_KEY）の設定

---

## 📐 アーキテクチャ

### 現在のアーキテクチャ（Cloudflare Pages）

- **[ADR-001: Cloudflare Pages + Functions 採用](adr/001-adopt-cloudflare-pages-functions.md)**
  - アーキテクチャ決定の背景と理由
  - ロールバック手順を含む

- **[Spreadsheet スキーマ定義](sheets-schema.md)**
  - 各タブ（Config、Surveys、Users、Responses、Logs）の列定義

### 軌道修正の経緯

- **[軌道修正計画（Pivot Plan）](pivot-plan.md)**
  - Next.js/Prisma → Spreadsheet + GAS への方針転換

---

## 🔧 運用・保守

### ログとトラブルシューティング

- **[ログ戦略とトラブルシューティング手順](logging-strategy.md)**
  - 10分以内に問題を切り分ける手順

- **[Cloudflare ログ確認手順](cloudflare-logs-guide.md)**
  - Cloudflare Pages Functions のログ確認方法

### 動作確認

- **[LIFF デプロイ・動作確認チェックリスト](liff-deployment-verification.md)**
  - 本番運用前の総合的な確認手順

- **[GAS 動作確認](../gas/VERIFICATION.md)**
  - GAS Web App のデプロイ後確認

---

## 📊 完了レポート・検証記録

### Cloudflare 移行（2025-01-12 完了）

- **[Cloudflare 移行完了レポート](cloudflare-migration-completion.md)**
- **[Cloudflare Pages 移行 EPIC 完了レポート](cloudflare-migration-epic-completion.md)**
- **[EPIC サマリー](EPIC-cloudflare-migration-summary.md)**
- **[移行検証チェックリスト](cloudflare-migration-verification-checklist.md)**

### Sprint 1（2025-12-29 完了）

- **[Sprint 1 完了報告](sprint1-completion-report.md)**
  - Sheets + GAS + LIFF 最小構成の完成

---

## 🛑 停止された手順（参考資料）

**⚠️ 以下の手順は停止されました - 使用しないでください**

### GitHub Pages + JSONP 経路（2025-01-12 停止）

- **[GitHub Pages LIFF PoC 手順書](github-pages-liff-poc.md)** ← **停止（運用不可）**
  - 停止理由: JSONP 廃止、セキュリティリスク、API キー管理不可

- **[GitHub Pages + JSONP 廃止について](github-pages-jsonp-deprecation.md)**
  - 廃止の詳細と移行記録

**現在の推奨**: [Cloudflare 環境セットアップ](cloudflare-quickstart.md)

---

## 📚 参考情報

### データ構造

- **[Spreadsheet スキーマ定義](sheets-schema.md)**
- **[シートテンプレート](../sheet-template/)**

### API 設定

- **[API 設定値について](api-config-values.md)**
- **[GAS API キー検証手順](gas-api-key-verification.md)**

### その他

- **[レガシーブランチ作成手順](create-legacy-branch.md)**
  - Next.js/Prisma 実装の保存方法

---

## ディレクトリ構成

```
docs/
├── README.md                               # このファイル（ドキュメント一覧）
│
├── 🚀 セットアップ
│   ├── cloudflare-quickstart.md           # クイックスタート（推奨）
│   ├── setup.md                            # 詳細セットアップ手順
│   ├── cloudflare-pages-setup.md          # Cloudflare Pages 設定
│   └── cloudflare-secrets-setup.md        # Cloudflare 環境変数設定
│
├── 📐 アーキテクチャ
│   ├── adr/                                # アーキテクチャ決定記録
│   │   ├── README.md
│   │   └── 001-adopt-cloudflare-pages-functions.md
│   ├── sheets-schema.md                    # Spreadsheet スキーマ
│   └── pivot-plan.md                       # 軌道修正計画
│
├── 🔧 運用・保守
│   ├── logging-strategy.md                 # ログ戦略
│   ├── cloudflare-logs-guide.md           # Cloudflare ログ確認
│   └── liff-deployment-verification.md    # LIFF 動作確認
│
├── 📊 完了レポート
│   ├── cloudflare-migration-completion.md
│   ├── cloudflare-migration-epic-completion.md
│   ├── EPIC-cloudflare-migration-summary.md
│   └── sprint1-completion-report.md
│
└── 🛑 停止された手順（参考資料）
    ├── github-pages-liff-poc.md           # 停止（運用不可）
    └── github-pages-jsonp-deprecation.md  # 廃止の詳細
```

---

## 更新履歴

| 日付 | 変更内容 | 担当 |
|------|---------|------|
| 2026-01-15 | ドキュメント一覧を作成、Cloudflare 優先の構成に整理 | @copilot |
