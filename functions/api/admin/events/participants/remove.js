import { jsonResponse, corsPreflightResponse } from '../../../../_shared/headers.js';
import { callGas, createGasConfigErrorResponse } from '../../../../_shared/gas.js';
import { verifyAdminAuth } from '../../../../_shared/admin-auth.js';

export async function onRequestPost({ request, env }) {
  const authResult = verifyAdminAuth(request, env);

  if (!authResult.ok) {
    return authResult.response;
  }

  let body;

  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse(
      { ok: false, error: 'Invalid JSON request body' },
      400
    );
  }

  if (!body || typeof body !== 'object' || Array.isArray(body) || !body.participantId) {
    return jsonResponse(
      { ok: false, error: 'participantId is required' },
      400
    );
  }

  try {
    const gasResult = await callGas({
      env,
      action: 'removeEventParticipant',
      method: 'POST',
      body: {
        participantId: body.participantId,
      },
    });

    return jsonResponse(gasResult.data, gasResult.status);
  } catch (error) {
    return createGasConfigErrorResponse(error);
  }
}

export async function onRequestOptions() {
  return corsPreflightResponse();
}
