import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './config'
import type { UserProfile } from '@/types'

// ログイン
export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

// ログアウト
export async function logOut() {
  return signOut(auth)
}

/**
 * 招待リンク経由の新規登録：Firebase Auth にアカウントを作成するのみ。
 * Firestore への users/{uid} 書き込みは /api/users/init（サーバ）に集約済み。
 * 呼び出し側は credential 取得後に initUserProfile() を必ず呼ぶこと。
 */
export async function registerWithInvite(
  email: string,
  password: string,
  displayName: string
) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName })
  return credential
}

/**
 * サーバ API 経由で users/{uid} を初期化。
 * - inviteToken 指定: athletes として登録（招待検証＋acceptInvite を atomic に実施）
 * - inviteToken 無し: coach として登録
 * 既に users/{uid} が存在する場合は冪等に成功扱い。
 */
export async function initUserProfile(args: {
  displayName: string
  inviteToken?: string
}): Promise<{ ok: true; existed: boolean }> {
  const user = auth.currentUser
  if (!user) throw new Error('not-signed-in')
  const idToken = await user.getIdToken()
  const res = await fetch('/api/users/init', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(args),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.error ?? `init failed (${res.status})`)
  }
  return res.json()
}

// Firestoreからユーザープロフィール取得
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return snap.data() as UserProfile
}

// 現在のFirebase Authユーザー
export function getCurrentUser(): User | null {
  return auth.currentUser
}
