'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAuth } from 'firebase/auth'
import { Shield, Search } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { getPreset } from '@/lib/presets'
import { calculateAge } from '@/lib/age'

interface AdminUserRow {
  uid: string
  displayName: string
  email: string
  role: string | null
  birthDate: string | null
  sex: string | null
  coachName: string | null
  plan: string | null
  activityPreset: string | null
  isAdmin: boolean
  createdAt: number | null
  latestMetrics: { ctl: number; atl: number; tsb: number } | null
  lastWorkoutLoggedAt: number | null
  targetRaceCount: number
}

export default function AdminPage() {
  const { profile } = useAuth()
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getAuth().currentUser?.getIdToken()
        const res = await fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'エラー')
        setUsers(data.users)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (!profile?.isAdmin) {
    return (
      <>
        <TopBar title="管理者" />
        <div className="p-4 sm:p-6">
          <p className="text-sm text-slate-400">権限がありません</p>
        </div>
      </>
    )
  }

  const filtered = users.filter((u) => {
    if (!q.trim()) return true
    const s = q.toLowerCase()
    return (
      u.displayName.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      (u.coachName ?? '').toLowerCase().includes(s)
    )
  })

  const coaches = filtered.filter((u) => u.role === 'coach')
  const athletes = filtered.filter((u) => u.role === 'athlete')

  return (
    <>
      <TopBar title="管理者ダッシュボード" />
      <div className="p-4 sm:p-6 max-w-6xl space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-400" />
          <h2 className="text-base font-semibold text-white">全ユーザー（{users.length}名）</h2>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="名前・メール・コーチ名で検索"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-900/40 border border-red-800 px-3 py-2 text-sm text-red-400">
            エラー: {error}
          </p>
        )}

        {loading ? (
          <div className="h-40 animate-pulse rounded-xl bg-slate-800" />
        ) : (
          <>
            <UserTable title="コーチ" users={coaches} />
            <UserTable title="選手" users={athletes} />
          </>
        )}
      </div>
    </>
  )
}

function UserTable({ title, users }: { title: string; users: AdminUserRow[] }) {
  if (users.length === 0) return null
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      <div className="border-b border-slate-800 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-white">
          {title}（{users.length}）
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
              <th className="px-4 py-2 font-medium">名前</th>
              <th className="px-4 py-2 font-medium">年齢</th>
              <th className="px-4 py-2 font-medium">メール</th>
              <th className="px-4 py-2 font-medium">コーチ</th>
              <th className="px-4 py-2 font-medium">タイプ</th>
              <th className="px-4 py-2 font-medium">プラン</th>
              <th className="px-4 py-2 font-medium">CTL/ATL/TSB</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid} className="border-b border-slate-800/50 hover:bg-slate-800/40">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/users/${u.uid}`} className="font-medium text-emerald-400 hover:underline">
                    {u.displayName || '(無名)'}
                  </Link>
                  {u.isAdmin && (
                    <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">管理者</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-400">
                  {calculateAge(u.birthDate) != null ? `${calculateAge(u.birthDate)}歳` : '-'}
                </td>
                <td className="px-4 py-2.5 text-slate-400">{u.email}</td>
                <td className="px-4 py-2.5 text-slate-400">{u.coachName ?? '-'}</td>
                <td className="px-4 py-2.5 text-slate-300">
                  {u.role === 'athlete' ? getPreset(u.activityPreset as never).label : '-'}
                </td>
                <td className="px-4 py-2.5 text-slate-400">{u.plan ?? '-'}</td>
                <td className="px-4 py-2.5 text-slate-400">
                  {u.latestMetrics
                    ? `${u.latestMetrics.ctl?.toFixed(0)} / ${u.latestMetrics.atl?.toFixed(0)} / ${u.latestMetrics.tsb?.toFixed(0)}`
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
