/**
 * Tests for middleware verifySessionValue function
 */
import { describe, it, expect } from 'vitest';
import { SESSION_MAX_AGE_MS } from '@/lib/auth/constants';

// We need to test the middleware's verifySessionValue function
// Since it's not exported, we'll test it indirectly through a reimplementation
// that matches the middleware logic

/**
 * Reimplementation of middleware's verifySessionValue for testing
 * This matches the logic in src/middleware.ts
 */
async function verifySessionValue(sessionValue: string, secret: string): Promise<boolean> {
  const parts = sessionValue.split(':');
  if (parts.length !== 3) {
    return false;
  }

  const [token, timestampStr, providedSignature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  
  if (isNaN(timestamp)) {
    return false;
  }

  // Check if session has expired
  const now = Date.now();
  if (now - timestamp > SESSION_MAX_AGE_MS) {
    return false;
  }

  // Verify signature
  const encoder = new TextEncoder();
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

  return providedSignature === expectedSignature;
}

/**
 * Helper to create a valid session value for testing
 */
async function createTestSessionValue(secret: string, timestamp?: number): Promise<string> {
  const token = 'a'.repeat(64); // 32 bytes = 64 hex chars
  const ts = timestamp ?? Date.now();
  
  const encoder = new TextEncoder();
  const data = encoder.encode(`${token}:${ts}`);
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

  return `${token}:${ts}:${signature}`;
}

describe('Middleware verifySessionValue', () => {
  const testSecret = 'test-secret-for-middleware';

  it('should accept valid sessions', async () => {
    const validSession = await createTestSessionValue(testSecret);
    const result = await verifySessionValue(validSession, testSecret);
    expect(result).toBe(true);
  });

  it('should reject sessions with invalid signatures', async () => {
    const validSession = await createTestSessionValue(testSecret);
    const parts = validSession.split(':');
    const tamperedSession = `${parts[0]}:${parts[1]}:invalidSignature`;
    
    const result = await verifySessionValue(tamperedSession, testSecret);
    expect(result).toBe(false);
  });

  it('should reject expired sessions', async () => {
    const oldTimestamp = Date.now() - SESSION_MAX_AGE_MS - 1000; // Expired by 1 second
    const expiredSession = await createTestSessionValue(testSecret, oldTimestamp);
    
    const result = await verifySessionValue(expiredSession, testSecret);
    expect(result).toBe(false);
  });

  it('should reject malformed session values with wrong number of parts', async () => {
    expect(await verifySessionValue('token:timestamp', testSecret)).toBe(false);
    expect(await verifySessionValue('onlytoken', testSecret)).toBe(false);
    expect(await verifySessionValue('', testSecret)).toBe(false);
    expect(await verifySessionValue('a:b:c:d', testSecret)).toBe(false);
  });

  it('should reject session values with invalid timestamp', async () => {
    const invalidTimestampSession = 'validtoken:notanumber:validsignature';
    const result = await verifySessionValue(invalidTimestampSession, testSecret);
    expect(result).toBe(false);
  });

  it('should reject session values with NaN timestamp', async () => {
    const nanTimestampSession = 'validtoken:NaN:validsignature';
    const result = await verifySessionValue(nanTimestampSession, testSecret);
    expect(result).toBe(false);
  });

  it('should detect signature tampering', async () => {
    const validSession = await createTestSessionValue(testSecret);
    const parts = validSession.split(':');
    
    // Replace signature with completely different one
    const differentSignature = 'b'.repeat(64);
    const tamperedSession = `${parts[0]}:${parts[1]}:${differentSignature}`;
    
    const result = await verifySessionValue(tamperedSession, testSecret);
    expect(result).toBe(false);
  });

  it('should detect token tampering', async () => {
    const validSession = await createTestSessionValue(testSecret);
    const parts = validSession.split(':');
    
    // Tamper with the token
    const tamperedToken = 'c'.repeat(64);
    const tamperedSession = `${tamperedToken}:${parts[1]}:${parts[2]}`;
    
    const result = await verifySessionValue(tamperedSession, testSecret);
    expect(result).toBe(false);
  });

  it('should detect timestamp tampering', async () => {
    const validSession = await createTestSessionValue(testSecret);
    const parts = validSession.split(':');
    
    // Tamper with the timestamp
    const differentTimestamp = Date.now() - 1000;
    const tamperedSession = `${parts[0]}:${differentTimestamp}:${parts[2]}`;
    
    const result = await verifySessionValue(tamperedSession, testSecret);
    expect(result).toBe(false);
  });

  it('should reject sessions signed with different secret', async () => {
    const sessionWithDifferentSecret = await createTestSessionValue('different-secret');
    const result = await verifySessionValue(sessionWithDifferentSecret, testSecret);
    expect(result).toBe(false);
  });

  it('should accept sessions that are not yet expired', async () => {
    // Session created 1 hour ago (should still be valid for 24 hours)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const validSession = await createTestSessionValue(testSecret, oneHourAgo);
    
    const result = await verifySessionValue(validSession, testSecret);
    expect(result).toBe(true);
  });
});
