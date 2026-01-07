# LIFF PoC - GitHub Pages Static Hosting

このディレクトリには、GitHub Pages で配信される静的 LIFF アプリケーションの PoC（概念実証）が含まれています。

## 📄 ファイル

- `index.html` - 静的 LIFF アプリケーション（最小構成）

## 🎯 目的

GitHub Pages を使って静的 LIFF アプリケーションを配信し、以下を確認する:

- `liff.init()` が正常に動作すること
- `liff.getProfile()` でユーザー情報を取得できること
- LINE アプリ内で起動できること（`liff.isInClient() === true`）
- Endpoint URL の設定が正しいこと（警告が出ないこと）

## 🚀 セットアップ手順

詳細な手順は [GitHub Pages LIFF PoC 手順書](../github-pages-liff-poc.md) を参照してください。

### 簡易手順

1. **GitHub Pages を有効化**
   - Settings → Pages → Deploy from a branch → main / /docs

2. **LINE Developers Console で設定**
   - Endpoint URL: `https://ihsinoky.github.io/yomikikase-planner/miniapp-poc/`
   - LIFF ID を取得

3. **動作確認**
   - URL: `https://miniapp.line.me/{LIFF_ID}?liffId={LIFF_ID}`
   - LINE アプリ内で開く

## 📱 アクセス方法

### LINE アプリ内から（推奨）

```
https://miniapp.line.me/{LIFF_ID}?liffId={LIFF_ID}
```

### ブラウザから（デバッグ用）

```
https://ihsinoky.github.io/yomikikase-planner/miniapp-poc/?liffId={LIFF_ID}
```

**注意**: `{LIFF_ID}` を実際の LIFF ID に置き換えてください。

## ✅ 受け入れ条件

- [ ] `liff.isInClient() === true` が確認できる
- [ ] `liff.init()` が resolve する（エラーで落ちない）
- [ ] `liff.getProfile()` が成功する
- [ ] `displayName` と `userId` が画面に表示される
- [ ] Endpoint URL 不一致の警告が出ない

## 🔍 デバッグ

画面上に以下のデバッグログが表示されます:

- LIFF SDK バージョン
- LIFF ID（一部マスク）
- 現在の URL
- 環境情報（isInClient, isLoggedIn, OS, etc.）
- プロフィール情報（userId, displayName, etc.）

## 🔐 セキュリティ

- ✅ LIFF ID は公開されても問題ありません（開発用 internal channel を使用）
- ❌ アクセストークン、シークレットキーは含めないでください
- ❌ 個人情報、ユーザーデータは含めないでください

## 📝 実装メモ

### LIFF SDK

- CDN (edge): `https://static.line-scdn.net/liff/edge/2/sdk.js`
- バージョン: edge（最新版）

### liff.init() オプション

```javascript
await liff.init({
  liffId: liffId,
  withLoginOnExternalBrowser: true
});
```

- `withLoginOnExternalBrowser: true` - 外部ブラウザでのログインを許可

### URL 階層の注意点

- Endpoint URL: `https://ihsinoky.github.io/yomikikase-planner/miniapp-poc/`
- liff.init() 実行 URL: Endpoint URL と一致または配下である必要がある
- 末尾の `/` (スラッシュ) を揃える（リダイレクト回避）

## 🐛 トラブルシューティング

詳細は [GitHub Pages LIFF PoC 手順書 - トラブルシューティング](../github-pages-liff-poc.md#4-トラブルシューティング) を参照。

### よくある問題

1. **LIFF ID が未設定**
   - URL に `?liffId={LIFF_ID}` を追加

2. **Endpoint URL 不一致**
   - LINE Developers Console の Endpoint URL を確認
   - 末尾の `/` を揃える

3. **404 Not Found**
   - GitHub Pages のデプロイを待つ（5-10分）
   - Settings → Pages で有効になっているか確認

## 🔗 関連ドキュメント

- [GitHub Pages LIFF PoC 手順書](../github-pages-liff-poc.md)
- [セットアップ手順書](../setup.md)
- [LIFF ドキュメント（LINE Developers）](https://developers.line.biz/ja/docs/liff/)

## 📊 次のステップ

PoC が成功したら:

1. GAS Health Endpoint との疎通確認
2. 予約登録の最小 API 実装
3. 本番環境への移行（Review → Published チャネル）
