/**
 * Cloudflare Pages Functions - Health Check Endpoint
 * 
 * This endpoint is used to verify that the Pages Functions are working correctly.
 * It returns a simple JSON response with status 200.
 * 
 * @param {Object} context - Cloudflare Pages Functions context
 * @param {Request} context.request - The incoming request
 * @returns {Response} JSON response with { "ok": true }
 */

import { jsonResponse, corsPreflightResponse } from '../_shared/headers.js';

export async function onRequestGet() {
  return jsonResponse({ ok: true });
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function onRequestOptions() {
  return corsPreflightResponse();
}
