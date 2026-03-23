import { jsonResponse } from './headers.js';

const LINE_VERIFY_URL = 'https://api.line.me/oauth2/v2.1/verify';

export function getBearerToken(request) {
  const authorization = request.headers.get('Authorization') || '';

  if (!authorization.startsWith('Bearer ')) {
    return '';
  }

  return authorization.slice('Bearer '.length).trim();
}

export function createUnauthorizedResponse(message = 'Unauthorized') {
  return jsonResponse(
    {
      ok: false,
      error: message,
    },
    401
  );
}

export async function verifyLineIdToken(request, env) {
  const idToken = getBearerToken(request);
  const channelId = env.LINE_LOGIN_CHANNEL_ID;

  if (!idToken) {
    return {
      ok: false,
      response: createUnauthorizedResponse('Missing ID token'),
    };
  }

  if (!channelId) {
    return {
      ok: false,
      response: jsonResponse(
        {
          ok: false,
          error: 'LINE_LOGIN_CHANNEL_ID is not configured',
        },
        500
      ),
    };
  }

  const body = new URLSearchParams({
    id_token: idToken,
    client_id: channelId,
  });

  try {
    const response = await fetch(LINE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    const data = await response.json();

    if (!response.ok || !data.sub) {
      return {
        ok: false,
        response: createUnauthorizedResponse('Invalid ID token'),
      };
    }

    return {
      ok: true,
      claims: data,
    };
  } catch (error) {
    return {
      ok: false,
      response: jsonResponse(
        {
          ok: false,
          error: 'Failed to verify ID token',
          message: error.message,
        },
        502
      ),
    };
  }
}