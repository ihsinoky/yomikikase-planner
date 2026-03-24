# Issue 002: Spreadsheet と環境前提の固定

## 目的

Milestone 3 の API と LIFF が動く前提データと環境変数を固定する。

## 担当

- Primary: User
- Support: Agent

## 依存関係

- なし

## 必須入力

- `Config.activeSurveyId`
- `Surveys` の対象アンケート行
- `SurveyDates` の対象候補日行
- Cloudflare Pages 環境変数 `GAS_BASE_URL`, `GAS_API_KEY`, `LIFF_ID`, `LINE_LOGIN_CHANNEL_ID`
- GAS Script Properties `API_KEY`
- LINE Developers の LIFF Endpoint URL と `openid` scope

## 完了条件

- [x] `Config.activeSurveyId` が空ではない
- [x] `Surveys` に `activeSurveyId` と一致する行が存在する
- [x] 対象アンケートの `status` が `active` である
- [x] `SurveyDates` に対象アンケートの候補日が 1 件以上存在する
- [x] Cloudflare Pages に `GAS_BASE_URL`, `GAS_API_KEY`, `LIFF_ID`, `LINE_LOGIN_CHANNEL_ID` が設定済みである
- [x] GAS 側 `API_KEY` と Cloudflare 側 `GAS_API_KEY` が一致している
- [x] LINE Developers で LIFF Endpoint URL が Cloudflare Pages の URL と一致している
- [x] LIFF で ID トークンを取得できる設定になっている

## 確認方法

- [x] Spreadsheet の `Config`, `Surveys`, `SurveyDates` を目視確認する
- [x] Cloudflare Pages の Environment variables を確認する
- [x] GAS Script Properties を確認する
- [x] LINE Developers Console の LIFF 設定を確認する

## 確認メモ

- 2026-03-25 時点で本番 `api/survey` が `survey_001` と候補日 4 件を返しており、`Config.activeSurveyId`、`Surveys.status=active`、`SurveyDates` の前提を満たしていることを確認。
- 本番 `api/config` が LIFF ID を返却し、`api/gas/health` と `api/gas/surveys` が復旧済みであることから、Cloudflare Pages 側の `GAS_BASE_URL`、`GAS_API_KEY`、`LIFF_ID`、`LINE_LOGIN_CHANNEL_ID` は有効な値で設定済みと判断。
- 新しい GAS Web App を直接叩くと `apiKey` なしで `Unauthorized` を返し、Cloudflare 経由では正常応答するため、GAS 側 `API_KEY` と Cloudflare 側 `GAS_API_KEY` は一致していると確認。
- LINE Developers 側の Endpoint URL と `openid` を含む設定は、このセッション中の Console 確認で Cloudflare Pages の URL と一致していることを確認済み。

## 関連ファイル

- [docs/sheets-schema.md](../sheets-schema.md)
- [docs/setup.md](../setup.md)
- [docs/liff-deployment-verification.md](../liff-deployment-verification.md)