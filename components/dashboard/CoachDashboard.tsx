'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Calendar, Dumbbell, AlertCircle } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { subscribeAthletes } from '@/lib/firebase/firestore'
import { CoachWellnessAlert } from './CoachWellnessAlert'
import { AiTeamAnalysis } from './AiTeamAnalysis'
import { PlanBadge } from '@/components/ui/PlanBadge'
import type { AthleteCache } from '@/types'
import { clsx } from 'clsx'

export function CoachDashboard() {
  const { user } = useAuth()
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

  // 1週間以上ログがない選手
  const inactiveAthletes = athletes.filter((a) => {
    if (!a.lastWorkoutLoggedAt) return true
    const last = (a.lastWorkoutLoggedAt as any).toDate()
    const daysSince = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24)
    return daysSince > 7
  })

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI チーム分析 */}
      <AiTeamAnalysis coachId={user!.uid} />

      {/* Wellness アラート */}
      <CoachWellnessAlert />

      {/* サマリーカード */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          icon={Users}
          label="選手数"
          value={athletes.length.toString()}
          href="/athletes"
          color="emerald"
        />
        <SummaryCard
          icon={AlertCircle}
          label="未報告（7日以上）"
          value={inactiveAthletes.length.toString()}
          href="/athletes"
          color="amber"
        />
        <SummaryCard
          icon={Dumbbell}
          label="プロトコル"
          value="-"
          href="/strength/templates"
          color="blue"
        />
      </div>

      {/* 選手一覧 */}
      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 className="text-base font-semibold text-white">担当選手</h2>
          <Link href="/athletes" className="text-sm text-emerald-400 hover:text-emerald-300">
            すべて見る →
          </Link>
        </div>
        {athletes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-slate-500">まだ選手がいません</p>
            <Link
              href="/settings/team"
              className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              選手を招待
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {athletes.slice(0, 5).map((a) => (
              <li key={a.id}>
                <Link
                  href={`/athletes/${a.userId}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{a.displayName}</p>
                      <PlanBadge plan={a.plan} />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      最終記録: {a.lastWorkoutLoggedAt ? formatDaysAgo(a.lastWorkoutLoggedAt) : '未記録'}
                    </p>
                  </div>
                  {a.latestMetrics && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500">CTL/TSB</p>
                      <p className="text-sm font-medium text-white">
                        {a.latestMetrics.ctl.toFixed(0)} / {a.latestMetrics.tsb.toFixed(0)}
                      </p>
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  href,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  href: string
  color: 'emerald' | 'amber' | 'blue'
}) {
  const colorMap = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    blue: 'bg-blue-500/10 text-blue-400',
  }
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-800 bg-slate-900 p-5 hover:bg-slate-900/80 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <span className={clsx('rounded-lg p-2', colorMap[color])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </Link>
  )
}

function formatDaysAgo(timestamp: any): string {
  const date = timestamp.toDate()
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return '今日'
  if (days === 1) return '昨日'
  return `${days}日前`
}
