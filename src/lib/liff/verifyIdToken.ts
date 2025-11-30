/**
 * LINE ID Token verification utility
 *
 * Verifies LINE ID tokens using the LINE Platform API to extract the user's LINE user ID.
 * Reference: https://developers.line.biz/en/reference/line-login/#verify-id-token
 */

export interface LineUserInfo {
  lineUserId: string;
  displayName?: string;
}

interface LineVerifyResponse {
  iss: string;
  sub: string; // LINE user ID
  aud: string; // channel ID
  exp: number;
  iat: number;
  name?: string;
  picture?: string;
  email?: string;
}

interface LineErrorResponse {
  error: string;
  error_description?: string;
}

/**
 * Verifies a LINE ID token using the LINE Platform API
 * and returns the user information if valid.
 *
 * @param idToken - The ID token obtained from liff.getIDToken()
 * @returns LineUserInfo object containing the LINE user ID
 * @throws Error if verification fails or token is invalid
 */
export async function verifyIdToken(idToken: string): Promise<LineUserInfo> {
  const channelId = process.env.LINE_CHANNEL_ID;

  if (!channelId) {
    throw new Error('LINE_CHANNEL_ID environment variable is not set');
  }

  const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      id_token: idToken,
      client_id: channelId,
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as LineErrorResponse;
    throw new Error(
      errorData.error_description || errorData.error || 'Failed to verify LINE ID token'
    );
  }

  const data = (await response.json()) as LineVerifyResponse;

  // Verify that the audience matches our channel ID
  if (data.aud !== channelId) {
    throw new Error('Token was not issued for this channel');
  }

  return {
    lineUserId: data.sub,
    displayName: data.name,
  };
}
