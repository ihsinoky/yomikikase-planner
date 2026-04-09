import { corsPreflightResponse, CORS_HEADERS, SECURITY_HEADERS } from '../../../_shared/headers.js';
import { callGas, createGasConfigErrorResponse } from '../../../_shared/gas.js';
import { verifyAdminAuth } from '../../../_shared/admin-auth.js';
import { jsonResponse } from '../../../_shared/headers.js';

const CSV_COLUMNS = [
  'responseId',
  'surveyId',
  'surveyDateId',
  'lineUserId',
  'answer',
  'submittedAt',
  'notes',
];

function escapeCsvField(value) {
  const str = String(value || '');

  // Neutralize formula injection: prefix with single quote if starts with =, +, -, @
  const safe = /^[=+\-@]/.test(str) ? "'" + str : str;

  if (
    safe.includes(',') ||
    safe.includes('"') ||
    safe.includes('\n') ||
    safe.includes('\r')
  ) {
    return '"' + safe.replace(/"/g, '""') + '"';
  }

  return safe;
}

function responsesToCsv(responses) {
  const header = CSV_COLUMNS.join(',');
  const rows = responses.map(function (record) {
    return CSV_COLUMNS.map(function (col) {
      return escapeCsvField(record[col]);
    }).join(',');
  });

  return '\uFEFF' + header + '\n' + rows.join('\n') + '\n';
}

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

    if (!gasResult.ok) {
      return jsonResponse(gasResult.data, gasResult.status);
    }

    const responses = gasResult.data.responses || [];
    const csv = responsesToCsv(responses);
    // Sanitize surveyId for Content-Disposition filename (allow only alphanumeric, hyphen, underscore)
    const safeSurveyId = surveyId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = safeSurveyId
      ? 'responses-' + safeSurveyId + '.csv'
      : 'responses-all.csv';

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="' + filename + '"',
        ...CORS_HEADERS,
        ...SECURITY_HEADERS,
      },
    });
  } catch (error) {
    return createGasConfigErrorResponse(error);
  }
}

export async function onRequestOptions() {
  return corsPreflightResponse();
}
