# LINE ミニアプリ Cloudflare 移行 検証チェックリスト

## 概要

このチェックリストは、LINE ミニアプリの配信元を GitHub Pages から Cloudflare Pages に移行する際の検証項目をまとめたものです。

**検証日**: ___________________  
**検証者**: ___________________  

---

## 1. LINE Developers Console の設定変更

### 1.1. Endpoint URL の変更

- [ ] LINE Developers Console にアクセス
- [ ] LINE ミニアプリのチャネル（Developing）を選択
- [ ] Basic settings で Endpoint URL を確認:
  - 変更前: `https://ihsinoky.github.io/yomikikase-planner/miniapp-poc/`
  - 変更後: `https://<project>.pages.dev/`
- [ ] Endpoint URL を Cloudflare Pages の URL に変更
- [ ] 末尾の `/`（スラッシュ）が含まれていることを確認
- [ ] 「Save」をクリック

### 1.2. LIFF ID の確認

- [ ] Developing タブの Basic settings で LIFF ID を確認
- [ ] LIFF ID をメモ: `____________________________`

---

## 2. LINE アプリからの起動確認

### 2.1. アクセス URL の作成

LIFF URL を作成:
```
https://miniapp.line.me/{LIFF_ID}?liffId={LIFF_ID}
```

- [ ] `{LIFF_ID}` を実際の LIFF ID に置き換え
- [ ] URL パラメータ `?liffId={LIFF_ID}` が含まれていることを確認

### 2.2. LINE アプリで起動

- [ ] LINE アプリを起動
- [ ] 作成した LIFF URL を LINE のトークに送信（自分自身に送る）
- [ ] LINE アプリ内で URL をタップ
- [ ] LIFF アプリが起動することを確認

### 2.3. 画面表示の確認

- [ ] タイトルが表示される: 「LIFF - 読み聞かせプランナー」
- [ ] ステータスが緑色で表示される: 「✅ すべての確認が完了しました」
- [ ] プロフィール情報が表示される:
  - ユーザー名: `____________________________`
  - User ID: `U____________________________`
  - プロフィール画像: 表示される / 表示されない（該当する方に○）

### 2.4. デバッグログの確認

画面下部のデバッグログに以下が表示されることを確認:

- [ ] `[SUCCESS] liff.init() が成功しました`
- [ ] `[SUCCESS] liff.getProfile() が成功しました`
- [ ] `User ID: U...`
- [ ] `Display Name: （あなたのLINE表示名）`

### 2.5. エラーがないことを確認

- [ ] エラーメッセージが表示されていない
- [ ] 赤色のステータスが表示されていない
- [ ] 「LIFF ID が未設定です」というメッセージが表示されていない

### 2.6. スクリーンショット撮影

検証エビデンスとして以下のスクリーンショットを撮影:

- [ ] LIFF アプリ起動後の画面全体
- [ ] プロフィール情報が表示されている部分
- [ ] デバッグログが表示されている部分

---

## 3. API 経路の確認

### 3.1. ブラウザでの確認（推奨）

PCのブラウザで確認する場合:

- [ ] ブラウザで以下の URL にアクセス:
  ```
  https://<project>.pages.dev/?liffId={LIFF_ID}
  ```
- [ ] 開発者ツールを開く（F12 または 右クリック → 検証）
- [ ] **Network** タブを開く
- [ ] ページをリロード

### 3.2. Network タブでの確認

以下の項目を確認:

- [ ] `/api/gas/health` へのリクエストが表示される
- [ ] `/api/gas/health` のステータスコードが 200 OK である
- [ ] `/api/gas/health` のレスポンスが JSON 形式である
  - 例: `{"ok":true,"timestamp":"...","message":"..."}`

- [ ] `script.google.com` へのリクエストが **ない** ことを確認
- [ ] `callback` パラメータを含むリクエストが **ない** ことを確認

### 3.3. スクリーンショット撮影

検証エビデンスとして以下のスクリーンショットを撮影:

- [ ] Network タブで `/api/gas/health` のリクエストが表示されている画面
- [ ] `/api/gas/health` のレスポンス内容

---

## 4. GAS への直接アクセスがブロックされることの確認

### 4.1. API キーなしでのアクセス（拒否されることを確認）

コマンドラインまたは REST クライアントで確認:

```bash
curl "https://script.google.com/macros/s/.../exec?action=health"
```

- [ ] レスポンスが以下の形式であることを確認:
  ```json
  {"ok":false,"error":"Unauthorized"}
  ```

### 4.2. callback パラメータ付きでのアクセス（拒否されることを確認）

```bash
curl "https://script.google.com/macros/s/.../exec?action=health&apiKey=...&callback=test"
```

- [ ] レスポンスが以下の形式であることを確認:
  ```json
  {"ok":false,"error":"JSONP is not supported. Please use JSON API via Cloudflare Functions."}
  ```

### 4.3. Cloudflare Functions 経由でのアクセス（成功することを確認）

```bash
curl "https://<project>.pages.dev/api/gas/health"
```

- [ ] レスポンスが以下の形式であることを確認:
  ```json
  {"ok":true,"timestamp":"2025-01-12T...","message":"yomikikase-planner GAS Web App is running"}
  ```

---

## 5. Console の警告確認

### 5.1. Endpoint URL 不一致の警告がないことを確認

ブラウザの開発者ツールで **Console** タブを開く:

- [ ] 以下の警告が **表示されない** ことを確認:
  ```
  liff.init() was called with a current URL that is not related to the endpoint URL.
  ```

- [ ] その他の LIFF 関連のエラーや警告が表示されないことを確認

### 5.2. スクリーンショット撮影

検証エビデンスとして以下のスクリーンショットを撮影:

- [ ] Console タブで警告が表示されていない画面

---

## 6. GitHub Pages が使用されていないことの確認

### 6.1. ドキュメントの確認

以下のドキュメントに警告が追加されていることを確認:

- [ ] `docs/miniapp-poc/README.md` に「⚠️ 重要：この PoC は完了しました（運用非推奨）」セクションがある
- [ ] `docs/github-pages-liff-poc.md` に「⚠️ 重要：この PoC は完了しました（運用非推奨）」セクションがある
- [ ] 両ドキュメントに停止理由が記載されている
- [ ] 両ドキュメントに Cloudflare Pages への移行が推奨されている

### 6.2. LINE Developers Console の確認

- [ ] Endpoint URL が GitHub Pages の URL で **ない** ことを確認
  - ❌ `https://ihsinoky.github.io/yomikikase-planner/miniapp-poc/`
  - ✅ `https://<project>.pages.dev/`

---

## 7. ロールバック手順の確認

### 7.1. ドキュメントの確認

- [ ] `docs/github-pages-liff-poc.md` に「ロールバック手順」セクションがある
- [ ] ロールバック手順に以下が含まれている:
  - LINE Developers Console で Endpoint URL を戻す手順
  - GAS の API キー要件を緩和する手順
  - 確認方法

### 7.2. 緊急連絡先の確認（オプション）

- [ ] 緊急時の連絡先を確認: `____________________________`
- [ ] ロールバックを実施する判断基準を確認

---

## 8. 最終確認

### 8.1. DoD（受け入れ条件）の確認

以下の項目がすべて満たされていることを確認:

- [ ] LINE ミニアプリが Cloudflare Pages を配信面として使っている
- [ ] `/api/*` が Cloudflare Functions 経由で動く
- [ ] GitHub Pages + GAS(JSONP) の導線が「運用として使えない」状態になっている
- [ ] 切替の検証エビデンス（スクリーンショット/ログ）を Issue コメントに添付

### 8.2. スクリーンショット一覧

以下のスクリーンショットがすべて撮影されていることを確認:

- [ ] LIFF アプリ起動後の画面全体
- [ ] プロフィール情報が表示されている部分
- [ ] デバッグログが表示されている部分
- [ ] Network タブで `/api/gas/health` のリクエストが表示されている画面
- [ ] `/api/gas/health` のレスポンス内容
- [ ] Console タブで警告が表示されていない画面

### 8.3. 検証完了の報告

- [ ] GitHub Issue にコメントを追加
- [ ] スクリーンショットを添付
- [ ] 検証日時を記載: `____________________________`
- [ ] 検証者名を記載: `____________________________`

---

## 9. 追加検証（オプション）

### 9.1. パフォーマンス確認

- [ ] LIFF アプリの起動時間を計測: `______ 秒`
- [ ] API レスポンス時間を計測: `______ ms`
- [ ] 体感速度: 速い / 普通 / 遅い（該当する方に○）

### 9.2. 複数デバイスでの確認

- [ ] Android で動作確認
- [ ] iOS で動作確認
- [ ] タブレットで動作確認（オプション）

### 9.3. 外部ブラウザでの確認

- [ ] PC ブラウザ（Chrome）で動作確認
- [ ] PC ブラウザ（Safari）で動作確認
- [ ] スマートフォンブラウザで動作確認

---

## 検証結果サマリー

### 総合評価

- [ ] ✅ すべての項目が合格
- [ ] ⚠️ 一部の項目で問題あり（詳細を記載）
- [ ] ❌ 重大な問題あり（ロールバック推奨）

### 問題点・気づき

```
（ここに問題点や気づきを記載）
```

### 次のアクション

```
（ここに次に実施すべきアクションを記載）
```

---

## 参考リンク

- [Cloudflare 移行完了レポート](cloudflare-migration-completion.md)
- [Cloudflare Pages セットアップ手順](cloudflare-pages-setup.md)
- [GitHub Pages + JSONP 廃止について](github-pages-jsonp-deprecation.md)
- [GAS API キー検証](gas-api-key-verification.md)

---

**検証完了日**: ___________________  
**検証者署名**: ___________________
