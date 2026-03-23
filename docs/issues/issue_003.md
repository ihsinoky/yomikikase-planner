# Issue 003: GAS のアンケート・ユーザー・回答 API

## 目的

Spreadsheet を正として、アクティブアンケート取得、ユーザー登録、回答保存を GAS で完結できるようにする。

## 担当

- Primary: Agent

## 依存関係

- [issue_002.md](./issue_002.md)

## 対象ファイル

- [gas/Code.gs](../../gas/Code.gs)

## 完了条件

- [ ] `GET action=getActiveSurvey` が `survey` と `dates` を返す
- [ ] `GET action=getUser` が `lineUserId` に紐づく年度プロフィールを返す
- [ ] 未登録ユーザーでは `ok: true, user: null` を返す
- [ ] `POST action=registerUser` が `Users` シートへ追加または更新する
- [ ] `POST action=saveResponse` が `Responses` シートへ追加または更新する
- [ ] `saveResponse` で `surveyDateId` が `activeSurveyId` に属することを検証する
- [ ] `answer` が `可`, `不可`, `未定` 以外なら拒否する
- [ ] `saveResponse` は同一 `lineUserId + surveyDateId` を上書きする
- [ ] API キー未指定時は `Unauthorized` を返す
- [ ] 不正な action は JSON エラーを返す

## 確認方法

- [ ] `?action=getActiveSurvey&apiKey=...` で JSON を確認する
- [ ] `?action=getUser&lineUserId=...&apiKey=...` で登録済み/未登録の両方を確認する
- [ ] `action=registerUser` の POST で `Users` シート更新を確認する
- [ ] `action=saveResponse` の POST で `Responses` シートの追加と上書きを確認する

## 非スコープ

- GAS 単体での ID トークン検証
- 管理画面向け API