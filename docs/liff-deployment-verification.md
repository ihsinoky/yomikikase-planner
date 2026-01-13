# LIFF 静的アプリ デプロイ・動作確認チェックリスト

## 概要

このドキュメントは、Cloudflare Pages に LIFF 静的アプリをデプロイし、LINE ミニアプリで起動確認するための手順とチェックリストです。

**目的**: Cloudflare Pages で静的 LIFF を配信し、LINE ミニアプリ内で `liff.init` → プロフィール取得まで動作することを確認する

---

## 前提条件

以下が完了していることを確認してください：

- [ ] Cloudflare アカウントが作成済み
- [ ] GitHub アカウントでリポジトリへのアクセス権がある
- [ ] LINE Developers Console へのアクセス権がある
- [ ] GAS Web App がデプロイ済み（API Base URL を取得済み）
- [ ] LIFF ID が発行済み

---

## 1. Cloudflare Pages プロジェクトの作成

### 1.1. プロジェクトのセットアップ

詳細な手順は [Cloudflare Pages セットアップ手順](cloudflare-pages-setup.md) を参照してください。

**クイックチェックリスト**:

- [ ] Cloudflare Dashboard で「Workers & Pages」→「Create application」→「Pages」を選択
- [ ] GitHub リポジトリ `ihsinoky/yomikikase-planner` を連携
- [ ] プロジェクト名を設定（例: `yomikikase-planner`）
  - 本番用: `yomikikase-planner`
  - 検証用: `yomikikase-planner-staging`（推奨）
- [ ] Production branch を `main` に設定
- [ ] Build settings を設定:
  - Framework preset: `None`
  - Build command: （空欄）
  - Build output directory: `liff`
- [ ] 「Save and Deploy」をクリック

### 1.2. デプロイの確認

- [ ] デプロイが「Success」ステータスになることを確認
- [ ] プロジェクト URL をメモ: `https://______________________________.pages.dev/`
- [ ] ブラウザで URL にアクセスし、LIFF アプリが表示されることを確認

---

## 2. 環境変数の設定

### 2.1. GAS 関連の環境変数

詳細な手順は [Cloudflare Secrets 設定手順](cloudflare-secrets-setup.md) を参照してください。

**設定する環境変数**:

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `GAS_BASE_URL` | GAS Web App の URL | `https://script.google.com/macros/s/ABC.../exec` |
| `GAS_API_KEY` | API 認証キー（GAS のスクリプトプロパティと一致） | `your-random-secret-key` |

**チェックリスト**:

- [ ] Cloudflare Pages プロジェクトの「Settings」→「Environment variables」を開く
- [ ] `GAS_BASE_URL` を追加
  - Environment: `Production` と `Preview` 両方にチェック
  - Value: GAS Web App の URL
- [ ] `GAS_API_KEY` を追加
  - Environment: `Production` と `Preview` 両方にチェック
  - Value: GAS のスクリプトプロパティ `API_KEY` と同じ値
- [ ] 「Save」をクリック
- [ ] 最新のデプロイを「Retry deployment」で再デプロイ
- [ ] 再デプロイが完了するまで待機（1〜2分）

### 2.2. LIFF ID の設定方法

LIFF ID は環境変数ではなく、**URL パラメータ**で指定します。

**理由**:
- 同じ LIFF アプリで複数の LIFF ID を切り替えられる柔軟性
- Cloudflare Pages の環境変数を使用せず、フロントエンドでの実装がシンプル
- LINE Developers Console で Endpoint URL を設定する際に LIFF ID を含める

**設定方法**:
```text
https://yomikikase-planner.pages.dev/?liffId={LIFF_ID}
```

---

## 3. 本番/検証環境の切り替え戦略

### 3.1. 推奨構成

| 環境 | Cloudflare プロジェクト | ブランチ | LINE チャネル | LIFF ID |
|------|------------------------|---------|--------------|---------|
| **本番** | `yomikikase-planner` | `main` | Production チャネル | 本番用 LIFF ID |
| **検証** | `yomikikase-planner-staging` | `main` | Developing チャネル | 検証用 LIFF ID |

### 3.2. 切り替え方法

**方法 1: URL で分ける（推奨）**

- 本番: `https://yomikikase-planner.pages.dev/?liffId={本番LIFF_ID}`
- 検証: `https://yomikikase-planner-staging.pages.dev/?liffId={検証LIFF_ID}`

**利点**:
- ✅ 明確な環境分離
- ✅ 本番と検証で異なる GAS Web App を参照可能
- ✅ Cloudflare の環境変数を環境ごとに設定可能

**方法 2: 同じ URL で LIFF ID だけ変える**

- 本番: `https://yomikikase-planner.pages.dev/?liffId={本番LIFF_ID}`
- 検証: `https://yomikikase-planner.pages.dev/?liffId={検証LIFF_ID}`

**利点**:
- ✅ 1 つの Cloudflare プロジェクトで管理
- ⚠️ GAS Web App は本番・検証共通

### 3.3. チェックリスト

- [ ] 本番環境用の Cloudflare Pages プロジェクトを作成済み
- [ ] 検証環境用の Cloudflare Pages プロジェクトを作成済み（推奨）
- [ ] 各環境の URL をドキュメント化: 
  - 本番: `https://______________________________`
  - 検証: `https://______________________________`
- [ ] 各環境の LIFF ID をドキュメント化:
  - 本番: `______________________________`
  - 検証: `______________________________`

---

## 4. LINE Developers Console の設定

### 4.1. LIFF アプリの Endpoint URL 設定

**本番環境（Production チャネル）**:

- [ ] [LINE Developers Console](https://developers.line.biz/console/) にログイン
- [ ] LINE ミニアプリの **Production** チャネルを選択
- [ ] 「LIFF」タブを選択
- [ ] LIFF アプリの「Edit」をクリック
- [ ] **Endpoint URL** を設定:
  ```
  https://yomikikase-planner.pages.dev/
  ```
  - ⚠️ 末尾のスラッシュ `/` を忘れずに
  - ⚠️ LIFF ID は含めない（URL パラメータで指定）
- [ ] 「Update」をクリック

**検証環境（Developing チャネル）**:

- [ ] LINE Developers Console で **Developing** チャネルを選択
- [ ] 「LIFF」タブを選択
- [ ] LIFF アプリの「Edit」をクリック
- [ ] **Endpoint URL** を設定:
  ```
  https://yomikikase-planner-staging.pages.dev/
  ```
  - または検証環境用の URL
- [ ] 「Update」をクリック

### 4.2. LIFF ID の確認

- [ ] LINE Developers Console で LIFF ID を確認
- [ ] 本番用 LIFF ID をメモ: `______________________________`
- [ ] 検証用 LIFF ID をメモ: `______________________________`

---

## 5. 動作確認手順

### 5.1. API 疎通確認（ブラウザ）

まず、ブラウザで API が動作することを確認します。

- [ ] ブラウザで以下の URL にアクセス:
  ```text
  https://yomikikase-planner.pages.dev/api/health
  ```
- [ ] レスポンスが `{"ok":true}` であることを確認
- [ ] GAS プロキシ API を確認:
  ```text
  https://yomikikase-planner.pages.dev/api/gas/health
  ```
- [ ] レスポンスが以下の形式であることを確認:
  ```json
  {
    "ok": true,
    "timestamp": "2025-01-12T...",
    "message": "yomikikase-planner GAS Web App is running"
  }
  ```

### 5.2. LIFF 初期化確認（ブラウザ）

ブラウザで LIFF が読み込まれることを確認します。

- [ ] ブラウザで以下の URL にアクセス:
  ```text
  https://yomikikase-planner.pages.dev/?liffId={LIFF_ID}
  ```
  - `{LIFF_ID}` を実際の LIFF ID に置き換え
- [ ] 開発者ツール（F12）で Console タブを開く
- [ ] ログイン画面にリダイレクトされることを確認
  - またはログイン済みの場合、LIFF が初期化されることを確認
- [ ] Console に以下のようなログが表示されることを確認:
  ```
  [INFO] ページ読み込み完了
  [INFO] LIFF SDK バージョン: 2.x.x
  [INFO] liff.init() を呼び出し中...
  ```
- [ ] エラーがないことを確認

### 5.3. LINE アプリでの起動確認

LINE アプリから LIFF を起動し、プロフィール取得まで動作することを確認します。

#### 5.3.1. LIFF URL の作成

LINE アプリで開く URL を作成します:
```text
https://miniapp.line.me/{LIFF_ID}?liffId={LIFF_ID}
```

- [ ] `{LIFF_ID}` を実際の LIFF ID に置き換え
- [ ] URL をメモ: `______________________________`

#### 5.3.2. LINE アプリで起動

- [ ] LINE アプリを起動
- [ ] 作成した URL を自分宛てのトークに送信
- [ ] LINE アプリ内で URL をタップ
- [ ] LIFF アプリが起動することを確認

#### 5.3.3. 画面表示の確認

- [ ] タイトルが表示される: **「📚 LIFF - 読み聞かせプランナー」**
- [ ] ステータスが緑色で表示される: **「✅ すべての確認が完了しました」**
- [ ] 以下の情報セクションが表示される:
  - [ ] **「ℹ️ このページについて」** セクション
  - [ ] **「🔍 デバッグログ」** セクション

#### 5.3.4. デバッグログの確認

デバッグログに以下が表示されることを確認:

- [ ] `[INFO] ページ読み込み完了`
- [ ] `[INFO] LIFF SDK バージョン: 2.x.x`
- [ ] `[INFO] LIFF ID: 1234567890...`
- [ ] `[SUCCESS] ✅ liff.init() が成功しました`
- [ ] `[INFO] 📱 環境情報`
  - [ ] `isInClient: true (LINE アプリ内)` または `false (外部ブラウザ)`
  - [ ] `isLoggedIn: true`
  - [ ] `OS: ios` または `android`
- [ ] `[INFO] 👤 プロフィール取得`
- [ ] `[SUCCESS] ✅ liff.getProfile() が成功しました`
- [ ] `[INFO] User ID: U...`
- [ ] `[INFO] Display Name: (あなたの LINE 表示名)`
- [ ] `[SUCCESS] ═══════════════════════════════`
- [ ] `[SUCCESS] LIFF 検証完了！`

#### 5.3.5. プロフィール画像の確認

- [ ] プロフィール画像が表示される（プロフィール画像を設定している場合）
- [ ] 画像は円形で緑色の枠線がある

#### 5.3.6. エラーがないことを確認

- [ ] 赤色のエラーメッセージが表示されていない
- [ ] `[ERROR]` レベルのログがない
- [ ] 「LIFF ID が未設定です」というメッセージがない
- [ ] 「Endpoint URL の不一致エラー」がない

### 5.4. ブラウザ開発者ツールでの確認（オプション）

PC ブラウザで開発者ツールを使用して詳細を確認します。

- [ ] PC ブラウザで LIFF URL を開く:
  ```text
  https://yomikikase-planner.pages.dev/?liffId={LIFF_ID}
  ```
- [ ] 開発者ツール（F12）を開く
- [ ] **Network** タブを開く
- [ ] ページをリロード
- [ ] 以下を確認:
  - [ ] `/api/gas/health` へのリクエストがある（現時点では使用していないため、なくても OK）
  - [ ] `script.google.com` への直接リクエストがない
  - [ ] `callback` パラメータを含むリクエストがない
- [ ] **Console** タブを開く
- [ ] 以下の警告が表示されないことを確認:
  ```
  liff.init() was called with a current URL that is not related to the endpoint URL.
  ```

---

## 6. スクリーンショット撮影（検証エビデンス）

検証の証拠として、以下のスクリーンショットを撮影してください:

- [ ] LINE アプリで LIFF 起動後の画面全体
- [ ] プロフィール情報が表示されている部分（拡大）
- [ ] デバッグログで「LIFF 検証完了！」が表示されている部分
- [ ] （オプション）PC ブラウザの開発者ツール（Console タブ）
- [ ] （オプション）PC ブラウザの開発者ツール（Network タブ）

---

## 7. トラブルシューティング

### 7.1. 「LIFF ID が未設定です」エラー

**症状**: 画面に「❌ LIFF ID が未設定です」と表示される

**原因**: URL パラメータ `?liffId=...` が指定されていない

**解決方法**:
- URL に `?liffId={LIFF_ID}` を追加
- 正しい形式: `https://yomikikase-planner.pages.dev/?liffId=1234567890-abcdefgh`

### 7.2. Endpoint URL 不一致エラー

**症状**: Console に以下の警告が表示される
```
liff.init() was called with a current URL that is not related to the endpoint URL.
```

**原因**: LINE Developers Console の Endpoint URL と現在の URL が一致していない

**解決方法**:
1. LINE Developers Console で Endpoint URL を確認
2. Endpoint URL を現在の Cloudflare Pages の URL に変更
3. 末尾のスラッシュ `/` を忘れずに付ける
4. 例: `https://yomikikase-planner.pages.dev/`

### 7.3. 「Unauthorized」エラー

**症状**: `/api/gas/health` が 401 または "Unauthorized" エラーを返す

**原因**: GAS の API キーが一致していない

**解決方法**:
1. GAS のスクリプトプロパティ `API_KEY` の値を確認
2. Cloudflare Pages の環境変数 `GAS_API_KEY` の値を確認
3. 両方が完全に一致していることを確認
4. 環境変数を修正した場合は、再デプロイを実行

### 7.4. LIFF が初期化されない

**症状**: `liff.init()` がタイムアウトまたはエラーになる

**確認事項**:
1. LIFF ID の形式が正しいか（例: `1234567890-abcdefgh`）
2. LINE Developers Console で LIFF アプリが有効になっているか
3. LIFF アプリの Endpoint URL が正しく設定されているか
4. ネットワーク接続が正常か

### 7.5. プロフィール取得に失敗

**症状**: `liff.getProfile()` がエラーになる

**確認事項**:
1. LINE にログインしているか
2. LIFF アプリの権限設定（Scopes）に `profile` が含まれているか
3. ユーザーが LIFF アプリの利用を承認したか

---

## 8. 受け入れ条件の確認（Definition of Done）

以下がすべて満たされていることを確認してください:

### 8.1. Cloudflare Pages の URL で LIFF が表示される

- [ ] Cloudflare Pages にデプロイされている
- [ ] ブラウザで `https://yomikikase-planner.pages.dev/?liffId={LIFF_ID}` にアクセスできる
- [ ] LIFF アプリの画面が表示される

### 8.2. LINE ミニアプリ内で liff.init → プロフィール取得まで通る

- [ ] LINE アプリで LIFF URL を開ける
- [ ] `liff.init()` が成功する（デバッグログで確認）
- [ ] `liff.getProfile()` が成功する（デバッグログで確認）
- [ ] ユーザー識別情報が取得できる:
  - [ ] User ID が表示される（`U` で始まる文字列）
  - [ ] Display Name が表示される
  - [ ] プロフィール画像が表示される（設定している場合）

### 8.3. ドキュメントが追加されている

- [ ] このチェックリスト（`docs/liff-deployment-verification.md`）が存在する
- [ ] 他の関連ドキュメントとの整合性が取れている:
  - [ ] [Cloudflare Pages セットアップ手順](cloudflare-pages-setup.md)
  - [ ] [Cloudflare Secrets 設定手順](cloudflare-secrets-setup.md)
  - [ ] [移行検証チェックリスト](cloudflare-migration-verification-checklist.md)

---

## 9. 完了報告

検証が完了したら、以下を記録してください:

**検証日時**: ___________________  
**検証者**: ___________________  
**環境**:
- Cloudflare Pages URL: ___________________
- LIFF ID: ___________________
- 使用デバイス: ___________________
- LINE アプリバージョン: ___________________

**検証結果**:
- [ ] ✅ すべての項目が合格
- [ ] ⚠️ 一部の項目で問題あり（詳細を下記に記載）
- [ ] ❌ 重大な問題あり

**問題点・気づき**:
```
（ここに問題点や気づきを記載）
```

**添付ファイル**:
- [ ] スクリーンショット（LINE アプリ起動画面）
- [ ] スクリーンショット（デバッグログ）
- [ ] その他のエビデンス

---

## 10. 参考リンク

### セットアップ手順
- [Cloudflare Pages セットアップ手順](cloudflare-pages-setup.md)
- [Cloudflare Secrets 設定手順](cloudflare-secrets-setup.md)
- [セットアップ手順書（全体）](setup.md)

### 検証・移行関連
- [Cloudflare 移行検証チェックリスト](cloudflare-migration-verification-checklist.md)
- [Cloudflare 移行完了レポート](cloudflare-migration-completion.md)

### アーキテクチャ
- [ADR-001: Cloudflare Pages + Functions 採用](adr/001-adopt-cloudflare-pages-functions.md)

### GAS 関連
- [GAS セットアップ手順](../gas/README.md)
- [GAS 動作確認](../gas/VERIFICATION.md)

---

## 付録: 環境変数一覧

| 変数名 | 用途 | 設定場所 | 必須 | 例 |
|--------|------|---------|------|-----|
| `GAS_BASE_URL` | GAS Web App の URL | Cloudflare Pages 環境変数 | ✅ | `https://script.google.com/macros/s/ABC.../exec` |
| `GAS_API_KEY` | API 認証キー | Cloudflare Pages 環境変数 & GAS スクリプトプロパティ | ✅ | `your-random-secret-key` |
| LIFF ID | LINE LIFF アプリ ID | URL パラメータ（`?liffId=...`） | ✅ | `1234567890-abcdefgh` |

---

## まとめ

このチェックリストに従うことで、以下が実現できます:

- ✅ Cloudflare Pages に LIFF 静的アプリをデプロイ
- ✅ 環境変数（LIFF ID、API Base URL など）の適切な管理
- ✅ 本番/検証環境の明確な切り替え
- ✅ LINE ミニアプリでの起動と動作確認（`liff.init` → `liff.getProfile`）
- ✅ トラブルシューティング手順の文書化

次のステップとして、実際の業務ロジック（アンケート機能など）の実装を進めることができます。
