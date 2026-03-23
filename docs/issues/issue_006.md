# Issue 006: ドキュメントと検証チェックリスト整備

## 目的

Milestone 3 のセットアップ差分と動作確認手順を、第三者が再現できる粒度で文書化する。

## 担当

- Primary: Agent

## 依存関係

- [issue_003.md](./issue_003.md)
- [issue_004.md](./issue_004.md)
- [issue_005.md](./issue_005.md)

## 対象ファイル

- [functions/README.md](../../functions/README.md)
- [gas/VERIFICATION.md](../../gas/VERIFICATION.md)
- [docs/liff-deployment-verification.md](../liff-deployment-verification.md)
- [docs/setup.md](../setup.md)

## 完了条件

- [ ] Functions の新規 API と必要な環境変数が文書化されている
- [ ] GAS 側の `getActiveSurvey`, `getUser`, `registerUser`, `saveResponse` の確認項目が追加されている
- [ ] LIFF の初回登録、候補日表示、回答送信、再回答上書きの確認手順がある
- [ ] `LINE_LOGIN_CHANNEL_ID` と `LIFF_ID` が必要な設定値として記載されている
- [ ] `openid` scope が必要であることが記載されている
- [ ] 失敗時の切り分け先が docs にある

## 確認方法

- [ ] 変更した docs だけを読み、必要な設定値と確認手順を再現できることを確認する
- [ ] 新しく参加する開発者が不足なくセットアップできる粒度になっているか点検する

## 非スコープ

- ADR の追加
- 一般ユーザー向け FAQ の整備