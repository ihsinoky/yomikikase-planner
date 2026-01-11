/**
 * Cloudflare Pages Functions - Health Check Endpoint
 * 
 * This endpoint is used to verify that the Pages Functions are working correctly.
 * It returns a simple JSON response with status 200.
 * 
 * @param {Request} request - The incoming request
 * @returns {Response} JSON response with { "ok": true }
 */
export async function onRequest(request) {
  return new Response(
    JSON.stringify({ ok: true }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
