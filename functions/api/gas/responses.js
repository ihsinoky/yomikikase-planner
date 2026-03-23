import { jsonResponse, corsPreflightResponse } from '../../_shared/headers.js';
import { callGas, createGasConfigErrorResponse } from '../../_shared/gas.js';
import { verifyLineIdToken } from '../../_shared/line-auth.js';

export async function onRequestPost({ request, env }) {
  const authResult = await verifyLineIdToken(request, env);

  if (!authResult.ok) {
    return authResult.response;
  }

  let body;

  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: 'Invalid JSON request body',
      },
      400
    );
  }

  try {
    const gasResult = await callGas({
      env,
      action: 'saveResponse',
      method: 'POST',
      body: {
        surveyId: body.surveyId,
        surveyDateId: body.surveyDateId,
        answer: body.answer,
        notes: body.notes,
        lineUserId: authResult.claims.sub,
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