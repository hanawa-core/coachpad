'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, ChevronRight } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { subscribeAthletes } from '@/lib/firebase/firestore'
import type { AthleteCache } from '@/types'

export default function AthletesPage() {
  const { user, profile } = useAuth()
  const [athletes, setAthletes] = useState<AthleteCache[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeAthletes(user.uid, (data) => {
      setAthletes(data)
      setLoading(false)
    })
    return unsub
  }, [user])

  if (profile?.role !== 'coach') {
    return (
      <>
        <TopBar title="選手一覧" />
        <div className="p-6">
          <p className="text-sm text-slate-400">権限がありません</p>
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar title="選手一覧" />
      <div className="p-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900">
          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : athletes.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-slate-500 mb-3">まだ選手がいません</p>
              <Link
                href="/settings/team"
                className="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              >
                招待リンクを発行
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {athletes.map((a) => (
                <li key={a.id}>
                  <div className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/50 transition-colors">
                    <Link href={`/athletes/${a.userId}`} className="flex-1">
                      <p className="text-sm font-medium text-white">{a.displayName}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {a.email} · 最終記録: {a.lastWorkoutLoggedAt ? formatDaysAgo(a.lastWorkoutLoggedAt) : '未記録'}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/calendar/${a.userId}`}
                        className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                      >
                        <Calendar className="h-3 w-3" />
                        カレンダー
                      </Link>
                      <Link
                        href={`/athletes/${a.userId}`}
                        className="text-slate-500 hover:text-white"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}

function formatDaysAgo(timestamp: any): string {
  const date = timestamp.toDate()
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return '今日'
  if (days === 1) return '昨日'
  return `${days}日前`
}
