import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { getActivityStreams } from '@/lib/strava/api'
import { refreshAccessToken } from '@/lib/strava/oauth'

/**
 * GET /api/strava/streams?workoutId=xxx
 * 該当ワークアウトの Strava ストリーム（GPS・標高・心拍）を取得
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  let userId: string
  try {
    const decoded = await adminAuth().verifyIdToken(auth.substring('Bearer '.length))
    userId = decoded.uid
  } catch {
    return NextResponse.json({ error: 'invalid token' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const workoutId = searchParams.get('workoutId')
  if (!workoutId) {
    return NextResponse.json({ error: 'workoutId required' }, { status: 400 })
  }

  try {
    const db = adminDb()
    const wSnap = await db.collection('workouts').doc(workoutId).get()
    if (!wSnap.exists) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }
    const w = wSnap.data() as any
    if (w.athleteId !== userId && w.coachId !== userId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    if (!w.stravaActivityId) {
      return NextResponse.json({ error: 'No Strava activity linked' }, { status: 400 })
    }

    // 選手のStravaトークン取得
    const integrationRef = db
      .collection('users')
      .doc(w.athleteId)
      .collection('integrations')
      .doc('strava')
    const intSnap = await integrationRef.get()
    if (!intSnap.exists) {
      return NextResponse.json({ error: 'Strava not connected' }, { status: 400 })
    }
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

    const streams = await getActivityStreams(w.stravaActivityId, accessToken)

    return NextResponse.json({
      ok: true,
      streams,
    })
  } catch (e: any) {
    console.error('Streams fetch error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
