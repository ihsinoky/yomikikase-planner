/**
 * Tests for login API route
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock next/headers before importing the route
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  validateCredentials: vi.fn(),
  createSession: vi.fn(),
}));

import { POST } from '@/app/api/auth/login/route';
import { NextRequest } from 'next/server';
import { validateCredentials, createSession } from '@/lib/auth';

// Helper to create a mock NextRequest with JSON body
function createMockRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return 400 when username is missing', async () => {
    const request = createMockRequest({ password: 'testpass' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('ユーザー名とパスワードを入力してください');
  });

  it('should return 400 when password is missing', async () => {
    const request = createMockRequest({ username: 'testuser' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('ユーザー名とパスワードを入力してください');
  });

  it('should return 400 when username is empty string', async () => {
    const request = createMockRequest({ username: '', password: 'testpass' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('ユーザー名とパスワードを入力してください');
  });

  it('should return 400 when password is empty string', async () => {
    const request = createMockRequest({ username: 'testuser', password: '' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('ユーザー名とパスワードを入力してください');
  });

  it('should return 400 when username is whitespace only', async () => {
    const request = createMockRequest({ username: '   ', password: 'testpass' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('ユーザー名とパスワードを入力してください');
  });

  it('should return 400 when password is whitespace only', async () => {
    const request = createMockRequest({ username: 'testuser', password: '   ' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('ユーザー名とパスワードを入力してください');
  });

  it('should return 401 when credentials are invalid', async () => {
    vi.mocked(validateCredentials).mockReturnValue(false);

    const request = createMockRequest({ username: 'wronguser', password: 'wrongpass' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('ユーザー名またはパスワードが正しくありません');
    expect(validateCredentials).toHaveBeenCalledWith('wronguser', 'wrongpass');
  });

  it('should return success and create session when credentials are valid', async () => {
    vi.mocked(validateCredentials).mockReturnValue(true);
    vi.mocked(createSession).mockResolvedValue(undefined);

    const request = createMockRequest({ username: 'admin', password: 'correctpass' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(validateCredentials).toHaveBeenCalledWith('admin', 'correctpass');
    expect(createSession).toHaveBeenCalled();
  });

  it('should return 500 when an unexpected error occurs', async () => {
    vi.mocked(validateCredentials).mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const request = createMockRequest({ username: 'admin', password: 'testpass' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('ログイン処理中にエラーが発生しました');
  });

  it('should return 500 when createSession fails', async () => {
    vi.mocked(validateCredentials).mockReturnValue(true);
    vi.mocked(createSession).mockRejectedValue(new Error('Session creation failed'));

    const request = createMockRequest({ username: 'admin', password: 'testpass' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('ログイン処理中にエラーが発生しました');
  });
});
