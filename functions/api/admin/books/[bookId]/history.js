import { jsonResponse, corsPreflightResponse } from '../../../../_shared/headers.js';
import { callGas, createGasConfigErrorResponse } from '../../../../_shared/gas.js';
import { verifyAdminAuth } from '../../../../_shared/admin-auth.js';

export async function onRequestGet({ request, env, params }) {
  const authResult = verifyAdminAuth(request, env);

  if (!authResult.ok) {
    return authResult.response;
  }

  const bookId = params.bookId;

  if (!bookId || !/^book_\d+$/.test(bookId)) {
    return jsonResponse(
      { ok: false, error: 'Valid bookId is required (e.g. book_001)' },
      400
    );
  }

  try {
    const gasResult = await callGas({
      env,
      action: 'getBookHistory',
      method: 'GET',
      query: { bookId },
    });

    return jsonResponse(gasResult.data, gasResult.status);
  } catch (error) {
    return createGasConfigErrorResponse(error);
  }
}

export async function onRequestOptions() {
  return corsPreflightResponse();
}
