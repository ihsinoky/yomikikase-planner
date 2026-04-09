# データ削除ポリシー

## 目的

本ドキュメントは、yomikikase-planner で管理する個人データ・利用データの保存期間と削除方針を定めるものです。

## データ分類と保存方針

### 個人識別データ（年度単位で削除可能）

| データ | 保存場所 | 保存期間 | 削除単位 |
|--------|---------|---------|---------|
| Usersタブ（名前・学年・クラス） | Google Spreadsheet | 当該年度 + 翌年度末まで | 年度 |
| Responsesタブ（アンケート回答） | Google Spreadsheet | 当該年度 + 翌年度末まで | 年度（surveyId 経由） |
| EventParticipantsタブ（参加者記録） | Google Spreadsheet | 当該年度 + 翌年度末まで | 年度（eventId 経由） |

**根拠:** 引き継ぎ期間として翌年度末まで保持し、それ以降は削除する。

### 運営データ（年度単位で削除可能）

| データ | 保存場所 | 保存期間 | 削除単位 |
|--------|---------|---------|---------|
| Surveysタブ（アンケート定義） | Google Spreadsheet | 当該年度 + 翌年度末まで | 年度 |
| SurveyDatesタブ（候補日） | Google Spreadsheet | 当該年度 + 翌年度末まで | 年度（surveyId 経由） |
| ConfirmedEventsタブ（確定日程） | Google Spreadsheet | 当該年度 + 翌年度末まで | 年度 |
| ReadingRecordsタブ（読み聞かせ記録） | Google Spreadsheet | 当該年度 + 翌年度末まで | 年度 |

### 永続データ（削除対象外）

| データ | 保存場所 | 理由 |
|--------|---------|------|
| Booksタブ（絵本マスタ） | Google Spreadsheet | 個人識別情報を含まず、園の共有財産として蓄積する |
| Configタブ（システム設定） | Google Spreadsheet | システム運用に必要 |
| Logsタブ（実行ログ） | Google Spreadsheet | 運用監視用。個人名を含まない。必要に応じて手動で古いログを削除 |

## 削除方針: 完全削除

本システムでは **完全削除** を採用します。匿名化統計は生成しません。

**理由:**
- 小規模運用（数十名）のため、匿名化しても個人の特定リスクが残る
- 運営統計は年度中に必要な範囲で確認すれば十分
- 絵本マスタ（Books）に読み聞かせの知見は蓄積されるため、統計データの長期保存は不要

## 削除手順

### 1. エクスポート（バックアップ）

削除前に必ずデータをエクスポートします。

```
GET /api/admin/fiscal-year/export?fiscalYear=2025
Authorization: Bearer {ADMIN_API_KEY}
```

レスポンスの JSON をファイルとして保存してください。

### 2. 年度データ削除

```
POST /api/admin/fiscal-year/delete
Authorization: Bearer {ADMIN_API_KEY}
Content-Type: application/json

{
  "fiscalYear": "2025",
  "confirm": true
}
```

**削除対象:**
- Surveys（対象年度のアンケート）
- SurveyDates（対象アンケートの候補日）
- Responses（対象アンケートの回答）
- Users（対象年度のユーザー）
- ConfirmedEvents（対象年度の確定日程）
- EventParticipants（対象確定日程の参加者）
- ReadingRecords（対象年度の読み聞かせ記録）

**削除対象外:**
- Books（絵本マスタ）
- Config（システム設定）
- Logs（実行ログ）

### 3. 安全装置

- `confirm: true` を明示しないと削除は実行されません
- 現在アクティブなアンケートを含む年度は削除できません（先に `activeSurveyId` を切り替えてください）
- 削除はロック内で実行され、同時操作による不整合を防止します
- 削除件数が JSON で返却されるため、想定通りに削除されたか確認できます

## 年度末の運用フロー

1. 新年度のアンケートを作成し、`activeSurveyId` を切り替える
2. 翌年度末に、前々年度のデータをエクスポート
3. エクスポートファイルの保存を確認
4. 年度データ削除を実行
5. 削除結果（件数）を確認
