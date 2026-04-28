import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin'
import { listActivities } from '@/lib/strava/api'
import { refreshAccessToken } from '@/lib/strava/oauth'
import { syncActivity } from '@/lib/strava/sync'

/**
 * POST /api/strava/sync
 * 手動で過去30日分の最新アクティビティを取得して同期
 * Authorization: Bearer <Firebase ID token>
 */
export async function POST(req: NextRequest) {
  // Firebase ID Tokenで認証
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const idToken = auth.substring('Bearer '.length)

  let userId: string
  try {
    const decoded = await adminAuth().verifyIdToken(idToken)
    userId = decoded.uid
  } catch {
    return NextResponse.json({ error: 'invalid token' }, { status: 401 })
  }

  try {
    const db = adminDb()
    const integrationRef = db
      .collection('users')
      .doc(userId)
      .collection('integrations')
      .doc('strava')
    const snap = await integrationRef.get()
    if (!snap.exists) {
      return NextResponse.json({ error: 'Strava not connected' }, { status: 400 })
    }
    const integration = snap.data()!

    // トークンチェック
    const now = Math.floor(Date.now() / 1000)
    let accessToken = integration.accessToken as string
    if ((integration.expiresAt as number) < now + 60) {
      const refreshed = await refreshAccessToken(integration.refreshToken)
      accessToken = refreshed.access_token
      await integrationRef.update({
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
        expiresAt: refreshed.expires_at,
      })
    }

    // 期間: クエリパラメータ ?days=N または既定30日
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '30')
    const after = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60
    const activities = await listActivities(accessToken, { perPage: 100, afterEpoch: after })

    console.log(`[Strava sync] User ${userId} - found ${activities.length} activities in last ${days} days`)

    let synced = 0
    for (const activity of activities) {
      try {
        await syncActivity(userId, activity.id)
        synced++
      } catch (err) {
        console.error(`Failed to sync activity ${activity.id}:`, err)
      }
    }

    return NextResponse.json({ ok: true, synced, total: activities.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
