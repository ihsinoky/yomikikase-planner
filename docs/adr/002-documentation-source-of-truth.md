# ADR-002: 現行の一次ソース文書を定義し、初期設計文書を履歴資料として扱う

**ステータス**: 採用済み (Accepted)  
**決定日**: 2026年3月23日  
**更新日**: 2026年3月23日

---

## 背景（Context）

このリポジトリでは、当初 Next.js / Prisma を前提に設計を進めていたが、その後 Google Spreadsheet + Google Apps Script + Cloudflare Pages / Functions + LIFF へ方針転換した。

方針転換後、以下のような状態が発生していた。

- `README.md`, `Milestone.md`, Sprint 完了報告、Cloudflare 移行レポートは現行構成を反映している
- `ArchitectureDesign.md`, `RequirementSpecification.md`, `AGENT.md` には初期構想が多く残っている
- 文書ごとに前提が異なるため、「何を現在の正とみなすか」が曖昧になっていた

この状態では、将来の開発者やエージェントが古い文書を一次ソースと誤認し、誤った前提で実装やレビューを進めるリスクがある。

---

## 決定事項（Decision）

**現行実装・進捗・運用判断の一次ソースを明示的に定義し、初期設計文書は履歴資料として扱う。**

### 一次ソースとして扱う文書

- `README.md`
- `Milestone.md`
- `docs/pivot-plan.md`
- `docs/sprint0-completion-status.md`
- `docs/sprint1-completion-report.md`
- `docs/cloudflare-migration-completion.md`
- `docs/adr/001-adopt-cloudflare-pages-functions.md`
- この ADR (`docs/adr/002-documentation-source-of-truth.md`)

### 履歴資料として扱う文書

- `ArchitectureDesign.md`
- `RequirementSpecification.md`
- README 内の「初期構想の記録（履歴資料）」節
- 初期構想を説明するその他の旧計画メモ

### 運用ルール

1. 現行の実装判断・レビュー判断は一次ソースを優先する
2. 履歴資料は背景理解のために残すが、現行仕様の根拠には使わない
3. 古い前提を多く含む文書の冒頭には、この ADR への参照を置く
4. 重要な判断ルールを追加する場合は、本文への注記だけで済ませず ADR として記録する

---

## 理由（Rationale）

### 1. 現行実装との整合性を保つため

現時点のコードベースは、Cloudflare Pages / Functions と GAS を前提としている。初期の Next.js / Prisma 前提文書をそのまま一次ソースとして扱うと、実装済み構成と齟齬が生じる。

### 2. 文書の役割を分離するため

すべての文書を現行仕様に完全書き換えするよりも、以下の役割分担を明確にする方が現実的である。

- 一次ソース: 今の意思決定と運用の基準
- 履歴資料: なぜ過去にその設計を考えたのかを知るための記録

### 3. 将来の更新コストを下げるため

今後、進捗やアーキテクチャが変わった場合でも、「どこをまず更新すべきか」が明確になる。結果として文書更新の漏れを減らせる。

---

## 影響（Consequences）

### 良い影響

- 現行仕様の参照先が明確になる
- エージェントや将来の開発者が古い前提で判断しにくくなる
- 進捗確認時に `Milestone.md` と完了報告を優先すべきことが明文化される

### 悪い影響 / トレードオフ

- 文書が「現行仕様」と「履歴資料」に分かれるため、背景理解には複数文書を読む必要がある
- 初期文書は完全には更新されないため、注意書きなしで読むと依然として誤解の余地がある

---

## やらないこと

- `ArchitectureDesign.md` と `RequirementSpecification.md` をこの ADR で全面書き換えすること
- 履歴資料を削除すること
- すべての古い記述を一度に現行仕様へ統一すること

必要であれば別タスクとして、履歴資料の全面刷新または再編成を行う。

---

## 関連ドキュメント

- [ADR-001: Cloudflare Pages + Functions を採用し、GitHub Pages + JSONP を廃止する](001-adopt-cloudflare-pages-functions.md)
- [Milestone](../../Milestone.md)
- [README](../../README.md)
- [軌道修正計画](../pivot-plan.md)
- [Sprint 0 Completion Status](../sprint0-completion-status.md)
- [Sprint 1 Completion Report](../sprint1-completion-report.md)
- [Cloudflare Migration Completion](../cloudflare-migration-completion.md)