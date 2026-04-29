'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

export default function OnboardingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<'coach' | 'athlete'>('coach')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
        role,
        avatarUrl: null,
        coachId: null,
        timezone: 'Asia/Tokyo',
        targetRaces: [],
        createdAt: serverTimestamp(),
      })
      // プロフィール作成後はページをリロードしてAuthProviderに再取得させる
      window.location.replace('/dashboard')
    } catch (e: any) {
      setError(e.message ?? 'エラーが発生しました')
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-emerald-400" />
            <span className="text-2xl font-bold text-white">CoachPad</span>
          </div>
          <p className="text-sm text-slate-400">プロフィール設定</p>
        </div>

        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
          <h1 className="mb-2 text-xl font-bold text-white">はじめに設定してください</h1>
          <p className="mb-6 text-sm text-slate-400">
            アカウントのプロフィールを作成します
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

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                役割
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('coach')}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                    role === 'coach'
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  コーチ
                </button>
                <button
                  type="button"
                  onClick={() => setRole('athlete')}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                    role === 'athlete'
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  選手
                </button>
              </div>
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
        </div>
      </div>
    </div>
  )
}
