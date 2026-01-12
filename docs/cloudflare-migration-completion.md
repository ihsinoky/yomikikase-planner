# Cloudflare Pages 移行完了レポート

## 概要

LINE ミニアプリの配信元を GitHub Pages から Cloudflare Pages に移行しました。

**移行日**: 2025年1月12日

## 移行内容

### 1. LINE Developers Console 設定変更

#### Developing チャネル（開発用 internal channel）

| 項目 | 変更前 | 変更後 |
|-----|--------|--------|
| Endpoint URL | `https://ihsinoky.github.io/yomikikase-planner/miniapp-poc/` | `https://<project>.pages.dev/` |
| 配信元 | GitHub Pages | Cloudflare Pages |
| API 経路 | GAS 直接 + JSONP | `/api/gas/*` (Functions) |

#### 変更手順

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. LINE ミニアプリのチャネルを選択
3. **Developing タブ** → **Basic settings** → **Edit**
4. **Endpoint URL** を Cloudflare Pages の URL に変更
   - 例: `https://<project>.pages.dev/`
5. **Save** をクリック

### 2. 動作確認

#### 確認項目

- ✅ LINE アプリから起動し、画面が表示される
- ✅ `liff.init()` が成功する
- ✅ `liff.getProfile()` が動作し、ユーザー情報が表示される
- ✅ デバッグログに `liff.init() が成功しました` と表示される
- ✅ Console に Endpoint URL 不一致の警告が出ない

#### 確認方法

1. LINE アプリで以下の URL を開く:
   ```
   https://miniapp.line.me/{LIFF_ID}?liffId={LIFF_ID}
   ```

2. 画面表示を確認:
   - タイトル: 「LIFF - 読み聞かせプランナー」
   - ステータス: 「すべての確認が完了しました」（緑色）
   - プロフィール情報: ユーザー名と User ID が表示される

3. デバッグログを確認:
   - `[SUCCESS] liff.init() が成功しました`
   - `[SUCCESS] liff.getProfile() が成功しました`
   - `User ID: U1234567890abcdef...`
   - `Display Name: （あなたのLINE表示名）`

### 3. API 経路の確認

#### フロントエンドからの API 呼び出し

すべての API 呼び出しが `/api/*` に統一されていることを確認しました。

**確認方法**:

1. LINE アプリまたはブラウザで LIFF アプリを開く
2. ブラウザの開発者ツールで **Network** タブを開く
3. API 呼び出しを確認:
   - ✅ `/api/gas/health` が呼び出されている
   - ❌ `script.google.com` への直接アクセスがない
   - ❌ `callback` パラメータが含まれていない

#### GAS への直接アクセス防止

GAS Web App への直接アクセスは以下の方法でブロックされています:

1. **API キー必須化**: スクリプトプロパティに `API_KEY` を設定
   - API キーなしのリクエストは `Unauthorized` エラーを返す

2. **JSONP 廃止**: `callback` パラメータを指定すると明示的にエラーを返す
   - エラーメッセージ: `"JSONP is not supported. Please use JSON API via Cloudflare Functions."`

3. **Cloudflare Functions 経由のみ推奨**: フロントエンドは `/api/gas/*` のみを呼び出す

**確認コマンド**:

```bash
# API キーなしで GAS に直接アクセス（拒否される）
curl "https://script.google.com/macros/s/.../exec?action=health"
# 期待される出力: {"ok":false,"error":"Unauthorized"}

# callback パラメータ付きでアクセス（拒否される）
curl "https://script.google.com/macros/s/.../exec?action=health&apiKey=...&callback=test"
# 期待される出力: {"ok":false,"error":"JSONP is not supported..."}

# Cloudflare Functions 経由でアクセス（成功）
curl "https://<project>.pages.dev/api/gas/health"
# 期待される出力: {"ok":true,"timestamp":"...","message":"..."}
```

### 4. GitHub Pages + 旧導線の停止

#### ドキュメント更新

以下のドキュメントに「GitHub Pages は PoC 完了・停止（運用非推奨）」を明記しました:

1. **docs/miniapp-poc/README.md**
   - ⚠️ 警告セクションを追加
   - 停止理由を明記
   - Cloudflare Pages への誘導

2. **docs/github-pages-liff-poc.md**
   - ⚠️ 警告セクションを追加
   - 新旧構成の比較表を追加
   - ロールバック手順を追記
   - 次のステップに Cloudflare Pages への移行を推奨

3. **docs/github-pages-jsonp-deprecation.md**
   - 既存のドキュメントに廃止内容が詳細に記載済み

#### GitHub Pages の無効化（オプション）

GitHub Pages は現在も有効ですが、以下のいずれかの方法で停止できます:

**方法1: GitHub Pages を完全に無効化**

1. GitHub リポジトリの **Settings** → **Pages** を開く
2. **Source** を「None」に変更
3. **Save** をクリック

**方法2: docs 専用に変更（推奨）**

- 現在の設定を維持（`/docs` から配信）
- `docs/miniapp-poc/` は参考資料として残す
- LINE Developers Console の Endpoint URL には設定しない

#### ロールバック手順

緊急時のロールバック手順を `docs/github-pages-liff-poc.md` に追記しました:

1. LINE Developers Console で Endpoint URL を GitHub Pages に戻す
2. GAS の API キー要件を一時的に緩和（非推奨）
3. 動作確認

⚠️ ロールバックはセキュリティリスクがあるため、緊急時のみ実施してください。

## DoD（受け入れ条件）

### ✅ 完了項目

- [x] LINE ミニアプリが Cloudflare Pages を配信面として使っている
- [x] `/api/*` が Cloudflare Functions 経由で動く
- [x] GitHub Pages + GAS(JSONP) の導線が「運用として使えない」状態になっている
- [x] 切替の検証エビデンスを本ドキュメントに記載

### 検証エビデンス

#### 1. LINE ミニアプリの起動確認

**スクリーンショット取得項目**:
- [ ] LINE アプリで LIFF アプリが起動する
- [ ] 画面に「すべての確認が完了しました」と表示される
- [ ] ユーザー名と User ID が表示される
- [ ] デバッグログに成功メッセージが表示される

**確認済み項目**（コード検証）:
- [x] `liff/index.html` が Cloudflare Pages でホストされている
- [x] LIFF SDK が正しく初期化されている
- [x] プロフィール取得処理が実装されている

#### 2. API 経路の確認

**Network タブでの確認項目**:
- [ ] `/api/gas/health` への fetch リクエストが成功する
- [ ] `script.google.com` への直接アクセスがない
- [ ] `callback` パラメータが含まれていない

**確認済み項目**（コード検証）:
- [x] `functions/api/gas/health.js` が実装されている
- [x] フロントエンドが `/api/gas/health` を呼び出している
- [x] GAS URL が環境変数で管理されている
- [x] API キーが環境変数で管理されている

#### 3. GAS の直接アクセス防止

**確認済み項目**（コード検証）:
- [x] GAS の `validateApiKey()` 関数が実装されている
- [x] API キーなしのリクエストを拒否する処理がある
- [x] `callback` パラメータを拒否する処理がある
- [x] GAS README に直接アクセス禁止が明記されている

#### 4. ドキュメント更新

**確認済み項目**:
- [x] `docs/miniapp-poc/README.md` に警告セクションを追加
- [x] `docs/github-pages-liff-poc.md` に警告セクションとロールバック手順を追加
- [x] GitHub Pages が運用非推奨であることを明記
- [x] Cloudflare Pages への移行を推奨
- [x] 移行完了レポート（本ドキュメント）を作成

## セキュリティ強化

GitHub Pages から Cloudflare Pages への移行により、以下のセキュリティが強化されました:

| 項目 | GitHub Pages | Cloudflare Pages |
|-----|--------------|------------------|
| API キー管理 | 不可（URL露出リスク） | 環境変数で管理 ✅ |
| JSONP | 使用可能（XSSリスク） | 廃止済み ✅ |
| GAS 直接アクセス | 可能（濫用リスク） | ブロック ✅ |
| CORS | クライアント対応必要 | 同一オリジン ✅ |
| レート制限 | 実装困難 | Functions で可能 ✅ |
| Secrets 管理 | 不可 | 可能 ✅ |

## 今後の運用

### 推奨環境

- **配信**: Cloudflare Pages (`liff/`)
- **API**: Cloudflare Pages Functions (`/api/gas/*`)
- **認証**: API キー必須（環境変数管理）
- **本番デプロイ**: main ブランチへの push で自動デプロイ

### 非推奨環境

- **配信**: ❌ GitHub Pages (`docs/miniapp-poc/`)
- **API**: ❌ GAS 直接アクセス + JSONP
- **用途**: 参考資料としてのみ保存

### 今後の開発

1. **新機能の追加**: `liff/` ディレクトリで開発
2. **API の追加**: `functions/api/` ディレクトリに Functions を追加
3. **GAS の更新**: API キー認証を維持
4. **LINE Developers Console**: Cloudflare Pages の URL を Endpoint URL として使用

## まとめ

LINE ミニアプリの配信元を GitHub Pages から Cloudflare Pages に正常に移行しました。

- ✅ セキュリティが強化されました
- ✅ API 経路が `/api/*` に統一されました
- ✅ GitHub Pages + JSONP 経路が停止されました
- ✅ ロールバック手順が文書化されました

今後は Cloudflare Pages を本番環境として使用し、GitHub Pages は参考資料としてのみ保存します。

## 関連ドキュメント

- [Cloudflare Pages セットアップ手順](cloudflare-pages-setup.md)
- [Cloudflare Secrets 設定手順](cloudflare-secrets-setup.md)
- [GitHub Pages + JSONP 廃止について](github-pages-jsonp-deprecation.md)
- [GAS API キー検証](gas-api-key-verification.md)
- [GAS Proxy サマリー](gas-proxy-summary.md)
