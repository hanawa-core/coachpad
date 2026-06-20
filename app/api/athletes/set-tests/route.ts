import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminAuth, adminDb } from '@/lib/firebase/admin'

const Body = z.object({
  athleteId: z.string(),
  assignedTests: z.array(z.string()).max(50),
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }

  const db = adminDb()

  // コーチが担当選手か確認
  const athleteUserSnap = await db.collection('users').doc(body.athleteId).get()
  if (!athleteUserSnap.exists || athleteUserSnap.data()?.coachId !== coachId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  await db.collection('users').doc(body.athleteId).update({ assignedTests: body.assignedTests })

  // athletes キャッシュ（doc-id → 旧userIdフォールバック）
  const directRef = db.collection('athletes').doc(body.athleteId)
  const directSnap = await directRef.get()
  if (directSnap.exists) {
    await directRef.update({ assignedTests: body.assignedTests })
  } else {
    const legacy = await db.collection('athletes').where('userId', '==', body.athleteId).limit(1).get()
    if (!legacy.empty) await legacy.docs[0].ref.update({ assignedTests: body.assignedTests })
  }

  return NextResponse.json({ ok: true })
}
