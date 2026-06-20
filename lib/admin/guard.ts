import { adminAuth, adminDb } from '@/lib/firebase/admin'

/**
 * 管理者判定（サーバー専用）。
 * - 環境変数 ADMIN_UIDS（カンマ区切りの uid 許可リスト）に含まれる、または
 * - users/{uid}.isAdmin === true
 * のいずれかを満たせば管理者。
 */
export async function isAdminUid(uid: string): Promise<boolean> {
  const envList = (process.env.ADMIN_UIDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (envList.includes(uid)) return true
  const snap = await adminDb().collection('users').doc(uid).get()
  return snap.exists && snap.data()?.isAdmin === true
}

/**
 * Authorization ヘッダを検証し、管理者なら uid を返す。
 * 失敗時はステータス付きのエラーを表すオブジェクトを返す。
 */
export async function verifyAdmin(
  authHeader: string | null
): Promise<{ ok: true; uid: string } | { ok: false; status: number; error: string }> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'unauthorized' }
  }
  let uid: string
  try {
    const decoded = await adminAuth().verifyIdToken(authHeader.substring('Bearer '.length))
    uid = decoded.uid
  } catch {
    return { ok: false, status: 401, error: 'invalid token' }
  }
  if (!(await isAdminUid(uid))) {
    return { ok: false, status: 403, error: 'forbidden' }
  }
  return { ok: true, uid }
}
