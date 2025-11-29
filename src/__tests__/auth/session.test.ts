/**
 * Tests for session verification functionality
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { verifySessionValue, createSessionValue } from '@/lib/auth/session';
import { SESSION_MAX_AGE_MS, SESSION_COOKIE_NAME } from '@/lib/auth/constants';

// Create mock functions that we can control
const mockGet = vi.fn();
const mockSet = vi.fn();
const mockDelete = vi.fn();

// Mock next/headers since we're testing in Node.js environment
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    get: mockGet,
    set: mockSet,
    delete: mockDelete,
  })),
}));

describe('verifySessionValue', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.AUTH_SECRET = 'test-secret-for-testing';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should accept valid session values', async () => {
    const sessionValue = await createSessionValue();
    const result = await verifySessionValue(sessionValue);
    expect(result).toBe(true);
  });

  it('should reject session values with invalid signature', async () => {
    const sessionValue = await createSessionValue();
    const parts = sessionValue.split(':');
    // Tamper with the signature
    const tamperedSignature = parts[2].replace(/[0-9a-f]/, 'x');
    const tamperedSession = `${parts[0]}:${parts[1]}:${tamperedSignature}`;

    const result = await verifySessionValue(tamperedSession);
    expect(result).toBe(false);
  });

  it('should reject expired sessions', async () => {
    // Create a session value with an old timestamp
    const token = 'a'.repeat(64); // 32 bytes = 64 hex chars
    const oldTimestamp = Date.now() - SESSION_MAX_AGE_MS - 1000; // Expired by 1 second

    // Create a valid signature for the old timestamp
    const encoder = new TextEncoder();
    const secret = process.env.AUTH_SECRET || 'test-secret';
    const data = encoder.encode(`${token}:${oldTimestamp}`);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
    const signature = Array.from(new Uint8Array(signatureBuffer), (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');

    const expiredSession = `${token}:${oldTimestamp}:${signature}`;
    const result = await verifySessionValue(expiredSession);
    expect(result).toBe(false);
  });

  it('should reject malformed session values with wrong number of parts', async () => {
    // Too few parts
    expect(await verifySessionValue('token:timestamp')).toBe(false);
    expect(await verifySessionValue('onlytoken')).toBe(false);
    expect(await verifySessionValue('')).toBe(false);

    // Too many parts
    expect(await verifySessionValue('a:b:c:d')).toBe(false);
  });

  it('should reject session values with invalid timestamp', async () => {
    const invalidTimestampSession = 'validtoken:notanumber:validsignature';
    const result = await verifySessionValue(invalidTimestampSession);
    expect(result).toBe(false);
  });

  it('should reject session values with NaN timestamp', async () => {
    const nanTimestampSession = 'validtoken:NaN:validsignature';
    const result = await verifySessionValue(nanTimestampSession);
    expect(result).toBe(false);
  });

  it('should detect signature tampering', async () => {
    const sessionValue = await createSessionValue();
    const parts = sessionValue.split(':');

    // Replace signature with completely different one
    const differentSignature = 'a'.repeat(64);
    const tamperedSession = `${parts[0]}:${parts[1]}:${differentSignature}`;

    const result = await verifySessionValue(tamperedSession);
    expect(result).toBe(false);
  });

  it('should detect token tampering', async () => {
    const sessionValue = await createSessionValue();
    const parts = sessionValue.split(':');

    // Tamper with the token
    const tamperedToken = 'b'.repeat(64);
    const tamperedSession = `${tamperedToken}:${parts[1]}:${parts[2]}`;

    const result = await verifySessionValue(tamperedSession);
    expect(result).toBe(false);
  });

  it('should detect timestamp tampering', async () => {
    const sessionValue = await createSessionValue();
    const parts = sessionValue.split(':');

    // Tamper with the timestamp (change to a different valid timestamp)
    const differentTimestamp = Date.now() - 1000;
    const tamperedSession = `${parts[0]}:${differentTimestamp}:${parts[2]}`;

    const result = await verifySessionValue(tamperedSession);
    expect(result).toBe(false);
  });
});

describe('createSessionValue', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.AUTH_SECRET = 'test-secret-for-testing';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create session value in correct format (token:timestamp:signature)', async () => {
    const sessionValue = await createSessionValue();
    const parts = sessionValue.split(':');

    expect(parts.length).toBe(3);
    expect(parts[0].length).toBe(64); // 32 bytes = 64 hex chars for token
    expect(parseInt(parts[1], 10)).toBeGreaterThan(0); // Valid timestamp
    expect(parts[2].length).toBe(64); // HMAC-SHA256 = 32 bytes = 64 hex chars
  });

  it('should generate different tokens for each call', async () => {
    const sessionValue1 = await createSessionValue();
    const sessionValue2 = await createSessionValue();

    const token1 = sessionValue1.split(':')[0];
    const token2 = sessionValue2.split(':')[0];

    expect(token1).not.toBe(token2);
  });

  it('should include accurate timestamp', async () => {
    const before = Date.now();
    const sessionValue = await createSessionValue();
    const after = Date.now();

    const timestamp = parseInt(sessionValue.split(':')[1], 10);

    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it('should create verifiable session values', async () => {
    const sessionValue = await createSessionValue();
    const isValid = await verifySessionValue(sessionValue);
    expect(isValid).toBe(true);
  });

  it('should generate signature using HMAC-SHA256', async () => {
    const sessionValue = await createSessionValue();
    const parts = sessionValue.split(':');
    const [token, timestamp, signature] = parts;

    // Manually verify the signature was created with HMAC-SHA256
    const encoder = new TextEncoder();
    const secret = process.env.AUTH_SECRET || 'test-secret';
    const data = encoder.encode(`${token}:${timestamp}`);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer), (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');

    expect(signature).toBe(expectedSignature);
  });
});

describe('isAuthenticated', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.AUTH_SECRET = 'test-secret-for-testing';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return true for valid sessions', async () => {
    // Need to re-import after mocks are set up
    const { isAuthenticated, createSessionValue } = await import('@/lib/auth/session');
    
    const validSession = await createSessionValue();
    mockGet.mockReturnValue({ value: validSession });

    const result = await isAuthenticated();
    expect(result).toBe(true);
    expect(mockGet).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
  });

  it('should return false when session cookie does not exist', async () => {
    const { isAuthenticated } = await import('@/lib/auth/session');
    
    mockGet.mockReturnValue(undefined);

    const result = await isAuthenticated();
    expect(result).toBe(false);
    expect(mockGet).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
  });

  it('should return false when session cookie value is empty', async () => {
    const { isAuthenticated } = await import('@/lib/auth/session');
    
    mockGet.mockReturnValue({ value: '' });

    const result = await isAuthenticated();
    expect(result).toBe(false);
  });

  it('should return false when session cookie value is null', async () => {
    const { isAuthenticated } = await import('@/lib/auth/session');
    
    mockGet.mockReturnValue({ value: null });

    const result = await isAuthenticated();
    expect(result).toBe(false);
  });

  it('should return false for invalid/expired sessions', async () => {
    const { isAuthenticated } = await import('@/lib/auth/session');
    
    // Create an expired session
    const token = 'a'.repeat(64);
    const oldTimestamp = Date.now() - SESSION_MAX_AGE_MS - 1000;

    const encoder = new TextEncoder();
    const secret = process.env.AUTH_SECRET || 'test-secret';
    const data = encoder.encode(`${token}:${oldTimestamp}`);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
    const signature = Array.from(new Uint8Array(signatureBuffer), (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');

    const expiredSession = `${token}:${oldTimestamp}:${signature}`;
    mockGet.mockReturnValue({ value: expiredSession });

    const result = await isAuthenticated();
    expect(result).toBe(false);
  });

  it('should return false for sessions with invalid signature', async () => {
    const { isAuthenticated, createSessionValue } = await import('@/lib/auth/session');
    
    const validSession = await createSessionValue();
    const parts = validSession.split(':');
    const tamperedSession = `${parts[0]}:${parts[1]}:invalidSignature`;
    
    mockGet.mockReturnValue({ value: tamperedSession });

    const result = await isAuthenticated();
    expect(result).toBe(false);
  });

  it('should correctly delegate to verifySessionValue', async () => {
    const { isAuthenticated, createSessionValue, verifySessionValue } = await import('@/lib/auth/session');
    
    const validSession = await createSessionValue();
    mockGet.mockReturnValue({ value: validSession });

    // Verify that isAuthenticated returns the same result as verifySessionValue
    const isAuthResult = await isAuthenticated();
    const verifyResult = await verifySessionValue(validSession);
    
    expect(isAuthResult).toBe(verifyResult);
    expect(isAuthResult).toBe(true);
  });
});

describe('createSession', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.AUTH_SECRET = 'test-secret-for-testing';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create session cookie with correct name', async () => {
    const { createSession } = await import('@/lib/auth/session');
    
    await createSession();
    
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet.mock.calls[0][0]).toBe(SESSION_COOKIE_NAME);
  });

  it('should create session cookie with httpOnly attribute', async () => {
    const { createSession } = await import('@/lib/auth/session');
    
    await createSession();
    
    const cookieOptions = mockSet.mock.calls[0][2];
    expect(cookieOptions.httpOnly).toBe(true);
  });

  it('should create session cookie with sameSite lax attribute', async () => {
    const { createSession } = await import('@/lib/auth/session');
    
    await createSession();
    
    const cookieOptions = mockSet.mock.calls[0][2];
    expect(cookieOptions.sameSite).toBe('lax');
  });

  it('should create session cookie with correct maxAge', async () => {
    const { createSession } = await import('@/lib/auth/session');
    const { SESSION_MAX_AGE_SECONDS } = await import('@/lib/auth/constants');
    
    await createSession();
    
    const cookieOptions = mockSet.mock.calls[0][2];
    expect(cookieOptions.maxAge).toBe(SESSION_MAX_AGE_SECONDS);
  });

  it('should create session cookie with path set to root', async () => {
    const { createSession } = await import('@/lib/auth/session');
    
    await createSession();
    
    const cookieOptions = mockSet.mock.calls[0][2];
    expect(cookieOptions.path).toBe('/');
  });

  it('should set secure attribute to false in non-production environment', async () => {
    process.env.NODE_ENV = 'development';
    const { createSession } = await import('@/lib/auth/session');
    
    await createSession();
    
    const cookieOptions = mockSet.mock.calls[0][2];
    expect(cookieOptions.secure).toBe(false);
  });

  it('should set secure attribute to true in production environment', async () => {
    process.env.NODE_ENV = 'production';
    const { createSession } = await import('@/lib/auth/session');
    
    await createSession();
    
    const cookieOptions = mockSet.mock.calls[0][2];
    expect(cookieOptions.secure).toBe(true);
  });

  it('should create session value in correct format (token:timestamp:signature)', async () => {
    const { createSession } = await import('@/lib/auth/session');
    
    await createSession();
    
    const sessionValue = mockSet.mock.calls[0][1];
    const parts = sessionValue.split(':');
    
    expect(parts.length).toBe(3);
    expect(parts[0].length).toBe(64); // 32 bytes = 64 hex chars for token
    expect(parseInt(parts[1], 10)).toBeGreaterThan(0); // Valid timestamp
    expect(parts[2].length).toBe(64); // HMAC-SHA256 = 32 bytes = 64 hex chars
  });

  it('should create verifiable session value', async () => {
    const { createSession, verifySessionValue } = await import('@/lib/auth/session');
    
    await createSession();
    
    const sessionValue = mockSet.mock.calls[0][1];
    const isValid = await verifySessionValue(sessionValue);
    
    expect(isValid).toBe(true);
  });
});
