import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminAuth, adminDb } from '@/lib/firebase/admin'

// 負荷モデルの手動上書き。null でプリセット既定（自動分岐）に戻す。
const Body = z.object({
  athleteId: z.string(),
  loadModelOverride: z.enum(['strava_ctl', 'srpe']).nullable(),
})

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  let coachId: string
  try {
    const decoded = await adminAuth().verifyIdToken(auth.substring('Bearer '.length))
    coachId = decoded.uid
  } catch {
    return NextResponse.json({ error: 'invalid token' }, { status: 401 })
  }

  let body
  try {
    body = Body.parse(await req.json())
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'invalid body' },
      { status: 400 }
    )
  }

  const db = adminDb()

  // コーチが担当選手かどうか確認
  const athleteUserSnap = await db.collection('users').doc(body.athleteId).get()
  if (!athleteUserSnap.exists || athleteUserSnap.data()?.coachId !== coachId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // users と athletes キャッシュ双方を更新（コーチ画面が1フェッチで読めるように）
  await db.collection('users').doc(body.athleteId).update({ loadModelOverride: body.loadModelOverride })

  const directRef = db.collection('athletes').doc(body.athleteId)
  const directSnap = await directRef.get()
  if (directSnap.exists) {
    await directRef.update({ loadModelOverride: body.loadModelOverride })
  } else {
    const legacy = await db
      .collection('athletes')
      .where('userId', '==', body.athleteId)
      .limit(1)
      .get()
    if (!legacy.empty) {
      await legacy.docs[0].ref.update({ loadModelOverride: body.loadModelOverride })
    }
  }

  return NextResponse.json({ ok: true })
}
