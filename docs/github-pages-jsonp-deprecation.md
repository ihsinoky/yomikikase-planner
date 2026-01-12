# GitHub Pages + JSONP 経路の廃止について

## 概要

2025年1月12日より、以下の経路が完全に廃止されました：

- ❌ GitHub Pages から GAS への直接アクセス
- ❌ JSONP (`callback` パラメータ) の使用
- ❌ API キーなしでの GAS へのアクセス

## 背景

### なぜ廃止するのか？

1. **セキュリティリスク**
   - 公開 URL への直接アクセスで濫用リスクが高い
   - API キーが URL に露出する可能性
   - JSONP は XSS 攻撃のリスクがある

2. **保守性の問題**
   - GAS URL が変更された場合の影響範囲が大きい
   - CORS 問題への対応が複雑

3. **運用上の課題**
   - GitHub Pages は静的ホスティングのみ
   - Secrets の管理ができない
   - レート制限の実装が困難

## 新しいアーキテクチャ

### 推奨構成（Cloudflare Pages + Functions）

```
参加者（LINE）
    ↓
LIFF (Cloudflare Pages)
    ↓
Cloudflare Pages Functions (/api/gas/*)
    ↓ (API キー付き)
Google Apps Script
    ↓
Google Spreadsheet
```

### 主な変更点

| 項目 | 旧構成 | 新構成 |
|-----|--------|--------|
| ホスティング | GitHub Pages | Cloudflare Pages |
| GAS 通信 | JSONP (直接) | JSON (Proxy経由) |
| API キー | オプション | **必須** |
| callback パラメータ | 使用可能 | **拒否** |
| セキュリティ | 低 | 高 |

## 移行手順

### 1. API キーの設定（GAS 側）

```
1. Apps Script エディタで「プロジェクトの設定」を開く
2. 「スクリプト プロパティ」に以下を追加:
   - プロパティ: API_KEY
   - 値: `openssl rand -base64 32` で生成した文字列
```

### 2. Cloudflare Pages の設定

詳細は [Cloudflare Secrets 設定手順](cloudflare-secrets-setup.md) を参照。

```
1. Cloudflare Dashboard にアクセス
2. Pages プロジェクトの Settings → Environment variables
3. 以下を設定:
   - GAS_BASE_URL: https://script.google.com/macros/s/.../exec
   - GAS_API_KEY: (GAS 側で設定したものと同じ)
```

### 3. フロントエンドコードの更新

#### 変更前（GitHub Pages + JSONP）

```javascript
// ❌ 旧コード: JSONP で直接アクセス
function callGAS(callback) {
  const script = document.createElement('script');
  script.src = 'https://script.google.com/macros/s/.../exec?action=health&callback=handleResponse';
  document.body.appendChild(script);
}
```

#### 変更後（Cloudflare Pages + JSON）

```javascript
// ✅ 新コード: Proxy 経由で JSON API を呼び出す
async function callGAS() {
  const response = await fetch('/api/gas/health');
  const data = await response.json();
  
  if (data.ok) {
    console.log('Success:', data);
  } else {
    console.error('Error:', data.error);
  }
}
```

### 4. HTML からの script タグ削除

```html
<!-- ❌ 削除: JSONP 用の script タグ -->
<script src="https://script.google.com/macros/s/.../exec?callback=..."></script>

<!-- ✅ 新コード: fetch API で呼び出す -->
<script>
  fetch('/api/gas/health')
    .then(res => res.json())
    .then(data => console.log(data));
</script>
```

## DoD（受け入れ条件）の確認

### ✅ GAS 側

- [x] API キーが未設定の場合、401 相当のエラー（`ok: false, error: "Unauthorized"`）を返す
- [x] API キーが不正な場合、401 相当のエラーを返す
- [x] `callback` パラメータが指定された場合、エラーを返す
- [x] API キーが正しい場合、正常に動作する

### ✅ Cloudflare Functions 側

- [x] `/api/gas/health` が正常に動作する
- [x] GAS からの 401 エラーを適切に処理する（502 Bad Gateway として返す）
- [x] 環境変数が未設定の場合、500 エラーを返す

### ✅ ドキュメント

- [x] GAS README に「直接アクセス禁止」を明記
- [x] 新旧構成の比較表を作成
- [x] 移行手順書を作成
- [x] トラブルシューティング情報を追加

## トラブルシューティング

### "Unauthorized" エラーが出る

**確認事項**:
1. GAS のスクリプトプロパティに `API_KEY` が設定されているか
2. Cloudflare Pages の環境変数 `GAS_API_KEY` が設定されているか
3. 両者が完全に一致しているか（余分な空白や改行がないか）

**解決方法**:
```bash
# API キーを生成
openssl rand -base64 32

# GAS と Cloudflare の両方に同じ値を設定
```

### "JSONP is not supported" エラーが出る

**原因**: コードに `callback` パラメータが残っている

**解決方法**:
1. フロントエンドコードから `callback` パラメータを削除
2. JSONP の script タグを削除
3. fetch API または XMLHttpRequest に変更

### "Configuration error" エラーが出る

**原因**: Cloudflare Pages の環境変数が未設定

**解決方法**:
1. Cloudflare Dashboard → Pages → Settings → Environment variables
2. `GAS_BASE_URL` と `GAS_API_KEY` を設定
3. 再デプロイ

## 参考リンク

- [GAS README](../gas/README.md)
- [Cloudflare Secrets 設定手順](cloudflare-secrets-setup.md)
- [GAS Proxy 実装サマリー](gas-proxy-summary.md)
- [Cloudflare Pages セットアップ](cloudflare-pages-setup.md)

## 変更履歴

| 日付 | 変更内容 |
|------|---------|
| 2025-01-12 | GitHub Pages + JSONP 経路の廃止、API キー必須化 |
