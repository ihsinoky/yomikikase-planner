# Issue 001: Milestone 3 Parent

## 目的

Milestone 3 を、保護者が LIFF から最新アンケートを取得し、初回プロフィール登録後に回答送信できる状態まで完了させる。

## 担当

- Primary: Agent
- Support: User

## 子タスク

- [issue_002.md](./issue_002.md): Spreadsheet / 環境前提の固定
- [issue_003.md](./issue_003.md): GAS のアンケート・ユーザー・回答 API
- [issue_004.md](./issue_004.md): Cloudflare Functions のプロキシと ID トークン検証
- [issue_005.md](./issue_005.md): LIFF MVP 画面フロー
- [issue_006.md](./issue_006.md): ドキュメントと検証チェックリスト整備
- [issue_007.md](./issue_007.md): 実環境確認と受け入れ判定

## 完了条件

- [ ] `Config.activeSurveyId` に紐づくアンケートを LIFF で表示できる
- [ ] 初回アクセス時に `Users` シートへプロフィール登録できる
- [ ] 回答送信で `Responses` シートへ保存できる
- [ ] 同一 `lineUserId + surveyDateId` の再送は既存行を更新する
- [ ] Cloudflare Functions で LINE ID トークンを検証してから GAS に中継する
- [ ] 主要なセットアップと手動検証手順が docs に反映されている
- [ ] User が本番相当の手動確認を完了している

## 完了判定に使うファイル

- [gas/Code.gs](../../gas/Code.gs)
- [functions/api/gas/surveys.js](../../functions/api/gas/surveys.js)
- [functions/api/gas/responses.js](../../functions/api/gas/responses.js)
- [functions/api/users.js](../../functions/api/users.js)
- [liff/index.html](../../liff/index.html)
- [docs/liff-deployment-verification.md](../liff-deployment-verification.md)
- [gas/VERIFICATION.md](../../gas/VERIFICATION.md)

## 非スコープ

- 管理 UI の追加
- 回答一覧の CSV 出力改善
- 絵本記録機能
- 年度削除機能