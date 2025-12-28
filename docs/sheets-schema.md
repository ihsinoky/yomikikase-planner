# Google Spreadsheet スキーマ定義

このドキュメントは、yomikikase-planner で使用する Google Spreadsheet のデータ構造を定義します。

## 概要

データの正（Source of Truth）は Google Spreadsheet に置きます。
- Google Apps Script（GAS）がこのシートを読み書きし、LIFF へデータを配信します
- 管理者は Spreadsheet を直接編集してアンケートや設定を管理します
- スプリント2以降、GASは「列を読む/書く」だけの実装で進められます

## タブ構成

以下の6つのタブで構成します：

1. **Config** - システム設定
2. **Surveys** - アンケート本体
3. **SurveyDates** - アンケートの開催候補日
4. **Users** - LINE ユーザー情報と園児情報
5. **Responses** - アンケート回答
6. **Logs** - 実行ログ（エラー追跡用）

---

## 1. Config タブ

システム全体の設定を保持します。

### 列定義

| 列名 | データ型 | 必須 | 説明 | 例 |
|------|---------|------|------|-----|
| key | string | ✓ | 設定キー | `activeSurveyId` |
| value | string | ✓ | 設定値 | `survey_001` |
| description | string | | 設定の説明 | `現在アクティブなアンケートID` |
| updatedAt | datetime | | 最終更新日時 | `2025-12-28 10:00:00` |

### 想定される設定キー

- `activeSurveyId`: 現在アクティブなアンケートのID（LIFFで表示するアンケート）
- `liffId`: LINE LIFF アプリケーションID（任意）
- `appVersion`: アプリケーションバージョン（任意）

### サンプルデータ

```csv
key,value,description,updatedAt
activeSurveyId,survey_001,現在アクティブなアンケートID,2025-12-28 10:00:00
liffId,1234567890-abcdefgh,LIFF アプリケーションID,2025-12-28 10:00:00
appVersion,1.0.0,アプリケーションバージョン,2025-12-28 10:00:00
```

---

## 2. Surveys タブ

アンケート本体の情報を保持します。

### 列定義

| 列名 | データ型 | 必須 | 説明 | 例 |
|------|---------|------|------|-----|
| surveyId | string | ✓ | アンケート一意ID | `survey_001` |
| fiscalYear | string | ✓ | 年度 | `2025` |
| title | string | ✓ | アンケートタイトル | `1月の読み聞かせ参加希望調査` |
| description | string | | アンケート説明文 | `1月の読み聞かせ活動について...` |
| status | string | ✓ | ステータス | `active`, `closed`, `draft` |
| createdAt | datetime | ✓ | 作成日時 | `2025-12-28 10:00:00` |
| updatedAt | datetime | | 最終更新日時 | `2025-12-28 10:00:00` |

### ステータス値

- `draft`: 下書き（LIFF非表示）
- `active`: 公開中（LIFF表示）
- `closed`: 受付終了

### サンプルデータ

```csv
surveyId,fiscalYear,title,description,status,createdAt,updatedAt
survey_001,2025,1月の読み聞かせ参加希望調査,1月の読み聞かせ活動について、参加可能な日程をお知らせください。各日程で年少・年中・年長のいずれかの学年が対象となります。,active,2025-12-28 10:00:00,2025-12-28 10:00:00
survey_002,2025,2月の読み聞かせ参加希望調査,2月の読み聞かせ活動の参加希望調査です。,draft,2025-12-28 11:00:00,2025-12-28 11:00:00
```

---

## 3. SurveyDates タブ

各アンケートの開催候補日を保持します。1つのアンケートに複数の候補日が紐付きます。

### 列定義

| 列名 | データ型 | 必須 | 説明 | 例 |
|------|---------|------|------|-----|
| surveyDateId | string | ✓ | 候補日一意ID | `date_001` |
| surveyId | string | ✓ | アンケートID（外部キー） | `survey_001` |
| dateTime | datetime | ✓ | 開催候補日時 | `2025-01-15 10:00:00` |
| targetGrade | string | ✓ | 対象学年 | `年少`, `年中`, `年長` |
| label | string | | 候補日のラベル | `1月15日(水) 10:00〜 年少` |
| sortOrder | number | | 表示順序 | `1` |
| notes | string | | 備考 | `園庭使用予定のため室内` |

### targetGrade 許可値

- `年少`
- `年中`
- `年長`
- `全学年`（任意）

### サンプルデータ

```csv
surveyDateId,surveyId,dateTime,targetGrade,label,sortOrder,notes
date_001,survey_001,2025-01-15 10:00:00,年少,1月15日(水) 10:00〜 年少,1,
date_002,survey_001,2025-01-16 10:00:00,年中,1月16日(木) 10:00〜 年中,2,
date_003,survey_001,2025-01-17 10:00:00,年長,1月17日(金) 10:00〜 年長,3,
date_004,survey_001,2025-01-22 10:00:00,年少,1月22日(水) 10:00〜 年少,4,園庭使用予定のため室内
```

---

## 4. Users タブ

LINE ユーザー情報と園児情報を保持します。

### 列定義

| 列名 | データ型 | 必須 | 説明 | 例 |
|------|---------|------|------|-----|
| lineUserId | string | ✓ | LINE ユーザーID（一意） | `U1234567890abcdef` |
| displayName | string | | LINE表示名（任意） | `山田 花子` |
| childName | string | ✓ | 園児名 | `山田 太郎` |
| grade | string | ✓ | 学年 | `年少`, `年中`, `年長` |
| class | string | ✓ | クラス | `さくら組`, `ばら組` |
| fiscalYear | string | ✓ | 年度 | `2025` |
| createdAt | datetime | ✓ | 登録日時 | `2025-12-28 10:00:00` |
| updatedAt | datetime | | 最終更新日時 | `2025-12-28 10:00:00` |

### grade 許可値

- `年少`
- `年中`
- `年長`

### サンプルデータ

```csv
lineUserId,displayName,childName,grade,class,fiscalYear,createdAt,updatedAt
U1234567890abcdef,山田 花子,山田 太郎,年少,さくら組,2025,2025-12-28 10:00:00,2025-12-28 10:00:00
U2345678901bcdefg,佐藤 次郎,佐藤 花子,年中,ばら組,2025,2025-12-28 10:05:00,2025-12-28 10:05:00
U3456789012cdefgh,鈴木 三郎,鈴木 一郎,年長,ひまわり組,2025,2025-12-28 10:10:00,2025-12-28 10:10:00
```

---

## 5. Responses タブ

アンケートへの回答を保持します。1行が1つの候補日への1回答を表します。

**注意**: 保護者はボランティアとして参加するため、自分の子どもの学年に関係なく、任意の候補日に回答できます。ただし、通常は自分の子どもの学年の候補日に優先的に回答する傾向があります。

### 列定義

| 列名 | データ型 | 必須 | 説明 | 例 |
|------|---------|------|------|-----|
| responseId | string | ✓ | 回答一意ID | `res_001` |
| surveyId | string | ✓ | アンケートID（外部キー） | `survey_001` |
| surveyDateId | string | ✓ | 候補日ID（外部キー） | `date_001` |
| lineUserId | string | ✓ | 回答者のLINE ユーザーID | `U1234567890abcdef` |
| answer | string | ✓ | 回答 | `可`, `不可`, `未定` |
| submittedAt | datetime | ✓ | 回答日時 | `2025-12-28 12:00:00` |
| notes | string | | 備考・コメント | `午後から参加可能` |

### answer 許可値

- `可`: 参加可能
- `不可`: 参加不可
- `未定`: 未定・わからない

### サンプルデータ

```csv
responseId,surveyId,surveyDateId,lineUserId,answer,submittedAt,notes
res_001,survey_001,date_001,U1234567890abcdef,可,2025-12-28 12:00:00,
res_002,survey_001,date_004,U1234567890abcdef,不可,2025-12-28 12:00:00,用事があり参加できません
res_003,survey_001,date_002,U2345678901bcdefg,可,2025-12-28 12:05:00,
res_004,survey_001,date_003,U3456789012cdefgh,可,2025-12-28 12:10:00,
res_005,survey_001,date_002,U3456789012cdefgh,未定,2025-12-28 12:10:00,年中の日程は未定
```

---

## 6. Logs タブ

GAS実行時のログ、特にエラー情報を記録します。

### 列定義

| 列名 | データ型 | 必須 | 説明 | 例 |
|------|---------|------|------|-----|
| logId | string | ✓ | ログ一意ID | `log_001` |
| timestamp | datetime | ✓ | ログ記録日時 | `2025-12-28 12:00:00` |
| level | string | ✓ | ログレベル | `INFO`, `WARN`, `ERROR` |
| source | string | ✓ | ログ発生元 | `doPost`, `getSurveys`, `saveResponse` |
| message | string | ✓ | ログメッセージ | `回答を保存しました` |
| details | string | | 詳細情報（JSON等） | `{"userId":"U123...","surveyId":"survey_001"}` |

### level 許可値

- `INFO`: 情報
- `WARN`: 警告
- `ERROR`: エラー

### サンプルデータ

```csv
logId,timestamp,level,source,message,details
log_001,2025-12-28 12:00:00,INFO,doPost,回答を正常に保存しました,"{""userId"":""U1234567890abcdef"",""surveyId"":""survey_001""}"
log_002,2025-12-28 12:05:00,ERROR,saveResponse,回答の保存に失敗しました,"{""error"":""surveyDateId not found"",""surveyDateId"":""invalid_id""}"
log_003,2025-12-28 12:10:00,WARN,doGet,未認証のアクセス試行,"{""ip"":""192.168.1.1""}"
```

---

## データ関連図（テキスト版）

```
Config
  - システム設定（Key-Value形式）

Surveys (1) ←―→ (N) SurveyDates
  - 1つのアンケートに複数の候補日

Users (1) ←―→ (N) Responses
  - 1人のユーザーが複数の回答

Surveys (1) ←―→ (N) Responses
  - 1つのアンケートに複数の回答

SurveyDates (1) ←―→ (N) Responses
  - 1つの候補日に複数の回答

Logs
  - 独立したログテーブル
```

---

## 運用ガイドライン

### ID生成ルール

- `surveyId`: `survey_` + 3桁連番（例: `survey_001`, `survey_002`）
- `surveyDateId`: `date_` + 3桁連番（例: `date_001`）
- `responseId`: `res_` + 3桁連番（例: `res_001`）
- `logId`: `log_` + 3桁連番（例: `log_001`）

GAS実装時は、最終行のIDを取得して自動採番することを推奨します。

### データ入力の注意点

1. **必須項目は必ず入力する**
   - 空白のままだとGASでエラーになる可能性があります

2. **日時フォーマット**
   - `yyyy-MM-dd HH:mm:ss` 形式（例: `2025-12-28 10:00:00`）
   - Spreadsheet の日時型として認識されるようにする

3. **許可値を守る**
   - `status`, `answer`, `level`, `grade` などは定義された値のみ使用

4. **外部キーの整合性**
   - `surveyId`, `surveyDateId`, `lineUserId` は対応するタブに存在する値を使用

### テンプレートからの始め方

1. `sheet-template/` ディレクトリ内の各CSVファイルをインポート
2. Config タブで `activeSurveyId` を設定
3. Surveys タブでアンケートを作成
4. SurveyDates タブで候補日を追加
5. GAS側でシートを読み込んで動作確認

---

## 変更履歴

| 日付 | 変更内容 | 変更者 |
|------|---------|--------|
| 2025-12-28 | 初版作成 | Sprint 1 |

