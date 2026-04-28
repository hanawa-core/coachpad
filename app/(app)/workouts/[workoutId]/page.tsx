'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Target } from 'lucide-react'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { getWorkout, saveCoachFeedback } from '@/lib/firebase/firestore'
import { calculateAchievement } from '@/lib/achievement'
import { ZoneAnalysis } from '@/components/workouts/ZoneAnalysis'
import { WorkoutMapSection } from '@/components/workouts/WorkoutMapSection'
import type { Workout } from '@/types'
import { WORKOUT_TYPE_LABELS } from '@/types'

export default function WorkoutDetailPage() {
  const params = useParams()
  const id = params.workoutId as string
  const { user, profile } = useAuth()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)

  // コーチフィードバック編集
  const [feedback, setFeedback] = useState('')
  const [editing, setEditing] = useState(false)
  const [savingFb, setSavingFb] = useState(false)

  useEffect(() => {
    const load = async () => {
      const w = await getWorkout(id)
      setWorkout(w)
      setFeedback(w?.coachFeedback?.textComment ?? '')
      setLoading(false)
    }
    load()
  }, [id])

  const handleSaveFeedback = async () => {
    if (!user) return
    setSavingFb(true)
    try {
      await saveCoachFeedback(id, {
        textComment: feedback,
        updatedAt: Timestamp.now(),
        updatedBy: user.uid,
        hasAnnotatedImages: workout?.coachFeedback?.hasAnnotatedImages ?? false,
      })
      const w = await getWorkout(id)
      setWorkout(w)
      setEditing(false)
    } finally {
      setSavingFb(false)
    }
  }

  if (loading || !workout) {
    return (
      <>
        <TopBar title="ワークアウト" />
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      </>
    )
  }

  const isCoach = profile?.role === 'coach'
  const achievement = calculateAchievement(workout)

  return (
    <>
      <TopBar title="ワークアウト詳細" />
      <div className="p-6 max-w-3xl space-y-4">
        <Link
          href={isCoach ? `/calendar/${workout.athleteId}` : '/calendar'}
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          カレンダーに戻る
        </Link>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                {workout.planned?.title ?? workout.completed?.title ?? 'ワークアウト'}
              </h1>
              <p className="mt-1 text-sm text-slate-400">{workout.date}</p>
            </div>
            {workout.completed && (
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                実施済
              </span>
            )}
          </div>
        </div>

        {/* 達成率 */}
        {achievement && (
          <div className={`rounded-xl border p-5 ${achievement.colorClass}`}>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5" />
              <h2 className="text-base font-semibold text-white">実施判定</h2>
            </div>
            <div className="flex items-end gap-4">
              <div>
                <p className="text-4xl font-bold">{achievement.percent}<span className="text-xl">%</span></p>
                <p className="text-sm font-medium mt-1">{achievement.label}</p>
              </div>
              <div className="flex-1 text-sm text-slate-300">
                <p>
                  計画: <span className="font-semibold">{achievement.planned}{achievement.unit}</span>
                  {' / '}
                  実績: <span className="font-semibold">{achievement.actual}{achievement.unit}</span>
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {achievement.metric === 'distance' ? '距離ベース' : '時間ベース'} で自動判定
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 計画 vs 実績 */}
        <div className="grid gap-4 md:grid-cols-2">
          {workout.planned && (
            <div className="rounded-xl border border-blue-700 bg-blue-950/20 p-5">
              <h2 className="mb-3 text-sm font-semibold text-blue-300">📋 計画</h2>
              <dl className="space-y-1.5 text-sm">
                <Row label="種別" value={WORKOUT_TYPE_LABELS[workout.planned.workoutType]} />
                <Row label="目標距離" value={workout.planned.targetDistanceKm ? `${workout.planned.targetDistanceKm} km` : '-'} />
                <Row label="目標時間" value={workout.planned.targetDurationMin ? `${workout.planned.targetDurationMin} 分` : '-'} />
                <Row label="目標ペース" value={workout.planned.targetPaceMinPerKm ?? '-'} />
              </dl>
              {workout.planned.description && (
                <div className="mt-3 rounded-lg bg-slate-950/40 p-3 text-sm text-slate-300 whitespace-pre-wrap">
                  {workout.planned.description}
                </div>
              )}
            </div>
          )}

          {workout.completed && (
            <div className="rounded-xl border border-emerald-700 bg-emerald-950/20 p-5">
              <h2 className="mb-3 text-sm font-semibold text-emerald-300">✅ 実績</h2>
              <dl className="space-y-1.5 text-sm">
                <Row label="距離" value={workout.completed.distanceKm ? `${workout.completed.distanceKm} km` : '-'} />
                <Row label="時間" value={workout.completed.durationMin ? `${workout.completed.durationMin} 分` : '-'} />
                <Row label="平均ペース" value={workout.completed.avgPaceMinPerKm ?? '-'} />
                <Row label="平均HR" value={workout.completed.avgHeartRate ? `${workout.completed.avgHeartRate} bpm` : '-'} />
                <Row label="最大HR" value={workout.completed.maxHeartRate ? `${workout.completed.maxHeartRate} bpm` : '-'} />
                <Row label="獲得標高" value={workout.completed.elevationGainM ? `${workout.completed.elevationGainM} m` : '-'} />
                <Row label="TSS / CTL / ATL" value={`${workout.completed.tss ?? '-'} / ${workout.completed.ctl ?? '-'} / ${workout.completed.atl ?? '-'}`} />
              </dl>
              {workout.completed.notes && (
                <div className="mt-3 rounded-lg bg-slate-950/40 p-3 text-sm text-slate-300 whitespace-pre-wrap">
                  {workout.completed.notes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 走行ルート地図（GPS データがある場合） */}
        {workout.completed && <WorkoutMapSection workout={workout} />}

        {/* ゾーン分析（実績がある場合） */}
        {workout.completed && <ZoneAnalysis workout={workout} profile={profile} />}

        {/* コーチフィードバック（赤ペン先生・テキスト） */}
        <div className="rounded-xl border border-red-700/50 bg-red-950/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-red-300">
              <MessageSquare className="h-4 w-4" />
              コーチからのフィードバック（赤ペン先生）
            </h2>
            {isCoach && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-slate-400 hover:text-white"
              >
                {workout.coachFeedback ? '編集' : '記入する'}
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-2">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={5}
                placeholder="今日の練習のフィードバックを記入..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveFeedback}
                  disabled={savingFb}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-60"
                >
                  {savingFb ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setFeedback(workout.coachFeedback?.textComment ?? '')
                  }}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : workout.coachFeedback?.textComment ? (
            <div className="text-sm text-red-100 whitespace-pre-wrap">
              {workout.coachFeedback.textComment}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              {isCoach ? 'まだフィードバックを書いていません' : 'コーチからのコメントはまだありません'}
            </p>
          )}
        </div>
      </div>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-white font-medium">{value}</dd>
    </div>
  )
}
