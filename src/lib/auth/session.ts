import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, SESSION_MAX_AGE_MS } from './constants';

/**
 * Performs a constant-time string comparison to prevent timing attacks
 */
function timingSafeStringCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generates a simple session token using crypto
 */
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Creates a signed session value
 * The session includes a timestamp and signature for validation
 */
export async function createSessionValue(): Promise<string> {
  const token = generateSessionToken();
  const timestamp = Date.now();
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is not set');
  }

  // Create a simple HMAC-like signature
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
  const signature = Array.from(new Uint8Array(signatureBuffer), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');

  return `${token}:${timestamp}:${signature}`;
}

/**
 * Verifies a session value
 */
export async function verifySessionValue(sessionValue: string): Promise<boolean> {
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

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
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

  return timingSafeStringCompare(providedSignature, expectedSignature);
}

/**
 * Creates and sets an admin session cookie
 */
export async function createSession(): Promise<void> {
  const sessionValue = await createSessionValue();
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  });
}

/**
 * Clears the admin session cookie
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Checks if there is a valid admin session
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return false;
  }

  return verifySessionValue(sessionCookie.value);
}
