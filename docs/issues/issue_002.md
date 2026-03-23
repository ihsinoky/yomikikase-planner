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

- [ ] `Config.activeSurveyId` が空ではない
- [ ] `Surveys` に `activeSurveyId` と一致する行が存在する
- [ ] 対象アンケートの `status` が `active` である
- [ ] `SurveyDates` に対象アンケートの候補日が 1 件以上存在する
- [ ] Cloudflare Pages に `GAS_BASE_URL`, `GAS_API_KEY`, `LIFF_ID`, `LINE_LOGIN_CHANNEL_ID` が設定済みである
- [ ] GAS 側 `API_KEY` と Cloudflare 側 `GAS_API_KEY` が一致している
- [ ] LINE Developers で LIFF Endpoint URL が Cloudflare Pages の URL と一致している
- [ ] LIFF で ID トークンを取得できる設定になっている

## 確認方法

- [ ] Spreadsheet の `Config`, `Surveys`, `SurveyDates` を目視確認する
- [ ] Cloudflare Pages の Environment variables を確認する
- [ ] GAS Script Properties を確認する
- [ ] LINE Developers Console の LIFF 設定を確認する

## 関連ファイル

- [docs/sheets-schema.md](../sheets-schema.md)
- [docs/setup.md](../setup.md)
- [docs/liff-deployment-verification.md](../liff-deployment-verification.md)