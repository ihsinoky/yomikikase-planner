# [EPIC] Cloudflare Pages + Pages Functions 移行完了レポート

**EPIC完了日**: 2025年1月12日  
**ステータス**: ✅ 完了

---

## エグゼクティブサマリー

LINE ミニアプリの配信元を **GitHub Pages + GAS(JSONP)** から **Cloudflare Pages + Pages Functions** への移行が完了しました。

### 主な成果

- ✅ **セキュリティ強化**: API キー必須化、JSONP 廃止、GAS 直接アクセス禁止
- ✅ **運用の簡素化**: 同一オリジン API、Secrets 管理の一元化
- ✅ **アーキテクチャの統一**: 静的配信と API プロキシを Cloudflare に集約
- ✅ **旧経路の停止**: GitHub Pages + JSONP 経路を完全に非推奨化

---

## 背景と目的

### 背景

- GitHub Pages 上の静的 LIFF で「LINE ミニアプリとして動作する」PoC は確認済み
- 次フェーズは **Cloudflare Pages（静的配信）+ Pages Functions（API）** に統一し、運用を軽量化
- 旧経路である **GitHub Pages + GAS(JSONP)** は停止（運用導線から除外）

### 目的

1. LIFF の配信先を Cloudflare Pages に切り替え、LINE ミニアプリの Endpoint URL も Cloudflare に統一
2. API は Pages Functions の `/api/*` に集約し、ブラウザから GAS を直接叩かない（JSONP 依存を排除）
3. GitHub Pages + GAS(JSONP) 経路を停止する（誤って使い続けない状態にする）

---

## 実装完了項目

### ✅ Issue 1: Cloudflare Pages プロジェクト作成 & 最小デプロイ

**完了内容**:
- Cloudflare Pages プロジェクトを作成し、GitHub リポジトリと連携
- `liff/` ディレクトリを公開ディレクトリとして設定
- 自動デプロイパイプラインの構築（main ブランチへの push で自動デプロイ）

**エビデンス**:
- [Cloudflare Pages セットアップ手順](cloudflare-pages-setup.md)
- `liff/` ディレクトリの構成確認済み

### ✅ Issue 2: LIFF 静的アプリを Cloudflare 用ディレクトリへ移植

**完了内容**:
- LIFF 静的アプリ (`index.html`) を `liff/` ディレクトリに配置
- LIFF SDK による初期化、ログイン、プロフィール取得機能を実装
- セキュリティ対策（XSS 防止、入力検証）を実装

**エビデンス**:
- `liff/index.html` - 完全な LIFF アプリケーション実装
- `liff/README.md` - 実装内容と使用方法の説明

### ✅ Issue 3: Pages Functions 基盤（/api/health + _routes.json）

**完了内容**:
- `/api/health` エンドポイントを実装（Cloudflare Functions 動作確認用）
- `_routes.json` を設定し、`/api/*` へのルーティングを定義
- Pages Functions の基本構造を確立

**エビデンス**:
- `functions/api/health.js` - ヘルスチェック API 実装
- `liff/_routes.json` - ルーティング設定

```json
{
  "version": 1,
  "include": ["/api/*"],
  "exclude": []
}
```

### ✅ Issue 4: Pages Functions で GAS Proxy（Secrets 利用）

**完了内容**:
- `/api/gas/health` エンドポイントを実装（GAS へのプロキシ）
- 環境変数による Secrets 管理（`GAS_BASE_URL`, `GAS_API_KEY`）
- タイムアウト処理、エラーハンドリング、適切なステータスコード返却
- ハイブリッドエラーハンドリング（HTTP ステータス + JSON body 両対応）

**エビデンス**:
- `functions/api/gas/health.js` - GAS プロキシ実装
- [Cloudflare Secrets 設定手順](cloudflare-secrets-setup.md)
- [GAS Proxy サマリー](gas-proxy-summary.md)

### ✅ Issue 5: GAS - JSONP 廃止 + API key 必須化（直叩き401）

**完了内容**:
- `callback` パラメータを検出して明示的にエラーを返す処理を実装
- API キーの検証を必須化（未設定または不正な場合は `Unauthorized` エラー）
- スクリプトプロパティによる API キー管理
- タイミング攻撃軽減のための長さチェック

**エビデンス**:
- `gas/Code.gs` - JSONP 廃止と API キー検証の実装

```javascript
// JSONP callback パラメータを最初にチェック
if (e.parameter.callback) {
  return createJsonError('JSONP is not supported. Please use JSON API via Cloudflare Functions.');
}

// API キーの検証
if (!validateApiKey(e)) {
  return createJsonError('Unauthorized');
}
```

- `gas/README.md` - 直接アクセス禁止の明記
- [GAS API キー検証](gas-api-key-verification.md)

### ✅ Issue 6: LINE Endpoint 切替 & GitHub Pages 経路停止

**完了内容**:
- LINE Developers Console の Endpoint URL を Cloudflare Pages に変更
- GitHub Pages 関連ドキュメントに廃止警告を追加
- 旧導線（GitHub Pages + JSONP）の停止を明記
- ロールバック手順の文書化

**エビデンス**:
- [Cloudflare 移行完了レポート](cloudflare-migration-completion.md)
- [GitHub Pages + JSONP 廃止について](github-pages-jsonp-deprecation.md)
- `docs/miniapp-poc/README.md` - ⚠️ 警告セクション追加
- `docs/github-pages-liff-poc.md` - ⚠️ 警告とロールバック手順追加

---

## EPIC DoD（完了条件）の確認

**DoD 検証レポート**: [EPIC DoD 検証レポート](EPIC-dod-verification-report.md)

### ✅ 1. LINE ミニアプリが Cloudflare Pages の URL を配信面として使用している

**確認内容**:
- LINE Developers Console の Endpoint URL が Cloudflare Pages (`https://{project-name}.pages.dev/`) に設定されている
- LIFF アプリケーションが `liff/` ディレクトリから配信されている
- LINE アプリから起動時、Cloudflare Pages の URL が使用される

**確認方法**:
```
https://miniapp.line.me/{LIFF_ID}?liffId={LIFF_ID}
→ Cloudflare Pages からコンテンツが配信される
```

### ✅ 2. フロントエンドの API 呼び出し先が `/api/*` に統一され、JSONP を使用していない

**確認内容**:
- すべての API 呼び出しが `/api/gas/*` エンドポイントを使用
- JSONP（`callback` パラメータ）は使用されていない
- 標準的な `fetch()` API による JSON 通信

**確認方法**:
```javascript
// ✅ 実装済み: fetch API による JSON 通信
const response = await fetch('/api/gas/health');
const data = await response.json();
```

コードベース内に `callback` パラメータを含むリクエストは存在しない（grep 検証済み）。

### ✅ 3. GAS は Cloudflare 経由でのみ利用され、直アクセス（鍵なし）は拒否される

**確認内容**:
- GAS の `doGet()` に API キー検証を実装
- API キーなしのリクエストは `Unauthorized` エラーを返す
- `callback` パラメータ付きリクエストは明示的にエラーを返す
- Cloudflare Functions 経由のアクセスのみが推奨される

**確認方法**:
```bash
# ❌ API キーなしで直接アクセス → 拒否される
curl "https://script.google.com/macros/s/.../exec?action=health"
# レスポンス: {"ok":false,"error":"Unauthorized"}

# ❌ callback パラメータ付きアクセス → 拒否される
curl "https://script.google.com/.../exec?action=health&apiKey=...&callback=test"
# レスポンス: {"ok":false,"error":"JSONP is not supported..."}

# ✅ Cloudflare Functions 経由 → 成功
curl "https://{project-name}.pages.dev/api/gas/health"
# レスポンス: {"ok":true,"timestamp":"...","message":"..."}
```

### ✅ 4. GitHub Pages + GAS(JSONP) の導線が実装/ドキュメント上から除外されている（停止状態）

**確認内容**:
- `docs/miniapp-poc/README.md` に停止警告を追加
- `docs/github-pages-liff-poc.md` に停止警告とロールバック手順を追加
- README.md に Cloudflare Pages が本番環境であることを明記
- GitHub Pages は「参考資料」として位置づけ

**警告内容**:
```markdown
## ⚠️ **重要：この PoC は完了しました（運用非推奨）**

**2025年1月12日 - GitHub Pages 経路は停止されました**

- ❌ **この環境は運用に使用しないでください**
- ✅ **本番運用は Cloudflare Pages を使用してください**
```

---

## アーキテクチャ比較

### 旧構成（GitHub Pages + JSONP）

```
参加者（LINE）
    ↓
GitHub Pages (静的LIFF)
    ↓ (JSONP - 直接アクセス)
Google Apps Script
    ↓
Google Spreadsheet
```

**問題点**:
- API キーが URL に露出するリスク
- JSONP は XSS 攻撃のリスク
- CORS 問題への対応が複雑
- Secrets 管理ができない

### 新構成（Cloudflare Pages + Functions）

```
参加者（LINE）
    ↓
Cloudflare Pages (静的LIFF)
    ↓ (同一オリジン)
Cloudflare Pages Functions (/api/gas/*)
    ↓ (API キー付き JSON)
Google Apps Script
    ↓
Google Spreadsheet
```

**改善点**:
- ✅ API キーは環境変数で管理（URL 露出なし）
- ✅ JSONP 廃止（XSS リスク排除）
- ✅ 同一オリジン通信（CORS 問題なし）
- ✅ Secrets の集中管理
- ✅ GAS への直接アクセスをブロック
- ✅ レート制限の実装が可能（将来対応可能）

---

## セキュリティ強化の詳細

| 項目 | 旧構成 | 新構成 | 改善内容 |
|-----|--------|--------|---------|
| **API キー管理** | URL パラメータ（露出リスク） | 環境変数（Cloudflare Secrets） | ✅ 安全性向上 |
| **JSONP** | 使用（XSS リスク） | 完全廃止 | ✅ XSS 攻撃防止 |
| **GAS 直接アクセス** | 可能（濫用リスク） | ブロック（Unauthorized） | ✅ 濫用防止 |
| **CORS** | クライアント対応必要 | 同一オリジン（不要） | ✅ 実装簡素化 |
| **レート制限** | 実装困難 | Functions で実装可能 | ✅ 将来拡張可能 |
| **認証方式** | オプション | 必須（API key） | ✅ セキュリティ強化 |

---

## ドキュメント一覧

### セットアップ・手順書

- [Cloudflare Pages セットアップ手順](cloudflare-pages-setup.md)
- [Cloudflare Secrets 設定手順](cloudflare-secrets-setup.md)
- [セットアップ手順書（全体）](setup.md)

### 移行関連

- [Cloudflare 移行完了レポート](cloudflare-migration-completion.md)
- [移行検証チェックリスト](cloudflare-migration-verification-checklist.md)
- [GitHub Pages + JSONP 廃止について](github-pages-jsonp-deprecation.md)

### 技術詳細

- [GAS Proxy サマリー](gas-proxy-summary.md)
- [GAS API キー検証](gas-api-key-verification.md)
- [Cloudflare Functions 検証](cloudflare-functions-verification.md)
- [GAS Proxy 検証](gas-proxy-verification.md)

### 参考（PoC・過去資料）

- [GitHub Pages LIFF PoC 手順書](github-pages-liff-poc.md) - ⚠️ 運用非推奨
- [PoC 検証チェックリスト](poc-verification-checklist.md) - ⚠️ 運用非推奨

---

## 今後の運用方針

### 推奨環境（本番運用）

- **配信**: Cloudflare Pages (`liff/`)
- **API**: Cloudflare Pages Functions (`/api/gas/*`)
- **認証**: API キー必須（環境変数管理）
- **デプロイ**: main ブランチへの push で自動デプロイ

### 非推奨環境（参考資料のみ）

- **配信**: ❌ GitHub Pages (`docs/miniapp-poc/`)
- **API**: ❌ GAS 直接アクセス + JSONP
- **用途**: 過去の PoC として参考資料のみ保存

### 開発フロー

1. **機能開発**: `liff/` ディレクトリでコード変更
2. **API 追加**: `functions/api/` に新しい Functions を追加
3. **コミット & プッシュ**: main ブランチに push
4. **自動デプロイ**: Cloudflare Pages が自動的にデプロイ
5. **動作確認**: `https://{project-name}.pages.dev/` で確認

---

## トラブルシューティング

### ロールバック手順

緊急時のロールバック手順は [GitHub Pages LIFF PoC 手順書](github-pages-liff-poc.md) に記載されています。

**⚠️ 注意**: ロールバックはセキュリティリスクがあるため、緊急時のみ実施してください。

1. LINE Developers Console で Endpoint URL を GitHub Pages に戻す
2. GAS の API キー要件を一時的に緩和（非推奨）
3. 動作確認後、速やかに Cloudflare Pages に戻す

### よくある問題

詳細は各ドキュメントを参照してください:

- [GitHub Pages + JSONP 廃止について - トラブルシューティング](github-pages-jsonp-deprecation.md#トラブルシューティング)
- [GAS README - トラブルシューティング](../gas/README.md#トラブルシューティング)

---

## 検証エビデンス

### コード検証

- ✅ `liff/index.html` が Cloudflare Pages でホストされている
- ✅ `functions/api/gas/health.js` が実装されている
- ✅ `liff/_routes.json` で `/api/*` ルーティングが設定されている
- ✅ `gas/Code.gs` に API キー検証と JSONP 拒否が実装されている
- ✅ コードベースに `callback` パラメータを使用する箇所がない（grep 検証済み）

### ドキュメント検証

- ✅ README.md に Cloudflare Pages が本番環境として記載されている
- ✅ GitHub Pages 関連ドキュメントに停止警告が追加されている
- ✅ ロールバック手順が文書化されている
- ✅ セットアップ手順書が整備されている

---

## まとめ

**[EPIC] Cloudflare Pages + Pages Functions への移行** は完了しました。

### 達成した成果

1. ✅ **セキュリティの大幅強化**: API キー必須化、JSONP 廃止、GAS 直接アクセス禁止
2. ✅ **アーキテクチャの統一**: Cloudflare Pages による静的配信と API プロキシの集約
3. ✅ **運用の簡素化**: 同一オリジン通信、Secrets 管理の一元化
4. ✅ **旧経路の完全停止**: GitHub Pages + JSONP 経路の非推奨化
5. ✅ **包括的なドキュメント整備**: セットアップ、移行、トラブルシューティングの完全ガイド

### 次のステップ（別EPIC/別Issue）

- 予約登録等の本機能追加（API 設計・UI 実装の拡張）
- 本格的な認証（OAuth 等）の導入
- 監視/アラート整備
- 審査・本番公開の最終対応

---

## 関連リンク

- **EPIC Issue**: [#XX] Cloudflare Pages + Pages Functions へ移行（静的LIFF + API Gateway）
- **メインREADME**: [README.md](../README.md)
- **GAS README**: [gas/README.md](../gas/README.md)
- **LIFF README**: [liff/README.md](../liff/README.md)

---

**承認者**: ___________________  
**承認日**: ___________________
