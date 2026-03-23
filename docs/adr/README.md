# Architecture Decision Records (ADR)

このディレクトリには、yomikikase-planner プロジェクトの重要な判断履歴を記録した ADR（Architecture Decision Records）が含まれています。

> この README は、判断の背景を追いたいエージェントやメンテナ向けです。
> 一般向けの現在状態は、`README.md`, `Milestone.md`, `ArchitectureDesign.md`, `RequirementSpecification.md` を参照してください。

## ADR とは

ADR は、プロジェクトの重要な技術的・アーキテクチャ的決定を文書化する手法です。各 ADR には以下が含まれます：

- **背景（Context）**: なぜこの決定が必要だったのか
- **決定事項（Decision）**: 何を決めたのか
- **理由（Rationale）**: なぜその選択肢を選んだのか
- **影響（Consequences）**: この決定がもたらす結果

## ADR リスト

| 番号 | タイトル | ステータス | 日付 |
|-----|---------|-----------|------|
| [ADR-001](001-adopt-cloudflare-pages-functions.md) | Cloudflare Pages + Functions を採用し、GitHub Pages + JSONP を廃止する | 採用済み | 2026-01-13 |
| [ADR-002](002-documentation-source-of-truth.md) | 現行の一次ソース文書を定義し、初期設計文書を履歴資料として扱う | 採用済み | 2026-03-23 |

## ADR の使いどころ

1. 現在の文書だけでは理由が分からないとき
2. 置き換えられた案や却下した案を確認したいとき
3. エージェントがレビューや設計判断の背景を確認したいとき

## 新しい ADR の作成方法

重要なアーキテクチャ決定を行う際は、以下の手順で ADR を作成してください：

1. **番号の割り当て**: 既存の ADR の最大番号 + 1 を使用（例: 002, 003...）
2. **ファイル名**: `NNN-short-title.md` 形式（例: `002-adopt-database.md`）
3. **テンプレート**: ADR-001 を参考に、以下のセクションを含める:
   - タイトルとメタデータ（ステータス、日付）
   - 背景（Context）
   - 決定事項（Decision）
   - 理由（Rationale）
   - ロールバック手順（該当する場合）
   - やらないこと（スコープ外）
   - 影響範囲
   - 関連ドキュメント
4. **このREADMEの更新**: 新しい ADR を上記のリストに追加

## ADR のステータス

- **提案中 (Proposed)**: 検討中、まだ決定していない
- **採用済み (Accepted)**: 決定済み、実装中または実装完了
- **廃止 (Deprecated)**: 過去の決定だが、現在は使用されていない
- **却下 (Rejected)**: 検討したが採用しなかった
- **置換 (Superseded)**: 別の ADR により置き換えられた

## 関連リソース

- [README](../../README.md) - 現在の全体像
- [Milestone](../../Milestone.md) - 現在の進捗
- [Architecture Design](../../ArchitectureDesign.md) - 現在のシステム構成
- [Requirement Specification](../../RequirementSpecification.md) - 現在の要求仕様
