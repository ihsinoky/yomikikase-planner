import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS } from '@/lib/auth/constants';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/admin/login', '/api/auth/login'];

/**
 * Verifies a session value in middleware context (using Edge runtime crypto)
 */
async function verifySessionValue(sessionValue: string, secret: string): Promise<boolean> {
  const parts = sessionValue.split(':');
  if (parts.length !== 3) {
    return false;
  }

  const [token, timestampStr, providedSignature] = parts;
  const timestamp = parseInt(timestampStr, 10);

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if we're accessing protected routes (admin pages or root)
  const isProtectedRoute = pathname === '/' || pathname.startsWith('/admin');

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Check for valid session
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const secret = process.env.AUTH_SECRET || 'dev-secret-please-change';
  const isValid = await verifySessionValue(sessionCookie.value, secret);

  if (!isValid) {
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    // Clear invalid session cookie
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
