# Cloudflare Pages セットアップ手順

このドキュメントは、yomikikase-planner の静的 LIFF コンテンツを Cloudflare Pages にデプロイする手順を説明します。

## 目次

- [前提条件](#前提条件)
- [1. Cloudflare Pages プロジェクトの作成](#1-cloudflare-pages-プロジェクトの作成)
- [2. GitHub リポジトリとの連携](#2-github-リポジトリとの連携)
- [3. ビルド設定](#3-ビルド設定)
- [4. デプロイの確認](#4-デプロイの確認)
- [5. 自動デプロイの動作確認](#5-自動デプロイの動作確認)
- [6. トラブルシューティング](#6-トラブルシューティング)

---

## 前提条件

セットアップを開始する前に、以下を準備してください：

- **Cloudflare アカウント**: [Cloudflare](https://dash.cloudflare.com/sign-up) でアカウント登録を完了させておく（無料プランで利用可能）
- **GitHub アカウント**: このリポジトリへのアクセス権限があること
- **リポジトリの main ブランチ**: `liff/index.html` が存在すること

---

## 1. Cloudflare Pages プロジェクトの作成

### 1.1. Cloudflare ダッシュボードにアクセス

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. 左サイドバーから「Workers & Pages」を選択
3. 「Create application」ボタンをクリック
4. 「Pages」タブを選択
5. 「Connect to Git」を選択

### 1.2. GitHub リポジトリとの連携

1. 「GitHub」を選択
2. 初回の場合、GitHub アカウントとの連携を求められるので「Authorize Cloudflare Pages」をクリック
3. リポジトリの選択画面で「ihsinoky/yomikikase-planner」を探して選択
   - もし表示されない場合は、「Configure GitHub App」から権限を追加
4. 「Begin setup」をクリック

---

## 2. GitHub リポジトリとの連携

### 2.1. プロジェクト名の設定

1. **Project name**: `yomikikase-planner` （または任意の名前）
   - この名前が URL の一部になります（例: `yomikikase-planner.pages.dev`）
2. **Production branch**: `main` を選択
   - main ブランチへの push で本番環境が自動デプロイされます

---

## 3. ビルド設定

### 3.1. Build settings の設定

以下の設定を行います：

| 項目 | 設定値 | 説明 |
|------|--------|------|
| **Framework preset** | None | 静的HTMLのため、フレームワークは使用しない |
| **Build command** | （空欄） | ビルドプロセスは不要 |
| **Build output directory** | `liff` | 公開するディレクトリを指定 |

#### 設定手順

1. 「Framework preset」で「None」を選択（デフォルト）
2. 「Build command」は空欄のまま
3. 「Build output directory」に `liff` と入力
4. 「Save and Deploy」ボタンをクリック

### 3.2. 初回デプロイの開始

設定を保存すると、自動的に初回デプロイが開始されます。

- デプロイの進行状況はダッシュボードで確認できます
- 通常、1〜2分程度で完了します

---

## 4. デプロイの確認

### 4.1. デプロイ完了の確認

1. デプロイが完了すると「Success」というステータスが表示されます
2. 「Visit site」ボタンが表示されます
3. プロジェクトの URL は `https://{プロジェクト名}.pages.dev/` の形式になります

### 4.2. ページの表示確認

1. 「Visit site」ボタンをクリック、または URL を直接ブラウザで開く
2. 以下の内容が表示されることを確認：
   - タイトル: 「よみきかせプランナー」
   - メッセージ: 「幼稚園の「絵本読み聞かせ」活動のための LINEミニアプリです。」
   - ステータス: 「✅ Cloudflare Pages デプロイ成功」

### 4.3. HTTP ステータスの確認

以下のコマンドで HTTP 200 が返ることを確認できます：

```bash
curl -I https://{プロジェクト名}.pages.dev/
```

期待される出力：
```
HTTP/2 200
content-type: text/html; charset=utf-8
...
```

---

## 5. 自動デプロイの動作確認

### 5.1. main ブランチへの push で自動デプロイ

Cloudflare Pages は main ブランチへの push を検知して自動的にデプロイを実行します。

#### 動作確認手順

1. `liff/index.html` に簡単な変更を加える（例: 絵文字を変更）
2. 変更を commit して main ブランチに push
   ```bash
   git add liff/index.html
   git commit -m "Test: Update emoji in index.html"
   git push origin main
   ```
3. Cloudflare Pages のダッシュボードで新しいデプロイが開始されることを確認
4. デプロイ完了後、サイトを確認して変更が反映されていることを確認

### 5.2. デプロイの履歴確認

- Cloudflare Pages のダッシュボードで「View build history」をクリック
- 各デプロイの詳細（コミットハッシュ、デプロイ時刻、ステータス）が確認できます

---

## 6. トラブルシューティング

### デプロイが失敗する場合

**症状**: デプロイが "Failed" になる

**確認事項**:
1. `liff/` ディレクトリが存在するか確認
2. `liff/index.html` が存在するか確認
3. ビルド設定で「Build output directory」が `liff` になっているか確認

**解決方法**:
- Cloudflare Pages のダッシュボードで「Settings」→「Builds & deployments」から設定を確認
- 必要に応じて「Retry deployment」で再デプロイ

### ページが 404 Not Found になる場合

**症状**: サイトにアクセスすると 404 エラーが表示される

**確認事項**:
1. Build output directory が正しく設定されているか（`liff` であること）
2. `liff/index.html` が main ブランチに存在するか

**解決方法**:
- Settings で Build output directory を確認・修正
- 再デプロイを実行

### GitHub 連携がうまくいかない場合

**症状**: リポジトリが表示されない、または連携できない

**確認事項**:
1. GitHub アカウントが正しく連携されているか
2. リポジトリへのアクセス権限があるか

**解決方法**:
- Cloudflare Pages の設定画面で「Configure GitHub App」をクリック
- 必要なリポジトリへのアクセス権限を付与
- ブラウザのキャッシュをクリアして再試行

---

## カスタムドメインの設定（オプション）

独自ドメインを使用したい場合：

1. Cloudflare Pages のプロジェクト設定で「Custom domains」を選択
2. 「Set up a custom domain」をクリック
3. ドメインを入力して指示に従う
4. DNS レコードを設定（Cloudflare の DNS を使用している場合は自動設定）

---

## まとめ

このドキュメントに従うことで、以下が実現できます：

- ✅ Cloudflare Pages プロジェクトの作成と GitHub リポジトリの連携
- ✅ `liff/` ディレクトリからの静的コンテンツ配信
- ✅ main ブランチへの push による自動デプロイ
- ✅ `https://{プロジェクト名}.pages.dev/` での公開

デプロイ URL やその他の情報は、Cloudflare Pages のダッシュボードでいつでも確認できます。
