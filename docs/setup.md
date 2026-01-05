# セットアップ手順書

このドキュメントは、yomikikase-planner の個人運用環境を最初からセットアップする手順を説明します。
数ヶ月〜1年放置した後でも、この手順に従って環境を再構築できることを目指しています。

## 目次

- [前提条件](#前提条件)
- [1. Google Spreadsheet の作成](#1-google-spreadsheet-の作成)
- [2. Google Apps Script の作成・デプロイ](#2-google-apps-script-の作成デプロイ)
- [3. LINE Developers での LINE ミニアプリ作成](#3-line-developers-での-line-ミニアプリ作成)
- [4. 設定値の登録](#4-設定値の登録)
- [5. 動作確認](#5-動作確認)
- [6. トラブルシューティング](#6-トラブルシューティング)
- [7. 更新時の注意点](#7-更新時の注意点)

---

## 前提条件

セットアップを開始する前に、以下を準備してください：

- **Google アカウント**: Spreadsheet と Apps Script を使用するために必要
- **LINE Developers アカウント**: LINE ミニアプリを作成するために必要
  - [LINE Developers Console](https://developers.line.biz/console/) でアカウント登録を完了させておく
- **（オプション）LINE 公式アカウント**: LINE ミニアプリと連携する場合に使用
  - Messaging API チャネルとして無料で作成可能
  - 本プロジェクトでは必須ではありませんが、リッチメニュー等で配信したい場合は作成しておくと便利です

---

## 1. Google Spreadsheet の作成

### 1.1. 新しいスプレッドシートを作成

1. [Google Drive](https://drive.google.com/) にアクセス
2. 「新規」→「Google スプレッドシート」→「空白のスプレッドシート」を選択
3. スプレッドシート名を変更（例: `読み聞かせプランナー データ`）

### 1.2. テンプレートシートのインポート

このリポジトリの `sheet-template/` ディレクトリに、各タブのテンプレートCSVファイルがあります。
以下の順序で6つのシートをインポートしてください。

#### 必要なシート（タブ）

1. **Config** - システム設定
2. **Surveys** - アンケート本体
3. **SurveyDates** - アンケートの開催候補日
4. **Users** - LINE ユーザー情報
5. **Responses** - アンケート回答データ
6. **Logs** - 実行ログ（自動作成されますが、手動作成も可）

#### インポート手順（各シートごとに実施）

1. スプレッドシート下部の「+」ボタンで新しいシートを追加
2. シート名を変更（例: `Config`, `Surveys`, `SurveyDates`, ...）
3. メニューから「ファイル」→「インポート」を選択
4. 「アップロード」タブを選択
5. 対応する CSV ファイルをドラッグ&ドロップまたは選択
   - `Config.csv` → `Config` シート
   - `Surveys.csv` → `Surveys` シート
   - `SurveyDates.csv` → `SurveyDates` シート
   - `Users.csv` → `Users` シート
   - `Responses.csv` → `Responses` シート
   - `Logs.csv` → `Logs` シート
6. インポート設定:
   - **インポート場所**: 「現在のシートを置き換える」
   - **区切り文字**: 「カンマ」
   - **データを変換する**: チェックを入れる（日付などを自動認識）
7. 「データをインポート」をクリック

#### ⚠️ 重要な注意点

- **ヘッダー行（1行目）は絶対に削除しないでください**
  - Apps Script がこの列名を使ってデータを読み書きします
- **サンプルデータ（2行目以降）は削除してもOK**
  - 本番運用開始時に削除して、実データを入力してください
- **列の順序を変更しないでください**
  - GAS が列番号でアクセスしている箇所があります

### 1.3. Spreadsheet ID をメモ

スプレッドシートの URL から Spreadsheet ID を取得します。

**URL の形式**:
```
https://docs.google.com/spreadsheets/d/【Spreadsheet ID】/edit
```

**例**:
```
https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I0J/edit
```
この場合、Spreadsheet ID は `1A2B3C4D5E6F7G8H9I0J` です。

📝 **このIDを後で使うのでメモしておいてください。**

---

## 2. Google Apps Script の作成・デプロイ

### 2.1. Apps Script プロジェクトの作成

1. 作成した Spreadsheet を開く
2. メニューから「拡張機能」→「Apps Script」を選択
3. 新しいブラウザタブで Apps Script エディタが開く
4. プロジェクト名を変更（例: `読み聞かせプランナー GAS`）

### 2.2. コードのコピー

#### `Code.gs` のコピー

1. Apps Script エディタで、デフォルトで作成される `コード.gs` を開く
2. このリポジトリの `gas/Code.gs` の内容を全てコピー
3. `コード.gs` の内容を全て削除し、コピーした内容を貼り付け
4. Ctrl+S（または Cmd+S）で保存

#### `index.html` の追加

1. Apps Script エディタの左サイドバーで「+」ボタンをクリック
2. 「HTML」を選択
3. ファイル名を `index` にする（`.html` は自動で付与される）
4. このリポジトリの `gas/index.html` の内容を全てコピー
5. `index.html` の内容を全て削除し、コピーした内容を貼り付け
6. Ctrl+S（または Cmd+S）で保存

### 2.3. 初回実行と権限の承認

コードをデプロイする前に、スプレッドシートへのアクセス権限を承認する必要があります。

1. Apps Script エディタで、関数選択ドロップダウンから `testHealthCheck` を選択
2. 「実行」ボタン（▷）をクリック
3. 初回実行時、「承認が必要です」というダイアログが表示される
4. 「権限を確認」をクリック
5. Google アカウントを選択
6. 「詳細」をクリック → 「（プロジェクト名）（安全ではないページ）に移動」をクリック
7. 「許可」をクリック
8. 実行ログに JSON レスポンスが表示されれば成功

**⚠️ 注意**: 「安全ではないページ」という警告は、個人プロジェクトで通常のプロセスです。自分で作成したスクリプトなので問題ありません。

### 2.4. Web App としてデプロイ

#### 新規デプロイの作成

1. Apps Script エディタで、右上の「デプロイ」→「新しいデプロイ」をクリック
2. 「種類の選択」（⚙️アイコン）をクリック → 「ウェブアプリ」を選択
3. 以下の設定を行う:
   - **説明**: `yomikikase-planner Web App`（任意の説明）
   - **次のユーザーとして実行**: **「自分」**を選択
   - **アクセスできるユーザー**: **「全員」**を選択
     - ⚠️ **重要**: LIFF からアクセスするため「全員」が必須です
4. 「デプロイ」ボタンをクリック
5. デプロイが完了すると、**ウェブアプリの URL** が表示される

#### Web App URL をメモ

表示された URL の形式:
```
https://script.google.com/macros/s/【デプロイID】/exec
```

**例**:
```
https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec
```

📝 **この URL を後で使うのでコピーしてメモしておいてください。**

### 2.5. デプロイの動作確認（基本）

ブラウザで以下の URL にアクセスして、デプロイが成功したか確認します。

**ヘルスチェック API**:
```
https://script.google.com/macros/s/【デプロイID】/exec?action=health
```

**期待される結果**:
```json
{
  "ok": true,
  "timestamp": "2025-12-29T10:00:00.000Z",
  "message": "yomikikase-planner GAS Web App is running"
}
```

✅ この JSON が表示されれば、GAS Web App は正常に動作しています。

---

## 3. LINE Developers での LINE ミニアプリ作成

LINE ミニアプリ（LIFF 統合）チャネルを作成し、GAS Web App と連携させます。

**⚠️ 重要**: 現在、LINE では新規の LIFF アプリを直接作成することはできません。新規作成は「LINE ミニアプリ」として行う必要があります。LINE ミニアプリは LIFF の機能を統合しており、より高度な機能を提供します。

### 3.1. LINE Developers Console にアクセス

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. LINE アカウントでログイン

### 3.2. プロバイダーの作成

#### プロバイダーが未作成の場合

1. 「Create a new provider」をクリック
2. プロバイダー名を入力（例: `読み聞かせプランナー`）
3. 「Create」をクリック

### 3.3. LINE ミニアプリチャネルの作成

1. 作成したプロバイダーを選択
2. 「Create a new channel」（新規チャネル作成）をクリック
3. チャネルタイプで **「LINE ミニアプリ」** を選択
4. 必須項目を入力:
   - **App name**: 読み聞かせプランナー
   - **App description**: 幼稚園の読み聞かせ活動管理用アプリ
   - **Category**: Education（教育）
   - **Subcategory**: 適切なものを選択
   - **Service provided region**: Japan（サービスを提供する地域）
   - **Email address**: 連絡先メールアドレス
5. 利用規約に同意してチェック
6. 「Create」をクリック

#### ⚠️ 作成時の注意点

- **地域制限**: LINE ミニアプリは、サービス提供地域によって作成に制約がある場合があります
- **日本での作成**: 日本で作成する場合、Business ID との連携や LINE アカウント認証が必要になる場合があります
- **制限がある場合の対処**: 
  - Business ID を作成して LINE アカウントと連携する手順については、[LINE Developers ヘルプセンター](https://developers.line.biz/ja/faq/)を参照
  - 作成が困難な場合は、まず未認証のまま開発を進めることも可能です（詳細は[開発ガイド](https://developers.line.biz/ja/docs/line-mini-app/develop/develop-overview/)を参照）

### 3.4. 内部チャネルと LIFF ID の理解

LINE ミニアプリは、開発・審査・本番の3つの **内部チャネル（Internal Channels）** を持ちます:

| 内部チャネル | 用途 | 公開範囲 |
|-------------|------|---------|
| **Developing** | 開発・テスト用 | チャネル管理者のみ |
| **Review** | 審査申請用 | 審査スタッフとテスター |
| **Published** | 本番公開用 | 一般ユーザー全員 |

**重要**: それぞれの内部チャネルには **異なる LIFF ID** が発行されます。開発時は主に **Developing チャネルの LIFF ID** を使用します。

### 3.5. Endpoint URL の設定

各内部チャネルに対して、Endpoint URL（アプリの配信先 URL）を設定します。

#### 3.5.1. Developing チャネルの設定（開発・テスト用）

1. LINE ミニアプリのチャネル設定画面を開く
2. 「Developing」タブを選択
3. 「Basic settings」セクションで「Edit」をクリック
4. 以下を設定:
   - **Endpoint URL**: `https://script.google.com/macros/s/【デプロイID】/exec`
     - 手順 2.4 でメモした GAS Web App URL を入力
   - **Module mode**: Off（本プロジェクトでは使用しない）
5. 「Save」をクリック

#### 3.5.2. その他のチャネルについて

- **Review / Published チャネル**: 現時点では設定不要です
- 将来、一般ユーザーに公開する際に、それぞれの Endpoint URL を設定します
- 開発段階では **Developing チャネル** のみ設定すれば十分です

### 3.6. LIFF ID の取得

#### 3.6.1. Developing チャネルの LIFF ID を取得

1. LINE ミニアプリのチャネル設定画面で「Developing」タブを選択
2. 「Basic settings」セクションに **LIFF ID** が表示されています
3. LIFF ID をコピー（`1234567890-abcdefgh` の形式）

📝 **この LIFF ID を後で使うのでコピーしてメモしておいてください。**

**LIFF ID の形式**:
```
1234567890-abcdefgh
```

#### 3.6.2. 内部チャネルと LIFF ID の対応

各内部チャネルには異なる LIFF ID が発行されます。

**例**（実際の値は異なります）:
```
Developing チャネル → 1234567890-abcdefgh（開発用、チャネル作成時に自動発行）
Review チャネル     → 1234567890-ijklmnop（審査申請時に自動発行）
Published チャネル  → 1234567890-qrstuvwx（公開承認後に自動発行）
```

**注意**: 
- Developing チャネルの LIFF ID はチャネル作成時に自動的に発行されます
- Review と Published チャネルの LIFF ID は、それぞれ審査申請時・公開承認後に発行されます
- **本プロジェクトでは、まず Developing チャネルの LIFF ID を使用します**

### 3.7. LIFF URL の確認

LINE ミニアプリにアクセスするための URL は以下の形式です:

#### 基本形式（推奨）

```
https://miniapp.line.me/【LIFF ID】
```

**例**:
```
https://miniapp.line.me/1234567890-abcdefgh
```

#### 従来形式（互換性）

従来の LIFF URL 形式も引き続き使用できます:
```
https://liff.line.me/【LIFF ID】
```

**推奨**: 新規作成の場合は `miniapp.line.me` を使用してください。

#### URL の使用方法

この URL を以下の場所に設定することで、ユーザーがアプリを開けるようになります:
- LINE 公式アカウントのリッチメニュー
- LINE 公式アカウントのメッセージ（テキスト・カードメッセージ等）
- LINE のトークで直接送信（テスト用）

---

## 4. 設定値の登録

必要な設定値を Spreadsheet の `Config` シートに登録します。

### 4.1. Config シートを開く

作成した Spreadsheet の `Config` タブを開きます。

### 4.2. 設定値を入力

以下の行を追加または更新します:

| key | value | description | updatedAt |
|-----|-------|-------------|-----------|
| `activeSurveyId` | `survey_001` | 現在アクティブなアンケートID | 現在の日時 |
| `liffId` | `【LIFF ID】` | LIFF アプリケーションID | 現在の日時 |
| `appVersion` | `1.0.0` | アプリケーションバージョン | 現在の日時 |

**例**:
| key | value | description | updatedAt |
|-----|-------|-------------|-----------|
| activeSurveyId | survey_001 | 現在アクティブなアンケートID | 2025-12-29 10:00:00 |
| liffId | 1234567890-abcdefgh | LIFF アプリケーションID | 2025-12-29 10:00:00 |
| appVersion | 1.0.0 | アプリケーションバージョン | 2025-12-29 10:00:00 |

### 4.3. 設定値の説明

#### 重要な設定値

| 設定キー | 説明 | 取得元 | 必須 |
|---------|------|--------|------|
| `activeSurveyId` | 現在表示するアンケートのID（LIFF画面で使用） | Surveys シートの surveyId 列 | ○ |
| `liffId` | LINE ミニアプリの LIFF ID（Developing チャネル） | LINE Developers Console の Developing タブ | ○ |
| `appVersion` | アプリケーションのバージョン番号 | 任意 | △ |

#### その他、運用で追加する可能性がある設定値

- `maintenanceMode`: メンテナンスモード（`true` / `false`）
- `debugMode`: デバッグモード（`true` / `false`）
- `adminLineUserId`: 管理者の LINE ユーザーID（通知用）

---

## 5. 動作確認

すべてのセットアップが完了したら、実際に動作確認を行います。

### 5.1. ヘルスチェック API の確認

**目的**: GAS Web App が正常に動作しているか確認

**確認方法**:
1. ブラウザで以下の URL にアクセス:
   ```
   https://script.google.com/macros/s/【デプロイID】/exec?action=health
   ```
2. 以下の JSON が表示されることを確認:
   ```json
   {
     "ok": true,
     "timestamp": "2025-12-29T10:00:00.000Z",
     "message": "yomikikase-planner GAS Web App is running"
   }
   ```

✅ **チェックポイント**:
- [ ] `ok: true` が返る
- [ ] `timestamp` が現在時刻に近い
- [ ] Spreadsheet の `Logs` シートに実行ログが記録されている

### 5.2. HTML 配信の確認

**目的**: LIFF 用の HTML が正常に配信されているか確認

**確認方法**:
1. ブラウザで以下の URL にアクセス:
   ```
   https://script.google.com/macros/s/【デプロイID】/exec
   ```
2. 「📚 読み聞かせプランナー」のページが表示されることを確認

✅ **チェックポイント**:
- [ ] HTML ページが表示される
- [ ] タイトルが「📚 読み聞かせプランナー」
- [ ] エラーメッセージが表示されていない
- [ ] Spreadsheet の `Logs` シートに実行ログが記録されている

### 5.3. LIFF 初期化の確認（外部ブラウザ）

**目的**: LIFF SDK が正常に読み込まれ、初期化されるか確認

**確認方法**:
1. ブラウザで以下の URL にアクセス:
   ```
   https://script.google.com/macros/s/【デプロイID】/exec?liffId=【LIFF ID】
   ```
2. LIFF 初期化が開始される
3. 外部ブラウザからアクセスした場合、LINE ログインページにリダイレクトされる
4. LINE でログイン後、元のページに戻る
5. 以下の情報が表示されることを確認:
   - **ユーザーID**: LINE userId（`U1234...` 形式）
   - **表示名**: LINE の表示名
   - **GAS Health**: `OK` と表示される
   - **デバッグ情報**: OS、LINE バージョン、起動元などが表示される

✅ **チェックポイント**:
- [ ] LIFF SDK が読み込まれる（エラーが出ない）
- [ ] LINE ログインが完了する
- [ ] userId が表示される（`U` で始まる文字列）
- [ ] displayName が表示される
- [ ] GAS Health が `OK` と表示される
- [ ] デバッグ情報が表示される

### 5.4. LINE ミニアプリの確認（LINE アプリ内）

**目的**: LINE アプリから LINE ミニアプリを起動できるか確認

**確認方法**:

#### 方法 A: LINE ミニアプリ URL をメッセージで送信

1. LINE アプリで自分自身またはテスト用のユーザーにメッセージを送信
2. メッセージに以下の URL を記載（Developing チャネルの LIFF ID を使用）:
   ```
   https://miniapp.line.me/【LIFF ID】
   ```
   または従来形式:
   ```
   https://liff.line.me/【LIFF ID】
   ```
3. URL をタップして LINE ミニアプリを開く

#### 方法 B: LINE 公式アカウントのリッチメニューに設定（オプション）

LINE 公式アカウントを持っている場合:

1. LINE Official Account Manager にアクセス
2. リッチメニューを作成
3. アクション設定で LINE ミニアプリ URL を設定:
   ```
   https://miniapp.line.me/【LIFF ID】
   ```
4. リッチメニューを公開
5. LINE アプリでリッチメニューをタップ

#### 確認内容

✅ **チェックポイント**:
- [ ] LINE ミニアプリが開く
- [ ] ユーザー情報（userId, displayName）が表示される
- [ ] GAS Health が `OK` と表示される
- [ ] デバッグ情報で「起動元」が正しく表示される（例: `utou` = 1対1トーク）
- [ ] 「外部ブラウザ」が `false` と表示される

### 5.5. ログの確認

**目的**: Spreadsheet にログが正常に記録されているか確認

**確認方法**:
1. Spreadsheet の `Logs` タブを開く
2. 以下のログが記録されていることを確認:

| timestamp | level | source | message |
|-----------|-------|--------|---------|
| （現在時刻に近い） | INFO | handleHealthCheck | ヘルスチェックが実行されました |
| （現在時刻に近い） | INFO | handleServeHtml | HTML が配信されました |

✅ **チェックポイント**:
- [ ] `Logs` シートにログが記録されている
- [ ] `timestamp` が日時型で表示されている
- [ ] `level` が `INFO` または `ERROR`
- [ ] `source` が関数名（`handleHealthCheck`, `handleServeHtml` など）
- [ ] `message` が日本語で表示されている

---

## 6. トラブルシューティング

よくある問題と解決方法を記載します。

### 6.1. GAS のデプロイ時に「認証が必要です」と表示される

**原因**: Web App のアクセス権限設定が「全員」になっていない

**解決方法**:
1. Apps Script エディタで「デプロイ」→「デプロイを管理」を開く
2. 有効なデプロイの鉛筆アイコン（編集）をクリック
3. 「アクセスできるユーザー」を **「全員」** に変更
4. 「デプロイ」をクリックして更新

### 6.2. Logs シートにログが記録されない

**原因 1**: Spreadsheet に `Logs` シートが存在しない

**解決方法**:
- 手動で `Logs` シートを作成し、ヘッダー行を追加:
  ```
  logId | timestamp | level | source | message | details
  ```

**原因 2**: Apps Script に Spreadsheet へのアクセス権限がない

**解決方法**:
1. Apps Script エディタで `testHealthCheck` を実行
2. 権限の承認ダイアログが表示されたら、承認する

**原因 3**: ログシートが壊れている

**解決方法**:
1. Apps Script エディタで `clearLogsSheet` を実行
2. Logs シートがリセットされる

### 6.3. LIFF 初期化エラーが出る

**エラーメッセージ例**:
```
LIFF 初期化エラー: Invalid liffId
```

**原因**: LIFF ID が正しくない、または間違った内部チャネルの LIFF ID を使用している

**解決方法**:
1. LINE Developers Console で LINE ミニアプリのチャネル設定を開く
2. **Developing タブ** を選択して LIFF ID を確認（開発時は Developing チャネルの LIFF ID を使用）
3. Spreadsheet の `Config` シートの `liffId` を正しい値に修正
4. URL のクエリパラメータ `?liffId=...` が正しいか確認

**注意**: Review や Published チャネルの LIFF ID は、開発段階では使用しません。

### 6.4. userId が取得できない

**エラーメッセージ例**:
```
ユーザープロフィールの取得に失敗しました
```

**原因**: LINE ミニアプリのスコープ設定に問題がある

**解決方法**:
1. LINE Developers Console で LINE ミニアプリのチャネル設定を開く
2. Developing タブを選択
3. 「Scopes & Permissions」セクションを探す（Basic settings の下部にあります）
4. 以下のスコープが有効になっているか確認:
   - `profile` - ユーザーの表示名とプロフィール画像を取得
   - `openid` - OpenID Connect を使用したユーザー識別
5. 有効になっていない場合は、チェックボックスをオンにして「Save」をクリック

**注意**: LINE ミニアプリでは、チャネル作成時にデフォルトで `profile` と `openid` のスコープが有効になっているはずですが、何らかの理由で無効になっている場合はこの手順で有効化してください。

### 6.5. 外部ブラウザからアクセスすると「ログインが必要です」が無限ループする

**原因**: ブラウザのサードパーティ Cookie がブロックされている

**解決方法**:
1. ブラウザの設定でサードパーティ Cookie を許可
2. または、LINE アプリ内からアクセスする（推奨）

### 6.6. GAS の URL にアクセスすると「スクリプトが見つかりません」と表示される

**原因**: デプロイ ID が間違っているか、デプロイが削除された

**解決方法**:
1. Apps Script エディタで「デプロイ」→「デプロイを管理」を開く
2. 有効なデプロイの URL を確認
3. 正しい URL を使用

---

## 7. 更新時の注意点

コードを更新してデプロイし直す際の注意点を記載します。

### 7.1. コードの更新

1. Apps Script エディタで `Code.gs` または `index.html` を編集
2. Ctrl+S（または Cmd+S）で保存

### 7.2. 新しいバージョンのデプロイ

#### ⚠️ 重要: デプロイ URL は変わらない

同じデプロイを更新する場合、URL は変更されません。
新しいデプロイを作成すると、新しい URL が発行されます。

#### 既存デプロイを更新する方法（推奨）

1. Apps Script エディタで「デプロイ」→「デプロイを管理」を開く
2. 有効なデプロイの鉛筆アイコン（編集）をクリック
3. 「バージョン」を「新バージョン」に変更
4. 「デプロイ」をクリック

✅ **この方法なら URL は変わらず、LINE ミニアプリの設定変更も不要です。**

#### 新しいデプロイを作成する方法（非推奨）

1. 「デプロイ」→「新しいデプロイ」を実行
2. 新しい URL が発行される
3. **LINE Developers Console で LINE ミニアプリのエンドポイント URL を新しい URL に更新する必要がある**

⚠️ **この方法は URL が変わるため、LINE ミニアプリ設定の更新が必要です。**

### 7.3. LINE ミニアプリ Endpoint URL の変更（新デプロイを作成した場合）

新しいデプロイを作成した場合、LINE ミニアプリのエンドポイント URL を更新する必要があります。

1. LINE Developers Console で LINE ミニアプリのチャネル設定を開く
2. **Developing タブ** を選択
3. 「Basic settings」セクションで「Edit」ボタンをクリック
4. 「Endpoint URL」を新しい GAS Web App URL に変更
5. 「Save」をクリック

**注意**: 各内部チャネル（Developing / Review / Published）を使用している場合は、それぞれのチャネルで Endpoint URL を更新してください。

### 7.4. 権限の再承認が必要な場合

Apps Script で新しい権限が必要な API を使用した場合、再度承認が必要になります。

1. Apps Script エディタで適当な関数を実行
2. 「承認が必要です」ダイアログが表示されたら、承認手順を実施

### 7.5. バージョン管理のベストプラクティス

#### Config シートで `appVersion` を管理

コードを更新したら、Spreadsheet の `Config` シートの `appVersion` を更新することをおすすめします。

**例**:
| key | value | description | updatedAt |
|-----|-------|-------------|-----------|
| appVersion | 1.1.0 | アプリケーションバージョン | 2025-12-30 12:00:00 |

これにより、どのバージョンのコードがデプロイされているかを追跡できます。

#### デプロイ履歴の記録

デプロイを実行したら、以下を記録しておくと便利です:

- デプロイ日時
- バージョン番号
- 変更内容の概要
- デプロイ ID（新規作成の場合）

**記録例（別途メモやスプレッドシートに記録）**:
| 日付 | バージョン | 変更内容 | デプロイID |
|------|-----------|---------|-----------|
| 2025-12-29 | 1.0.0 | 初期デプロイ | AKfycbxXXX... |
| 2025-12-30 | 1.1.0 | アンケート表示機能追加 | （同じ） |

---

## まとめ

この手順書に従えば、数ヶ月〜1年放置した後でも、以下のことができます:

✅ **環境の再構築**
- Google Spreadsheet の作成
- Apps Script のデプロイ
- LINE ミニアプリ（LIFF 統合）チャネルの設定

✅ **設定値の確認**
- Spreadsheet ID
- Web App URL
- LIFF ID（Developing チャネル）
- Config シートの設定値

✅ **動作確認**
- ヘルスチェック API
- HTML 配信
- LIFF 初期化と userId 取得
- ログの記録

✅ **コードの更新とデプロイ**
- 既存デプロイの更新（URL 変更なし）
- 新規デプロイの作成（URL 変更あり）
- LINE ミニアプリ Endpoint URL の更新

---

## 関連ドキュメント

### プロジェクト内ドキュメント

さらに詳しい情報は以下を参照してください:

- **[gas/README.md](../gas/README.md)** - GAS のコード詳細とAPI仕様
- **[gas/SPRINT1.md](../gas/SPRINT1.md)** - Sprint 1 の実装内容
- **[gas/VERIFICATION.md](../gas/VERIFICATION.md)** - 動作確認チェックリスト
- **[sheet-template/README.md](../sheet-template/README.md)** - Spreadsheet テンプレートの使い方
- **[docs/sheets-schema.md](./sheets-schema.md)** - Spreadsheet の詳細スキーマ
- **[docs/pivot-plan.md](./pivot-plan.md)** - アーキテクチャ変更の背景

### LINE 公式ドキュメント

LINE ミニアプリの詳細については、以下の公式ドキュメントを参照してください:

- **[LINE ミニアプリとは](https://developers.line.biz/ja/docs/line-mini-app/discover/introduction/)** - LINE ミニアプリの概要と LIFF 統合について
- **[LINE ミニアプリ：開発を始めよう](https://developers.line.biz/ja/docs/line-mini-app/develop/develop-overview/)** - チャネル作成手順・制約・未認証として利用可能な範囲
- **[LINE Developers Console Guide for LINE Mini App](https://developers.line.biz/en/docs/line-mini-app/discover/console-guide/)** - 内部チャネル、LIFF ID、Endpoint URL の詳細（英語）
- **[LIFF ドキュメント](https://developers.line.biz/ja/docs/liff/)** - LIFF SDK の使い方（LINE ミニアプリでも使用）

---

## 変更履歴

| 日付 | 変更内容 | 担当 |
|------|---------|------|
| 2025-12-29 | 初版作成: セットアップ手順書 | @copilot |
| 2026-01-05 | LINE ミニアプリ（LIFF 統合）チャネル作成前提へ更新 | @copilot |
