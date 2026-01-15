# Cloudflare ログ確認手順

**最終更新**: 2026年1月14日

## 目的

Cloudflare Pages Functions のログを確認し、API プロキシ層でのエラーを特定する。

---

## クイックアクセス

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. **Pages** を選択
3. プロジェクト **yomikikase-planner** をクリック
4. **Functions** タブをクリック
5. **Real-time logs** セクションを確認

---

## ログの見方

### リアルタイムログ画面

**表示項目**:
- **Timestamp**: リクエスト受信時刻（UTC）
- **Method**: HTTP メソッド（GET, POST など）
- **URL**: リクエスト URL
- **Status**: HTTP ステータスコード
- **Duration**: 処理時間（ミリ秒）
- **Logs**: `console.log()` の出力

### ログのフィルタリング

**URL でフィルタ**:
- `/api/gas/health` のみ表示
- `/api/config` のみ表示

**ステータスコードでフィルタ**:
- `200` 以外（エラーのみ）
- `500` 以上（サーバーエラーのみ）

---

## ログの読み方

### 正常なヘルスチェック

```
[Cloudflare] Health check request received: { path: '/api/gas/health', timestamp: '...' }
[Cloudflare] Sending request to GAS: { url: 'https://script.google.com/...', action: 'health' }
[Cloudflare] GAS response received: { status: 200, ok: true }
[Cloudflare] Health check succeeded
```

**判定**: ✅ 正常 - Cloudflare → GAS の通信が成功

---

### エラーパターン 1: 環境変数未設定

```
[Cloudflare] Health check request received: { path: '/api/gas/health', timestamp: '...' }
[Cloudflare] GAS_BASE_URL is not configured
```

**原因**: Cloudflare の環境変数 `GAS_BASE_URL` が未設定

**対処**:
1. Cloudflare Dashboard → Pages → yomikikase-planner → Settings → Environment variables
2. `GAS_BASE_URL` を追加
3. 値: GAS のデプロイ URL（例: `https://script.google.com/macros/s/.../exec`）
4. 保存後、再デプロイ

**参考**: [Cloudflare Secrets 設定手順](cloudflare-secrets-setup.md)

---

### エラーパターン 2: API キー認証失敗

```
[Cloudflare] Health check request received: { path: '/api/gas/health', timestamp: '...' }
[Cloudflare] Sending request to GAS: { url: 'https://script.google.com/...', action: 'health' }
[Cloudflare] GAS response received: { status: 200, ok: false }
[Cloudflare] Authentication failed with GAS
```

**原因**: Cloudflare の `GAS_API_KEY` と GAS のスクリプトプロパティ `API_KEY` が一致していない

**対処**:
1. Cloudflare Dashboard で `GAS_API_KEY` を確認
2. GAS エディタ → プロジェクトの設定 → スクリプトプロパティで `API_KEY` を確認
3. 不一致の場合、どちらかを修正
   - 推奨: GAS 側を Cloudflare に合わせる

**注意**: API キーを変更した場合、GAS を再デプロイする必要はありません（スクリプトプロパティはデプロイとは独立）。

---

### エラーパターン 3: GAS タイムアウト

```
[Cloudflare] Health check request received: { path: '/api/gas/health', timestamp: '...' }
[Cloudflare] Sending request to GAS: { url: 'https://script.google.com/...', action: 'health' }
[Cloudflare] GAS request timeout after 10s
```

**原因**: GAS が 10 秒以内に応答しない

**考えられる理由**:
- GAS が過負荷状態
- Spreadsheet へのアクセスが遅い
- LockService で待機している

**対処**:
1. GAS のログ（Spreadsheet の Logs タブ）を確認
2. GAS の実行ログ（Apps Script エディタ）を確認
3. LockService のタイムアウトが発生していないか確認
4. 一時的な問題であれば、時間をおいて再試行

---

### エラーパターン 4: ネットワークエラー

```
[Cloudflare] Health check request received: { path: '/api/gas/health', timestamp: '...' }
[Cloudflare] Sending request to GAS: { url: 'https://script.google.com/...', action: 'health' }
[Cloudflare] Failed to communicate with GAS: { error: 'fetch failed', name: 'TypeError' }
```

**原因**: GAS への接続に失敗

**考えられる理由**:
- GAS の URL が間違っている
- GAS がデプロイされていない
- Google のサービスに障害が発生している

**対処**:
1. `GAS_BASE_URL` が正しいか確認
2. ブラウザで GAS の URL に直接アクセスして確認
3. [Google Workspace ステータスダッシュボード](https://www.google.com/appsstatus/dashboard/) で障害情報を確認

---

## ログの保存期間

**Cloudflare の無料プラン**:
- リアルタイムログ: **直近 24 時間**
- それ以前のログ: 保存されない

**対処**:
- 障害発生時は直ちにログを確認し、スクリーンショットを保存
- 重要なエラーログはテキストファイルにコピーして保存

**長期保存が必要な場合**:
- Cloudflare の有料プラン（Workers Logs）に加入
- または、外部ログサービス（Sentry, Datadog など）を導入

---

## Config エンドポイントのログ

### 正常な Config 取得

```
[Cloudflare] Config request received: { path: '/api/config', timestamp: '...' }
[Cloudflare] Config response: { hasLiffId: true, environment: 'production' }
```

**判定**: ✅ 正常 - LIFF ID が設定されている

---

### 警告: LIFF_ID 未設定

```
[Cloudflare] Config request received: { path: '/api/config', timestamp: '...' }
[Cloudflare] LIFF_ID is not configured
[Cloudflare] Config response: { hasLiffId: false, environment: 'production' }
```

**原因**: Cloudflare の環境変数 `LIFF_ID` が未設定

**影響**: LIFF アプリが初期化できない（`liff.init()` が失敗）

**対処**:
1. LINE Developers Console で LIFF ID を確認
2. Cloudflare Dashboard → Pages → yomikikase-planner → Settings → Environment variables
3. `LIFF_ID` を追加
4. 保存後、再デプロイ

---

## よくある質問

### Q1. ログが表示されない

**A**: リアルタイムログは Functions が実行されたときのみ表示されます。

**確認方法**:
1. ブラウザで `/api/gas/health` にアクセス
2. 数秒待ってログ画面を更新
3. ログが表示されるか確認

---

### Q2. ログに個人情報が含まれているか心配

**A**: 現在の実装では、以下の情報のみがログに記録されます:
- リクエスト URL（パス部分のみ）
- タイムスタンプ
- ステータスコード
- エラーメッセージ

**記録されない情報**:
- LINE userId
- displayName
- 個人を特定できる情報

**注意**: 将来的に機能を追加する際は、[ログ戦略](logging-strategy.md) の個人情報保護ルールに従うこと。

---

### Q3. ログを長期保存したい

**A**: Cloudflare の無料プランでは 24 時間のみ保存されます。

**代替案**:
1. **重要なログを手動保存**: スクリーンショットまたはテキストコピー
2. **GAS のログを活用**: Spreadsheet の Logs タブには長期保存される
3. **外部サービス**: Sentry などのエラートラッキングサービスを導入

---

## トラブルシューティングフロー

```
1. Cloudflare Dashboard にアクセス
   ↓
2. Functions タブ → Real-time logs を確認
   ↓
3. エラーログを探す
   ↓
4. エラーパターンを特定（上記のパターン 1〜4）
   ↓
5. 対処方法に従って修正
   ↓
6. 再度テストして確認
```

---

## 関連ドキュメント

- [ログ戦略とトラブルシューティング手順](logging-strategy.md) - 全体的なログ戦略
- [Cloudflare Secrets 設定手順](cloudflare-secrets-setup.md) - 環境変数の設定方法
- [セットアップ手順書](setup.md) - システム全体のセットアップ
- [ADR-001: Cloudflare Pages + Functions 採用](adr/001-adopt-cloudflare-pages-functions.md) - アーキテクチャの決定記録

---

## まとめ

**Cloudflare のログで確認できること**:
- ✅ API リクエストが Cloudflare に届いているか
- ✅ 環境変数が正しく設定されているか
- ✅ GAS との通信が成功しているか
- ✅ どのようなエラーが発生しているか

**Cloudflare のログで確認できないこと**:
- ❌ GAS 内部の処理詳細（→ GAS のログを確認）
- ❌ Spreadsheet へのアクセス状況（→ GAS のログを確認）
- ❌ LIFF の初期化エラー（→ ブラウザコンソールを確認）

**障害時の優先順位**:
1. **LIFF のコンソール** - フロントエンドエラーを確認
2. **Cloudflare のログ** - API プロキシ層のエラーを確認
3. **GAS のログ** - バックエンドエラーを確認
4. **LINE の設定** - 設定ミスを確認
