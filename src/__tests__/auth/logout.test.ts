/**
 * Tests for logout API route
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock next/headers before importing the route
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  clearSession: vi.fn(),
}));

import { POST } from '@/app/api/auth/logout/route';
import { clearSession } from '@/lib/auth';

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return success when logout succeeds', async () => {
    vi.mocked(clearSession).mockResolvedValue(undefined);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(clearSession).toHaveBeenCalled();
  });

  it('should clear the session cookie on logout', async () => {
    vi.mocked(clearSession).mockResolvedValue(undefined);

    await POST();

    expect(clearSession).toHaveBeenCalledTimes(1);
  });

  it('should return 500 when an error occurs during logout', async () => {
    vi.mocked(clearSession).mockRejectedValue(new Error('Session clear failed'));

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('ログアウト処理中にエラーが発生しました');
  });
});
