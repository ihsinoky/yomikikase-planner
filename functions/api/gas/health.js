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

    // Make request to GAS with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    let gasResponse;
    try {
      gasResponse = await fetch(gasUrl.toString(), {
        method: 'GET',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // Hybrid error handling: Check both HTTP status and JSON body
    // This supports both current GAS (always HTTP 200) and future implementations
    
    // First check HTTP status code (for future-proofing or non-GAS services)
    if (!gasResponse.ok) {
      // Try to parse error response if available
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
          // Return other errors with parsed message
          return new Response(
            JSON.stringify({
              ok: false,
              error: 'Upstream service returned an error',
              message: errorData.error || errorData.message || 'Unknown error',
              statusCode: gasResponse.status,
            }),
            {
              status: 502, // Bad Gateway
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
        } catch (e) {
          // Failed to parse error response, fall through to generic error
        }
      }
      
      // Generic HTTP error without parseable JSON
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

    // Parse the JSON response (for current GAS or successful responses)
    const gasData = await gasResponse.json();
    
    // Validate response structure
    if (typeof gasData !== 'object' || gasData === null) {
      throw new Error('Invalid response format from upstream service');
    }

    // Check JSON body for errors (handles current GAS implementation)
    if (gasData.ok === false) {
      // Check if it's an authentication error
      if (gasData.error === 'Unauthorized') {
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
      
      // Other error from GAS
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Upstream service returned an error',
          message: gasData.error || 'Unknown error',
        }),
        {
          status: 502, // Bad Gateway
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Forward the successful response as-is
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
    // Handle timeout errors specifically
    if (error.name === 'AbortError') {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Upstream service timeout',
          message: 'Request to GAS took too long',
        }),
        {
          status: 504, // Gateway Timeout
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
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
