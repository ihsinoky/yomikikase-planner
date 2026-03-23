import { jsonResponse } from './headers.js';

const GAS_TIMEOUT_MS = 10000;

function getGasConfig(env) {
  const gasBaseUrl = env.GAS_BASE_URL;
  const gasApiKey = env.GAS_API_KEY;

  if (!gasBaseUrl) {
    throw new Error('GAS_BASE_URL is not configured');
  }

  if (!gasApiKey) {
    throw new Error('GAS_API_KEY is not configured');
  }

  return { gasBaseUrl, gasApiKey };
}

export function createGasConfigErrorResponse(error) {
  return jsonResponse(
    {
      ok: false,
      error: error.message,
    },
    500
  );
}

export async function callGas({ env, action, method = 'GET', query = {}, body }) {
  const { gasBaseUrl, gasApiKey } = getGasConfig(env);
  const gasUrl = new URL(gasBaseUrl);
  const upperMethod = method.toUpperCase();

  gasUrl.searchParams.set('action', action);
  gasUrl.searchParams.set('apiKey', gasApiKey);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      gasUrl.searchParams.set(key, String(value));
    }
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GAS_TIMEOUT_MS);

  try {
    const init = {
      method: upperMethod,
      signal: controller.signal,
    };

    if (upperMethod !== 'GET') {
      init.headers = {
        'Content-Type': 'application/json',
      };
      init.body = JSON.stringify(body || {});
    }

    const response = await fetch(gasUrl.toString(), init);
    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        status: 502,
        data: {
          ok: false,
          error: 'Upstream service returned an error',
          statusCode: response.status,
          message: data && (data.error || data.message) ? data.error || data.message : 'Unknown error',
        },
      };
    }

    if (data.ok === false) {
      return {
        ok: false,
        status: data.error === 'Unauthorized' ? 502 : 400,
        data: {
          ok: false,
          error: data.error || 'Upstream service returned an error',
        },
      };
    }

    return {
      ok: true,
      status: 200,
      data,
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        ok: false,
        status: 504,
        data: {
          ok: false,
          error: 'Upstream service timeout',
        },
      };
    }

    return {
      ok: false,
      status: 502,
      data: {
        ok: false,
        error: 'Failed to communicate with upstream service',
        message: error.message,
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}