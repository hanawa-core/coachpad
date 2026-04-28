'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Activity, AlertTriangle } from 'lucide-react'
import { getInviteByToken, acceptInvite } from '@/lib/firebase/firestore'
import { registerWithInvite } from '@/lib/firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import type { Invite } from '@/types'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [invite, setInvite] = useState<Invite | null>(null)
  const [inviteError, setInviteError] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const check = async () => {
      const inv = await getInviteByToken(token)
      if (!inv) {
        setInviteError('招待リンクが無効です')
      } else if (inv.status !== 'pending') {
        setInviteError('この招待リンクはすでに使用済みか期限切れです')
      } else if (new Date() > (inv.expiresAt as any).toDate()) {
        setInviteError('招待リンクの有効期限が切れています')
      } else {
        setInvite(inv)
        if (inv.email) setEmail(inv.email)
      }
      setChecking(false)
    }
    check()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invite) return
    setError('')
    setLoading(true)
    try {
      const credential = await registerWithInvite(email, password, name, 'athlete', invite.coachId)
      const uid = credential.user.uid

      // athletes コレクションにキャッシュ作成
      await setDoc(doc(db, 'athletes', uid), {
        userId: uid,
        coachId: invite.coachId,
        displayName: name,
        email,
        avatarUrl: null,
        joinedAt: serverTimestamp(),
        isActive: true,
        latestMetrics: null,
        lastWorkoutLoggedAt: null,
        lastStrengthLoggedAt: null,
        weeklyStats: null,
      })

      await acceptInvite(invite.id, uid)
      router.replace('/dashboard')
    } catch (err: any) {
      setError(err.message ?? '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
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
          <p className="text-sm text-slate-400">アカウント登録</p>
        </div>

        {inviteError ? (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p className="text-sm">{inviteError}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
            <h1 className="mb-2 text-xl font-bold text-white">選手登録</h1>
            <p className="mb-6 text-sm text-slate-400">コーチから招待されました。アカウントを作成してください。</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">お名前</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  placeholder="山田 太郎"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">メールアドレス</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">パスワード（6文字以上）</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-900/40 border border-red-800 px-3 py-2 text-sm text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 transition-colors"
              >
                {loading ? '登録中...' : 'アカウントを作成'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
