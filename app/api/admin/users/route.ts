import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAdmin } from '@/lib/admin/guard'

/** 全ユーザーの一覧（管理者専用）。users + athletes キャッシュをマージして返す。 */
export async function GET(req: NextRequest) {
  const auth = await verifyAdmin(req.headers.get('authorization'))
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const db = adminDb()
  const [usersSnap, athletesSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('athletes').get(),
  ])

  // athletes キャッシュを userId（または doc-id）でインデックス化
  const cacheByUser: Record<string, any> = {}
  for (const d of athletesSnap.docs) {
    const data = d.data()
    const key = (data.userId as string) ?? d.id
    cacheByUser[key] = data
  }

  // コーチ名解決用
  const nameByUid: Record<string, string> = {}
  for (const d of usersSnap.docs) {
    nameByUid[d.id] = (d.data().displayName as string) ?? ''
  }

  const toMillis = (v: any): number | null =>
    v?.toMillis ? v.toMillis() : v?._seconds ? v._seconds * 1000 : null

  const users = usersSnap.docs.map((d) => {
    const u = d.data()
    const cache = cacheByUser[d.id]
    return {
      uid: d.id,
      displayName: u.displayName ?? '',
      email: u.email ?? '',
      role: u.role ?? null,
      birthDate: u.birthDate ?? null,
      sex: u.sex ?? null,
      coachId: u.coachId ?? null,
      coachName: u.coachId ? nameByUid[u.coachId] ?? null : null,
      plan: u.plan ?? null,
      activityPreset: u.activityPreset ?? null,
      defaultActivityPreset: u.defaultActivityPreset ?? null,
      isAdmin: u.isAdmin === true,
      createdAt: toMillis(u.createdAt),
      latestMetrics: cache?.latestMetrics ?? null,
      lastWorkoutLoggedAt: toMillis(cache?.lastWorkoutLoggedAt),
      isActive: cache?.isActive ?? null,
      targetRaceCount: Array.isArray(u.targetRaces) ? u.targetRaces.length : 0,
    }
  })

  // ロール→名前順
  users.sort((a, b) => {
    if (a.role !== b.role) return (a.role ?? '').localeCompare(b.role ?? '')
    return a.displayName.localeCompare(b.displayName)
  })

  return NextResponse.json({ ok: true, count: users.length, users })
}
