# 管理者引き継ぎガイド

## 概要

このドキュメントは、yomikikase-planner の管理者権限を後任者へ引き継ぐための手順をまとめたものです。
卒園やその他の理由で管理者が交代する際に使用してください。

## 引き継ぎが必要なサービス

| サービス | 用途 | 引き継ぎ項目 |
|---------|------|------------|
| Google Spreadsheet | データ保存 | 編集権限 |
| Google Apps Script | バックエンドロジック | 編集権限・デプロイ権限 |
| Cloudflare Pages | フロントエンド・API プロキシ | アカウントまたはプロジェクト権限 |
| LINE Developers Console | LINE ミニアプリ管理 | プロバイダー管理者権限 |
| GitHub リポジトリ | ソースコード管理 | コラボレーター権限 |

## 引き継ぎ手順

### 1. Google Spreadsheet

1. 対象のスプレッドシートを開く
2. 右上の「共有」をクリック
3. 後任者の Google アカウントを追加し、**「編集者」** 権限を付与
4. 引き継ぎ完了後、旧管理者の権限を削除（任意）

### 2. Google Apps Script（GAS）

GAS はスプレッドシートに紐づいているため、スプレッドシートの編集権限があれば GAS も編集可能です。

**スクリプトプロパティの確認:**
1. スプレッドシート → 拡張機能 → Apps Script
2. プロジェクトの設定 → スクリプトプロパティ
3. 以下のプロパティが設定されていることを確認:
   - `API_KEY`: Cloudflare Functions との通信用キー

**デプロイの更新が必要な場合:**
1. Apps Script エディタ → デプロイ → デプロイを管理
2. 新しいバージョンのデプロイを作成
3. 新しいデプロイ URL を Cloudflare の `GAS_BASE_URL` シークレットに反映

### 3. Cloudflare Pages

**方法 A: Cloudflare アカウントの共有（推奨）**

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) にログイン
2. アカウント → メンバー → メンバーを招待
3. 後任者のメールアドレスを入力し、適切な権限を付与

**方法 B: プロジェクトの移行（アカウントを分離する場合）**

1. 後任者が新しい Cloudflare アカウントで Pages プロジェクトを作成
2. GitHub リポジトリを接続
3. 以下のシークレットを設定:
   - `GAS_BASE_URL`: GAS Web App のデプロイ URL（末尾に `/exec` を含む完全な URL）
   - `GAS_API_KEY`: GAS スクリプトプロパティの `API_KEY` と同じ値
   - `LINE_LOGIN_CHANNEL_ID`: LINE Login チャネル ID
   - `ADMIN_API_KEY`: 管理 API 認証キー（新規生成を推奨）

**ADMIN_API_KEY の再生成:**
```bash
# 新しいキーを生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Cloudflare に設定
npx wrangler pages secret put ADMIN_API_KEY --project-name yomikikase-planner
```

### 4. LINE Developers Console

1. [LINE Developers Console](https://developers.line.biz/console/) にログイン
2. 対象のプロバイダーを選択
3. 「設定」→「メンバー」→「メンバーを追加」
4. 後任者の LINE アカウントを **Admin** 権限で追加
5. 引き継ぎ完了後、旧管理者を削除

**確認事項:**
- LINE Login チャネル: LIFF アプリの URL が正しいことを確認
- LIFF エンドポイント URL: `https://yomikikase-planner.pages.dev/liff/` であること

### 5. GitHub リポジトリ

1. リポジトリの Settings → Collaborators and teams
2. 後任者を **Write** 以上の権限で追加
3. Cloudflare Pages の自動デプロイが GitHub 連携で動作していることを確認

## 引き継ぎチェックリスト

- [ ] Google Spreadsheet の編集権限を後任者に付与
- [ ] GAS スクリプトプロパティ（API_KEY）の所在を後任者に伝達
- [ ] Cloudflare アカウント/プロジェクトのアクセス権を後任者に付与
- [ ] Cloudflare シークレット一覧（GAS_BASE_URL, GAS_API_KEY, LINE_LOGIN_CHANNEL_ID, ADMIN_API_KEY）を後任者に伝達
- [ ] LINE Developers Console のプロバイダー Admin 権限を後任者に付与
- [ ] GitHub リポジトリのコラボレーター権限を後任者に付与
- [ ] 後任者が管理 API（`/api/admin/*`）にアクセスできることを確認
- [ ] 運用マニュアル（`docs/operations-manual.md`）の所在を後任者に伝達
- [ ] 旧管理者の権限を削除（引き継ぎ完了後）
