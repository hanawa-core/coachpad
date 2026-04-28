/**
 * Strava API ラッパー
 * https://developers.strava.com/docs/reference/
 */

const STRAVA_API_BASE = 'https://www.strava.com/api/v3'

export interface StravaActivity {
  id: number
  name: string
  type: string // "Run", "TrailRun", "Ride", etc.
  sport_type: string
  start_date: string // ISO 8601
  start_date_local: string
  timezone: string
  distance: number // meters
  moving_time: number // seconds
  elapsed_time: number // seconds
  total_elevation_gain: number // meters
  average_speed: number // m/s
  max_speed: number // m/s
  average_heartrate?: number
  max_heartrate?: number
  calories?: number
  description?: string
  athlete: { id: number }
  /** Strava 圧縮ポリライン */
  map?: {
    id: string
    summary_polyline: string | null
    polyline?: string | null
  }
  start_latlng?: [number, number] | null
  end_latlng?: [number, number] | null
}

/**
 * アクティビティのストリームデータ取得（時系列）
 */
export interface StravaStreams {
  latlng?: { data: [number, number][] }
  altitude?: { data: number[] }
  heartrate?: { data: number[] }
  distance?: { data: number[] }
  time?: { data: number[] }
  velocity_smooth?: { data: number[] }
  cadence?: { data: number[] }
  grade_smooth?: { data: number[] }
  watts?: { data: number[] }
}

export async function getActivityStreams(
  activityId: number,
  accessToken: string,
  keys: string[] = [
    'latlng',
    'altitude',
    'heartrate',
    'distance',
    'time',
    'velocity_smooth',
    'grade_smooth',
  ]
): Promise<StravaStreams> {
  const params = new URLSearchParams()
  params.set('keys', keys.join(','))
  params.set('key_by_type', 'true')
  const res = await fetch(
    `${STRAVA_API_BASE}/activities/${activityId}/streams?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )
  if (!res.ok) {
    throw new Error(`Strava streams error: ${res.status}`)
  }
  return res.json()
}

/**
 * アクティビティ詳細取得
 */
export async function getActivity(
  activityId: number,
  accessToken: string
): Promise<StravaActivity> {
  const res = await fetch(`${STRAVA_API_BASE}/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    throw new Error(`Strava API error: ${res.status}`)
  }
  return res.json()
}

/**
 * 最近のアクティビティ一覧取得
 */
export async function listActivities(
  accessToken: string,
  options: { perPage?: number; afterEpoch?: number } = {}
): Promise<StravaActivity[]> {
  const params = new URLSearchParams()
  params.set('per_page', String(options.perPage ?? 30))
  if (options.afterEpoch) params.set('after', String(options.afterEpoch))

  const res = await fetch(`${STRAVA_API_BASE}/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    throw new Error(`Strava API error: ${res.status}`)
  }
  return res.json()
}

/**
 * Webhook購読作成（管理者が初回1回だけ実行）
 */
export async function createWebhookSubscription(
  callbackUrl: string,
  verifyToken: string
): Promise<{ id: number }> {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    client_secret: process.env.STRAVA_CLIENT_SECRET!,
    callback_url: callbackUrl,
    verify_token: verifyToken,
  })
  const res = await fetch(`${STRAVA_API_BASE}/push_subscriptions?${params}`, {
    method: 'POST',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Webhook subscription failed: ${text}`)
  }
  return res.json()
}
