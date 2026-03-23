# Issue 004: Cloudflare Functions のプロキシと ID トークン検証

## 目的

LIFF からのアクセスを `/api/*` に統一し、LINE ID トークン検証後にのみ GAS を呼び出す。

## 担当

- Primary: Agent

## 依存関係

- [issue_002.md](./issue_002.md)
- [issue_003.md](./issue_003.md)

## 対象ファイル

- [functions/_shared/headers.js](../../functions/_shared/headers.js)
- [functions/_shared/gas.js](../../functions/_shared/gas.js)
- [functions/_shared/line-auth.js](../../functions/_shared/line-auth.js)
- [functions/api/gas/surveys.js](../../functions/api/gas/surveys.js)
- [functions/api/gas/responses.js](../../functions/api/gas/responses.js)
- [functions/api/users.js](../../functions/api/users.js)

## 完了条件

- [ ] `GET /api/gas/surveys` が GAS の `getActiveSurvey` を中継する
- [ ] `GET /api/users` が LINE ID トークン検証後に GAS の `getUser` を中継する
- [ ] `POST /api/users` が LINE ID トークン検証後に GAS の `registerUser` を中継する
- [ ] `POST /api/gas/responses` が LINE ID トークン検証後に GAS の `saveResponse` を中継する
- [ ] `Authorization: Bearer <idToken>` が無い場合は 401 を返す
- [ ] 不正な ID トークンの場合は 401 を返す
- [ ] `LINE_LOGIN_CHANNEL_ID` 未設定時は 500 を返す
- [ ] GAS upstream のエラーを Cloudflare 側 JSON エラーへ変換する
- [ ] POST に必要な CORS ヘッダーが有効である

## 確認方法

- [ ] `Authorization` なしで `/api/users` と `/api/gas/responses` を叩き、401 を確認する
- [ ] 正常な ID トークンで `/api/users` と `/api/gas/responses` を叩き、200 を確認する
- [ ] Cloudflare 環境変数未設定時のエラー文言を確認する

## 非スコープ

- LINE Bot や Messaging API の認可
- 管理者ロール判定