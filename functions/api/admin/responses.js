import { jsonResponse, corsPreflightResponse } from '../../_shared/headers.js';
import { callGas, createGasConfigErrorResponse } from '../../_shared/gas.js';
import { verifyAdminAuth } from '../../_shared/admin-auth.js';

export async function onRequestGet({ request, env }) {
  const authResult = verifyAdminAuth(request, env);

  if (!authResult.ok) {
    return authResult.response;
  }

  const url = new URL(request.url);
  const surveyId = url.searchParams.get('surveyId') || '';

  try {
    const query = {};

    if (surveyId) {
      query.surveyId = surveyId;
    }

    const gasResult = await callGas({
      env,
      action: 'getResponses',
      method: 'GET',
      query,
    });

    return jsonResponse(gasResult.data, gasResult.status);
  } catch (error) {
    return createGasConfigErrorResponse(error);
  }
}

export async function onRequestOptions() {
  return corsPreflightResponse();
}
