# GAS Proxy API 動作確認チェックリスト

このドキュメントは、GAS Proxy API の実装が正しく動作することを確認するためのチェックリストです。

## 前提条件

- [ ] GAS Web App がデプロイ済み
- [ ] GAS のスクリプトプロパティに `API_KEY` が設定済み
- [ ] Cloudflare Pages にプロジェクトがデプロイ済み
- [ ] Cloudflare Pages の環境変数 `GAS_BASE_URL` と `GAS_API_KEY` が設定済み
- [ ] 環境変数設定後に再デプロイ済み

## 1. Cloudflare Pages Functions 経由のアクセス確認

### 1.1. 正常系：プロキシ経由でヘルスチェック

```bash
curl -i https://yomikikase-planner.pages.dev/api/gas/health
```

**期待される結果**:
- HTTP ステータス: `200 OK`
- Content-Type: `application/json`
- レスポンスボディ:
  ```json
  {
    "ok": true,
    "timestamp": "2025-12-29T...",
    "message": "yomikikase-planner GAS Web App is running"
  }
  ```

- [ ] ✅ 確認完了

### 1.2. 環境変数未設定の場合

環境変数を削除または無効にして再デプロイした場合：

```bash
curl https://yomikikase-planner.pages.dev/api/gas/health
```

**期待される結果**:
- HTTP ステータス: `500 Internal Server Error`
- レスポンスボディ:
  ```json
  {
    "ok": false,
    "error": "GAS_BASE_URL is not configured"
  }
  ```
  または
  ```json
  {
    "ok": false,
    "error": "GAS_API_KEY is not configured"
  }
  ```

- [ ] ✅ 確認完了（環境変数を戻すことを忘れずに）

## 2. GAS 側の API キー検証確認

### 2.1. API キーなしでのアクセス（拒否されるべき）

```bash
curl "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=health"
```

**期待される結果**:
- レスポンスボディ:
  ```json
  {
    "ok": false,
    "error": "Unauthorized"
  }
  ```

- [ ] ✅ 確認完了

### 2.2. 誤った API キーでのアクセス（拒否されるべき）

```bash
curl "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=health&apiKey=wrong-api-key"
```

**期待される結果**:
- レスポンスボディ:
  ```json
  {
    "ok": false,
    "error": "Unauthorized"
  }
  ```

- [ ] ✅ 確認完了

### 2.3. 正しい API キーでのアクセス（成功するべき）

```bash
curl "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=health&apiKey=YOUR_CORRECT_API_KEY"
```

**期待される結果**:
- レスポンスボディ:
  ```json
  {
    "ok": true,
    "timestamp": "2025-12-29T...",
    "message": "yomikikase-planner GAS Web App is running"
  }
  ```

- [ ] ✅ 確認完了

## 3. エラーケースの確認

### 3.1. GAS がダウンしている場合

GAS のデプロイを一時的に無効化するか、`GAS_BASE_URL` を誤った URL に変更して確認：

```bash
curl https://yomikikase-planner.pages.dev/api/gas/health
```

**期待される結果**:
- HTTP ステータス: `502 Bad Gateway`
- レスポンスボディ:
  ```json
  {
    "ok": false,
    "error": "Failed to communicate with upstream service",
    "message": "..."
  }
  ```
  または
  ```json
  {
    "ok": false,
    "error": "Upstream service returned an error",
    "statusCode": ...
  }
  ```

- [ ] ✅ 確認完了（設定を戻すことを忘れずに）

### 3.2. Cloudflare と GAS の API キーが不一致の場合

Cloudflare の `GAS_API_KEY` を意図的に誤った値に変更して再デプロイ：

```bash
curl https://yomikikase-planner.pages.dev/api/gas/health
```

**期待される結果**:
- HTTP ステータス: `502 Bad Gateway`
- レスポンスボディ:
  ```json
  {
    "ok": false,
    "error": "Authentication failed with upstream service"
  }
  ```

- [ ] ✅ 確認完了（正しい API キーに戻すことを忘れずに）

## 4. ブラウザからのアクセス確認

### 4.1. ブラウザでプロキシ API にアクセス

ブラウザで以下の URL を開く：

```
https://yomikikase-planner.pages.dev/api/gas/health
```

**期待される結果**:
- ブラウザに JSON が表示される
- `"ok": true` が含まれる

- [ ] ✅ 確認完了

### 4.2. ブラウザの開発者ツールでネットワーク確認

1. ブラウザの開発者ツールを開く（F12）
2. Network タブを選択
3. `/api/gas/health` にアクセス
4. リクエスト詳細を確認

**期待される結果**:
- Status Code: `200`
- Content-Type: `application/json`
- Response に GAS からの JSON が含まれる

- [ ] ✅ 確認完了

## 5. LIFF アプリからのアクセス確認（将来実装）

### 5.1. liff/index.html から fetch でアクセス

`liff/index.html` に以下のようなコードを追加してテスト：

```javascript
async function testGasHealth() {
  try {
    const response = await fetch('/api/gas/health');
    const data = await response.json();
    console.log('GAS Health Check:', data);
    return data.ok;
  } catch (error) {
    console.error('Failed to call GAS health check:', error);
    return false;
  }
}

// ページ読み込み時に実行
testGasHealth();
```

**期待される結果**:
- コンソールに `GAS Health Check: {ok: true, ...}` が表示される
- エラーが発生しない
- CORS エラーが発生しない（同一オリジンのため）

- [ ] ✅ 確認完了（将来実装時）

## 6. セキュリティチェック

### 6.1. Secrets が Git 管理されていないことを確認

```bash
git log --all --full-history -- .env
git log --all --full-history -- "**/*.env"
```

**期待される結果**:
- `.env` ファイルが履歴に含まれていない
- `.env.example` のみがコミットされている

- [ ] ✅ 確認完了

### 6.2. .gitignore に .env が含まれていることを確認

```bash
cat .gitignore | grep .env
```

**期待される結果**:
- `.env` が含まれている

- [ ] ✅ 確認完了

### 6.3. ソースコードに API キーがハードコードされていないことを確認

```bash
grep -r "your-api-key\|YOUR_API_KEY\|apiKey.*=" functions/ gas/ liff/ --include="*.js" --include="*.gs"
```

**期待される結果**:
- API キーの実際の値が含まれていない
- 変数名や例示のみが含まれる

- [ ] ✅ 確認完了

## 7. パフォーマンス確認

### 7.1. レスポンスタイムの確認

```bash
time curl -s https://yomikikase-planner.pages.dev/api/gas/health > /dev/null
```

**期待される結果**:
- 1〜3秒以内にレスポンスが返る（GAS のコールドスタート時は遅い場合あり）

- [ ] ✅ 確認完了

## 受け入れ条件（最終確認）

すべての項目にチェックが入っていることを確認：

- [ ] `/api/gas/health` が Cloudflare 経由で 200 を返す
- [ ] Secrets が git 管理されていない（`.env.example` のみコミット）
- [ ] フロントエンドは GAS URL を参照しない方針が明記されている（README に記載）
- [ ] GAS 側で API キー検証が動作する
- [ ] Cloudflare 側で環境変数が正しく設定されている
- [ ] エラーハンドリングが適切に動作する
- [ ] セキュリティチェックが完了している

## トラブルシューティング

各ステップで問題が発生した場合は、[Cloudflare Secrets 設定手順](cloudflare-secrets-setup.md) のトラブルシューティングセクションを参照してください。

## 次のステップ

動作確認が完了したら：

1. このチェックリストの結果を Issue にコメント
2. すべての項目が完了していることを確認
3. Issue をクローズ
4. 次の機能（例: `/api/gas/surveys`）の実装に進む
