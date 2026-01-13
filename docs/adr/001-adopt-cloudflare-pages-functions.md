# ADR-001: Cloudflare Pages + Functions を採用し、GitHub Pages + JSONP を廃止する

**ステータス**: 採用済み (Accepted)  
**決定日**: 2025年1月12日  
**更新日**: 2026年1月13日

---

## 背景（Context）

Sprint 1 の完了により、「Google Spreadsheet + Google Apps Script + 静的 LIFF」という基本構成が成立した。

### 現状の成果
- ✅ Spreadsheet でのデータ管理
- ✅ GAS Web App による API 提供と HTML 配信
- ✅ LIFF による静的アプリケーション

### 課題
- **配信基盤の選択**: LIFF アプリケーションをどこでホスティングするか
- **API アクセス方式**: GAS への通信をどう安全に行うか
- **セキュリティ**: 公開 URL への直接アクセスによる濫用リスク

---

## 決定事項（Decision）

**Cloudflare Pages + Pages Functions に移行し、GitHub Pages + JSONP 経路を完全に廃止する。**

### 移行する範囲

#### 1. LIFF ホスティング（静的配信）
- **移行前**: GitHub Pages で静的 HTML/JS を配信
- **移行後**: Cloudflare Pages で静的 HTML/JS を配信
- **配置先**: リポジトリの `liff/` ディレクトリ

#### 2. API アクセス（データアクセス）
- **移行前**: ブラウザから GAS Web App URL に JSONP で直接アクセス
- **移行後**: Cloudflare Pages Functions (`/api/gas/*`) 経由で GAS にアクセス
- **配置先**: リポジトリの `functions/` ディレクトリ

### 保持する範囲（変更なし）

#### 1. データ層
- **Google Spreadsheet**: マスターデータストア
- **Google Apps Script**: ビジネスロジックと Spreadsheet アクセス

#### 2. データ構造
- Surveys, SurveyDates, Users, Responses などの既存タブ構成

---

## 理由（Rationale）

### なぜ Cloudflare Pages を選ぶのか

1. **セキュリティ強化**
   - Secrets 管理機能（環境変数）による API キーの安全な保管
   - 同一オリジン通信により CORS 問題を回避
   - GAS URL を隠蔽し、直接アクセスを防止

2. **運用の簡素化**
   - GitHub リポジトリとの自動連携（push で自動デプロイ）
   - Pages Functions による API プロキシの統合管理
   - 無料枠で十分な利用量（個人運用向け）

3. **保守性の向上**
   - GAS URL が変更されても、フロントエンドへの影響なし
   - API キーの一元管理（Cloudflare Dashboard）
   - レート制限の実装が容易（将来対応可能）

### なぜ GitHub Pages + JSONP を廃止するのか

1. **セキュリティリスク**
   - JSONP は XSS 攻撃のリスクがある
   - API キーが URL パラメータに露出する可能性
   - 公開 URL への直接アクセスで濫用リスクが高い

2. **保守性の問題**
   - Secrets 管理ができない（リポジトリに平文で保存される危険性）
   - CORS 対応が複雑

3. **運用上の課題**
   - レート制限の実装が困難
   - エラーハンドリングが不十分

### 段階的移行アプローチ

**今スプリントで実施**: まずは低リスクな形で移行
- Cloudflare Functions は GAS への「プロキシ」として機能
- GAS のビジネスロジックは変更せず、アクセス経路のみを変更
- Spreadsheet のデータ構造も変更なし

**将来の拡張可能性**（今スプリントでは実施しない）:
- Cloudflare D1（SQLite）への段階的なデータ移行
- Cloudflare Workers による追加機能の実装
- Cloudflare R2 による画像ストレージ

---

## アーキテクチャ図（Text Format）

### 全体構成

```
┌──────────────┐
│  参加者      │
│  (LINE)      │
└──────┬───────┘
       │
       │ LIFF 起動
       ↓
┌──────────────────────────────────────┐
│  Cloudflare Pages                    │
│  ┌────────────────────────────────┐  │
│  │  LIFF (静的 HTML/JS)           │  │
│  │  - liff/index.html             │  │
│  │  - LIFF SDK 統合               │  │
│  └────────────┬───────────────────┘  │
│               │                       │
│               │ /api/gas/* へ fetch   │
│               ↓                       │
│  ┌────────────────────────────────┐  │
│  │  Pages Functions (API Proxy)   │  │
│  │  - functions/api/gas/health.js │  │
│  │  - 環境変数で API キー管理     │  │
│  └────────────┬───────────────────┘  │
└───────────────┼───────────────────────┘
                │
                │ API キー付きリクエスト
                ↓
┌──────────────────────────────────────┐
│  Google Apps Script (Web App)        │
│  ┌────────────────────────────────┐  │
│  │  ビジネスロジック              │  │
│  │  - API キー検証                │  │
│  │  - JSONP 拒否                  │  │
│  │  - ルーティング                │  │
│  └────────────┬───────────────────┘  │
└───────────────┼───────────────────────┘
                │
                │ Apps Script API
                ↓
┌──────────────────────────────────────┐
│  Google Spreadsheet                  │
│  - Surveys, SurveyDates, Users       │
│  - Responses, Config, Logs           │
└──────────────────────────────────────┘
```

### コンポーネント配置

| コンポーネント | 配置場所 | 役割 |
|--------------|---------|------|
| **LIFF (静的)** | Cloudflare Pages (`liff/`) | 参加者向け UI |
| **API Proxy** | Cloudflare Pages Functions (`functions/`) | GAS への安全な通信経路 |
| **ビジネスロジック** | Google Apps Script | データ処理・検証 |
| **データストア** | Google Spreadsheet | マスターデータ |

---

## ロールバック手順（3ステップ）

万が一、Cloudflare Pages に問題が発生した場合の緊急対応手順:

### ステップ 1: LINE Endpoint URL を GAS に戻す（5分以内）

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. LINE ミニアプリチャネルを選択
3. Developing タブ → Basic settings
4. **Endpoint URL** を GAS URL に変更:
   ```
   https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```
5. 保存

**効果**: 参加者は GAS が直接配信する HTML にアクセスできる（LIFF 初期化は動作する）

### ステップ 2: GAS の API キー検証を一時的に無効化（10分以内）

1. Apps Script エディタを開く
2. `Code.gs` の `validateApiKey` 関数を修正:
   ```javascript
   function validateApiKey(apiKey) {
     // 緊急対応: API キー検証を一時的に無効化
     return true;
     
     // const expectedKey = PropertiesService.getScriptProperties().getProperty('API_KEY');
     // return apiKey === expectedKey;
   }
   ```
3. デプロイ → 新しいデプロイ → 既存のデプロイを更新

**効果**: API キーなしでも GAS にアクセス可能になる（セキュリティは低下）

### ステップ 3: 状況の監視と恒久対応の検討（1時間以内）

1. Spreadsheet の Logs タブでアクセス状況を確認
2. Cloudflare Pages の問題が解決可能か判断
3. 解決可能な場合: 修正後にステップ 1, 2 を逆順で戻す
4. 解決困難な場合: GitHub Pages への一時的な切り替えを検討

**注意**: ステップ 2 の状態は緊急時のみ使用し、問題解決後は必ず元に戻すこと

---

## やらないこと（今スプリントで触らない範囲）

### データ層の変更

- ❌ Google Spreadsheet から他のデータベース（Cloudflare D1, PostgreSQL など）への移行
- ❌ GAS のビジネスロジックの大幅な書き換え
- ❌ Spreadsheet のタブ構造・スキーマの変更

### 機能の追加

- ❌ 新しい API エンドポイントの追加（アンケート取得・回答送信は Sprint 2 以降）
- ❌ 認証・認可機能の強化（LIFF ID トークン検証は Sprint 2 以降）
- ❌ レート制限の実装
- ❌ 監視・アラート機能の実装

### インフラの拡張

- ❌ Cloudflare Workers への機能実装
- ❌ Cloudflare D1（SQLite）の導入
- ❌ Cloudflare R2（Object Storage）の導入
- ❌ CI/CD パイプラインの本格整備

### 運用面

- ❌ 複数環境（開発・ステージング・本番）の構築
- ❌ 自動テストの整備
- ❌ パフォーマンス監視の実装

---

## 影響範囲

### 変更が必要なもの

- ✅ LIFF アプリケーションの配信元 URL（LINE Developers Console で設定）
- ✅ フロントエンドの API 呼び出し先（`/api/gas/*` に統一）
- ✅ GAS の API キー検証・JSONP 拒否ロジック

### 変更が不要なもの

- ✅ Spreadsheet のデータ構造
- ✅ GAS のビジネスロジック（API キー検証以外）
- ✅ LIFF の UI/UX（配信元が変わるのみ）

---

## 関連ドキュメント

### 実装完了レポート
- [Cloudflare Pages 移行 EPIC 完了レポート](../cloudflare-migration-epic-completion.md)
- [Cloudflare 移行完了レポート](../cloudflare-migration-completion.md)
- [移行検証チェックリスト](../cloudflare-migration-verification-checklist.md)

### セットアップ手順
- [Cloudflare Pages セットアップ手順](../cloudflare-pages-setup.md)
- [Cloudflare Secrets 設定手順](../cloudflare-secrets-setup.md)
- [セットアップ手順書（全体）](../setup.md)

### 技術詳細
- [GAS Proxy サマリー](../gas-proxy-summary.md)
- [GAS API キー検証](../gas-api-key-verification.md)
- [GitHub Pages + JSONP 廃止について](../github-pages-jsonp-deprecation.md)

### データ設計
- [Spreadsheet スキーマ定義](../sheets-schema.md)
- [軌道修正計画（Pivot Plan）](../pivot-plan.md)

---

## 承認

- **提案者**: @copilot
- **レビュー**: 完了
- **承認日**: 2025年1月12日（実装完了）
- **ADR 文書化日**: 2026年1月13日

---

## 変更履歴

| 日付 | 変更内容 | 担当 |
|------|---------|------|
| 2025-01-13 | ADR 初版作成 | @copilot |
