import { jsonResponse, corsPreflightResponse } from '../_shared/headers.js';
import { callGas, createGasConfigErrorResponse } from '../_shared/gas.js';

export async function onRequestGet({ env }) {
  try {
    const gasResult = await callGas({
      env,
      action: 'getActiveSurvey',
      method: 'GET',
    });

    return jsonResponse(gasResult.data, gasResult.status);
  } catch (error) {
    return createGasConfigErrorResponse(error);
  }
}

export async function onRequestOptions() {
  return corsPreflightResponse();
}