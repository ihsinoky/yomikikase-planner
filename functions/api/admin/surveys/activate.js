import { jsonResponse, corsPreflightResponse } from '../../../_shared/headers.js';
import { callGas, createGasConfigErrorResponse } from '../../../_shared/gas.js';

export async function onRequestPost({ request, env }) {
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

  if (!body.surveyId) {
    return jsonResponse(
      {
        ok: false,
        error: 'surveyId is required',
      },
      400
    );
  }

  try {
    const gasResult = await callGas({
      env,
      action: 'switchActiveSurvey',
      method: 'POST',
      body: {
        surveyId: body.surveyId,
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
