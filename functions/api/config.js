/**
 * Cloudflare Pages Functions - Configuration Endpoint
 * 
 * This endpoint provides LIFF and application configuration to the frontend.
 * It returns settings needed by the LIFF application such as:
 * - LIFF ID
 * - API base URL
 * - Environment name
 * 
 * @param {Object} context - Cloudflare Pages Functions context
 * @param {Request} context.request - The incoming request
 * @param {Object} context.env - Environment variables
 * @returns {Response} JSON response with configuration
 */

import { jsonResponse, corsPreflightResponse } from '../_shared/headers.js';

export async function onRequestGet({ request, env }) {
  const requestUrl = new URL(request.url);
  console.log('[Cloudflare] Config request received:', {
    path: requestUrl.pathname,
    timestamp: new Date().toISOString(),
  });

  // Get configuration from environment variables
  const liffId = env.LIFF_ID || null;
  const environmentName = env.ENVIRONMENT_NAME || 'production';
  
  // API base URL is the current origin
  const url = new URL(request.url);
  const apiBaseUrl = `${url.protocol}//${url.host}/api`;
  
  // Build configuration object
  const config = {
    liffId,
    apiBaseUrl,
    environment: environmentName,
  };
  
  // Log warning if LIFF_ID is not configured
  if (!liffId) {
    console.warn('[Cloudflare] LIFF_ID is not configured');
  }
  
  console.log('[Cloudflare] Config response:', {
    hasLiffId: !!liffId,
    environment: environmentName,
  });
  
  return jsonResponse(config);
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function onRequestOptions() {
  return corsPreflightResponse();
}
