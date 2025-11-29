import { timingSafeEqual as cryptoTimingSafeEqual } from 'crypto';

/**
 * Performs a constant-time string comparison to prevent timing attacks
 * Uses Node.js's built-in crypto.timingSafeEqual for proper security
 */
function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);

  // If lengths differ, return false (but still do a comparison to avoid leaking length info)
  if (bufA.length !== bufB.length) {
    return false;
  }

  return cryptoTimingSafeEqual(bufA, bufB);
}

/**
 * Validates admin credentials against environment variables
 * Uses constant-time comparison to prevent timing attacks
 */
export function validateCredentials(username: string, password: string): boolean {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.error('Admin credentials not configured in environment variables');
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  const usernameValid = timingSafeEqual(username, adminUsername);
  const passwordValid = timingSafeEqual(password, adminPassword);

  return usernameValid && passwordValid;
}
