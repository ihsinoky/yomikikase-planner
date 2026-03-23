import { jsonResponse, corsPreflightResponse } from '../_shared/headers.js';
import { callGas, createGasConfigErrorResponse } from '../_shared/gas.js';
import { verifyLineIdToken } from '../_shared/line-auth.js';

export async function onRequestGet({ request, env }) {
  const authResult = await verifyLineIdToken(request, env);

  if (!authResult.ok) {
    return authResult.response;
  }

  try {
    const gasResult = await callGas({
      env,
      action: 'getUser',
      method: 'GET',
      query: {
        lineUserId: authResult.claims.sub,
      },
    });

    return jsonResponse(gasResult.data, gasResult.status);
  } catch (error) {
    return createGasConfigErrorResponse(error);
  }
}

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
      action: 'registerUser',
      method: 'POST',
      body: {
        lineUserId: authResult.claims.sub,
        displayName: authResult.claims.name || body.displayName || '',
        childName: body.childName,
        grade: body.grade,
        class: body.class,
        fiscalYear: body.fiscalYear,
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