'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Dumbbell, Plus } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import {
  getWorkoutsByMonth,
  getStrengthAssignmentsByMonth,
} from '@/lib/firebase/firestore'
import { TrainingLoadCard } from './TrainingLoadCard'
import { FitnessChart } from './FitnessChart'
import { TodayStrengthDetail } from './TodayStrengthDetail'
import { WellnessQuickCard } from './WellnessQuickCard'
import { WeeklySummary } from './WeeklySummary'
import type { Workout, StrengthAssignment } from '@/types'
import { WORKOUT_TYPE_LABELS } from '@/types'

export function AthleteDashboard() {
  const { user } = useAuth()
  const [todaysWorkouts, setTodaysWorkouts] = useState<Workout[]>([])
  const [todaysStrength, setTodaysStrength] = useState<StrengthAssignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    const load = async () => {
      const [workouts, strength] = await Promise.all([
        getWorkoutsByMonth(user.uid, today.getFullYear(), today.getMonth() + 1),
        getStrengthAssignmentsByMonth(user.uid, today.getFullYear(), today.getMonth() + 1),
      ])
      setTodaysWorkouts(workouts.filter((w) => w.date === todayStr))
      setTodaysStrength(strength.filter((s) => s.date === todayStr))
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Wellness クイックカード */}
      {user && <WellnessQuickCard athleteId={user.uid} />}

      {/* 本日のトレーニング詳細 */}
      {user && <TodayStrengthDetail athleteId={user.uid} />}

      {/* 週間サマリー */}
      {user && <WeeklySummary athleteId={user.uid} />}

      {/* トレーニング負荷 */}
      {user && <TrainingLoadCard athleteId={user.uid} />}

      {/* フィットネスチャート */}
      {user && <FitnessChart athleteId={user.uid} />}

      {/* 本日の予定 */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
          <Calendar className="h-4 w-4 text-emerald-400" />
          本日の予定
        </h2>

        {todaysWorkouts.length === 0 && todaysStrength.length === 0 ? (
          <p className="text-sm text-slate-500">本日のメニューはありません</p>
        ) : (
          <div className="space-y-3">
            {todaysWorkouts.map((w) => (
              <Link
                key={w.id}
                href={`/workouts/${w.id}`}
                className="block rounded-lg border-l-4 border-l-blue-500 border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="inline-block rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-300 mb-1">
                      🏃 ランニング
                    </span>
                    <p className="text-sm font-medium text-white">
                      {w.planned?.title ?? WORKOUT_TYPE_LABELS[w.planned?.workoutType ?? 'other']}
                    </p>
                    {w.planned?.targetDistanceKm && (
                      <p className="mt-1 text-xs text-slate-500">
                        目標: {w.planned.targetDistanceKm}km
                        {w.planned.targetPaceMinPerKm && ` @ ${w.planned.targetPaceMinPerKm}/km`}
                      </p>
                    )}
                  </div>
                  {w.completed ? (
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                      実施済
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                      未実施
                    </span>
                  )}
                </div>
              </Link>
            ))}
            {todaysStrength.map((s) => (
              <Link
                key={s.id}
                href={`/strength/${s.id}`}
                className="block rounded-lg border-l-4 border-l-purple-500 border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="inline-block rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-medium text-purple-300 mb-1">
                      💪 筋力トレーニング
                    </span>
                    <p className="text-sm font-medium text-white flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-purple-400" />
                      {s.templateSnapshot.name}
                    </p>
                  </div>
                  {s.status === 'completed' ? (
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                      実施済
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                      未実施
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* クイックアクション */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/workouts/new"
          className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 hover:bg-slate-800 transition-colors"
        >
          <span className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400">
            <Plus className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-white">ワークアウト記録</p>
            <p className="text-xs text-slate-500">手動で記録</p>
          </div>
        </Link>
        <Link
          href="/calendar"
          className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 hover:bg-slate-800 transition-colors"
        >
          <span className="rounded-lg bg-blue-500/10 p-2.5 text-blue-400">
            <Calendar className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-white">カレンダー</p>
            <p className="text-xs text-slate-500">月間予定</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
