/**
 * Cloudflare Pages Functions - GAS Health Check Proxy
 * 
 * This endpoint proxies requests to the Google Apps Script Web App health endpoint.
 * It adds authentication via API key (as query parameter) and returns a proper JSON response.
 * 
 * @param {Object} context - Cloudflare Pages Functions context
 * @param {Request} context.request - The incoming request
 * @param {Object} context.env - Environment variables (GAS_BASE_URL, GAS_API_KEY)
 * @returns {Response} JSON response from GAS or error response
 */
export async function onRequestGet({ request, env }) {
  // Validate required environment variables
  const gasBaseUrl = env.GAS_BASE_URL;
  const gasApiKey = env.GAS_API_KEY;

  if (!gasBaseUrl) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'GAS_BASE_URL is not configured',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  if (!gasApiKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'GAS_API_KEY is not configured',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    // Construct GAS health check URL
    const gasUrl = new URL(gasBaseUrl);
    gasUrl.searchParams.set('action', 'health');
    gasUrl.searchParams.set('apiKey', gasApiKey);

    // Make request to GAS
    const gasResponse = await fetch(gasUrl.toString(), {
      method: 'GET',
    });

    // Check if GAS returned a successful response
    if (!gasResponse.ok) {
      // Check if it's an authentication error
      const contentType = gasResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await gasResponse.json();
          if (errorData.error === 'Unauthorized') {
            return new Response(
              JSON.stringify({
                ok: false,
                error: 'Authentication failed with upstream service',
              }),
              {
                status: 502, // Bad Gateway
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );
          }
        } catch (e) {
          // Failed to parse error response, fall through to generic error
        }
      }
      
      // GAS returned an error status (generic)
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Upstream service returned an error',
          statusCode: gasResponse.status,
        }),
        {
          status: 502, // Bad Gateway
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Parse and return the GAS response
    const gasData = await gasResponse.json();

    return new Response(
      JSON.stringify(gasData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    // Network error or JSON parsing error
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'Failed to communicate with upstream service',
        message: error.message,
      }),
      {
        status: 502, // Bad Gateway
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
