# Google Spreadsheet テンプレート

このディレクトリには、yomikikase-planner で使用する Google Spreadsheet のテンプレートファイル（CSV形式）が含まれています。

## 📁 ファイル一覧

- `Config.csv` - システム設定タブ
- `Surveys.csv` - アンケート本体タブ
- `SurveyDates.csv` - 開催候補日タブ
- `Users.csv` - ユーザー情報タブ
- `Responses.csv` - 回答データタブ
- `Logs.csv` - 実行ログタブ

## 🚀 使い方

### 1. 新しいスプレッドシートを作成

Google Drive で新しいスプレッドシートを作成します。

### 2. CSVファイルをインポート

各CSVファイルを対応するタブとしてインポートします：

1. スプレッドシートで新しいシートを作成
2. シート名を変更（例: `Config`, `Surveys`, `SurveyDates`, ...）
3. `ファイル` > `インポート` > `アップロード` から対応するCSVファイルを選択
4. インポート設定:
   - インポート場所: `現在のシートを置き換える`
   - 区切り文字: `カンマ`
   - データを変換する: チェック（日付などを自動認識）

### 3. データ型の調整

インポート後、以下の列のフォーマットを調整します：

#### Config タブ
- `updatedAt`: 日時型（書式: `yyyy-MM-dd HH:mm:ss`）

#### Surveys タブ
- `createdAt`, `updatedAt`: 日時型（書式: `yyyy-MM-dd HH:mm:ss`）

#### SurveyDates タブ
- `dateTime`: 日時型（書式: `yyyy-MM-dd HH:mm:ss`）
- `sortOrder`: 数値型

#### Users タブ
- `createdAt`, `updatedAt`: 日時型（書式: `yyyy-MM-dd HH:mm:ss`）

#### Responses タブ
- `submittedAt`: 日時型（書式: `yyyy-MM-dd HH:mm:ss`）

#### Logs タブ
- `timestamp`: 日時型（書式: `yyyy-MM-dd HH:mm:ss`）

### 4. シートの順序

推奨するシートの順序（左から）：
1. Config
2. Surveys
3. SurveyDates
4. Users
5. Responses
6. Logs

### 5. サンプルデータの削除（任意）

各CSVファイルにはサンプルデータ（1〜3行）が含まれています。
本番運用前に、サンプルデータを削除して実データを入力してください。

**注意**: ヘッダー行（1行目）は削除しないでください。

## 📋 詳細な仕様

各タブの列定義、データ型、許可値などの詳細は以下を参照してください：

👉 [docs/sheets-schema.md](../docs/sheets-schema.md)

## 🔧 Google Apps Script との連携

Sprint 2 以降で、Google Apps Script（GAS）を実装します。
GASはこのスプレッドシートを読み書きして、以下を実現します：

- LIFF アプリへのアンケートデータ配信
- ユーザーからの回答の保存
- ログの記録

## ⚠️ 注意事項

1. **必須列は削除しない**
   - ヘッダー行の列名を変更・削除すると、GASが動作しなくなります

2. **データ型を守る**
   - 日時は `yyyy-MM-dd HH:mm:ss` 形式
   - 許可値（status, answer, level など）は定義された値のみ

3. **外部キーの整合性**
   - `surveyId`, `surveyDateId`, `lineUserId` は対応するタブに存在する値を参照

4. **バックアップ**
   - 定期的にスプレッドシートのコピーを作成して保存することを推奨

## 💡 運用Tips

### ID の採番

サンプルでは手動で連番を振っていますが、GAS実装時は以下のように自動採番します：

```javascript
function getNextId(sheet, prefix) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return prefix + '_001';
  
  const lastId = sheet.getRange(lastRow, 1).getValue();
  const num = parseInt(lastId.split('_')[1]) + 1;
  return prefix + '_' + String(num).padStart(3, '0');
}
```

### Config タブの設定

- `activeSurveyId`: 現在表示したいアンケートのIDを設定
  - LIFF アプリはこの値を読んで表示するアンケートを決定します
- `liffId`: LINE Developers で発行される LIFF ID を設定

### アンケートの公開

Surveys タブの `status` を変更してアンケートの状態を管理：
- `draft` → 作成中（LIFF非表示）
- `active` → 公開中（LIFF表示）
- `closed` → 受付終了

## 🔗 関連ドキュメント

- [Spreadsheet スキーマ定義](../docs/sheets-schema.md) - 各タブの詳細仕様
- [軌道修正計画](../docs/pivot-plan.md) - アーキテクチャの背景
- [README](../README.md) - プロジェクト全体の概要

