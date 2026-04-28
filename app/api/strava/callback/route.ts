import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken } from '@/lib/strava/oauth'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * GET /api/strava/callback?code=xxx&state=userId&scope=...
 * Strava認可コードをトークンに交換し、Firestoreに保存
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state') // userId
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?strava_error=${error}`
    )
  }

  if (!code || !userId) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 })
  }

  try {
    const token = await exchangeCodeForToken(code)
    const db = adminDb()

    await db
      .collection('users')
      .doc(userId)
      .collection('integrations')
      .doc('strava')
      .set({
        provider: 'strava',
        stravaAthleteId: token.athlete.id,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: token.expires_at,
        scope: 'read,activity:read_all',
        athleteName: `${token.athlete.firstname} ${token.athlete.lastname}`,
        connectedAt: FieldValue.serverTimestamp(),
        lastSyncAt: null,
      })

    // Strava athlete ID → User ID のマッピング（Webhookで使う）
    await db.collection('stravaUserMap').doc(String(token.athlete.id)).set({
      userId,
      connectedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?strava_connected=1`)
  } catch (e: any) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?strava_error=${encodeURIComponent(e.message)}`
    )
  }
}
