import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '@/lib/firebase/admin'

const Body = z.object({
  displayName: z.string().min(1).max(100),
  inviteToken: z.string().min(1).max(200).optional(),
})

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let uid: string
  let tokenEmail: string | undefined
  try {
    const decoded = await adminAuth().verifyIdToken(authHeader.substring('Bearer '.length))
    uid = decoded.uid
    tokenEmail = decoded.email
  } catch {
    return NextResponse.json({ error: 'invalid token' }, { status: 401 })
  }

  let body: z.infer<typeof Body>
  try {
    body = Body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  const db = adminDb()
  const userRef = db.collection('users').doc(uid)

  // Idempotent: 既存プロフィールがあれば返すのみ（上書き禁止）
  const existing = await userRef.get()
  if (existing.exists) {
    return NextResponse.json({ ok: true, existed: true })
  }

  const displayName = body.displayName.trim().slice(0, 100)
  const userEmail = (tokenEmail ?? '').trim()

  // ===== 招待トークン経由（athlete として登録）=====
  if (body.inviteToken) {
    const inviteRef = db.collection('invites').doc(body.inviteToken)
    try {
      await db.runTransaction(async (tx) => {
        const inviteSnap = await tx.get(inviteRef)
        if (!inviteSnap.exists) throw new Error('invite-not-found')
        const inv = inviteSnap.data()!

        if (inv.status !== 'pending') throw new Error('invite-not-pending')

        const expiresAtRaw = inv.expiresAt
        const expiresAt = expiresAtRaw?.toDate?.()
          ?? (expiresAtRaw instanceof Date ? expiresAtRaw : new Date(0))
        if (expiresAt < new Date()) throw new Error('invite-expired')

        // 招待メールが指定されていれば、ID Token のメールと一致を要求
        if (inv.email && userEmail && inv.email.toLowerCase() !== userEmail.toLowerCase()) {
          throw new Error('invite-email-mismatch')
        }
        if (!inv.coachId || typeof inv.coachId !== 'string') {
          throw new Error('invite-coach-missing')
        }

        tx.set(userRef, {
          uid,
          email: userEmail,
          displayName,
          role: 'athlete',
          avatarUrl: null,
          coachId: inv.coachId,
          timezone: 'Asia/Tokyo',
          targetRaces: [],
          createdAt: FieldValue.serverTimestamp(),
        })

        tx.set(db.collection('athletes').doc(uid), {
          userId: uid,
          coachId: inv.coachId,
          displayName,
          email: userEmail,
          avatarUrl: null,
          joinedAt: FieldValue.serverTimestamp(),
          isActive: true,
          latestMetrics: null,
          lastWorkoutLoggedAt: null,
          lastStrengthLoggedAt: null,
          weeklyStats: null,
        })

        tx.update(inviteRef, {
          status: 'accepted',
          acceptedByUserId: uid,
          acceptedAt: FieldValue.serverTimestamp(),
        })
      })
    } catch (e: any) {
      const msg = String(e?.message ?? 'unknown')
      const status =
        msg === 'invite-not-found' ? 404 :
        msg === 'invite-not-pending' || msg === 'invite-expired' ? 410 :
        msg === 'invite-email-mismatch' || msg === 'invite-coach-missing' ? 403 :
        500
      return NextResponse.json({ error: msg }, { status })
    }

    return NextResponse.json({ ok: true, role: 'athlete', existed: false })
  }

  // ===== 招待トークン無し → コーチとして新規登録 =====
  await userRef.set({
    uid,
    email: userEmail,
    displayName,
    role: 'coach',
    avatarUrl: null,
    coachId: null,
    timezone: 'Asia/Tokyo',
    targetRaces: [],
    createdAt: FieldValue.serverTimestamp(),
  })

  return NextResponse.json({ ok: true, role: 'coach', existed: false })
}
