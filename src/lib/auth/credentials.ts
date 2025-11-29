/**
 * Performs a constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);

  // If lengths differ, we still need to do a comparison to maintain constant time
  // We'll compare against a buffer of the same length as bufA
  const compareLength = Math.max(bufA.length, bufB.length);

  let result = bufA.length === bufB.length ? 0 : 1;

  for (let i = 0; i < compareLength; i++) {
    const byteA = i < bufA.length ? bufA[i] : 0;
    const byteB = i < bufB.length ? bufB[i] : 0;
    result |= byteA ^ byteB;
  }

  return result === 0;
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
