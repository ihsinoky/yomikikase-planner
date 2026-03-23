# yomikikase-planner

幼稚園の「絵本読み聞かせ」活動のための、LINEミニアプリ＋管理用Webアプリです。

- 保護者は LINE ミニアプリから **参加アンケートに回答** する
- 管理者は Web 画面から **アンケート結果を確認** し、**確定した日程・参加者を登録** する
- 人に紐づくデータ（参加履歴など）は年度単位で完結させつつ、
  **「どの学年でどの絵本を読んだか」の履歴だけ長期保存** できることを目指します

## 背景

現在は Google フォーム＋ LINE グループ＋ Excel のような運用で、

- 名前表記ゆれによる紐付けの大変さ
- 「誰が何回参加したのか」を追う手間
- 過去に読んだ絵本の記録が散逸してしまう

といった課題がある。

このリポジトリでは、次のようなポリシーで改善を目指します。

- ユーザー識別は **LINE の userId** で行い、「名前文字列マッチ地獄」から脱出する
- 年度ごとに活動を区切り、人に紐づくデータは長期保存しない
- 絵本の履歴は **ISBN / 書誌情報** ベースで残し、次の絵本選びに活かせるようにする

---

## 機能概要（MVP）

MVP では、機能をできるだけ絞り込んでスタートします。

### 管理者向け

- アンケート作成
  - 年度・タイトル・説明
  - 開催候補日（日時＋対象学年）の登録
- アンケート結果の確認
  - 学年・クラスでフィルタ表示
  - CSV エクスポート（別システムでの自動割り当てを想定）
- 確定日程・参加者の登録
  - 学年・クラスごとに見やすいビューで参加者を設定
  - 確定済み日程の一覧表示

### 参加者（保護者）向け

- LINE ミニアプリ（LIFF）からのアンケート回答
  - 初回のみ、名前・学年・クラスを登録
  - 以降は LINE アカウント（userId）で識別
  - 対象アンケートごとに、各候補日への参加可否を回答

### 絵本の記録（将来機能）

- 読み聞かせで使用した絵本の登録
  - ISBN をもとに書誌情報・表紙画像URLを取得
  - 「いつ」「どの年度・学年で」読んだかを記録
- 過去に読んだ絵本の一覧・検索
- 「この学年でまだ読んでいない本」の把握

MVP 段階では **絵本機能のデータモデルだけ定義** し、実装は後続マイルストーンで進める想定です。

---

## 想定技術スタック（案）

※あくまで現時点の候補。実装開始時に見直してもよい。

- フロントエンド
  - LINE ミニアプリ(LIFF)：TypeScript + React（または Next.js の一部として実装）
  - 管理画面：TypeScript + React / Next.js
- バックエンド API
  - Node.js + TypeScript
  - Web フレームワーク：Express / Fastify / NestJS のいずれか
- データベース
  - PostgreSQL もしくは MySQL系（RDB想定）
- インフラ
  - 任意のクラウド（例：Railway, Render, Fly.io, AWS, GCP など）
- 外部サービス
  - LINE Messaging API / LIFF
  - 書誌情報取得用 API（Google Books API / 国会図書館サーチなど）※候補

---

## ディレクトリ構成（案）

まだ実装前なので「たたき台」です。

```text
yomikikase-planner/
  README.md
  Milestone.md
  ArchitectureDesign.md

  src/
    backend/           # API サーバー側
      app/             # ユースケース・サービス
      domain/          # ドメインモデル
      infra/           # DB・外部API連携
      interfaces/      # HTTP ルーティング・DTO
    frontend/
      admin/           # 管理画面（Web）
      liff/            # LIFF アプリ（保護者向け）

  docs/
    # 設計ドキュメント等をここに追加していく予定

  .env.example         # 環境変数のサンプル
  package.json
  tsconfig.json
```

## 開発の進め方（ざっくり）

- まずはドメイン・データモデル・API の最小セットを固める
- 管理画面から、
    - アンケート作成
    - アンケート結果閲覧
    - 確定日程登録ができるところを最初の目標にする
- その後、LIFF 側からのアンケート回答を実装
- 絵本記録機能は、データモデルを活かして段階的に足していく

詳細は Milestone.md を参照。

## CI/CD とデプロイ自動化

GitHub Actions で以下を自動化しています。

- Pull Request / `main` / `develop` への push 時
  - `npm run lint`
  - `npm run test`
  - `npm run build`
- Pull Request 時（同一リポジトリ内のPR）
  - Vercel Preview デプロイ
  - PR に Preview URL を自動コメント
- `main` への push 時
  - Vercel 本番デプロイ
  - `DATABASE_URL` が設定されていれば `prisma migrate deploy`

ワークフロー定義: [.github/workflows/ci.yaml](.github/workflows/ci.yaml)

### GitHub Secrets に必要な値

Vercel 本番デプロイを有効にするには、GitHub リポジトリの Secrets に以下を設定してください。

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `DATABASE_URL`（Prisma マイグレーションも自動化する場合）

#### Secrets の取得手順

1. Vercel ダッシュボードで対象プロジェクトを開く
2. `Settings` → `General` から以下を確認する
  - `Project ID` → `VERCEL_PROJECT_ID`
  - `Team ID` または `Organization ID` → `VERCEL_ORG_ID`
3. Vercel ダッシュボード右上のアカウント設定から `Tokens` を開く
4. 新しいトークンを発行し、`VERCEL_TOKEN` として GitHub Secrets に登録する
5. GitHub リポジトリの `Settings` → `Secrets and variables` → `Actions` で各 Secret を追加する
6. Prisma の本番マイグレーションも GitHub Actions で実行したい場合は、`DATABASE_URL` も同じ画面で登録する

補足:

- `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` は、手元で一度 `vercel link` を実行したときに生成される `.vercel/project.json` でも確認できます。
- Secrets は GitHub の Repository secrets に入れてください。

#### Vercel プロジェクト初期リンク手順

まだ GitHub リポジトリと Vercel プロジェクトを紐付けていない場合は、最初に以下を実施してください。

1. Vercel で新しいプロジェクトを作成する
2. この GitHub リポジトリを Vercel プロジェクトに接続する
3. ローカルで Vercel CLI を使ってログインする
  - `npx vercel login`
4. リポジトリ直下でプロジェクトをリンクする
  - `npx vercel link`
5. 生成された `.vercel/project.json` から以下を確認する
  - `projectId` → `VERCEL_PROJECT_ID`
  - `orgId` → `VERCEL_ORG_ID`
6. GitHub Secrets に `VERCEL_TOKEN` / `VERCEL_PROJECT_ID` / `VERCEL_ORG_ID` を登録する

注意:

- `.vercel/` はローカル確認用です。通常はコミット不要です。
- GitHub 連携だけでも Vercel 自体の自動デプロイはできますが、このリポジトリでは GitHub Actions から明示的に Preview / Production を制御する構成にしています。

### Vercel 側で設定しておくもの

- Preview / Production 環境の環境変数
  - `DATABASE_URL`
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD`
  - `AUTH_SECRET`
  - 今後 LIFF を使う場合は LINE 関連の環境変数

Preview 環境でも動作確認したい場合は、少なくとも以下を Vercel の Preview Environment に設定してください。

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `AUTH_SECRET`
- `DATABASE_URL`（DB接続が必要な確認を行う場合）

本番DBを Preview から直接触りたくない場合は、Preview 用の別DBを用意してください。

#### Preview 用 DB の作り方

Preview 環境でフォーム作成や一覧取得まで確認したい場合は、Preview 専用の PostgreSQL を用意するのが安全です。

代表的な選択肢:

- Neon
- Supabase
- Railway
- Render PostgreSQL

基本手順:

1. Preview 用の PostgreSQL インスタンスを作成する
2. 接続文字列を取得する
3. Vercel の `Settings` → `Environment Variables` で `Preview` 環境に `DATABASE_URL` を設定する
4. 必要なら `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `AUTH_SECRET` も `Preview` に設定する
5. 初回デプロイ後、必要に応じて Preview DB に対して Prisma マイグレーションを適用する

運用の考え方:

- **安全重視:** Preview 用に本番とは別DBを使う
- **コスト重視:** 1つの共有 Preview DB を使う
- **厳密重視:** ブランチごとに分離した Preview DB を用意する

このプロジェクトの規模なら、まずは **1つの共有 Preview DB** で十分です。

注意:

- Preview から本番DBを参照すると、テスト操作が本番データに混ざる可能性があります。
- CSV 出力や一覧確認だけでも、将来的には回答データを書き込む機能が増える前提で、早めに Preview DB を分けるのが無難です。

### Pull Request 時点での動作確認方法

PR を作成すると、CI 成功後に Vercel Preview が自動デプロイされます。

確認手順:

1. PR のコメントに追加される Preview URL を開く
2. 管理者ログインができることを確認する
3. 主要画面を確認する
  - アンケート一覧
  - アンケート作成
  - 回答一覧
  - CSV ダウンロード
4. 必要なら API の疎通も Preview 上で確認する

制約:

- Preview デプロイは、同一リポジトリ内の PR を対象にしています。
- Fork からの PR では GitHub Secrets を安全に渡せないため、この自動 Preview は動きません。

### 補足

- `main` にマージされると、本番デプロイが自動で走ります。
- DB マイグレーションを GitHub Actions 側でも実行する構成です。
- `DATABASE_URL` を GitHub Secrets に入れていない場合は、デプロイのみ実行されます。