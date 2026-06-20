import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAdmin } from '@/lib/admin/guard'

/** Firestore Timestamp などを JSON 安全な値（millis）へ再帰変換 */
function deepSerialize(value: any): any {
  if (value == null) return value
  if (typeof value !== 'object') return value
  // Firestore Timestamp
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value._seconds === 'number') return value._seconds * 1000
  if (Array.isArray(value)) return value.map(deepSerialize)
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(value)) out[k] = deepSerialize(v)
  return out
}

async function queryByField(collection: string, field: string, uid: string, limit = 300) {
  const snap = await adminDb().collection(collection).where(field, '==', uid).limit(limit).get()
  return snap.docs.map((d) => ({ id: d.id, ...deepSerialize(d.data()) }))
}

/** 1ユーザーの全情報（管理者専用） */
export async function GET(req: NextRequest, ctx: { params: Promise<{ uid: string }> }) {
  const auth = await verifyAdmin(req.headers.get('authorization'))
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { uid } = await ctx.params
  const db = adminDb()

  const userSnap = await db.collection('users').doc(uid).get()
  if (!userSnap.exists) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  const user = { uid, ...deepSerialize(userSnap.data()) }
  const role = userSnap.data()?.role

  // athletes キャッシュ（直接 doc → 旧 userId フォールバック）
  let athleteCache: any = null
  const directCache = await db.collection('athletes').doc(uid).get()
  if (directCache.exists) {
    athleteCache = { id: directCache.id, ...deepSerialize(directCache.data()) }
  } else {
    const legacy = await db.collection('athletes').where('userId', '==', uid).limit(1).get()
    if (!legacy.empty) athleteCache = { id: legacy.docs[0].id, ...deepSerialize(legacy.docs[0].data()) }
  }

  // 選手系データ
  const [workouts, wellness, strengthAssignments, motionAnalyses] = await Promise.all([
    queryByField('workouts', 'athleteId', uid),
    queryByField('wellnessEntries', 'athleteId', uid),
    queryByField('strengthAssignments', 'athleteId', uid),
    queryByField('motionAnalyses', 'athleteId', uid),
  ])
  workouts.sort((a, b) => String(b.date).localeCompare(String(a.date)))
  wellness.sort((a, b) => String(b.date).localeCompare(String(a.date)))
  strengthAssignments.sort((a, b) => String(b.date).localeCompare(String(a.date)))

  // コーチ系データ
  let roster: any[] = []
  let aiProfile: any = null
  let invites: any[] = []
  if (role === 'coach') {
    const [rosterSnap, aiSnap, inviteList] = await Promise.all([
      db.collection('athletes').where('coachId', '==', uid).get(),
      db.collection('users').doc(uid).collection('aiProfile').doc('main').get(),
      queryByField('invites', 'coachId', uid),
    ])
    roster = rosterSnap.docs.map((d) => ({ id: d.id, ...deepSerialize(d.data()) }))
    aiProfile = aiSnap.exists ? deepSerialize(aiSnap.data()) : null
    invites = inviteList
  }

  // チャットスレッド
  const threadsSnap = await db
    .collection('chats')
    .where('participants', 'array-contains', uid)
    .get()
  const chatThreads = threadsSnap.docs.map((d) => ({ id: d.id, ...deepSerialize(d.data()) }))

  return NextResponse.json({
    ok: true,
    user,
    athleteCache,
    workouts,
    wellness,
    strengthAssignments,
    motionAnalyses,
    roster,
    aiProfile,
    invites,
    chatThreads,
    counts: {
      workouts: workouts.length,
      wellness: wellness.length,
      strengthAssignments: strengthAssignments.length,
      motionAnalyses: motionAnalyses.length,
      roster: roster.length,
      chatThreads: chatThreads.length,
    },
  })
}
