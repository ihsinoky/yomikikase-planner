/**
 * Shared utility for CORS and Security headers
 * 
 * This module provides common headers used across Cloudflare Pages Functions.
 */

/**
 * Standard CORS headers for API endpoints
 * Allows cross-origin access from any origin (read-only public APIs)
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400', // 24 hours
};

/**
 * Standard security headers for API endpoints
 * Provides defense-in-depth against common web vulnerabilities
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'none'",
  'Referrer-Policy': 'no-referrer',
};

/**
 * Create a JSON response with standard CORS and security headers
 * 
 * @param {Object} data - Data to be JSON-encoded
 * @param {number} status - HTTP status code (default: 200)
 * @param {Object} additionalHeaders - Additional headers to include
 * @returns {Response} Response object with headers
 */
export function jsonResponse(data, status = 200, additionalHeaders = {}) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS,
        ...SECURITY_HEADERS,
        ...additionalHeaders,
      },
    }
  );
}

/**
 * Create an OPTIONS response for CORS preflight
 * 
 * @returns {Response} 204 No Content response with CORS headers
 */
export function corsPreflightResponse() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
