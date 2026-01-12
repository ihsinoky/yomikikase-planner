# GAS API Key & JSONP 廃止の検証手順

このドキュメントは、GAS の API キー必須化と JSONP 廃止の実装を検証するための手順書です。

## 事前準備

### 1. API キーの生成

```bash
# ランダムな API キーを生成
openssl rand -base64 32
```

出力例: `YOUR_GENERATED_API_KEY_HERE_REPLACE_WITH_ACTUAL_VALUE`

**⚠️ 重要**: 実際の検証では、上記コマンドで生成された実際の値を使用してください。このドキュメントの例示値は使用しないでください。

### 2. GAS にデプロイ

1. `gas/Code.gs` の内容を Apps Script エディタにコピー
2. スクリプトプロパティに `API_KEY` を設定（上記で生成した値）
3. Web App としてデプロイ
4. デプロイ URL を記録: `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec`

### 3. Cloudflare Pages の環境変数設定

```
GAS_BASE_URL=https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
GAS_API_KEY={YOUR_GENERATED_API_KEY}
```

## 検証項目

### ✅ テスト 1: API キーなしでアクセス（401 相当のエラーを期待）

**目的**: API キーが必須になっていることを確認

**手順**:
```bash
curl -X GET "https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?action=health"
```

**期待される結果**:
```json
{
  "ok": false,
  "error": "Unauthorized"
}
```

**HTTP ステータス**: 200 (GAS の制約により、エラーでも 200 を返す)

**判定**: ✅ レスポンスに `"ok": false` と `"error": "Unauthorized"` が含まれていれば成功

---

### ✅ テスト 2: 間違った API キーでアクセス（401 相当のエラーを期待）

**目的**: API キーの検証が正しく機能していることを確認

**手順**:
```bash
curl -X GET "https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?action=health&apiKey=wrong-api-key"
```

**期待される結果**:
```json
{
  "ok": false,
  "error": "Unauthorized"
}
```

**判定**: ✅ レスポンスに `"ok": false` と `"error": "Unauthorized"` が含まれていれば成功

---

### ✅ テスト 3: 正しい API キーでアクセス（200 成功を期待）

**目的**: 正しい API キーでは正常に動作することを確認

**手順**:
```bash
# {YOUR_GENERATED_API_KEY} を実際に生成した API キーに置き換えてください
curl -X GET "https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?action=health&apiKey={YOUR_GENERATED_API_KEY}"
```

**期待される結果**:
```json
{
  "ok": true,
  "timestamp": "2025-01-12T...",
  "message": "yomikikase-planner GAS Web App is running"
}
```

**判定**: ✅ レスポンスに `"ok": true` が含まれていれば成功

---

### ✅ テスト 4: JSONP callback パラメータの拒否

**目的**: JSONP が完全に廃止されていることを確認

**手順**:
```bash
# {YOUR_GENERATED_API_KEY} を実際に生成した API キーに置き換えてください
curl -X GET "https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?action=health&apiKey={YOUR_GENERATED_API_KEY}&callback=myCallback"
```

**期待される結果**:
```json
{
  "ok": false,
  "error": "JSONP is not supported. Please use JSON API via Cloudflare Functions."
}
```

**判定**: ✅ JSONP エラーメッセージが返ってくれば成功

---

### ✅ テスト 5: Cloudflare Functions 経由でのアクセス（推奨方法）

**目的**: Cloudflare Pages Functions 経由で正常にアクセスできることを確認

**手順**:
```bash
curl -X GET "https://your-domain.pages.dev/api/gas/health"
```

**期待される結果**:
```json
{
  "ok": true,
  "timestamp": "2025-01-12T...",
  "message": "yomikikase-planner GAS Web App is running"
}
```

**判定**: ✅ レスポンスに `"ok": true` が含まれていれば成功

---

### ✅ テスト 6: API キー未設定時のエラーログ確認

**目的**: API キーが未設定の場合、適切なログが記録されることを確認

**手順**:
1. GAS のスクリプトプロパティから `API_KEY` を削除
2. ヘルスチェックを実行:
   ```bash
   curl -X GET "https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?action=health"
   ```
3. Apps Script エディタの「実行ログ」を確認

**期待される結果**:
- レスポンス: `{"ok": false, "error": "Unauthorized"}`
- ログに `ERROR: API_KEY is not configured in Script Properties` が記録される

**判定**: ✅ エラーレスポンスとログが正しく記録されていれば成功

---

### ✅ テスト 7: Cloudflare Functions のエラーハンドリング

**目的**: Cloudflare Functions が GAS のエラーを適切に処理することを確認

**手順**:
1. Cloudflare Pages の環境変数 `GAS_API_KEY` を間違った値に変更
2. デプロイを待つ
3. アクセス:
   ```bash
   curl -X GET "https://your-domain.pages.dev/api/gas/health"
   ```

**期待される結果**:
```json
{
  "ok": false,
  "error": "Authentication failed with upstream service"
}
```

**HTTP ステータス**: 502 Bad Gateway

**判定**: ✅ 502 エラーと適切なエラーメッセージが返ってくれば成功

---

## 受け入れ条件（DoD）の確認

以下のすべてが ✅ になれば、実装は完了です：

### GAS 側

- [ ] テスト 1: API キーなしで 401 相当のエラー ✅
- [ ] テスト 2: 間違った API キーで 401 相当のエラー ✅
- [ ] テスト 3: 正しい API キーで 200 成功 ✅
- [ ] テスト 4: JSONP callback パラメータの拒否 ✅
- [ ] テスト 6: API キー未設定時のエラーログ ✅

### Cloudflare Functions 側

- [ ] テスト 5: Cloudflare Functions 経由で 200 成功 ✅
- [ ] テスト 7: GAS エラー時の適切なエラーハンドリング ✅

### ドキュメント

- [x] GAS README に直接アクセス禁止を明記 ✅
- [x] GitHub Pages + JSONP 廃止ドキュメントの作成 ✅
- [x] README に廃止のお知らせを追加 ✅
- [x] トラブルシューティング情報の追加 ✅

## トラブルシューティング

### API キーが認識されない

**症状**: 正しい API キーを指定してもエラーが返る

**確認事項**:
1. API キーの前後に空白や改行がないか確認
2. URL エンコーディングの問題がないか確認
3. GAS とCloudflare の API キーが完全に一致しているか確認

**デバッグ方法**:
```javascript
// GAS のデバッグ用関数を追加
function debugApiKey() {
  var props = PropertiesService.getScriptProperties();
  var apiKey = props.getProperty('API_KEY');
  
  Logger.log('API Key length: ' + (apiKey ? apiKey.length : 'null'));
  Logger.log('API Key first 5 chars: ' + (apiKey ? apiKey.substring(0, 5) : 'null'));
  
  return apiKey ? apiKey.length : 0;
}
```

### CORS エラーが発生する

**症状**: ブラウザから直接アクセスすると CORS エラーが発生

**原因**: GAS に直接アクセスしようとしている

**解決方法**: Cloudflare Pages Functions 経由でアクセスする（`/api/gas/health`）

### Cloudflare Functions がタイムアウトする

**症状**: 502 Gateway Timeout エラー

**原因**: GAS のコールドスタートが遅い、またはネットワークの問題

**解決方法**:
1. GAS を事前に「ウォームアップ」する（定期的にアクセス）
2. Cloudflare Functions のタイムアウト時間を延長（現在10秒）
3. GAS のパフォーマンスを最適化

## 参考リンク

- [GAS README](../gas/README.md)
- [GitHub Pages + JSONP 廃止ドキュメント](github-pages-jsonp-deprecation.md)
- [Cloudflare Secrets 設定手順](cloudflare-secrets-setup.md)

## 変更履歴

| 日付 | 変更内容 | 担当 |
|------|---------|------|
| 2025-01-12 | 初版作成 | @copilot |
