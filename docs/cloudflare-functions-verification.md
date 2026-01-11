# Cloudflare Pages Functions - 動作確認手順

このドキュメントは、Cloudflare Pages にデプロイ後の動作確認手順を説明します。

## 前提条件

- Cloudflare Pages にプロジェクトがデプロイされていること
- デプロイ URL を確認済みであること（例: `https://yomikikase-planner.pages.dev`）

## 1. 静的コンテンツの確認

### ブラウザでの確認

1. デプロイされたサイトにアクセス:
   ```
   https://your-project-name.pages.dev/
   ```

2. 以下が表示されることを確認:
   - タイトル: 「📚 LIFF - 読み聞かせプランナー」
   - LIFF アプリケーションの UI
   - デバッグログセクション

### コマンドラインでの確認

```bash
# HTTP ステータスコードの確認
curl -I https://your-project-name.pages.dev/

# 期待される出力:
# HTTP/2 200
# content-type: text/html; charset=utf-8
# ...
```

✅ **確認ポイント**: 
- HTTP ステータスが 200 であること
- Content-Type が `text/html` であること
- Functions が起動していないこと（高速に応答すること）

## 2. API エンドポイントの確認

### `/api/health` の動作確認

#### 方法 1: curl コマンド

```bash
# JSON レスポンスを取得
curl https://your-project-name.pages.dev/api/health

# 期待される出力:
# {"ok":true}
```

#### 方法 2: HTTP ヘッダーも含めて確認

```bash
# ヘッダー情報も表示
curl -i https://your-project-name.pages.dev/api/health

# 期待される出力:
# HTTP/2 200
# content-type: application/json
# ...
# 
# {"ok":true}
```

#### 方法 3: ブラウザでアクセス

1. ブラウザで以下の URL を開く:
   ```
   https://your-project-name.pages.dev/api/health
   ```

2. ブラウザに以下が表示されることを確認:
   ```json
   {"ok":true}
   ```

✅ **確認ポイント**:
- HTTP ステータスが 200 であること
- Content-Type が `application/json` であること
- レスポンスボディが `{"ok":true}` であること
- Functions が正常に起動していること

## 3. ルーティング制御の確認

### 静的ファイルで Functions が起動しないことを確認

以下のような静的ファイルにアクセスした場合、Functions が起動せずに Edge から直接配信されることを確認します。

```bash
# ルートパスへのアクセス
curl -I https://your-project-name.pages.dev/

# 静的ファイル（存在する場合）
curl -I https://your-project-name.pages.dev/favicon.ico
```

✅ **確認ポイント**:
- 非常に高速にレスポンスが返ること（Edge からの配信）
- レスポンスヘッダーに Functions 関連の情報が含まれていないこと

### API パスで Functions が起動することを確認

```bash
# /api/* パスへのアクセス
curl https://your-project-name.pages.dev/api/health
```

✅ **確認ポイント**:
- JSON レスポンスが返ること（Functions が処理していること）
- `{"ok":true}` が返ること

## 4. Cloudflare ダッシュボードでの確認

### デプロイログの確認

1. Cloudflare Pages のダッシュボードにアクセス
2. プロジェクトを選択
3. 「View build history」または最新のデプロイを開く
4. ビルドログを確認:
   - `functions/` ディレクトリが検出されていること
   - `_routes.json` が適用されていること
   - デプロイが成功していること

### Functions の存在確認

デプロイ詳細画面で:
- Functions が検出されていることを確認
- `/api/health` が Functions として登録されていることを確認

## 5. エラーケースの確認（オプション）

### 存在しない API パスへのアクセス

```bash
# 存在しない API エンドポイントにアクセス
curl -I https://your-project-name.pages.dev/api/nonexistent

# 期待される動作:
# - 404 Not Found が返る
# - または Cloudflare のデフォルトエラーページが表示される
```

## トラブルシューティング

### `/api/health` が 404 を返す

**原因**:
- Functions がデプロイされていない
- `functions/api/health.js` が正しくコミットされていない
- Build output directory の設定が間違っている

**解決策**:
1. Cloudflare Pages のダッシュボードでデプロイログを確認
2. `functions/` ディレクトリが認識されているか確認
3. 必要に応じて再デプロイを実行

### `/` が 404 を返す

**原因**:
- Build output directory が `liff` に設定されていない
- `liff/index.html` が存在しない

**解決策**:
1. Settings → Builds & deployments で Build output directory を確認
2. `liff` に設定されていることを確認
3. 再デプロイを実行

### Functions が起動しない

**原因**:
- `_routes.json` の設定が間違っている
- Functions のファイル名や配置が間違っている

**解決策**:
1. `liff/_routes.json` の内容を確認:
   ```json
   {
     "version": 1,
     "include": ["/api/*"],
     "exclude": []
   }
   ```
2. `functions/api/health.js` が存在することを確認
3. 再デプロイを実行

## 受け入れ条件チェックリスト

以下をすべて確認できれば、実装は成功です：

- [ ] `GET /` で静的な `index.html` が表示される
- [ ] `GET /api/health` が HTTP 200 を返す
- [ ] `GET /api/health` のレスポンスボディが `{"ok":true}` である
- [ ] `GET /api/health` の Content-Type が `application/json` である
- [ ] 静的ファイルへのアクセスが高速である（Functions が起動していない）
- [ ] `/api/*` パスでのみ Functions が起動している

## 次のステップ

動作確認が完了したら:

1. ✅ この issue をクローズ
2. 次の API エンドポイントの実装を検討（例: `/api/reservations`）
3. LIFF アプリから `/api/health` を呼び出す実装を追加
4. 認証・認可の実装（LIFF ID Token の検証など）

## 参考

- [Cloudflare Pages Functions ドキュメント](https://developers.cloudflare.com/pages/functions/)
- [_routes.json 設定ガイド](https://developers.cloudflare.com/pages/functions/routing/#function-invocation-routes)
- [LIFF README](../liff/README.md)
- [Functions README](../functions/README.md)
