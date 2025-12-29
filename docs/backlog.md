# Technical Backlog

このドキュメントは、将来的に対応すべき技術的改善項目（Technical Debt）を記録します。

## Sprint 2 以降で検討すべき項目

### パフォーマンス最適化

#### ログ書き込みの最適化
- **Issue**: `logToSheet` 関数が毎回ロックを取得するため、高負荷時にボトルネックになる可能性
- **Current**: 各HTTPリクエストで最低1回のログエントリが生成され、すべてのログ書き込みがシリアライズされる
- **Proposed Solution**: 
  - バッチ処理によるログ書き込み
  - 非クリティカルなログにキューベースのアプローチを採用
  - インメモリバッファを使用し、定期的にまとめて書き込む
- **Priority**: Medium
- **Context**: Sprint 1 では骨格実装のため、実際の負荷パターンが不明。実運用で性能問題が確認されてから対応する
- **Related Code**: `gas/Code.gs` - `logToSheet()` function (lines 176-205)
- **Related PR Comment**: [PR Review Comment #2649972229](https://github.com/ihsinoky/yomikikase-planner/pull/XXX#discussion_r2649972229)
- **Date Added**: 2025-12-29
- **Added By**: Code Review

#### generateLogId の効率化
- **Issue**: `generateLogId` が `withLock` 内で呼ばれ、その中で再度 `getLogsSheet()` を呼び出すため、ネストした操作が非効率的
- **Current**: ロックされたセクション内でシート操作が複数回実行される
- **Proposed Solution**: 
  - シート参照をキャッシュする
  - ロック外で必要な情報を事前取得する
  - ID生成ロジックを最適化
- **Priority**: Low
- **Context**: 実測で問題が確認されてから対応するのが適切
- **Related Code**: `gas/Code.gs` - `generateLogId()` function (lines 212-235)
- **Related PR Comment**: [PR Review Comment #2649972232](https://github.com/ihsinoky/yomikikase-planner/pull/XXX#discussion_r2649972232)
- **Date Added**: 2025-12-29
- **Added By**: Code Review
- **Partial Fix**: ID フォーマットのバリデーションは commit 4d5b3e9 で対応済み

## 完了済み項目

### Sprint 1 で対応済み

- ✅ LIFF SDK バージョン固定 (commit: 8bdcf23)
- ✅ logToSheet のエラーハンドリング改善 (commit: 8bdcf23)
- ✅ withLock のエラーメッセージ改善 (commit: 8bdcf23)
- ✅ 再帰的ログ防止のためのtry/catch追加 (commit: 8bdcf23)
- ✅ 未使用CSS削除 (commit: 8bdcf23)
- ✅ generateLogId のバリデーション追加 (commit: 4d5b3e9)

## バックログの使い方

1. **新規追加**: コードレビューや開発中に発見した改善点を記録
2. **優先度設定**: Critical / High / Medium / Low で優先度を設定
3. **Sprint計画**: 各Sprintで対応する項目を選択
4. **完了記録**: 対応完了後は「完了済み項目」セクションに移動

## 関連ドキュメント

- [Milestone](../Milestone.md)
- [Sprint 0 Completion Status](./sprint0-completion-status.md)
- [Pivot Plan](./pivot-plan.md)
