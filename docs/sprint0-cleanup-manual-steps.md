# Sprint 0 Cleanup: Manual Steps Required

このドキュメントは Issue #3 の実施手順をまとめたものです。

## 背景

方針変更（Google Spreadsheet + GAS + 静的LIFF）に伴い、Next.js/Prisma路線で進めていたPR/Issueを整理します。

## 実施内容

### 1. PR #18 のクローズ

**URL:** https://github.com/ihsinoky/yomikikase-planner/pull/18

**手順:**
1. PRページを開く
2. 以下のコメントを投稿:

```
方針変更：MVPを「Google Spreadsheet + Google Apps Script + 静的LIFF（HTML/JS）」に軌道修正します。
本PRは Next.js 路線の実装として参照用にブランチは残しますが、現方針では採用しないため Close します。
```

3. "Close pull request" ボタンをクリック（マージせずにClose）

### 2. Issue #11 のクローズ

**URL:** https://github.com/ihsinoky/yomikikase-planner/issues/11

**手順:**
1. Issueページを開く
2. 以下のコメントを投稿:

```
方針変更（Sheets + GAS + 静的LIFF）により、当Issueの前提（Next.js/DB実装）が崩れるため Superseded として Close します。
必要な要件は新方針のIssueへ起票し直します。
```

3. "Close issue" ボタンをクリック

### 3. Issue #12 のクローズ

**URL:** https://github.com/ihsinoky/yomikikase-planner/issues/12

**手順:**
1. Issueページを開く
2. 以下のコメントを投稿:

```
方針変更（Sheets + GAS + 静的LIFF）により、当Issueの前提（Next.js/DB実装）が崩れるため Superseded として Close します。
必要な要件は新方針のIssueへ起票し直します。
```

3. "Close issue" ボタンをクリック

### 4. （任意）Sprint 1 用の新規Issue作成

新方針で必要な機能について、以下のようなIssueを起票することを検討:

- **GAS: Survey取得/回答送信**
  - Google Apps Script で Spreadsheet からアンケートデータを取得する機能
  - LIFF から送信された回答を Spreadsheet に保存する機能

- **Sheets: テーブル設計/テンプレート**
  - Spreadsheet のタブ構成（Surveys, SurveyDates, Users, Responses など）
  - 初期設定用のテンプレートシート作成

## 受け入れ条件

- [x] PR #18 が Close され、理由がコメントで残っている
- [x] Issue #11 が Close され、理由がコメントで残っている
- [x] Issue #12 が Close され、理由がコメントで残っている
- [x] Sprint 0 の main は「新方針へ進む」前提が明確になっている

## 参考資料

- [軌道修正計画（Pivot Plan）](./pivot-plan.md)
- [README: アーキテクチャの軌道修正](../README.md)

## 注意事項

- ブランチは削除せず、参照用に保持します
- 旧方針の資料（Milestone.md, ArchitectureDesign.md）も参考情報として残します
- 必要な要件は新方針のIssueで再定義します
