/**
 * Strava OAuth フロー
 * https://developers.strava.com/docs/authentication/
 */

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize'
const STRAVA_TOKEN_URL = 'https://www.strava.com/api/v3/oauth/token'

export interface StravaTokenResponse {
  token_type: 'Bearer'
  expires_at: number // Unix timestamp
  expires_in: number
  refresh_token: string
  access_token: string
  athlete: {
    id: number
    username: string
    firstname: string
    lastname: string
    profile: string
  }
}

/**
 * 認可URL生成
 */
export function buildAuthorizeUrl(userId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'force', // 毎回承認画面を表示（権限を確実に付与）
    scope: 'read,activity:read_all',
    state: userId,
  })
  return `${STRAVA_AUTH_URL}?${params.toString()}`
}

/**
 * 認可コードをアクセストークンに交換
 */
export async function exchangeCodeForToken(code: string): Promise<StravaTokenResponse> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Strava token exchange failed: ${text}`)
  }
  return res.json()
}

/**
 * リフレッシュトークンでアクセストークンを更新
 */
export async function refreshAccessToken(refreshToken: string): Promise<StravaTokenResponse> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) {
    throw new Error('Strava token refresh failed')
  }
  return res.json()
}
