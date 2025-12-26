# 軌道修正計画（Pivot Plan）: Google Spreadsheet + Apps Script + Static LIFF

## 1. 結論（意思決定）
- データの正：Google Spreadsheet
- API/配信：Google Apps Script（Web App）
- 参加者UI：LIFF（静的HTML/JS、依存最小）
- 管理UI：まずは Spreadsheet（必要最小限の運用）。追加UIは「必要になってから」

**理由**
- 個人運用で更新頻度が低い（1ヶ月〜1年）ため、Node/Next の依存更新追従を前提にしない構成にする
- 公開面を最小化し、運用負荷（セキュリティ対応・デプロイ・DB保守）を下げる

## 2. 既存資産の扱い（Legacy戦略）
- 現行 main（Next.js/Prisma）は `legacy/nextjs-2025-12` に保存
- PR ihsinoky/yomikikase-planner#18 は「参照用にブランチは残すが採用しない」方針で Close
- Issue ihsinoky/yomikikase-planner#11/#12 は Superseded で Close（必要な要件は新方式で起票し直す）

## 3. アーキテクチャ（新方式）

### 3.1 コンポーネント
- Google Spreadsheet
  - Surveys / SurveyDates / Users / Responses / Config 等のタブで保持
- Google Apps Script（Web App）
  - `doGet()`：LIFF 用 HTML を返す（同一オリジンでCORS事故を避ける）
  - `doPost()` or `google.script.run`：回答送信、Sheet書き込み、（必要なら）LINE token 検証
- LIFF（HTML/JS）
  - 初回プロフィール登録（必要なら）
  - 最新アンケート表示・回答送信（MVPでは最新1件だけでOK）

### 3.2 データ設計（Sheets タブ案）
- `Config`
  - `activeSurveyId`
  - `liffId`（任意）
- `Surveys`
  - `surveyId`, `fiscalYear`, `title`, `description`, `status`, `createdAt`
- `SurveyDates`
  - `surveyDateId`, `surveyId`, `dateTime`, `targetGrade`, `label`, `sortOrder`
- `Users`
  - `lineUserId`, `displayName?`, `childName`, `grade`, `class`, `createdAt`, `updatedAt`
- `Responses`（1行＝1候補日への回答）
  - `responseId`, `surveyId`, `surveyDateId`, `lineUserId`, `answer`, `submittedAt`

### 3.3 セキュリティ/運用ポリシー（最低限）
- Spreadsheet は共有範囲を最小化（編集者は管理者のみ）
- LIFF 側のアクセストークン等は長期保存しない（都度認証・都度識別）
- GAS 側で同時書き込み対策（LockService）を入れる
- ログ（失敗時）を `Logs` シートへ記録（原因追跡できるように）

## 4. スプリント計画（概要）
### Sprint 0（いまやる）
- legacy 保存
- PR/Issue 整理
- 計画を Markdown 化（この Issue）
- README から参照導線追加

### Sprint 1（骨格）
- Sheets テンプレ作成
- GAS Web App 作成（HTML配信）
- LIFF 初期表示（ログイン→画面表示）

### Sprint 2（MVP）
- 最新アンケート取得（Surveys + SurveyDates）
- 回答送信→Sheet保存
- 集計（ピボット/関数）で "参加可否" を見える化

### Sprint 3（運用固め）
- 運用手順書（Sheets編集手順、エラー時の対応）
- 権限、バックアップ（テンプレ複製）など

## 5. Done 定義（新方式MVPが成立した状態）
- 管理者が Sheets でアンケートを用意できる
- 保護者が LIFF で回答でき、Responses に記録される
- 候補日別の参加可否が Sheets で集計できる
- README から "新方式の使い方/計画" に辿れる
