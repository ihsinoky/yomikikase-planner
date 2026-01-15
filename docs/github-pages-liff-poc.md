# 🛑 停止：GitHub Pages で静的 LIFF を配信する PoC 手順書

---

## ⛔ **この手順は完全に停止されました - 使用禁止**

**停止日**: 2025年1月12日

### なぜ停止されたのか？

1. **セキュリティリスク**: API キーが露出するリスク、JSONP による XSS 攻撃の危険性
2. **JSONP 完全廃止**: 2025年1月12日に JSONP サポートが完全に削除されました
3. **保守不可能**: GitHub Pages では環境変数管理ができず、運用が困難

### 今すぐ使うべき手順

✅ **[Cloudflare 環境セットアップ - クイックスタート](cloudflare-quickstart.md)** ← **こちらを使用してください**

- Cloudflare Pages で静的 LIFF を配信
- Cloudflare Functions で安全な API プロキシ
- API キー認証でセキュア
- 30-40分で完了

---

## ⚠️ 以下は参考資料です（実行しないでください）

この PoC は完了しましたが、**運用には使用できません**。
以下の内容は、過去の経緯を理解するための参考資料として残されています。

---

## ~~⚠️ **重要：この PoC は完了しました（運用非推奨）**~~

**~~2025年1月12日 - GitHub Pages 経路は停止されました~~**

- ❌ **この環境は運用に使用しないでください**
- ❌ **LINE Developers Console の Endpoint URL に設定しないでください**
- ✅ **本番運用は Cloudflare Pages を使用してください** → [Cloudflare Pages セットアップ手順](cloudflare-pages-setup.md)
- 📚 **この PoC は参考資料として保存されています**

### ~~停止理由~~

1. **セキュリティリスク**: GitHub Pages は Secrets 管理ができず、API キーが露出するリスクがある
2. **JSONP 廃止**: JSONP は XSS 攻撃のリスクがあり、2025年1月12日に完全廃止
3. **アーキテクチャ移行**: Cloudflare Pages + Functions による統合運用に移行
4. **保守性**: 環境変数管理、レート制限、CORS 対応が困難

### 推奨環境（本番運用）

| 項目 | GitHub Pages（廃止） | Cloudflare Pages（推奨） |
|-----|---------------------|------------------------|
| 配信 | GitHub Pages | Cloudflare Pages |
| API 経路 | GAS 直接 + JSONP | `/api/*` (Functions) |
| API キー | 非対応 | 必須（環境変数管理） |
| セキュリティ | 低 | 高 |
| 推奨度 | ❌ 廃止 | ✅ 推奨 |

---

このドキュメントでは、GitHub Pages を使って静的 LIFF アプリケーションを配信し、LINE ミニアプリとして動作確認するまでの手順を説明します。

**📝 注意**: 以下の手順は PoC 完了時点の記録です。本番運用には使用しないでください。

## 目次

- [概要](#概要)
- [前提条件](#前提条件)
- [1. GitHub Pages の設定](#1-github-pages-の設定)
- [2. LINE Developers Console の設定](#2-line-developers-console-の設定)
- [3. 動作確認](#3-動作確認)
- [4. トラブルシューティング](#4-トラブルシューティング)
- [ロールバック手順](#ロールバック手順)

---

## 概要

### このPoCで達成すること（完了）

- ✅ GitHub Pages 上の静的ページを LIFF の Endpoint URL として設定
- ✅ LINEアプリ内で起動して `liff.init()` → `liff.getProfile()` まで到達することを確認
- ✅ 画面上に init 成功・profile 表示・デバッグログ表示

### スコープ外（このPoCではやらないこと）

- GAS / Spreadsheet との本格連携（予約登録・更新など）
- CORS/認証/署名/レート制限等のセキュリティ設計
- 審査対応・本番公開

---

## 前提条件

- GitHub アカウント（このリポジトリへのアクセス権）
- LINE Developers アカウント
  - [LINE Developers Console](https://developers.line.biz/console/) でアカウント登録済み
- スマートフォン（LINE アプリがインストールされていること）

---

## 1. GitHub Pages の設定

### 1.1. GitHub Pages を有効化

このリポジトリで GitHub Pages を有効にして、`/docs` ディレクトリから配信されるように設定します。

#### 手順

1. GitHub のリポジトリページにアクセス
   - https://github.com/ihsinoky/yomikikase-planner

2. **Settings** タブをクリック

3. 左サイドバーから **Pages** を選択

4. **Source** セクションで以下を設定:
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/docs`

5. **Save** をクリック

6. 数分待つと、ページ上部に以下のようなメッセージが表示されます:
   ```
   Your site is live at https://ihsinoky.github.io/yomikikase-planner/
   ```

### 1.2. PoC ページの URL を確認

GitHub Pages が有効化されると、以下の URL でアクセスできるようになります:

```
https://ihsinoky.github.io/yomikikase-planner/miniapp-poc/
```

**重要**: 末尾の `/` (スラッシュ) を含めるようにしてください。これにより、リダイレクトを避けることができます。

### 1.3. ブラウザでアクセスして確認

上記 URL にブラウザでアクセスし、以下を確認:

- ページが正常に表示される
- LIFF SDK が読み込まれている（コンソールエラーがない）
- 「LIFF ID が未設定です」というメッセージが表示される（この時点では正常）

### ⚠️ セキュリティ上の注意事項

**GitHub Pages は公開されます**。以下の情報を `/docs` ディレクトリに配置しないでください:

- ❌ アクセストークン、シークレットキー
- ❌ 個人情報、ユーザーデータ
- ❌ 内部 URL、API キー
- ✅ LIFF ID は公開されても問題ありません（ただし、開発用 internal channel を使用）

---

## 2. LINE Developers Console の設定

### 2.1. LINE Developers Console にアクセス

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. LINE アカウントでログイン

### 2.2. プロバイダーの作成（未作成の場合）

すでにプロバイダーがある場合はスキップしてください。

1. 「Create a new provider」をクリック
2. プロバイダー名を入力（例: `読み聞かせプランナー PoC`）
3. 「Create」をクリック

### 2.3. LINE ミニアプリチャネルの作成

#### 新規作成の場合

1. 作成したプロバイダーを選択
2. 「Create a new channel」（新規チャネル作成）をクリック
3. チャネルタイプで **「LINE ミニアプリ」** を選択
4. 必須項目を入力:
   - **App name**: 読み聞かせプランナー PoC
   - **App description**: GitHub Pages 静的 LIFF の動作確認用
   - **Category**: Education（教育）
   - **Email address**: 連絡先メールアドレス
5. 利用規約に同意してチェック
6. 「Create」をクリック

#### 既存のチャネルを使用する場合

既存の LINE ミニアプリチャネルがある場合は、それを使用することもできます。

### 2.4. Developing チャネルの Endpoint URL を設定

1. LINE ミニアプリのチャネル設定画面を開く
2. **「Developing」タブ** を選択（開発・テスト用）
3. **「Basic settings」** セクションで「Edit」をクリック
4. 以下を設定:
   - **Endpoint URL**: `https://ihsinoky.github.io/yomikikase-planner/miniapp-poc/`
     - ⚠️ 末尾の `/` (スラッシュ) を忘れずに含めてください
   - **Module mode**: Off
5. 「Save」をクリック

### 2.5. LIFF ID を取得

1. 同じ「Developing」タブの **Basic settings** セクションに **LIFF ID** が表示されています
2. LIFF ID をコピー（例: `1234567890-abcdefgh` の形式）
3. メモ帳などに保存しておく

### 2.6. テスター登録（必要に応じて）

開発中の LINE ミニアプリは、登録されたテスターのみがアクセスできます。

1. チャネル設定画面で「Roles」タブを選択
2. 「Invite by email」でテスターのメールアドレスを招待
3. または、自分の LINE アカウントが管理者アカウントであれば自動的にアクセス可能

---

## 3. 動作確認

### 3.1. LIFF URL の生成

LINE ミニアプリにアクセスするための URL を生成します:

```
https://miniapp.line.me/{LIFF_ID}?liffId={LIFF_ID}
```

**例** (LIFF ID が `1234567890-abcdefgh` の場合):
```
https://miniapp.line.me/1234567890-abcdefgh?liffId=1234567890-abcdefgh
```

**注意**: 
- `{LIFF_ID}` の部分を実際の LIFF ID に置き換えてください
- URL パラメータ `?liffId={LIFF_ID}` を忘れずに追加してください（PoC 実装で使用）

### 3.2. スマートフォンで動作確認

#### 手順

1. 上記の LIFF URL をスマートフォンに送る
   - 自分自身に LINE でメッセージを送る
   - または、QR コードを生成してスキャン

2. LINE アプリ内で URL をタップ

3. PoC ページが開くことを確認

4. 画面を確認:
   - ✅ 「LIFF を初期化中...」→ 「すべての確認が完了しました」と表示される
   - ✅ デバッグログに以下が表示される:
     - `liff.init() が成功しました`
     - `liff.getProfile() が成功しました`
     - `User ID: U1234567890abcdef...`
     - `Display Name: （あなたのLINE表示名）`

5. スクリーンショットを撮影（検証エビデンスとして）

### 3.3. 受け入れ条件の確認

以下の項目をすべて確認してください:

- [ ] `liff.isInClient() === true` が確認できる（デバッグログに表示される）
- [ ] `liff.init()` が resolve する（エラーで落ちない）
- [ ] `liff.getProfile()` が成功し、`displayName` / `userId` が画面に表示される
- [ ] Console に `liff.init() was called with a current URL that is not related to the endpoint URL.` 系の警告が出ない
- [ ] Endpoint URL は https で、GitHub Pages の PoC URL と階層が揃っている

### 3.4. ブラウザの開発者コンソールで確認（オプション）

より詳細に確認したい場合:

1. PC のブラウザで以下の URL にアクセス:
   ```
   https://ihsinoky.github.io/yomikikase-planner/miniapp-poc/?liffId={LIFF_ID}
   ```

2. 開発者ツールを開く（F12 または 右クリック → 検証）

3. Console タブで以下を確認:
   - エラーメッセージがないこと
   - `[SUCCESS] liff.init() が成功しました` が表示されること
   - Endpoint URL 不一致の警告がないこと

---

## 4. トラブルシューティング

### 4.1. 「LIFF ID が未設定です」と表示される

**原因**: URL パラメータに `?liffId={LIFF_ID}` が含まれていない

**対処法**: URL を以下の形式に修正してください:
```
https://miniapp.line.me/{LIFF_ID}?liffId={LIFF_ID}
```

### 4.2. 「liff.init() was called with a current URL that is not related to the endpoint URL.」という警告が出る

**原因**: Endpoint URL と実際にアクセスしている URL が一致していない

**対処法**:
1. LINE Developers Console で設定した Endpoint URL を確認
2. 以下を確認:
   - Endpoint URL: `https://ihsinoky.github.io/yomikikase-planner/miniapp-poc/`
   - 実際のアクセス URL も同じになっているか
   - 末尾の `/` (スラッシュ) が揃っているか

### 4.3. 404 Not Found が表示される

**原因**: GitHub Pages がまだ有効になっていない、またはデプロイされていない

**対処法**:
1. GitHub の Settings → Pages で GitHub Pages が有効になっているか確認
2. デプロイには数分かかる場合があるので、5-10分待ってから再度アクセス
3. GitHub の Actions タブで、pages-build-deployment ワークフローが成功しているか確認

### 4.4. LIFF SDK の読み込みエラー

**原因**: ネットワークの問題、または CDN へのアクセスがブロックされている

**対処法**:
1. インターネット接続を確認
2. 別のネットワークで試す（Wi-Fi / モバイルデータ）
3. ブラウザのキャッシュをクリア

### 4.5. 「未ログイン - ログインページへリダイレクト」が表示され続ける

**原因**: LINE アプリ外でアクセスしている

**対処法**:
1. LINE アプリ内からアクセスしているか確認
2. LIFF URL (`https://miniapp.line.me/{LIFF_ID}?liffId={LIFF_ID}`) からアクセス
3. 外部ブラウザで開いている場合は、2秒後に自動的に LINE ログイン画面にリダイレクトされます

### 4.6. テスターでアクセスできない

**原因**: Developing チャネルは、チャネル管理者とテスターのみアクセス可能

**対処法**:
1. LINE Developers Console の「Roles」タブでテスターが登録されているか確認
2. テスター招待メールを確認し、承認する
3. または、管理者アカウントでテストする

---

## 補足情報

### GitHub Pages の公開 URL について

- **基本形式**: `https://{username}.github.io/{repository}/`
- **このリポジトリ**: `https://ihsinoky.github.io/yomikikase-planner/`
- **PoC ページ**: `https://ihsinoky.github.io/yomikikase-planner/miniapp-poc/`

### LIFF URL の形式について

2つの形式があります:

1. **推奨形式（新）**: `https://miniapp.line.me/{LIFF_ID}`
2. **従来形式**: `https://liff.line.me/{LIFF_ID}`

どちらも動作しますが、新規作成の場合は `miniapp.line.me` を推奨します。

### 内部チャネルについて

LINE ミニアプリには3つの内部チャネルがあります:

| チャネル | 用途 | 公開範囲 | LIFF ID |
|---------|------|---------|---------|
| Developing | 開発・テスト | チャネル管理者とテスター | 自動発行 |
| Review | 審査申請 | 審査スタッフ | 申請時に発行 |
| Published | 本番公開 | 一般ユーザー全員 | 承認後に発行 |

このPoCでは **Developing チャネル** を使用します。

---

## ロールバック手順

**⚠️ 緊急時のみ使用してください**

Cloudflare Pages から GitHub Pages に戻す必要がある場合（非推奨）:

### 1. LINE Developers Console で Endpoint URL を戻す

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. LINE ミニアプリのチャネルを選択
3. **Developing タブ** → **Basic settings** → **Edit** をクリック
4. **Endpoint URL** を変更:
   - 変更前: `https://your-project.pages.dev/`
   - 変更後: `https://ihsinoky.github.io/yomikikase-planner/miniapp-poc/`
5. **Save** をクリック

### 2. GAS の API キー要件を一時的に緩和（非推奨）

⚠️ セキュリティリスクがあるため、緊急時のみ実施してください。

1. Apps Script エディタで `Code.gs` を開く
2. `validateApiKey()` 関数のチェックを一時的にコメントアウト
3. 新しいバージョンをデプロイ

### 3. 確認

- LINE アプリから `https://miniapp.line.me/{LIFF_ID}` にアクセス
- 画面が正常に表示されることを確認
- `liff.init()` と `liff.getProfile()` が動作することを確認

### ⚠️ ロールバック後の注意事項

- API キー認証が無効になるため、セキュリティリスクが高まります
- できるだけ早く Cloudflare Pages に戻すことを推奨します
- ロールバック期間中は、不審なアクセスがないか監視してください

---

## 次のステップ（PoC 完了時点）

PoC が成功したら、以下のような拡張が可能です:

1. **GAS Health Endpoint との疎通確認**
   - PoC 画面から GAS の health API を呼び出す（GET/JSONP 等）

2. **予約登録の最小 API**
   - 書き込み機能を作って mini app から操作できるようにする

3. **本番環境への移行**
   - ❌ ~~Review チャネルで審査申請~~（GitHub Pages は非推奨）
   - ❌ ~~Published チャネルで一般公開~~（GitHub Pages は非推奨）
   - ✅ **Cloudflare Pages への移行** → [セットアップ手順](cloudflare-pages-setup.md)

---

## 参考リンク

- [LINE Developers ドキュメント](https://developers.line.biz/ja/docs/)
- [LIFF ドキュメント](https://developers.line.biz/ja/docs/liff/)
- [GitHub Pages ドキュメント](https://docs.github.com/ja/pages)
- [Cloudflare Pages セットアップ手順](cloudflare-pages-setup.md) ← **推奨**
- [GitHub Pages + JSONP 廃止について](github-pages-jsonp-deprecation.md)
