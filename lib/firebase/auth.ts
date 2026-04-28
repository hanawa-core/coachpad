import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'
import type { UserProfile, Role } from '@/types'

// ログイン
export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

// ログアウト
export async function logOut() {
  return signOut(auth)
}

// 新規登録（招待トークン経由）
export async function registerWithInvite(
  email: string,
  password: string,
  displayName: string,
  role: Role,
  coachId: string | null
) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const user = credential.user

  await updateProfile(user, { displayName })

  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email,
    displayName,
    role,
    avatarUrl: null,
    coachId,
    timezone: 'Asia/Tokyo',
    targetRaces: [],
    createdAt: serverTimestamp(),
  })

  return credential
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
