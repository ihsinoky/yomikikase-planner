import { jsonResponse } from './headers.js';

export function verifyAdminAuth(request, env) {
  var adminApiKey = env.ADMIN_API_KEY;

  if (!adminApiKey) {
    return {
      ok: false,
      response: jsonResponse(
        {
          ok: false,
          error: 'ADMIN_API_KEY is not configured',
        },
        500
      ),
    };
  }

  var authorization = request.headers.get('Authorization') || '';

  if (!authorization.startsWith('Bearer ')) {
    return {
      ok: false,
      response: jsonResponse(
        {
          ok: false,
          error: 'Missing admin authorization',
        },
        401
      ),
    };
  }

  var token = authorization.slice('Bearer '.length).trim();

  if (token.length !== adminApiKey.length || token !== adminApiKey) {
    return {
      ok: false,
      response: jsonResponse(
        {
          ok: false,
          error: 'Invalid admin authorization',
        },
        403
      ),
    };
  }

  return { ok: true };
}
