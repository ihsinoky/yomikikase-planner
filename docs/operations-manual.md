# 運用マニュアル

## 概要

yomikikase-planner（読み聞かせプランナー）の日常運用手順をまとめたマニュアルです。
管理者が年間を通して行う作業を、時系列に沿って説明します。

## 年間運用フロー

```
4月  新年度準備（アンケート作成・ユーザー登録案内）
     ↓
5〜2月  通常運用（アンケート配信・回答集計・日程確定・絵本登録）
     ↓
3月  年度末処理（データエクスポート・引き継ぎ準備）
     ↓
4月  旧年度データの削除（翌年度以降）
```

## 通常運用

### アンケートの作成

1. Google Spreadsheet の **Surveys** タブにアンケートを追加
   - `surveyId`: `survey_001` 形式で連番
   - `fiscalYear`: 年度（例: `2025`）
   - `title`, `description`: アンケートのタイトルと説明
   - `isActive`: `FALSE`（あとで切り替え）
2. **SurveyDates** タブに候補日を追加
   - `surveyDateId`: `date_001` 形式で連番
   - `surveyId`: 対応するアンケート ID
   - `dateTime`: 候補日（YYYY-MM-DD）
   - `targetGrade`: 対象学年

### アンケートの配信

アクティブなアンケートを切り替えます:

```bash
curl -X POST https://yomikikase-planner.pages.dev/api/admin/surveys/activate \
  -H "Authorization: Bearer {ADMIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"surveyId": "survey_001"}'
```

LINE グループに LIFF の URL を共有してください:
```
https://liff.line.me/{YOUR_LIFF_ID}
```

### 回答の確認

**Spreadsheet で直接確認:**
- Responses タブを開いてフィルタ

**API 経由で確認:**
```bash
# 一覧取得
curl https://yomikikase-planner.pages.dev/api/admin/responses?surveyId=survey_001 \
  -H "Authorization: Bearer {ADMIN_API_KEY}"

# CSV エクスポート
curl https://yomikikase-planner.pages.dev/api/admin/responses/csv?surveyId=survey_001 \
  -H "Authorization: Bearer {ADMIN_API_KEY}" \
  -o responses.csv
```

### 日程の確定

```bash
curl -X POST https://yomikikase-planner.pages.dev/api/admin/events/register \
  -H "Authorization: Bearer {ADMIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "fiscalYear": "2025",
    "eventDate": "2025-06-15",
    "targetGrade": "年長"
  }'
```

### 参加者の追加

```bash
curl -X POST https://yomikikase-planner.pages.dev/api/admin/events/participants/add \
  -H "Authorization: Bearer {ADMIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt_001",
    "lineUserIds": ["U1234...", "U5678..."]
  }'
```

### 絵本の登録

```bash
# ISBN で書誌情報を検索
curl https://yomikikase-planner.pages.dev/api/admin/books/isbn/9784834000825 \
  -H "Authorization: Bearer {ADMIN_API_KEY}"

# 絵本を登録
curl -X POST https://yomikikase-planner.pages.dev/api/admin/books/register \
  -H "Authorization: Bearer {ADMIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "isbn": "9784834000825",
    "title": "ぐりとぐら",
    "author": "中川李枝子",
    "publisher": "福音館書店"
  }'
```

### 読み聞かせ記録の登録

```bash
curl -X POST https://yomikikase-planner.pages.dev/api/admin/reading-records/register \
  -H "Authorization: Bearer {ADMIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": "book_001",
    "readDate": "2025-06-15",
    "fiscalYear": "2025",
    "targetGrade": "年長"
  }'
```

## 年度末の作業

### 1. 新年度のアンケート準備

1. Surveys タブに新年度のアンケートを作成
2. SurveyDates タブに候補日を追加
3. `activeSurveyId` を新年度のアンケートに切り替え

### 2. データのバックアップ

旧年度のデータをエクスポートします:

```bash
curl https://yomikikase-planner.pages.dev/api/admin/fiscal-year/export?fiscalYear=2025 \
  -H "Authorization: Bearer {ADMIN_API_KEY}" \
  -o fiscal-year-2025-backup.json
```

エクスポートされる内容:
- アンケート定義・候補日
- 回答データ
- ユーザー情報
- 確定日程・参加者
- 読み聞かせ記録

### 3. 旧年度データの削除

**注意:** 削除は取り消せません。必ず先にバックアップを取ってください。

```bash
curl -X POST https://yomikikase-planner.pages.dev/api/admin/fiscal-year/delete \
  -H "Authorization: Bearer {ADMIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "fiscalYear": "2025",
    "confirm": true
  }'
```

削除対象外: 絵本マスタ（Books）は年度に紐付かないので残ります。

詳細は [データ削除ポリシー](data-deletion-policy.md) を参照してください。

## API 一覧（クイックリファレンス）

### 参照系（GET）

| エンドポイント | 説明 |
|--------------|------|
| `/api/admin/surveys` | アンケート一覧 |
| `/api/admin/responses?surveyId=` | 回答一覧 |
| `/api/admin/responses/csv?surveyId=` | 回答 CSV エクスポート |
| `/api/admin/events?fiscalYear=` | 確定日程一覧 |
| `/api/admin/users?fiscalYear=` | ユーザー一覧 |
| `/api/admin/books` | 絵本一覧 |
| `/api/admin/books/isbn/{isbn}` | ISBN で書誌情報検索 |
| `/api/admin/books/{bookId}/history` | 絵本の読み聞かせ履歴 |
| `/api/admin/reading-records?fiscalYear=` | 読み聞かせ記録一覧 |
| `/api/admin/fiscal-year/export?fiscalYear=` | 年度データエクスポート |

### 更新系（POST）

| エンドポイント | 説明 |
|--------------|------|
| `/api/admin/surveys/activate` | アクティブアンケート切替 |
| `/api/admin/events/register` | 確定日程登録 |
| `/api/admin/events/participants/add` | 参加者追加 |
| `/api/admin/events/participants/remove` | 参加者削除 |
| `/api/admin/books/register` | 絵本登録 |
| `/api/admin/reading-records/register` | 読み聞かせ記録登録 |
| `/api/admin/fiscal-year/delete` | 年度データ削除 |

### 認証

すべての管理 API は `Authorization: Bearer {ADMIN_API_KEY}` ヘッダーが必要です。

## トラブルシューティング

### API がエラーを返す場合

1. Cloudflare Pages のデプロイが正常か確認
2. GAS のデプロイが有効か確認（Apps Script → デプロイ → デプロイを管理）
3. Cloudflare シークレットが正しいか確認（`GAS_BASE_URL`, `GAS_API_KEY`）
4. Spreadsheet の Logs タブでエラーログを確認

### LIFF が開かない場合

1. LINE Developers Console で LIFF の設定を確認
2. エンドポイント URL が `https://yomikikase-planner.pages.dev/liff/` であることを確認
3. LINE Login チャネルが公開済みであることを確認

### GAS を再デプロイした場合

1. 新しいデプロイ URL を取得
2. Cloudflare の `GAS_BASE_URL` シークレットを更新:
   ```bash
   npx wrangler pages secret put GAS_BASE_URL --project-name yomikikase-planner
   ```
3. 値として新しい GAS Web App URL（`https://script.google.com/macros/s/.../exec`）を入力

## 関連ドキュメント

- [セットアップ手順書](setup.md)
- [Cloudflare クイックスタート](cloudflare-quickstart.md)
- [データ削除ポリシー](data-deletion-policy.md)
- [管理者引き継ぎガイド](admin-handover.md)
- [スプレッドシートスキーマ定義](sheets-schema.md)
