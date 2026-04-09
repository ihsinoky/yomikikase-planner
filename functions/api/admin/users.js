import { jsonResponse, corsPreflightResponse } from '../../_shared/headers.js';
import { callGas, createGasConfigErrorResponse } from '../../_shared/gas.js';
import { verifyAdminAuth } from '../../_shared/admin-auth.js';

export async function onRequestGet({ request, env }) {
  const authResult = verifyAdminAuth(request, env);

  if (!authResult.ok) {
    return authResult.response;
  }

  const url = new URL(request.url);
  const fiscalYear = url.searchParams.get('fiscalYear') || '';

  try {
    const query = {};

    if (fiscalYear) {
      query.fiscalYear = fiscalYear;
    }

    const gasResult = await callGas({
      env,
      action: 'listUsers',
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
