import { jsonResponse, corsPreflightResponse } from '../../../../_shared/headers.js';
import { verifyAdminAuth } from '../../../../_shared/admin-auth.js';

const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

export async function onRequestGet({ request, env, params }) {
  const authResult = verifyAdminAuth(request, env);

  if (!authResult.ok) {
    return authResult.response;
  }

  const isbn = params.isbn;

  if (!isbn || !/^\d{10,13}$/.test(isbn)) {
    return jsonResponse(
      { ok: false, error: 'Valid ISBN (10 or 13 digits) is required' },
      400
    );
  }

  try {
    const response = await fetch(
      `${GOOGLE_BOOKS_API_URL}?q=isbn:${isbn}&maxResults=1`
    );

    if (!response.ok) {
      return jsonResponse(
        { ok: false, error: 'Failed to fetch book info from external API' },
        502
      );
    }

    const data = await response.json();

    if (!data.totalItems || !data.items || data.items.length === 0) {
      return jsonResponse({
        ok: true,
        found: false,
        isbn,
        book: null,
      });
    }

    const volumeInfo = data.items[0].volumeInfo || {};

    return jsonResponse({
      ok: true,
      found: true,
      isbn,
      book: {
        title: volumeInfo.title || '',
        author: (volumeInfo.authors || []).join(', '),
        publisher: volumeInfo.publisher || '',
        coverImageUrl: volumeInfo.imageLinks
          ? volumeInfo.imageLinks.thumbnail || ''
          : '',
      },
    });
  } catch (error) {
    return jsonResponse(
      { ok: false, error: 'ISBN lookup failed: ' + error.message },
      502
    );
  }
}

export async function onRequestOptions() {
  return corsPreflightResponse();
}
