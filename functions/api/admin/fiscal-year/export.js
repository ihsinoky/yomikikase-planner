import { jsonResponse, corsPreflightResponse } from '../../../_shared/headers.js';
import { callGas, createGasConfigErrorResponse } from '../../../_shared/gas.js';
import { verifyAdminAuth } from '../../../_shared/admin-auth.js';

export async function onRequestGet({ request, env }) {
  const authResult = verifyAdminAuth(request, env);

  if (!authResult.ok) {
    return authResult.response;
  }

  const url = new URL(request.url);
  const fiscalYear = url.searchParams.get('fiscalYear') || '';

  if (!fiscalYear) {
    return jsonResponse(
      { ok: false, error: 'fiscalYear query parameter is required' },
      400
    );
  }

  try {
    const gasResult = await callGas({
      env,
      action: 'exportFiscalYearData',
      method: 'GET',
      query: { fiscalYear },
    });

    return jsonResponse(gasResult.data, gasResult.status);
  } catch (error) {
    return createGasConfigErrorResponse(error);
  }
}

export async function onRequestOptions() {
  return corsPreflightResponse();
}
