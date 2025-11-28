# Architecture Design

幼稚園の絵本読み聞かせ活動を支える LINE ミニアプリ＋管理 Web アプリのアーキテクチャ設計メモです。

---

## 1. ドメイン概要

### 1.1 活動の単位

- 活動は **年度単位**（例：2025年度）で区切る
- 各年度の中で、月3回を基本とした読み聞かせ会
  - 年少
  - 年中
  - 年長
- 各回には「参加希望アンケート」と「確定した日程・参加者」が存在する

### 1.2 登場人物と情報

- 保護者（User）
  - LINE アカウントで一意に識別（`line_user_id`）
  - 年度ごとに「学年・クラス」を持つ（`UserYearProfile`）
- 管理者
  - 幼稚園 or 読み聞かせ運営側
  - Web 管理画面から操作
- 絵本（Book）
  - ISBN / タイトル / 著者 / 表紙画像URL など
  - 読み聞かせで使われた履歴（BookReadingRecord）を持つ

---

## 2. ユースケース

### 2.1 アンケート関連（MVP）

1. 管理者が「年度」と「アンケート」を作成
2. 開催候補日を登録（日時＋学年）
3. LINE グループにミニアプリのリンクを共有
4. 保護者がミニアプリからアンケートページを開く
5. 保護者は候補日ごとの参加可否を回答
6. 管理者が Web 管理画面で結果を閲覧・CSV 出力
7. 管理者が別ツールで候補を検討し、「確定日程＋参加者」を管理画面に登録

### 2.2 絵本記録（将来）

1. 管理者が「読み終えた絵本」をアプリに登録
   - ISBN から書誌情報を取得して Book を作成
2. 「いつ・どの年度・どの学年（クラス）で読んだか」を BookReadingRecord に記録
3. 次回の絵本選びで「同学年で過去に読んだ / まだ読んでいない本」を確認

---

## 3. システム構成

### 3.1 コンポーネント

- **LIFFフロントエンド（保護者向け）**
  - LINE アプリ内で起動する Web アプリ
  - 主な責務：
    - LINE ログイン（userId の取得）
    - 初回プロフィール登録（名前・学年・クラス）
    - アンケートの回答

- **管理用 Web フロントエンド（管理者向け）**
  - ブラウザからアクセスする通常の Web アプリ
  - 主な責務：
    - アンケート作成・編集
    - アンケート結果の閲覧・CSV エクスポート
    - 確定日程・参加者の登録・閲覧
    - （将来）絵本マスタ・読書履歴の管理

- **バックエンド API**
  - REST API（必要なら後で GraphQL 等に拡張）
  - 主な責務：
    - 認証・認可（管理者 / 一般ユーザー）
    - ドメインロジック（アンケート・日程・絵本）
    - DB アクセス
    - 外部 API（LINE, 書誌情報）との連携

- **データベース**
  - RDBMS（PostgreSQL / MySQL系）
  - トランザクション整合性・検索性重視

- **外部サービス**
  - LINE Messaging API / LIFF
  - 書誌情報 API（Google Books 等）

### 3.2 コンテキスト図（テキスト版）

- 保護者  
  ⇔ LINE アプリ  
  ⇔ LIFF フロントエンド  
  ⇔ バックエンド API  
  ⇔ DB

- 管理者  
  ⇔ 管理用 Web フロントエンド  
  ⇔ バックエンド API  
  ⇔ DB

- バックエンド API  
  ⇔ LINE API（ユーザー検証・メッセージ送信 etc.）  
  ⇔ 書誌情報 API

---

## 4. データモデル（概要）

### 4.1 年度とユーザー

- `SchoolYear`
  - `id`
  - `name` (例: "2025年度")
  - `start_date`
  - `end_date`
  - `is_active`

- `User`
  - `id`
  - `line_user_id`
  - `display_name`
  - `created_at`

- `UserYearProfile`
  - `id`
  - `user_id`
  - `school_year_id`
  - `grade` (年少 / 年中 / 年長)
  - `class_name`
  - `created_at`

### 4.2 アンケート

- `Survey`
  - `id`
  - `school_year_id`
  - `title`
  - `description`
  - `created_at`

- `SurveyDate`
  - `id`
  - `survey_id`
  - `date` (datetime or date)
  - `grade`

- `Response`
  - `id`
  - `survey_id`
  - `user_id`
  - `created_at`

- `ResponseDetail`
  - `id`
  - `response_id`
  - `survey_date_id`
  - `status` (参加可 / 参加不可)

### 4.3 確定日程

- `ConfirmedEvent`
  - `id`
  - `school_year_id`
  - `date`
  - `grade`
  - `class_name` (任意)
  - `created_at`

- `ConfirmedParticipant`
  - `id`
  - `confirmed_event_id`
  - `user_id` もしくは `participant_name` + `grade` + `class_name`
  - `created_at`

### 4.4 絵本

- `Book`
  - `id`
  - `title`
  - `author`
  - `publisher`
  - `isbn`
  - `cover_image_url`
  - `created_at`

- `BookReadingRecord`
  - `id`
  - `book_id`
  - `school_year_id`
  - `date`
  - `grade`
  - `class_name`
  - `notes`
  - `created_at`

---

## 5. 認証・認可

### 5.1 保護者（LIFF側）

- LIFF SDK から IDトークン or アクセストークンを取得
- バックエンド側でトークンを検証し、`line_user_id` を取得
- `User` に存在しない場合は新規作成
- フロント側ではログイン UI を明示的に出さず、「LINE で開いたらそのまま認証済み」という体験にする

### 5.2 管理者（Web 管理画面）

- シンプルな ID/PW 認証から開始
  - 将来、園の Google アカウントや別の SSO に移行してもよい
- ロールとしては最低限：
  - `admin`（全操作可）

---

## 6. データライフサイクル / プライバシー

- 人に紐づくデータ（アンケート・参加者情報など）
  - 原則として **年度単位で完結**
  - ポリシー例：
    - 「年度終了後◯年で削除」
    - または「卒園タイミングで一括削除」
- 絵本の履歴
  - 個人情報と紐づけずに、「年度・学年・クラス・日付」のみ記録
  - 長期的に残してよい前提

- 「アプリを畳む」場合に備えて：
  - `SchoolYear` 単位、またはシステム全体の「一括削除」機能を設計に含める
  - 削除前に CSV などへのエクスポートを行えるようにする

---

## 7. 今後の拡張アイデア（メモ）

- 公平性を考慮した自動割当ロジック
  - 連続参加ペナルティ
  - 累積参加回数ペナルティ
  - 同じ学年の他クラスへの割当ペナルティ
- LINE からの自動通知
  - アンケート開始のお知らせ
  - 確定日程のお知らせ
- 絵本レコメンド
  - 学年・季節・テーマから「まだ読んでいないおすすめ本」を提案
- 複数園対応（マルチテナント化）
  - `Kindergarten` テーブルを追加し、園ごとにデータを分離

---
