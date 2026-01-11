# LIFF 静的アプリケーション

このディレクトリには、Cloudflare Pages で配信される静的 LIFF アプリケーションが含まれています。

## 📄 ファイル

- `index.html` - LIFF アプリケーション本体（最小構成）

## 🎯 目的

Cloudflare Pages を使って静的 LIFF アプリケーションを配信し、以下を確認する:

- `liff.init()` が正常に動作すること
- `liff.getProfile()` でユーザー情報を取得できること
- LINE アプリ内で起動できること（`liff.isInClient() === true`）
- Endpoint URL の設定が正しいこと

## 🚀 セットアップ手順

詳細な手順は [Cloudflare Pages セットアップ手順書](../docs/cloudflare-pages-setup.md) を参照してください。

### 概要

1. **Cloudflare Pages プロジェクトを作成**
   - GitHub リポジトリと連携
   - ビルドコマンド: なし（静的ファイルのみ）
   - ビルド出力ディレクトリ: `liff`

2. **LINE Developers Console で設定**
   - Endpoint URL: `https://your-project.pages.dev/`（Cloudflare Pages の URL）
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
https://your-project.pages.dev/?liffId={LIFF_ID}
```

**注意**: `{LIFF_ID}` を実際の LIFF ID に置き換えてください。

## ✅ 受け入れ条件

- [x] `liff.isInClient() === true` が確認できる
- [x] `liff.init()` が resolve する（エラーで落ちない）
- [x] `liff.getProfile()` が成功する
- [x] `displayName` と `userId` が画面に表示される
- [x] Endpoint URL 不一致の警告が出ない

## 🔮 今後の実装方針

### API 呼び出し戦略

将来的な API 実装では、**同一オリジンの `/api/*` エンドポイント**を使用します：

- `/api/health` - ヘルスチェック
- `/api/reservations` - 予約情報の取得・登録
- `/api/users` - ユーザー情報管理

これにより CORS の問題を回避し、シンプルな実装を維持します。

**注意**: 現時点では API は未実装です。この LIFF アプリは `liff.init()` → `liff.getProfile()` までの動作確認のみを目的としています。

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

- Endpoint URL: Cloudflare Pages のプロジェクト URL
- liff.init() 実行 URL: Endpoint URL と一致または配下である必要がある
- 末尾の `/` (スラッシュ) を揃える（リダイレクト回避）

## 🐛 トラブルシューティング

### よくある問題

1. **LIFF ID が未設定**
   - URL に `?liffId={LIFF_ID}` を追加

2. **Endpoint URL 不一致**
   - LINE Developers Console の Endpoint URL を確認
   - Cloudflare Pages の URL と一致させる
   - 末尾の `/` を揃える

3. **404 Not Found**
   - Cloudflare Pages のデプロイを待つ（通常は数分）
   - プロジェクト設定でビルド出力ディレクトリが `liff` になっているか確認

## 🔗 関連ドキュメント

- [Cloudflare Pages セットアップ手順](../docs/cloudflare-pages-setup.md)
- [セットアップ手順書](../docs/setup.md)
- [LIFF ドキュメント（LINE Developers）](https://developers.line.biz/ja/docs/liff/)

## 📚 参考：GitHub Pages PoC

このアプリケーションは、`docs/miniapp-poc/` の GitHub Pages PoC を基に作成されました。
PoC の成果物は参考用として保存されていますが、今後の開発はこの `liff/` ディレクトリで行います。

## 📊 次のステップ

LIFF 基礎実装が完了したら:

1. GAS API との疎通確認（`/api/health` など）
2. 予約登録の最小 API 実装
3. UI/UX の改善
4. 本番環境への移行（Review → Published チャネル）
