import { jsonResponse, corsPreflightResponse } from '../../../_shared/headers.js';
import { callGas, createGasConfigErrorResponse } from '../../../_shared/gas.js';
import { verifyAdminAuth } from '../../../_shared/admin-auth.js';

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

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonResponse(
      { ok: false, error: 'Request body must be a JSON object' },
      400
    );
  }

  if (!body.bookId || !body.fiscalYear || !body.readDate || !body.targetGrade) {
    return jsonResponse(
      { ok: false, error: 'bookId, fiscalYear, readDate, targetGrade are required' },
      400
    );
  }

  try {
    const gasResult = await callGas({
      env,
      action: 'registerReadingRecord',
      method: 'POST',
      body: {
        bookId: body.bookId,
        fiscalYear: body.fiscalYear,
        readDate: body.readDate,
        targetGrade: body.targetGrade,
        className: body.className || '',
        eventId: body.eventId || '',
        readerUserId: body.readerUserId || '',
        notes: body.notes || '',
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
