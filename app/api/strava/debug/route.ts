import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { listActivities } from '@/lib/strava/api'
import { refreshAccessToken } from '@/lib/strava/oauth'

/**
 * GET /api/strava/debug?date=YYYY-MM-DD
 * 該当日の Firestore 上の workouts ドキュメント一覧と
 * Strava 側のアクティビティ一覧を返す診断エンドポイント
 *
 * 同日に複数アクティビティがあったのに workout が 1 件しかない、
 * といった調査のため一時的に追加。
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let userId: string
  try {
    const decoded = await adminAuth().verifyIdToken(authHeader.substring('Bearer '.length))
    userId = decoded.uid
  } catch {
    return NextResponse.json({ error: 'invalid token' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date=YYYY-MM-DD required' }, { status: 400 })
  }

  try {
    const db = adminDb()

    // 1. Firestore 上の workouts ドキュメント
    const snap = await db
      .collection('workouts')
      .where('athleteId', '==', userId)
      .where('date', '==', date)
      .get()

    const firestoreDocs = snap.docs.map((d) => {
      const data = d.data() as any
      return {
        id: d.id,
        date: data.date,
        type: data.type,
        stravaActivityId: data.stravaActivityId ?? null,
        hasPlanned: !!data.planned,
        hasCompleted: !!data.completed,
        completedTitle: data.completed?.title ?? null,
        completedDistanceKm: data.completed?.distanceKm ?? null,
        completedDurationMin: data.completed?.durationMin ?? null,
      }
    })

    // 2. Strava 側のアクティビティ
    const integrationRef = db
      .collection('users')
      .doc(userId)
      .collection('integrations')
      .doc('strava')
    const intSnap = await integrationRef.get()
    let stravaActivities: any[] = []
    if (intSnap.exists) {
      const integration = intSnap.data()!
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
      // 該当日を含む前後 1 日のアクティビティを取得
      const dayStart = new Date(`${date}T00:00:00+09:00`)
      const after = Math.floor(dayStart.getTime() / 1000) - 24 * 60 * 60
      const activities = await listActivities(accessToken, { perPage: 50, afterEpoch: after })
      stravaActivities = activities
        .filter((a) => a.start_date_local.startsWith(date))
        .map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          sportType: a.sport_type,
          startDateLocal: a.start_date_local,
          distanceKm: Number((a.distance / 1000).toFixed(2)),
          movingTimeMin: Math.round(a.moving_time / 60),
        }))
    }

    return NextResponse.json({
      ok: true,
      date,
      userId,
      firestore: {
        count: firestoreDocs.length,
        docs: firestoreDocs,
      },
      strava: {
        count: stravaActivities.length,
        activities: stravaActivities,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
