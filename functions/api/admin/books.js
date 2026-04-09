import { jsonResponse, corsPreflightResponse } from '../../_shared/headers.js';
import { callGas, createGasConfigErrorResponse } from '../../_shared/gas.js';
import { verifyAdminAuth } from '../../_shared/admin-auth.js';

export async function onRequestGet({ request, env }) {
  const authResult = verifyAdminAuth(request, env);

  if (!authResult.ok) {
    return authResult.response;
  }

  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';

  try {
    const query = {};

    if (q) {
      query.q = q;
    }

    const gasResult = await callGas({
      env,
      action: 'listBooks',
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
