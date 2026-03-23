# Issue 007: 実環境確認と受け入れ判定

## 目的

本番相当の環境で Milestone 3 の手動確認を実施し、リリース可能か判断する。

## 担当

- Primary: User
- Support: Agent

## 依存関係

- [issue_002.md](./issue_002.md)
- [issue_003.md](./issue_003.md)
- [issue_004.md](./issue_004.md)
- [issue_005.md](./issue_005.md)
- [issue_006.md](./issue_006.md)

## 完了条件

- [ ] LINE アプリ内で LIFF を開ける
- [ ] 初回登録したユーザーが `Users` シートへ保存される
- [ ] 最新アンケートの候補日一覧が表示される
- [ ] 回答送信後に `Responses` シートへ保存される
- [ ] 同じ候補日に再回答したとき、同一行が更新される
- [ ] Cloudflare Logs と Spreadsheet `Logs` タブの両方で異常が追跡できる
- [ ] `activeSurveyId` を切り替えたとき、表示アンケートが切り替わる
- [ ] User が「本番投入してよい / まだ不可」を判断できる

## 確認方法

- [ ] [docs/liff-deployment-verification.md](../liff-deployment-verification.md) の手順で実機確認する
- [ ] [gas/VERIFICATION.md](../../gas/VERIFICATION.md) の追加項目で Spreadsheet 更新を確認する
- [ ] Cloudflare Dashboard のログと Spreadsheet `Logs` タブを確認する

## リリース不可と判定する条件

- [ ] ID トークン未設定でも回答送信できてしまう
- [ ] `Users` または `Responses` に保存されない
- [ ] `activeSurveyId` と異なる候補日に回答できてしまう
- [ ] 設定値不足時のエラーが追跡できない