/**
 * Tests for LINE ID token verification
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { verifyIdToken } from '@/lib/liff/verifyIdToken';

describe('verifyIdToken', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.LINE_CHANNEL_ID = 'test-channel-id';
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should return user info for valid token', async () => {
    const mockResponse = {
      iss: 'https://access.line.me',
      sub: 'U1234567890abcdef',
      aud: 'test-channel-id',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      name: 'Test User',
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await verifyIdToken('valid-id-token');

    expect(result).toEqual({
      lineUserId: 'U1234567890abcdef',
      displayName: 'Test User',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.line.me/oauth2/v2.1/verify',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: expect.any(URLSearchParams),
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('should return user info without display name if not provided', async () => {
    const mockResponse = {
      iss: 'https://access.line.me',
      sub: 'U1234567890abcdef',
      aud: 'test-channel-id',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await verifyIdToken('valid-id-token');

    expect(result).toEqual({
      lineUserId: 'U1234567890abcdef',
      displayName: undefined,
    });
  });

  it('should throw error when LINE_CHANNEL_ID is not set', async () => {
    delete process.env.LINE_CHANNEL_ID;

    await expect(verifyIdToken('some-token')).rejects.toThrow(
      'LINE_CHANNEL_ID environment variable is not set'
    );
  });

  it('should throw error when LINE API returns error', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'invalid_request',
        error_description: 'Invalid ID token',
      }),
    } as Response);

    await expect(verifyIdToken('invalid-token')).rejects.toThrow('Invalid ID token');
  });

  it('should throw error when token audience does not match channel ID', async () => {
    const mockResponse = {
      iss: 'https://access.line.me',
      sub: 'U1234567890abcdef',
      aud: 'different-channel-id',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    await expect(verifyIdToken('valid-token-wrong-channel')).rejects.toThrow(
      'Token was not issued for this channel'
    );
  });
});
