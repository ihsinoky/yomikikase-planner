/**
 * サンプルテスト
 * プロジェクトのテスト基盤が正しく動作することを確認するためのテストです。
 */
import { describe, it, expect } from 'vitest';

describe('Sample Test', () => {
  it('should pass a basic assertion', () => {
    expect(1 + 1).toBe(2);
  });
});
