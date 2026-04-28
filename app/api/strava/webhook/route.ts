import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { syncActivity } from '@/lib/strava/sync'

/**
 * GET /api/strava/webhook
 * Webhook購読時のチャレンジ検証エンドポイント
 * Strava仕様: hub.challenge を返す
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.STRAVA_VERIFY_TOKEN) {
    return NextResponse.json({ 'hub.challenge': challenge })
  }

  return NextResponse.json({ error: 'verification failed' }, { status: 403 })
}

/**
 * POST /api/strava/webhook
 * Strava イベント受信
 * https://developers.strava.com/docs/webhooks/
 */
export async function POST(req: NextRequest) {
  const body = await req.json()

  // 期待される形式:
  // { object_type: "activity" | "athlete", object_id, aspect_type: "create"|"update"|"delete", owner_id, event_time }
  const { object_type, object_id, aspect_type, owner_id } = body

  // 即座に200を返してから非同期処理（Stravaは2秒以内のレスポンス必須）
  // ここでは同期的に処理するが、本番ではキュー（Cloud Tasks等）推奨
  if (object_type === 'activity' && aspect_type === 'create') {
    try {
      const db = adminDb()
      const mapSnap = await db.collection('stravaUserMap').doc(String(owner_id)).get()
      if (mapSnap.exists) {
        const userId = mapSnap.data()!.userId as string
        // バックグラウンドで同期（awaitしない）
        syncActivity(userId, object_id).catch((err) =>
          console.error('Strava sync error:', err)
        )
      }
    } catch (err) {
      console.error('Webhook handler error:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
