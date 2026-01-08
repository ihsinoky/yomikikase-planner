# GitHub Pages LIFF PoC - 検証チェックリスト

このドキュメントは、GitHub Pages 静的 LIFF PoC の実装完了後、実際の動作確認を行うためのチェックリストです。

## 📋 前提条件

以下のファイルが正しく配置されていることを確認してください：

- [x] `docs/miniapp-poc/index.html` - PoC ページ本体
- [x] `docs/miniapp-poc/README.md` - PoC の説明
- [x] `docs/github-pages-liff-poc.md` - セットアップ手順書
- [x] `docs/.nojekyll` - Jekyll 処理の無効化
- [x] `README.md` - PoC へのリンクが追加されている

## ステップ 1: GitHub Pages の有効化

### 手順

1. GitHub リポジトリページにアクセス
   - https://github.com/ihsinoky/yomikikase-planner

2. **Settings** タブをクリック

3. 左サイドバーから **Pages** を選択

4. **Source** セクションで以下を設定:
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/docs`

5. **Save** をクリック

6. デプロイ完了を待つ（5-10分）

### チェックポイント

- [ ] GitHub Pages が有効化された
- [ ] デプロイが完了した（Actions タブで確認）
- [ ] 以下の URL にアクセスできる:
  - `https://ihsinoky.github.io/yomikikase-planner/`
  - `https://ihsinoky.github.io/yomikikase-planner/miniapp-poc/`

### 確認コマンド（オプション）

```bash
# PoC ページが配信されているか確認
curl -I https://ihsinoky.github.io/yomikikase-planner/miniapp-poc/
# 200 OK が返ればOK
```

## ステップ 2: LINE Developers Console の設定

### 2.1. LINE ミニアプリチャネルの作成または選択

- [ ] [LINE Developers Console](https://developers.line.biz/console/) にアクセス
- [ ] プロバイダーを作成または選択
- [ ] LINE ミニアプリチャネルを作成または選択

### 2.2. Endpoint URL の設定

1. **Developing** タブを選択

2. **Basic settings** → **Edit** をクリック

3. **Endpoint URL** に以下を設定:
   ```
   https://ihsinoky.github.io/yomikikase-planner/miniapp-poc/
   ```
   ⚠️ 末尾の `/` を忘れずに！

4. **Module mode**: Off

5. **Save** をクリック

### チェックポイント

- [ ] Endpoint URL が正しく設定された
- [ ] LIFF ID をメモした（例: `1234567890-abcdefgh`）
- [ ] テスターが登録されている（または管理者アカウントでテスト）

## ステップ 3: ブラウザでの動作確認（デバッグ）

### 3.1. PC ブラウザでアクセス

以下の URL にアクセス（`{LIFF_ID}` を実際の値に置き換え）:

```
https://ihsinoky.github.io/yomikikase-planner/miniapp-poc/?liffId={LIFF_ID}
```

### 3.2. 確認項目

- [ ] ページが表示される
- [ ] LIFF SDK が読み込まれる（コンソールエラーがない）
- [ ] デバッグログが表示される
- [ ] 「未ログイン」と表示される（外部ブラウザなので正常）
- [ ] 2秒後にログインページにリダイレクトされる

### 3.3. 開発者ツールでの確認

F12 キーで開発者ツールを開き、Console タブで確認:

- [ ] `[INFO] ページ読み込み完了` が表示される
- [ ] `[INFO] LIFF SDK バージョン: ...` が表示される
- [ ] `[SUCCESS] liff.init() が成功しました` が表示される
- [ ] Endpoint URL 不一致の警告が **出ない**

## ステップ 4: LINE アプリ内での動作確認

### 4.1. LIFF URL の生成

以下の形式で URL を生成（`{LIFF_ID}` を実際の値に置き換え）:

```
https://miniapp.line.me/{LIFF_ID}?liffId={LIFF_ID}
```

### 4.2. LINE アプリで開く

1. 上記 URL を自分に LINE で送信
2. LINE アプリ内でタップして開く
3. PoC ページが表示されることを確認

### 4.3. 確認項目

画面のデバッグログで以下を確認:

- [ ] `[SUCCESS] liff.init() が成功しました`
- [ ] `isInClient: true (LINEアプリ内)`
- [ ] `isLoggedIn: true`
- [ ] `[SUCCESS] liff.getProfile() が成功しました`
- [ ] `User ID: U...` が表示される
- [ ] `Display Name: （あなたのLINE表示名）` が表示される
- [ ] プロフィール画像が表示される（設定している場合）
- [ ] `✅ すべての確認が完了しました` が表示される

### 4.4. スクリーンショット撮影

検証エビデンスとして、以下のスクリーンショットを撮影:

- [ ] デバッグログ全体が見えるスクリーンショット
- [ ] 受け入れ条件チェックのセクションが見えるスクリーンショット

## ステップ 5: 受け入れ条件の最終確認

### Issue の受け入れ条件（DoD）

- [ ] `liff.isInClient() === true` が確認できる
- [ ] `liff.init()` が resolve する（例外で落ちない）
- [ ] `liff.getProfile()` が成功する
- [ ] `displayName` が画面に表示される
- [ ] `userId` が画面に表示される
- [ ] Console に `liff.init() was called with a current URL that is not related to the endpoint URL.` 系の警告が **出ない**
- [ ] Endpoint URL は https で配信されている
- [ ] Endpoint URL と liff.init 実行 URL の階層が揃っている

## トラブルシューティング

問題が発生した場合は、[GitHub Pages LIFF PoC 手順書のトラブルシューティング](github-pages-liff-poc.md#4-トラブルシューティング) を参照してください。

### よくある問題

1. **404 Not Found**
   - GitHub Pages のデプロイを待つ（5-10分）
   - Actions タブで pages-build-deployment が成功しているか確認

2. **Endpoint URL 不一致の警告**
   - Endpoint URL の末尾 `/` を確認
   - URL が完全一致しているか確認

3. **未ログインのまま**
   - LINE アプリ内から開いているか確認
   - LIFF URL (`https://miniapp.line.me/{LIFF_ID}?liffId={LIFF_ID}`) を使用

## 完了後のアクション

すべての確認項目がクリアできたら:

1. [ ] スクリーンショットを Issue にコメントとして添付
2. [ ] 検証結果を Issue に報告
3. [ ] 次のステップ（GAS 疎通確認など）を計画

## 次のステップ案

PoC が成功したら、以下のような拡張が可能です:

- [ ] GAS Health Endpoint との疎通確認
- [ ] 予約登録の最小 API 実装
- [ ] 本番環境への移行（Review → Published チャネル）

---

## 参考リンク

- [GitHub Pages LIFF PoC 手順書](github-pages-liff-poc.md)
- [セットアップ手順書](setup.md)
- [miniapp-poc README](miniapp-poc/README.md)
