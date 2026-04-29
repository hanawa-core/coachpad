'use client'

import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { doc, getDoc, setDoc, query, where, getDocs, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

export default function OnboardingPage() {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [autoChecking, setAutoChecking] = useState(true)

  // 招待経由のユーザーを自動検出して即座にプロフィール作成
  useEffect(() => {
    if (!user) return
    let cancelled = false

    const autoSetup = async () => {
      try {
        // 0. 既に users/{uid} がある場合は即ダッシュボードへ（上書きしない）
        const userSnap = await getDoc(doc(db, 'users', user.uid))
        if (userSnap.exists()) {
          if (!cancelled) window.location.replace('/dashboard')
          return
        }

        // 1. 既に athletes/{uid} ドキュメントがあれば（招待登録済み）
        const athleteSnap = await getDoc(doc(db, 'athletes', user.uid))
        if (athleteSnap.exists()) {
          const data = athleteSnap.data()
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email ?? '',
            displayName: data.displayName ?? user.displayName ?? user.email?.split('@')[0] ?? 'ユーザー',
            role: 'athlete',
            avatarUrl: null,
            coachId: data.coachId ?? null,
            timezone: 'Asia/Tokyo',
            targetRaces: [],
            createdAt: serverTimestamp(),
          })
          if (!cancelled) window.location.replace('/dashboard')
          return
        }

        // 2. メールに紐づく pending 招待があれば athlete として登録
        if (user.email) {
          const inviteQ = query(
            collection(db, 'invites'),
            where('email', '==', user.email),
            where('status', '==', 'pending')
          )
          const inviteSnap = await getDocs(inviteQ)
          if (!inviteSnap.empty) {
            const invite = inviteSnap.docs[0].data()
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName ?? user.email.split('@')[0],
              role: 'athlete',
              avatarUrl: null,
              coachId: invite.coachId,
              timezone: 'Asia/Tokyo',
              targetRaces: [],
              createdAt: serverTimestamp(),
            })
            if (!cancelled) window.location.replace('/dashboard')
            return
          }
        }

        // 招待が見つからない → コーチとして手動登録フォーム表示
        if (!cancelled) setAutoChecking(false)
      } catch (e) {
        if (!cancelled) setAutoChecking(false)
      }
    }

    autoSetup()
    return () => { cancelled = true }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !displayName.trim()) return
    setSaving(true)
    setError('')
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email ?? '',
        displayName: displayName.trim(),
        role: 'coach',
        avatarUrl: null,
        coachId: null,
        timezone: 'Asia/Tokyo',
        targetRaces: [],
        createdAt: serverTimestamp(),
      })
      window.location.replace('/dashboard')
    } catch (e: any) {
      setError(e.message ?? 'エラーが発生しました')
      setSaving(false)
    }
  }

  // 招待検出中のローディング画面
  if (autoChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-emerald-400" />
            <span className="text-2xl font-bold text-white">CoachPad</span>
          </div>
          <p className="text-sm text-slate-400">コーチ登録</p>
        </div>

        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
          <h1 className="mb-2 text-xl font-bold text-white">コーチアカウントの作成</h1>
          <p className="mb-6 text-sm text-slate-400">
            お名前を入力して開始してください
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                お名前
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="例: 花輪 太郎"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-900/40 border border-red-800 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || !displayName.trim()}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 transition-colors"
            >
              {saving ? '設定中...' : 'はじめる'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            選手の方は、コーチからの招待リンクを開いてください
          </p>
        </div>
      </div>
    </div>
  )
}
