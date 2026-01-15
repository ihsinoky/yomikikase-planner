# Cloudflare 環境セットアップ - クイックスタート

このドキュメントは、yomikikase-planner を Cloudflare Pages で最短で立ち上げる手順を説明します。
**数ヶ月空いても再開できる**ことを目的としています。

## 🎯 この手順で達成できること

- ✅ Cloudflare Pages で静的 LIFF を配信
- ✅ Cloudflare Pages Functions で GAS へのプロキシ API を構築
- ✅ LINE ミニアプリから安全に GAS にアクセス
- ✅ API キー認証によるセキュリティ確保

## ⏱️ 所要時間

- **初回セットアップ**: 約 30-40 分
- **再セットアップ（数ヶ月後）**: 約 15-20 分（設定値が残っている場合）

---

## 📋 前提条件

以下のアカウントと設定が必要です：

- [x] **Cloudflare アカウント**（無料プランで OK）
- [x] **Google アカウント**（Spreadsheet と Apps Script 用）
- [x] **LINE Developers アカウント**（LINE ミニアプリ作成用）
- [x] **GitHub アカウント**（このリポジトリへのアクセス権）

---

## 🚀 セットアップ手順

### ステップ 1: Google Spreadsheet と GAS のセットアップ

**目的**: データベースと API サーバーの準備

**手順**:
1. [セットアップ手順書](setup.md) の「1. Google Spreadsheet の作成」を実施
2. [セットアップ手順書](setup.md) の「2. Google Apps Script の作成・デプロイ」を実施
3. **重要**: 以下の値をメモ
   - Spreadsheet ID
   - GAS Web App URL（`https://script.google.com/macros/s/.../exec`）

**所要時間**: 約 15 分

---

### ステップ 2: GAS の API キー設定

**目的**: セキュアな API アクセスを実現

**手順**:
1. ターミナルで API キーを生成:
   ```bash
   openssl rand -base64 32
   ```
2. 生成された文字列をコピー（例: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4==`）
3. Apps Script エディタで「プロジェクトの設定」→「スクリプト プロパティ」を開く
4. 「スクリプト プロパティを追加」をクリック
5. 以下を入力:
   - **プロパティ**: `API_KEY`
   - **値**: 生成した API キー
6. 「スクリプト プロパティを保存」をクリック
7. **重要**: API キーをメモ（次のステップで使用）

**所要時間**: 約 3 分

**詳細**: [GAS API キー検証手順](gas-api-key-verification.md)

---

### ステップ 3: Cloudflare Pages プロジェクトの作成

**目的**: 静的 LIFF アプリケーションの配信

**手順**:
1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. 左サイドバーから「Workers & Pages」を選択
3. 「Create application」→「Pages」→「Connect to Git」を選択
4. GitHub で「ihsinoky/yomikikase-planner」リポジトリを選択
5. プロジェクト名を入力（例: `yomikikase-planner`）
6. **ビルド設定**:
   - Framework preset: **None**
   - Build command: **（空欄）**
   - Build output directory: **`liff`**
7. 「Save and Deploy」をクリック
8. デプロイ完了を待つ（1-2分）
9. **重要**: デプロイ URL をメモ（例: `https://yomikikase-planner.pages.dev`）

**所要時間**: 約 5 分

**詳細**: [Cloudflare Pages セットアップ手順](cloudflare-pages-setup.md)

---

### ステップ 4: Cloudflare 環境変数の設定

**目的**: Pages Functions から GAS にアクセスするための認証情報を設定

**手順**:
1. Cloudflare Pages のプロジェクトページで「Settings」→「Environment variables」を開く
2. 「Add variable」をクリックし、以下を追加:

   | Variable name | Value | Environment |
   |---------------|-------|-------------|
   | `GAS_BASE_URL` | `https://script.google.com/macros/s/.../exec` | Production |
   | `GAS_API_KEY` | ステップ 2 で生成した API キー | Production |

3. 両方の変数を追加したら「Save」をクリック
4. **再デプロイ**:
   - 「Deployments」タブに移動
   - 最新のデプロイの「...」メニューから「Retry deployment」を選択
   - 環境変数が適用されるまで待つ（1-2分）

**所要時間**: 約 5 分

**詳細**: [Cloudflare Secrets 設定手順](cloudflare-secrets-setup.md)

---

### ステップ 5: LINE ミニアプリの作成と設定

**目的**: LINE からアクセスできるようにする

**手順**:
1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. プロバイダーを作成（未作成の場合）
3. 「LINE ミニアプリ」チャネルを作成
4. **Developing タブ**を開く
5. 「Basic settings」→「Edit」をクリック
6. **Endpoint URL** を入力:
   ```
   https://yomikikase-planner.pages.dev/
   ```
   （ステップ 3 でメモした Cloudflare Pages の URL）
7. 「Save」をクリック
8. **重要**: LIFF ID をメモ（`1234567890-abcdefgh` の形式）

**所要時間**: 約 7 分

**詳細**: [セットアップ手順書](setup.md) の「3. LINE Developers での LINE ミニアプリ作成」

---

### ステップ 6: Spreadsheet の Config 設定

**目的**: LIFF ID を GAS に登録

**手順**:
1. Spreadsheet の `Config` タブを開く
2. 以下の行を追加または更新:

   | key | value | description | updatedAt |
   |-----|-------|-------------|-----------|
   | `liffId` | ステップ 5 で取得した LIFF ID | LIFF アプリケーションID | 現在の日時 |

3. 保存

**所要時間**: 約 2 分

---

### ステップ 7: 動作確認

**目的**: すべての設定が正しく動作することを確認

#### 7.1. API プロキシの確認

```bash
curl https://yomikikase-planner.pages.dev/api/gas/health
```

**期待される結果**:
```json
{
  "ok": true,
  "timestamp": "2025-01-15T10:00:00.000Z",
  "message": "yomikikase-planner GAS Web App is running"
}
```

✅ **チェックポイント**:
- [ ] HTTP 200 が返る
- [ ] `ok: true` が含まれる
- [ ] `timestamp` が現在時刻に近い

#### 7.2. LIFF 画面の確認

1. スマートフォンの LINE アプリを開く
2. 自分宛てにメッセージで以下の URL を送信:
   ```
   https://miniapp.line.me/{LIFF_ID}
   ```
   （`{LIFF_ID}` をステップ 5 で取得した LIFF ID に置き換え）
3. URL をタップして LINE ミニアプリを開く
4. 以下が表示されることを確認:
   - ✅ ユーザー ID（`U` で始まる文字列）
   - ✅ 表示名（LINE のプロフィール名）
   - ✅ GAS Health: `OK`

**所要時間**: 約 3 分

**詳細**: [LIFF デプロイ・動作確認チェックリスト](liff-deployment-verification.md)

---

## ✅ セットアップ完了！

おめでとうございます！これで yomikikase-planner が Cloudflare Pages で動作するようになりました。

### 次のステップ

- **アンケート機能の実装** - Surveys / SurveyDates / Responses を使った予約システムの構築
- **UI/UX の改善** - LIFF 画面のデザイン改善
- **本番公開** - Review → Published チャネルへの移行

---

## 🔧 トラブルシューティング

### 「Unauthorized」エラーが出る

**確認事項**:
- GAS のスクリプトプロパティに `API_KEY` が設定されているか
- Cloudflare の環境変数 `GAS_API_KEY` が設定されているか
- 両者の値が完全に一致しているか

**解決方法**:
1. ステップ 2 と ステップ 4 を再確認
2. 環境変数を更新したら必ず再デプロイ

### LIFF 初期化エラーが出る

**確認事項**:
- LINE Developers Console の Endpoint URL が正しいか
- Spreadsheet の Config シートの `liffId` が正しいか
- Developing チャネルの LIFF ID を使用しているか

**解決方法**:
1. ステップ 5 と ステップ 6 を再確認
2. LIFF ID を間違えていないか確認

### API プロキシが 500 エラーを返す

**確認事項**:
- Cloudflare の環境変数 `GAS_BASE_URL` と `GAS_API_KEY` が設定されているか
- GAS Web App が正常にデプロイされているか

**解決方法**:
1. [Cloudflare ログ確認手順](cloudflare-logs-guide.md) でエラー詳細を確認
2. ステップ 4 を再確認して再デプロイ

### その他の問題

詳細なトラブルシューティングは以下を参照:
- [セットアップ手順書 - トラブルシューティング](setup.md#6-トラブルシューティング)
- [ログ戦略とトラブルシューティング手順](logging-strategy.md)

---

## 📝 設定値の記録テンプレート

セットアップ時に以下の値をメモしておくと、再セットアップが容易になります：

```
# Google Apps Script
Spreadsheet ID: _______________________________
GAS Web App URL: https://script.google.com/macros/s/___________________/exec
API Key: ________________________________（安全に保管）

# Cloudflare Pages
Project Name: _______________________________
Project URL: https://__________________________.pages.dev

# LINE Developers
Provider: _______________________________
Channel Name: _______________________________
LIFF ID (Developing): _______________________________
```

**⚠️ 注意**: API キーは安全な場所に保管してください（パスワードマネージャー、暗号化されたファイルなど）

---

## 🔄 ロールバック手順

緊急時に Cloudflare から旧環境に戻す必要がある場合:

### 方法 A: GAS 直接アクセス（一時的）

⚠️ **セキュリティリスクあり - 緊急時のみ**

1. LINE Developers Console の Endpoint URL を GAS URL に変更:
   ```
   https://script.google.com/macros/s/.../exec
   ```
2. Apps Script で `validateApiKey()` のチェックを一時的にコメントアウト
3. 新しいバージョンをデプロイ
4. 確認後、速やかに Cloudflare に戻す

**詳細**: [ADR-001 - ロールバック手順](adr/001-adopt-cloudflare-pages-functions.md#ロールバック手順)

### 方法 B: GitHub Pages（非推奨）

⚠️ **JSONP 廃止により使用不可**

GitHub Pages + JSONP 経路は 2025年1月12日に完全廃止されました。
セキュリティリスクがあるため、この方法は使用しないでください。

**詳細**: [GitHub Pages + JSONP 廃止について](github-pages-jsonp-deprecation.md)

---

## 📚 関連ドキュメント

### セットアップ
- [セットアップ手順書（詳細版）](setup.md) - 全機能の詳細手順
- [Cloudflare Pages セットアップ](cloudflare-pages-setup.md) - Cloudflare Pages の詳細
- [Cloudflare Secrets 設定](cloudflare-secrets-setup.md) - 環境変数の詳細

### アーキテクチャ
- [ADR-001: Cloudflare Pages + Functions 採用](adr/001-adopt-cloudflare-pages-functions.md) - アーキテクチャ決定の背景
- [Cloudflare 移行完了レポート](cloudflare-migration-completion.md) - 移行の詳細

### 運用
- [ログ戦略とトラブルシューティング](logging-strategy.md) - 問題切り分け手順
- [Cloudflare ログ確認手順](cloudflare-logs-guide.md) - ログの見方
- [LIFF デプロイ・動作確認](liff-deployment-verification.md) - 検証チェックリスト

### 廃止された手順
- [GitHub Pages LIFF PoC](github-pages-liff-poc.md) - **⚠️ 停止（運用非推奨）**
- [GitHub Pages + JSONP 廃止](github-pages-jsonp-deprecation.md) - 廃止の詳細

---

## 変更履歴

| 日付 | 変更内容 | 担当 |
|------|---------|------|
| 2025-01-15 | 初版作成: Cloudflare クイックスタート | @copilot |
