# AGENTS.md

このファイルには、このリポジトリで AI エージェントに毎回守らせたいことだけを書く。

## 一次ソース

- 現行仕様・用語・優先順位の Single Source of Truth は `README.md`、`RequirementSpecification.md`、`ArchitectureDesign.md`、`Milestone.md`、`docs/pivot-plan.md`
- 一般向け文書は最新の真の状態だけを記録する。判断の背景が必要な場合のみ `docs/adr/` を参照する
- データの正は Google Spreadsheet。既存の Spreadsheet + GAS + Cloudflare Pages Functions + LIFF の境界を崩さない
- フロントエンドは原則 `/api/*` のみを呼び、GAS 直結や迂回経路を増やさない

## 開発原則

- 既存の設計、ユビキタス言語、レイヤ境界、依存方向を尊重する
- premature generalization を避け、最小差分で変更する
- atomic な変更でトレーサビリティを保つ
- 依存追加より既存の Spreadsheet / GAS / Functions 構成を活かす
- 秘密情報、個人情報、認証情報をコード、設定、ログに残さない

## 実装と検証

- t-wada TDD を実践する
- 自動テストと再現可能な確認手順を fitness function / guardrail として扱う
- 壊れやすい境界を優先して検証する: Spreadsheet / GAS / Functions、API 入出力、LIFF の主要フロー
- レビュー不能な量のコードを一度に生成しない
- 失敗は AI 可読な形で観測できる状態を保つ
- `main` ブランチを壊さず、CI がある変更では CI をグリーンに保つ

## 文書とコミュニケーション

- 人間向けの文書、Issue、PR、レビューコメントは日本語を正本にする
- Docs as Code を前提に、Design Doc、ADR、タスクリスト、検証手順はプレーンテキストで管理する
- 参照資料は日本語を優先し、英語の一次情報を使う場合は日本語要約を添える

## 変更管理

- コミットメッセージは Conventional Commits に寄せる
- backward compatibility を意識し、破壊的変更は SemVer 相当の変更として migration path を明示する
- フロー効率を優先し、PR 在庫を積み上げない
- PR は小さく保ち、レビュー容易性と可逆性を維持する
- PR には変更概要、未解決事項、手動確認点、ロールバックしやすさを明示する
- 明示的な指示がない限り、`main` へ直接 push せず PR 経由で反映する
