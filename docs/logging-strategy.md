# ログ戦略とトラブルシューティング手順

**最終更新**: 2026年1月14日

## 目的

システム障害発生時に、問題箇所を **10分以内** に切り分けられるようにする。

## 受け入れ条件（Definition of Done）

- ✅ 失敗が "Cloudflare / GAS / Spreadsheet / LINE 側" のどれに近いか当たりが付く
- ✅ 最低 1 箇所に "リクエストの痕跡" が残る
- ✅ 個人情報を過剰に残さないルールが明確

---

## アーキテクチャとログの記録場所

```
┌──────────────┐
│  LINE        │ ← LINE 側のログは LINE Developers Console で確認
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────────┐
│  Cloudflare Pages                    │
│  - LIFF (静的 HTML/JS)               │ ← ブラウザコンソールで確認
│  - Pages Functions (API Proxy)       │ ← Cloudflare Dashboard でログ確認
└───────────────┬───────────────────────┘
                │
                ↓
┌──────────────────────────────────────┐
│  Google Apps Script (Web App)        │ ← Apps Script 実行ログで確認
└───────────────┬───────────────────────┘
                │
                ↓
┌──────────────────────────────────────┐
│  Google Spreadsheet                  │
│  - Logs タブ（構造化ログ）           │ ← Spreadsheet の Logs タブで確認
└──────────────────────────────────────┘
```

---

## ログ記録方針

### 原則

1. **各層で独立してログを記録する**
   - Cloudflare Functions: Cloudflare のログシステムに記録
   - GAS: Spreadsheet の Logs タブに記録
   - LIFF: ブラウザのコンソールに記録（本番では最小限）

2. **リクエストの痕跡を最低 1 箇所に残す**
   - 各リクエストは GAS の Logs タブに必ず記録される
   - Cloudflare Functions のエラーは Cloudflare のログに記録される

3. **エラー発生時は詳細を記録する**
   - エラーメッセージ、スタックトレース、関連パラメータ
   - ただし、個人情報は除外する（後述のルール参照）

### 各層のログ記録内容

#### 1. Cloudflare Pages Functions

**記録場所**: Cloudflare Dashboard → Pages → プロジェクト → Functions logs

**記録内容**:
- リクエストの成功/失敗
- GAS への通信エラー
- タイムアウトエラー
- 認証エラー（API キー関連）

**記録方法**:
- `console.log()`, `console.error()` を使用
- Cloudflare が自動的に収集

**現状**: 上記の項目を含む詳細なログ出力とエラーハンドリングを実装済み。

#### 2. Google Apps Script (GAS)

**記録場所**:
1. Apps Script エディタ → 実行ログ（一時的）
2. Spreadsheet → Logs タブ（永続的）

**記録内容**:
- すべての HTTP リクエスト（GET, POST）
- API 呼び出しの成功/失敗
- エラー詳細（例外メッセージ、スタックトレース）
- 重要な処理の開始/完了

**記録方法**:
- `logToSheet(level, source, message, details)` 関数を使用
- レベル: `INFO`, `WARN`, `ERROR`

**記録フォーマット**:
```
logId       | timestamp           | level | source            | message                  | details
log_001     | 2025-12-28 12:00:00 | INFO  | handleHealthCheck | ヘルスチェック実行       | {}
log_002     | 2025-12-28 12:05:00 | ERROR | doPost            | リクエスト処理エラー     | {"error": "...", "stack": "..."}
```

**現状**: 完全実装済み。すべてのリクエストで自動記録。

#### 3. LIFF (フロントエンド)

**記録場所**: ブラウザの開発者ツール → Console

**記録内容**:
- LIFF 初期化の成功/失敗
- API 呼び出しの成功/失敗
- ユーザー操作のエラー

**記録方法**:
- `console.log()`, `console.error()` を使用
- 本番環境では最小限に抑える

**現状**: 基本的なデバッグログのみ実装済み。

---

## 個人情報保護ルール（3 行）

1. **ログに記録しない情報**: LINE userId, displayName, email, 電話番号などの個人識別情報は、エラーログに含めない
2. **記録する情報**: リクエストの種類、エラーの種類、タイムスタンプ、失敗した処理の名前など、障害の特定に必要な情報のみ
3. **保存期間**: Logs タブのデータは 1 年度分のみ保持し、年度終了後は削除する（個人情報がない場合でも、データ量管理のため）

### 補足: 記録可能な情報の例

- ✅ `surveyId`, `surveyDateId` などのビジネス ID
- ✅ リクエストの action パラメータ（`health`, `getSurveys` など）
- ✅ エラーメッセージとスタックトレース
- ✅ HTTP ステータスコード
- ✅ タイムスタンプ
- ❌ `userId` (LINE ユーザー ID)
- ❌ `displayName` (ユーザー表示名)
- ❌ `email`, `phoneNumber` などの個人情報

**注意**: 将来的に認証情報（ID トークン）を扱う場合は、トークン自体をログに記録しないこと。

---

## トラブルシューティング手順（10分以内）

障害発生時に、以下の手順で問題箇所を特定します。

### ステップ 1: 症状の確認（1分）

**質問**:
- 何が起きているか？（エラーメッセージ、画面が表示されない、など）
- いつから起きているか？（特定の時刻、特定の操作後、など）
- 誰に起きているか？（すべてのユーザー、特定のユーザーのみ、など）

**ヒント**:
- LINE トーク画面でエラーメッセージが表示されている場合は、スクリーンショットを保存
- ブラウザで開いている場合は、開発者ツールのコンソールを確認

### ステップ 2: LIFF 側のエラー確認（2分）

**目的**: フロントエンド（LIFF アプリ）でエラーが発生しているか確認

**手順**:
1. LINE アプリでミニアプリを開く
2. ブラウザで同じ URL を開く（デバッグしやすいため）
3. ブラウザの開発者ツールを開く（F12 キー）
4. Console タブを確認

**確認ポイント**:
- `[ERROR]` が表示されているか？
  - Yes → エラーメッセージから問題を特定
    - 例: `LIFF init failed` → LIFF ID の設定ミス（LINE 側）
    - 例: `Failed to fetch /api/config` → Cloudflare 側の問題
- LIFF が初期化されているか？
  - `liff.init() が成功しました` が表示されているか？
  - No → LINE Developers Console で LIFF ID を確認

**判定**:
- エラーが見つかった場合 → 原因に応じて次のステップへ
- エラーがない場合 → ステップ 3 へ

### ステップ 3: Cloudflare 側のログ確認（3分）

**目的**: Cloudflare Pages Functions でエラーが発生しているか確認

**手順**:
1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. Pages → `yomikikase-planner` プロジェクトを選択
3. **Functions** タブをクリック
4. **Real-time logs** セクションで最新のログを確認

**確認ポイント**:
- `/api/gas/health` へのリクエストが成功しているか？
  - Status Code が `200` か？
  - No → エラー内容を確認
    - `502 Bad Gateway` → GAS との通信に失敗（ステップ 4 へ）
    - `500 Internal Server Error` → Cloudflare の環境変数が未設定
      - `GAS_BASE_URL is not configured` → 環境変数を設定
      - `GAS_API_KEY is not configured` → 環境変数を設定
- `/api/config` へのリクエストが成功しているか？
  - `LIFF_ID` が正しく返されているか？
  - No → Cloudflare の環境変数 `LIFF_ID` を確認

**判定**:
- Cloudflare でエラーが見つかった場合 → エラー内容に応じて対処
  - 環境変数の問題 → [Cloudflare Secrets 設定手順](cloudflare-secrets-setup.md) を参照
  - GAS との通信エラー → ステップ 4 へ
- Cloudflare でエラーがない場合 → ステップ 4 へ

### ステップ 4: GAS 側のログ確認（3分）

**目的**: Google Apps Script でエラーが発生しているか確認

**手順（方法 1: Spreadsheet の Logs タブ）**:
1. Google Spreadsheet を開く
2. **Logs** タブを選択
3. 最新のログエントリを確認（timestamp 列で並び替え）

**確認ポイント**:
- 最新のリクエストが記録されているか？
  - Yes → level が `ERROR` のエントリを探す
    - エラーメッセージと details 列を確認
  - No → GAS にリクエストが届いていない（Cloudflare の問題、またはネットワークの問題）
- `handleHealthCheck` のログが記録されているか？
  - Yes → GAS は正常に動作している
  - No → GAS のデプロイに問題がある可能性

**手順（方法 2: Apps Script エディタの実行ログ）**:
1. Google Apps Script エディタを開く
2. 左メニューの「実行数」をクリック
3. 最新の実行を確認

**確認ポイント**:
- `doGet` または `doPost` が実行されているか？
- エラーが発生しているか？
  - エラーメッセージを確認
  - スタックトレースから問題箇所を特定

**判定**:
- GAS でエラーが見つかった場合 → エラー内容に応じて対処
  - `Unauthorized` → API キーが一致していない（Cloudflare と GAS の設定を確認）
  - `Spreadsheet not found` → Spreadsheet の権限または GAS のバインディングを確認
  - その他のエラー → エラーメッセージとスタックトレースから対処
- GAS でエラーがない場合 → ステップ 5 へ

### ステップ 5: LINE 側の設定確認（1分）

**目的**: LINE Developers Console の設定が正しいか確認

**手順**:
1. [LINE Developers Console](https://developers.line.biz/console/) にログイン
2. LINE ミニアプリチャネルを選択
3. **Developing** タブ → **Basic settings** を確認

**確認ポイント**:
- **LIFF ID** が正しいか？
  - Cloudflare の環境変数 `LIFF_ID` と一致しているか？
- **Endpoint URL** が正しいか？
  - Cloudflare Pages の URL が設定されているか？
  - 例: `https://yomikikase-planner.pages.dev`
- LIFF アプリのステータスが「公開」になっているか？

**判定**:
- LINE の設定に問題がある場合 → 設定を修正
- LINE の設定に問題がない場合 → ステップ 6 へ

### ステップ 6: 問題の特定とエスカレーション（残り時間）

ここまでの手順で問題が特定できない場合:

1. **再現手順を明確にする**
   - 問題が発生する具体的な操作手順
   - 発生頻度（常に / 時々 / 稀に）

2. **収集した情報をまとめる**
   - LIFF のコンソールログ（スクリーンショット）
   - Cloudflare のログ（関連するエントリをコピー）
   - GAS の Logs タブのエントリ（該当する行）
   - LINE Developers Console の設定（スクリーンショット）

3. **問題を報告する**
   - GitHub Issue を作成
   - 収集した情報を添付

---

## よくある問題と解決方法

### 1. 「動かない」「画面が表示されない」

**症状**: LINE ミニアプリを開いても何も表示されない

**原因と対処**:
1. **LIFF ID が未設定または間違っている**
   - Cloudflare の環境変数 `LIFF_ID` を確認
   - LINE Developers Console で LIFF ID を確認
   - 両者が一致しているか確認

2. **Cloudflare Pages がデプロイされていない**
   - Cloudflare Dashboard でデプロイ状況を確認
   - 最新のコミットがデプロイされているか確認

3. **LINE の Endpoint URL が間違っている**
   - LINE Developers Console で Endpoint URL を確認
   - Cloudflare Pages の URL と一致しているか確認

### 2. ヘルスチェックが失敗する

**症状**: `/api/gas/health` が `502 Bad Gateway` を返す

**原因と対処**:
1. **GAS の API キーが一致していない**
   - Cloudflare の環境変数 `GAS_API_KEY` を確認
   - GAS のスクリプトプロパティ `API_KEY` を確認
   - 両者が一致しているか確認

2. **GAS のデプロイ URL が間違っている**
   - Cloudflare の環境変数 `GAS_BASE_URL` を確認
   - GAS のデプロイ URL と一致しているか確認

3. **GAS がタイムアウトしている**
   - GAS の実行ログを確認
   - Spreadsheet へのアクセスが遅い可能性
   - ログの記録を一時的に無効化して再試行

### 3. ログが記録されない

**症状**: GAS の Logs タブにログが記録されない

**原因と対処**:
1. **Logs シートが存在しない**
   - Spreadsheet に `Logs` タブを手動作成
   - ヘッダー行を追加: `logId, timestamp, level, source, message, details`

2. **GAS に Spreadsheet へのアクセス権限がない**
   - GAS エディタで `testHealthCheck()` を実行
   - 権限承認ダイアログが表示されたら承認

3. **LockService がタイムアウトしている**
   - 同時アクセスが多い場合に発生
   - GAS の実行ログで `LockTimeoutError` を確認
   - 一時的な問題であれば、時間をおいて再試行

### 4. 認証エラー（Unauthorized）

**症状**: API が `Unauthorized` エラーを返す

**原因と対処**:
1. **API キーが未設定**
   - GAS のスクリプトプロパティ `API_KEY` を確認
   - 未設定の場合は、[セットアップ手順書](setup.md) を参照して設定

2. **API キーが一致していない**
   - Cloudflare の `GAS_API_KEY` と GAS の `API_KEY` を比較
   - 不一致の場合は、どちらかを修正

3. **JSONP でアクセスしている**
   - `callback` パラメータを含むリクエストは拒否される
   - Cloudflare Functions 経由でアクセスすること

---

## Cloudflare ログの確認方法（詳細）

### リアルタイムログの確認

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. **Pages** → プロジェクト（`yomikikase-planner`）を選択
3. **Functions** タブをクリック
4. **Real-time logs** セクションを確認

**表示内容**:
- タイムスタンプ
- リクエスト URL
- HTTP メソッド
- ステータスコード
- レスポンス時間
- エラーメッセージ（ある場合）

**フィルタリング**:
- 特定のエンドポイントのみ表示（例: `/api/gas/health`）
- 特定のステータスコードのみ表示（例: `500` 以上）

### ログの保存期間

- **リアルタイムログ**: 直近 24 時間のログが表示される
- **長期保存**: Cloudflare の有料プラン（Workers Logs）が必要

**個人運用での対応**:
- 障害発生時は直ちにログを確認し、スクリーンショットを保存
- 重要なエラーログは手動でコピーして保存

### ログの追加（将来対応）

現在、Cloudflare Functions では基本的なエラーハンドリングのみ実装されています。
将来的に、より詳細なログを記録するには、`console.log()` を追加します。

**例**:
```javascript
export async function onRequestGet({ request, env }) {
  console.log('Request received:', request.url);
  
  try {
    // ... 処理 ...
    console.log('Request succeeded');
    return jsonResponse(data);
  } catch (error) {
    console.error('Request failed:', error.message);
    return jsonResponse({ ok: false, error: error.message }, 500);
  }
}
```

---

## GAS ログの確認方法（詳細）

### Spreadsheet の Logs タブでの確認

**手順**:
1. Google Spreadsheet を開く
2. **Logs** タブを選択
3. データを確認

**フィルタリング**:
- **level 列**でフィルタ（`ERROR` のみ表示）
- **timestamp 列**で並び替え（最新順）
- **source 列**でフィルタ（特定の関数のみ表示）

**検索**:
- Ctrl+F（またはCmd+F）でキーワード検索
- 例: エラーメッセージの一部を検索

### Apps Script エディタでの確認

**手順**:
1. Google Apps Script エディタを開く
2. 左メニューの **実行数** をクリック
3. 最新の実行を確認

**表示内容**:
- 実行開始時刻
- 実行時間
- ステータス（成功 / 失敗）
- ログ出力（`Logger.log()` の内容）

**利点**:
- リアルタイムに近い情報が取得できる
- スタックトレースが詳細に表示される

**欠点**:
- 保存期間が短い（数日程度）
- 検索機能が弱い

### ログのクリア（テスト時）

**手順**:
1. Apps Script エディタを開く
2. `clearLogsSheet()` 関数を実行

**注意**:
- すべてのログが削除される（元に戻せない）
- 本番環境では慎重に使用すること

---

## まとめ

### ログ記録の階層

| 階層 | 記録場所 | 記録内容 | 保存期間 | 主な用途 |
|------|---------|---------|---------|---------|
| **LIFF** | ブラウザコンソール | 初期化エラー、API エラー | セッション中のみ | フロントエンドのデバッグ |
| **Cloudflare Functions** | Cloudflare Dashboard | リクエスト、エラー、タイムアウト | 24時間 | API プロキシ層のデバッグ |
| **GAS** | Apps Script 実行ログ | リクエスト、エラー、スタックトレース | 数日 | リアルタイムデバッグ |
| **Spreadsheet Logs** | Logs タブ | すべてのリクエスト、エラー詳細 | 手動削除まで | 長期的な障害追跡 |

### 障害切り分けの流れ

1. **LIFF のコンソール** → フロントエンドエラーか？
2. **Cloudflare のログ** → Cloudflare 層のエラーか？
3. **GAS のログ** → バックエンドエラーか？
4. **LINE の設定** → LINE 側の設定ミスか？

### 10分以内に切り分けるためのポイント

- ✅ 各層のログ確認方法を事前に把握しておく
- ✅ エラーメッセージから原因を推測する
- ✅ よくある問題を知っておく
- ✅ 再現手順を明確にする

---

## 参考ドキュメント

- [セットアップ手順書](setup.md) - GAS と Spreadsheet の初期設定
- [Cloudflare Pages セットアップ手順](cloudflare-pages-setup.md) - Cloudflare のセットアップ
- [Cloudflare Secrets 設定手順](cloudflare-secrets-setup.md) - 環境変数の設定
- [ADR-001: Cloudflare Pages + Functions 採用](adr/001-adopt-cloudflare-pages-functions.md) - アーキテクチャの決定記録
- [Spreadsheet スキーマ定義](sheets-schema.md) - Logs タブの仕様
